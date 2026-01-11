export enum UserType {
  Vikulya = 'Викуля',
  Yanik = 'Яник'
}

export enum ActivityType {
  Complaint = 'COMPLAINT',
  GoodDeed = 'GOOD_DEED'
}

export enum ComplaintStatus {
  Approved = 'APPROVED',
  InProgress = 'IN PROGRESS',
  Completed = 'COMPLETED',
  Compensated = 'COMPENSATED'
}

export interface Complaint {
  id: string;
  user: UserType | string;
  type: ActivityType | string;
  category: string;
  categoryIcon: string;
  description: string;
  compensation: string;
  compensationIcon: string;
  timestamp: string;
  status: ComplaintStatus;
  points: number;
}

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
