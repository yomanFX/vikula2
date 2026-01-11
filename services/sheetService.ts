
import { Complaint, ComplaintStatus, UserType, ActivityType } from '../types';

const SCRIPT_URL = ''; // <--- PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const MOCK_MODE = SCRIPT_URL === '';

// Mock Data for demonstration if no API is connected
const MOCK_DATA: Complaint[] = [
  {
    id: '1',
    user: UserType.Vikulya,
    type: ActivityType.Complaint,
    category: 'Холодность',
    categoryIcon: '🧊',
    description: 'Съела последний йогурт без предупреждения',
    compensation: 'Купить два новых Epica',
    compensationIcon: 'redeem',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    status: ComplaintStatus.Approved,
    points: -15
  },
  {
    id: '2',
    user: UserType.Yanik,
    type: ActivityType.Complaint,
    category: 'Опоздание',
    categoryIcon: '⏰',
    description: 'Забыл вынести мусор (уже в третий раз!)',
    compensation: 'Массаж ног в течение 20 мин',
    compensationIcon: 'dry_cleaning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    status: ComplaintStatus.InProgress,
    points: -25
  },
  {
    id: '3',
    user: UserType.Vikulya,
    type: ActivityType.GoodDeed,
    category: 'Забота',
    categoryIcon: '❤️',
    description: 'Сделала вкусный завтрак',
    compensation: '',
    compensationIcon: '',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
    status: ComplaintStatus.Completed,
    points: 50
  }
];

export const fetchComplaints = async (): Promise<Complaint[]> => {
  if (MOCK_MODE) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const localData = localStorage.getItem('complaints');
    return localData ? JSON.parse(localData) : MOCK_DATA;
  }

  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch from Google Sheets", error);
    return [];
  }
};

export const submitComplaint = async (complaint: Complaint): Promise<boolean> => {
  if (MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 800));
    const current = localStorage.getItem('complaints');
    const all = current ? JSON.parse(current) : MOCK_DATA;
    all.unshift(complaint);
    localStorage.setItem('complaints', JSON.stringify(all));
    return true;
  }

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaint),
    });
    return true;
  } catch (error) {
    console.error("Failed to post to Google Sheets", error);
    return false;
  }
};

export const updateComplaintStatus = async (id: string, newStatus: ComplaintStatus): Promise<boolean> => {
    if (MOCK_MODE) {
        const current = localStorage.getItem('complaints');
        let all: Complaint[] = current ? JSON.parse(current) : MOCK_DATA;
        
        const index = all.findIndex(c => c.id === id);
        if (index !== -1) {
            all[index].status = newStatus;
            localStorage.setItem('complaints', JSON.stringify(all));
            return true;
        }
        return false;
    }
    
    // NOTE: For real Google Sheets implementation, you would need to implement an 'update' action 
    // in the Apps Script or simply append a new row representing the update and filter in the frontend.
    // For this demo, we assume the API handles it or we just return true.
    return true; 
};

export const calculateScore = (activities: Complaint[], user: UserType): number => {
  // Base score 500. Max 1000. Min 0.
  let score = 500;
  
  activities.forEach(act => {
    // 1. Good Deeds: The User is the DOER.
    if (act.type === ActivityType.GoodDeed && act.user === user) {
      score += Math.abs(act.points);
    }
    // 2. Complaints: The User is the ACCUSED.
    else if (act.type === ActivityType.Complaint && act.user === user) {
      // Logic Update: Points are permanently lost for complaints, regardless of compensation status.
      // You must perform Good Deeds to recover score.
      score -= Math.abs(act.points);
    }
  });

  return Math.max(0, Math.min(1000, score));
};
