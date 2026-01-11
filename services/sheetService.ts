
import { Complaint, ComplaintStatus, UserType, ActivityType } from '../types';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzb6VOmSiBbxIE5G5jxxKrGtAlDB3gF-HW1zqytV5cGbktg5W1f5xLKU3VnSLoBwhSf9Q/exec';
const MOCK_MODE = false; 

// --- CACHE LAYER ---
let MEMORY_CACHE: Complaint[] | null = null;
let LAST_FETCH_TIME = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minutes

// Helper to clean data: Deduplicate by ID (keep latest) and Sort by Date (Newest first)
const processData = (data: Complaint[]): Complaint[] => {
    const uniqueMap = new Map<string, Complaint>();
    data.forEach(item => uniqueMap.set(item.id, item));
    const uniqueList = Array.from(uniqueMap.values());
    return uniqueList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Main Fetch Function
export const fetchComplaints = async (force = false): Promise<Complaint[]> => {
  const now = Date.now();
  
  // 1. Check Memory Cache (Instant)
  if (!force && MEMORY_CACHE && (now - LAST_FETCH_TIME < CACHE_DURATION)) {
    return MEMORY_CACHE;
  }

  // 2. Check Local Storage (Fast)
  const localStr = localStorage.getItem('complaints');
  let localData = localStr ? JSON.parse(localStr) : [];
  
  // If we have local data and we are not forcing, return it immediately to unblock UI, 
  // but trigger a background refresh if cache is expired.
  if (!force && localData.length > 0 && (now - LAST_FETCH_TIME < CACHE_DURATION)) {
      MEMORY_CACHE = processData(localData);
      return MEMORY_CACHE;
  }

  // 3. Network Fetch (Slow)
  if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      MEMORY_CACHE = processData(localData); // Use local as mock
      return MEMORY_CACHE;
  }

  try {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    const rawData = await response.json();
    
    const processedData = processData(rawData);
    
    // Update Caches
    MEMORY_CACHE = processedData;
    LAST_FETCH_TIME = now;
    localStorage.setItem('complaints', JSON.stringify(processedData));
    
    return processedData;
  } catch (error) {
    console.warn("Failed to fetch, using local fallback", error);
    if (!MEMORY_CACHE) {
         MEMORY_CACHE = processData(localData);
    }
    return MEMORY_CACHE;
  }
};

export const submitComplaint = async (complaint: Complaint): Promise<boolean> => {
  // Optimistic Update
  if (!MEMORY_CACHE) MEMORY_CACHE = [];
  MEMORY_CACHE.unshift(complaint);
  MEMORY_CACHE = processData(MEMORY_CACHE);
  
  // Update Local Storage
  localStorage.setItem('complaints', JSON.stringify(MEMORY_CACHE));

  if (!MOCK_MODE) {
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...complaint }),
      });
      return true;
    } catch (error) {
      console.error("Failed to post to Google Sheets", error);
      return false; 
    }
  }
  return true;
};

export const updateComplaint = async (complaint: Complaint): Promise<boolean> => {
    // Optimistic Update
    if (!MEMORY_CACHE) {
        const local = localStorage.getItem('complaints');
        MEMORY_CACHE = local ? JSON.parse(local) : [];
    }
    
    if (MEMORY_CACHE) {
        const index = MEMORY_CACHE.findIndex(c => c.id === complaint.id);
        if (index !== -1) {
            MEMORY_CACHE[index] = complaint;
        } else {
            MEMORY_CACHE.unshift(complaint);
        }
        // Ensure order and deduplication
        MEMORY_CACHE = processData(MEMORY_CACHE);
        localStorage.setItem('complaints', JSON.stringify(MEMORY_CACHE));
    }

    // Network
    if (!MOCK_MODE) {
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', ...complaint }),
            });
        } catch (e) {
            console.error("Remote update failed", e);
        }
    }
    return true; 
};

export const updateComplaintStatus = async (id: string, newStatus: ComplaintStatus): Promise<boolean> => {
    // Helper to find item cleanly
    const all = await fetchComplaints(); // Ensures we have data in memory
    const item = all.find(c => c.id === id);
    if (item) {
        const updatedItem = { ...item, status: newStatus };
        return updateComplaint(updatedItem);
    }
    return false;
};

export const calculateScore = (activities: Complaint[], user: UserType): number => {
  let score = 500;
  
  activities.forEach(act => {
    if (act.status === ComplaintStatus.Annulled) return;
    // PENDING approvals do not count yet
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
