
import { Complaint, ComplaintStatus, UserType, ActivityType, ShopItem } from '../types';
import { supabase } from './supabase';

// Helper to convert Base64 to Blob for upload
const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

// Helper to sanitize filenames for storage (Cyrillic to ASCII)
const getUserSlug = (user: UserType) => {
    if (user === UserType.Vikulya) return 'vikulya';
    if (user === UserType.Yanik) return 'yanik';
    return 'unknown';
};

export const fetchComplaints = async (): Promise<Complaint[]> => {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    
    const mappedData: Complaint[] = (data || []).map((row: any) => ({
        id: row.id,
        user: row.user as UserType,
        type: row.type as ActivityType,
        category: row.category,
        categoryIcon: row.categoryIcon || row.categoryicon, 
        description: row.description,
        compensation: row.compensation,
        compensationIcon: row.compensationIcon || row.compensationicon,
        timestamp: row.timestamp,
        status: row.status as ComplaintStatus,
        points: Number(row.points),
        appeal: row.appeal,
        image: row.image
    }));

    return mappedData;

  } catch (error) {
    console.error("Supabase Fetch Error:", error);
    return []; 
  }
};

export const submitComplaint = async (complaint: Complaint): Promise<boolean> => {
  let finalImageUrl = complaint.image;

  // --- IMAGE UPLOAD LOGIC ---
  if (complaint.image && complaint.image.startsWith('data:')) {
      try {
          const blob = base64ToBlob(complaint.image);
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          
          const { error: uploadError } = await supabase.storage
              .from('complaint-evidence')
              .upload(fileName, blob, {
                  cacheControl: '3600',
                  upsert: false
              });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
              .from('complaint-evidence')
              .getPublicUrl(fileName);
          
          finalImageUrl = publicUrl;
          console.log("Image uploaded successfully:", finalImageUrl);

      } catch (uploadError) {
          console.error("Image upload failed, falling back to Base64 (might be slow):", uploadError);
      }
  }

  try {
    const { error } = await supabase
      .from('complaints')
      .insert([
        {
          id: complaint.id,
          user: complaint.user,
          type: complaint.type,
          category: complaint.category,
          "categoryIcon": complaint.categoryIcon,
          description: complaint.description,
          compensation: complaint.compensation,
          "compensationIcon": complaint.compensationIcon,
          timestamp: complaint.timestamp,
          status: complaint.status,
          points: complaint.points,
          image: finalImageUrl, 
          appeal: complaint.appeal || null
        }
      ]);

    if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
    }
    
    return true;
  } catch (error) {
    return false; 
  }
};

export const updateComplaint = async (complaint: Complaint): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('complaints')
            .update({
                status: complaint.status,
                points: complaint.points,
                appeal: complaint.appeal,
            })
            .eq('id', complaint.id);

        if (error) throw error;
        return true;

    } catch (e) {
        console.error("Supabase Update Failed", e);
        return false;
    }
};

export const updateComplaintStatus = async (id: string, newStatus: ComplaintStatus): Promise<boolean> => {
    try {
        const updatePayload: any = { status: newStatus };

        if (newStatus === ComplaintStatus.PendingAppeal) {
            updatePayload.appeal = {
                isResolved: false,
                plaintiffArg: "",
                defendantArg: ""
            };
        }

        const { error } = await supabase
            .from('complaints')
            .update(updatePayload)
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Status Update Failed", e);
        return false;
    }
};

// --- SCORING & SHOP LOGIC ---

export const calculateScore = (activities: Complaint[], user: UserType): number => {
  let score = 500;
  
  activities.forEach(act => {
    if (act.status === ComplaintStatus.Annulled) return;
    if (act.status === ComplaintStatus.PendingApproval) return;

    if (act.user === user) {
        // If I did a Good Deed -> Points increase
        if (act.type === ActivityType.GoodDeed) {
             score += Math.abs(act.points);
        }
        // If I received a Complaint -> Points decrease
        else if (act.type === ActivityType.Complaint) {
             score -= Math.abs(act.points);
        }
        // If I Bought something -> Points decrease
        else if (act.type === ActivityType.Purchase) {
             score -= Math.abs(act.points);
        }
    }
  });

  // Clamp only bottom, allow score to go over 1000 for "Divine" status
  return Math.max(0, score);
};

