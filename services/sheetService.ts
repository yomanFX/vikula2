
import { Complaint, ComplaintStatus, UserType, ActivityType } from '../types';
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

        // Critical: If moving to appeal, we MUST initialize the appeal structure
        // Otherwise the Court page will try to read null/undefined and might fail.
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

export const calculateScore = (activities: Complaint[], user: UserType): number => {
  let score = 500;
  
  activities.forEach(act => {
    if (act.status === ComplaintStatus.Annulled) return;
    if (act.status === ComplaintStatus.PendingApproval) return;

    if (act.type === ActivityType.GoodDeed && act.user === user) {
      score += Math.abs(act.points);
    }
    else if (act.type === ActivityType.Complaint && act.user === user) {
      score -= Math.abs(act.points);
    }
  });

  return Math.max(0, Math.min(1000, score));
};
