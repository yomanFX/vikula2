import { Complaint, ComplaintStatus, UserType, ActivityType } from '../types';

// INSTRUCTIONS FOR USER:
// 1. Create a Google Sheet.
// 2. Add columns in row 1: id, user, type, category, categoryIcon, description, compensation, compensationIcon, timestamp, status, points
// 3. Go to Extensions > Apps Script.
// 4. Paste the code below (in the comment block) into the script editor.
// 5. Deploy as Web App -> Execute as: "Me", Who can access: "Anyone".
// 6. Paste the deployed Web App URL below in `SCRIPT_URL`.

/*
// GOOGLE APPS SCRIPT CODE:
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i];
    });
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  // Ensure order matches columns: id, user, type, category, categoryIcon, description, compensation, compensationIcon, timestamp, status, points
  sheet.appendRow([
    data.id, 
    data.user, 
    data.type || 'COMPLAINT',
    data.category, 
    data.categoryIcon, 
    data.description, 
    data.compensation, 
    data.compensationIcon, 
    data.timestamp, 
    data.status, 
    data.points
  ]);
  return ContentService.createTextOutput(JSON.stringify({result: 'success'})).setMimeType(ContentService.MimeType.JSON);
}
*/

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzb6VOmSiBbxIE5G5jxxKrGtAlDB3gF-HW1zqytV5cGbktg5W1f5xLKU3VnSLoBwhSf9Q/exec'; // <--- PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
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
    await new Promise(resolve => setTimeout(resolve, 800));
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    const current = localStorage.getItem('complaints');
    const all = current ? JSON.parse(current) : MOCK_DATA;
    all.unshift(complaint);
    localStorage.setItem('complaints', JSON.stringify(all));
    return true;
  }

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script text/plain workaround
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(complaint),
    });
    return true;
  } catch (error) {
    console.error("Failed to post to Google Sheets", error);
    return false;
  }
};

export const calculateScore = (activities: Complaint[], user: UserType): number => {
  // Base score 500. Max 1000. Min 0.
  let score = 500;
  
  activities.forEach(act => {
    // If it's a Good Deed BY the user, add points.
    if (act.type === ActivityType.GoodDeed && act.user === user) {
      score += Math.abs(act.points);
    }
    // If it's a Complaint AGAINST the user, subtract points.
    else if (act.type === ActivityType.Complaint && act.user === user) {
      score -= Math.abs(act.points);
    }
  });

  return Math.max(0, Math.min(1000, score));
};
