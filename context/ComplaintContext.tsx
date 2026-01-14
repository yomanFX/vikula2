
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Complaint, UserType, TIERS } from '../types';
import { fetchComplaints, calculateScore, getAvatarUrl } from '../services/sheetService';
import { supabase } from '../services/supabase';

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
  refreshAvatars: () => void;
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

  const refreshAvatars = () => {
     // We append a timestamp in memory to force React to re-render the images
     // The base URL comes from Supabase
     const ts = Date.now();
     setAvatars({
         [UserType.Vikulya]: `${getAvatarUrl(UserType.Vikulya)}?t=${ts}`,
         [UserType.Yanik]: `${getAvatarUrl(UserType.Yanik)}?t=${ts}`
     });
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
    // Initial data fetch
    refreshData();
    refreshAvatars();

    // Set up Supabase real-time subscription
    const channel = supabase.channel('database-changes');
    channel
      .on('broadcast', { event: 'refresh' }, () => {
        console.log('Refresh event received!');
        refreshData();
        refreshAvatars();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to real-time updates!');
        }
      });

    // Clean up subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ComplaintContext.Provider value={{ complaints, loading, refreshData, vikulyaStats, yanikStats, avatars, refreshAvatars }}>
      {children}
    </ComplaintContext.Provider>
  );
};