
export enum UserType {
  Vikulya = 'Викуля',
  Yanik = 'Яник',
}

export enum ActivityType {
  Complaint = 'COMPLAINT',
  GoodDeed = 'GOOD_DEED'
}

export enum ComplaintStatus {
  Approved = 'APPROVED',
  InProgress = 'IN PROGRESS',
  Compensated = 'COMPENSATED',
  Completed = 'COMPLETED'
}

export interface Complaint {
  id: string;
  user: UserType; // For Complaint: The Accused. For GoodDeed: The Doer.
  type: ActivityType;
  category: string;
  categoryIcon: string;
  description: string;
  compensation: string;
  compensationIcon: string;
  timestamp: string; // ISO string
  status: ComplaintStatus;
  points: number; // Negative for complaints, Positive for deeds
}

export interface KPI {
  totalComplaints: number;
  vikulyaScore: number;
  yanikScore: number;
  weeklyGrowth: number;
}

export interface Tier {
  min: number;
  name: string;
  desc: string;
  color: string;
}

export const TIERS: Tier[] = [
  { min: 0, name: 'Нуб', desc: 'Хуже некуда. Срочно исправляйся!', color: 'text-red-600' },
  { min: 100, name: 'Токсик', desc: 'Душно, сложно, тяжело.', color: 'text-red-500' },
  { min: 200, name: 'Душнила', desc: 'С тобой непросто.', color: 'text-orange-600' },
  { min: 300, name: 'Нормис', desc: 'Ни рыба ни мясо.', color: 'text-orange-500' },
  { min: 400, name: 'Старательный', desc: 'Ты пытаешься, это видно.', color: 'text-yellow-600' },
  { min: 500, name: 'Зайка', desc: 'Комфортный уровень отношений.', color: 'text-yellow-500' },
  { min: 600, name: 'Котик', desc: 'Мур-мур, все хорошо.', color: 'text-green-500' },
  { min: 700, name: 'Краш', desc: 'Сердечко бьется чаще.', color: 'text-green-600' },
  { min: 800, name: 'Легенда', desc: 'Пример для подражания.', color: 'text-blue-500' },
  { min: 900, name: 'Идеал', desc: 'Ты существуешь вообще?', color: 'text-indigo-500' },
  { min: 1000, name: 'Божество', desc: 'Google Standards Quality.', color: 'text-purple-600' },
];

export const CATEGORIES = [
  { id: 'late', label: 'Опоздание', icon: '⏰' },
  { id: 'ignore', label: 'Игнор', icon: '👻' },
  { id: 'bad_joke', label: 'Плохая шутка', icon: '🃏' },
  { id: 'coffee_debt', label: 'Кофейный долг', icon: '☕' },
  { id: 'cold', label: 'Холодность', icon: '🧊' },
  { id: 'phone', label: 'Телефономания', icon: '📱' },
];

export const COMPENSATIONS = [
  { id: 'coffee', label: 'Купить кофе', icon: 'coffee', color: 'text-orange-600', bg: 'bg-orange-100' },
  { id: 'apology', label: 'Извинения', icon: 'campaign', color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'movie', label: 'Билет в кино', icon: 'local_activity', color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'dinner', label: 'Ужин', icon: 'restaurant', color: 'text-green-600', bg: 'bg-green-100' },
];
