
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Complaint, UserType, TIERS } from '../types';
import { fetchComplaints, calculateScore } from '../services/sheetService';

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

  const refreshData = async () => {
    // Keep loading true only on first load to prevent UI flicker
    if (complaints.length === 0) setLoading(true);
    
    try {
      const data = await fetchComplaints();
      setComplaints(data);
      calculateAndSetStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // Optional: Auto-refresh every 2 minutes
    const interval = setInterval(refreshData, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ComplaintContext.Provider value={{ complaints, loading, refreshData, vikulyaStats, yanikStats }}>
      {children}
    </ComplaintContext.Provider>
  );
};