export const buyItem = async (user: UserType, item: ShopItem): Promise<boolean> => {
    const purchase: Complaint = {
        id: Date.now().toString(),
        user: user,
        type: ActivityType.Purchase,
        category: item.id, // Storing Item ID in category for future lookups
        categoryIcon: item.icon,
        description: `Куплено: ${item.name}`, // Saving human-readable name directly
        compensation: 'Магазин',
        compensationIcon: 'shopping_cart',
        timestamp: new Date().toISOString(),
        status: ComplaintStatus.Completed,
        points: -Math.abs(item.price), // Negative points cost
        image: item.type // Storing 'frame' or 'medal' in image field for filtering
    };

    return await submitComplaint(purchase);
};

export const getInventory = (activities: Complaint[], user: UserType): string[] => {
    return activities
        .filter(a => a.user === user && a.type === ActivityType.Purchase)
        .map(a => a.category); // Returns Item IDs
};

// --- AVATAR HANDLING ---

export const uploadAvatar = async (user: UserType, base64Image: string): Promise<string | null> => {
    try {
        const blob = base64ToBlob(base64Image);
        // Use a unique filename (timestamped) to bypass INSERT-only RLS restrictions
        // We cannot reliably use 'upsert: true' if UPDATE policy is disabled.
        const slug = getUserSlug(user);
        const fileName = `avatar_${slug}_${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
            .from('complaint-evidence')
            .upload(fileName, blob, {
                cacheControl: '3600', 
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        // BEST EFFORT CLEANUP: Try to delete old avatars to keep bucket clean.
        // If RLS prevents DELETE, this will fail silently/log warning, which is acceptable.
        try {
            const { data: files } = await supabase.storage
                .from('complaint-evidence')
                .list('', { search: `avatar_${slug}_` });

            if (files && files.length > 0) {
                const oldFiles = files
                    .filter(f => f.name !== fileName) // Don't delete what we just uploaded
                    .map(f => f.name);
                
                if (oldFiles.length > 0) {
                    await supabase.storage
                        .from('complaint-evidence')
                        .remove(oldFiles);
                }
            }
        } catch (cleanupError) {
            console.warn("Cleanup of old avatars failed (likely restricted permissions), skipping.", cleanupError);
        }

        const { data: { publicUrl } } = supabase.storage
            .from('complaint-evidence')
            .getPublicUrl(fileName);

        return publicUrl;

    } catch (error: any) {
        console.error("Avatar upload failed:", error?.message || JSON.stringify(error));
        return null;
    }
};

export const getAvatarUrl = async (user: UserType): Promise<string | null> => {
    try {
        const slug = getUserSlug(user);
        
        // Find the latest avatar file
        const { data, error } = await supabase.storage
            .from('complaint-evidence')
            .list('', {
                limit: 10,
                search: `avatar_${slug}`, // Matches avatar_vikulya...
                sortBy: { column: 'created_at', order: 'desc' }
            });
            
        // Fallback to legacy static name if no timestamped files found
        const legacyName = `avatar_${slug}.jpg`;
        const legacyUrl = supabase.storage.from('complaint-evidence').getPublicUrl(legacyName).data.publicUrl;

        if (error || !data || data.length === 0) {
             return legacyUrl;
        }

        // Ensure we sort by date to get the absolute newest (List order can be flaky)
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        const latestFile = data[0];
        const { data: publicData } = supabase.storage
            .from('complaint-evidence')
            .getPublicUrl(latestFile.name);
            
        return publicData.publicUrl;

    } catch (e) {
        console.warn("Error fetching avatar url", e);
        return null;
    }
};
