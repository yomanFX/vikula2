
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Complaint, UserType, TIERS } from '../types';
import { fetchComplaints, calculateScore, getAvatarUrl } from '../services/sheetService';

interface Stats {
  score: number;
  tier: typeof TIERS[0];
}

interface ComplaintContextType {
  complaints: Complaint[];
  loading: boolean;
  refreshData: () => Promise<void>;
  vikulyaStats: Stats;
  yanikStats: Stats;
  avatars: Record<UserType, string>;
  refreshAvatars: () => Promise<void>;
}

const ComplaintContext = createContext<ComplaintContextType | null>(null);

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (!context) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
};

export const ComplaintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [vikulyaStats, setVikulyaStats] = useState<Stats>({ score: 500, tier: TIERS[5] });
  const [yanikStats, setYanikStats] = useState<Stats>({ score: 500, tier: TIERS[5] });

  const [avatars, setAvatars] = useState<Record<UserType, string>>({
    [UserType.Vikulya]: `https://picsum.photos/seed/${UserType.Vikulya}/200`,
    [UserType.Yanik]: `https://picsum.photos/seed/${UserType.Yanik}/200`
  });

  const previousCountRef = useRef(0);
  const firstLoadRef = useRef(true);

  const calculateAndSetStats = (data: Complaint[]) => {
      const vScore = calculateScore(data, UserType.Vikulya);
      const yScore = calculateScore(data, UserType.Yanik);

      setVikulyaStats({
        score: vScore,
        tier: TIERS.find(t => vScore >= t.min && (t.min + 100) > vScore) || TIERS[TIERS.length - 1]
      });

      setYanikStats({
        score: yScore,
        tier: TIERS.find(t => yScore >= t.min && (t.min + 100) > yScore) || TIERS[TIERS.length - 1]
      });
  };

  const refreshAvatars = async () => {
     try {
         const vUrl = await getAvatarUrl(UserType.Vikulya);
         const yUrl = await getAvatarUrl(UserType.Yanik);
         
         setAvatars(prev => ({
             [UserType.Vikulya]: vUrl || prev[UserType.Vikulya],
             [UserType.Yanik]: yUrl || prev[UserType.Yanik]
         }));
     } catch (e) {
         console.error("Failed to load avatars", e);
     }
  };

  const refreshData = async () => {
    // Keep loading true only on first load to prevent UI flicker
    if (complaints.length === 0) setLoading(true);
    
    try {
      const data = await fetchComplaints();
      
      // Notification Logic
      if (!firstLoadRef.current && data.length > previousCountRef.current) {
         if (Notification.permission === 'granted') {
             const newItem = data[0]; // Assuming sorted by timestamp desc
             new Notification("Новое событие! 🚨", {
                 body: `${newItem.user}: ${newItem.category || newItem.description}`,
                 icon: 'https://cdn-icons-png.flaticon.com/512/2548/2548527.png'
             });
         }
      }

      setComplaints(data);
      calculateAndSetStats(data);
      
      previousCountRef.current = data.length;
      firstLoadRef.current = false;

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    refreshAvatars();
    // Optional: Auto-refresh every 2 minutes
    const interval = setInterval(refreshData, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ComplaintContext.Provider value={{ complaints, loading, refreshData, vikulyaStats, yanikStats, avatars, refreshAvatars }}>
      {children}
    </ComplaintContext.Provider>
  );
};
