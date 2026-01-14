
export enum UserType {
  Vikulya = 'Викуля',
  Yanik = 'Яник',
}

export enum ActivityType {
  Complaint = 'COMPLAINT',
  GoodDeed = 'GOOD_DEED',
  Purchase = 'PURCHASE'
}

export enum ComplaintStatus {
  Approved = 'APPROVED',
  InProgress = 'IN PROGRESS',
  PendingConfirmation = 'PENDING_CONFIRMATION', // Accused says it's fixed, waiting for Accuser to close
  Compensated = 'COMPENSATED', // Final state, closed by Accuser
  Completed = 'COMPLETED',
  PendingApproval = 'PENDING_APPROVAL', // Waiting for the partner to rate it
  // Appeal Statuses
  PendingAppeal = 'PENDING_APPEAL', // In court, waiting for arguments
  Annulled = 'ANNULLED', // Judge cancelled it
  JudgedValid = 'JUDGED_VALID' // Judge upheld it
}

export interface AppealData {
  plaintiffArg?: string; // The person appealing
  defendantArg?: string; // The original author of the deed/complaint
  judgeReasoning?: string;
  isResolved: boolean;
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
  appeal?: AppealData; // New field for court data
  image?: string; // Base64 compressed image
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

// --- SHOP TYPES ---

export type ItemType = 'frame' | 'medal';

export interface ShopItem {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  price: number;
  icon: string; // Used for Medals AND as fallback icon for purchase feed
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export const SHOP_ITEMS: ShopItem[] = [
  // FRAMES (Now linked to AvatarFrame.tsx logic via ID)
  { id: 'frame_classic', type: 'frame', name: 'Дерево', description: 'Классика жанра', price: 0, rarity: 'common', icon: '🪵' },
  { id: 'frame_gold', type: 'frame', name: 'Золотой Дракон', description: 'Роскошь для элиты', price: 150, rarity: 'legendary', icon: '🐉' },
  { id: 'frame_neon', type: 'frame', name: 'Кибер-Сити', description: 'Будущее уже здесь', price: 100, rarity: 'epic', icon: '🕶️' },
  { id: 'frame_nature', type: 'frame', name: 'Друид', description: 'Сила природы', price: 75, rarity: 'rare', icon: '🌿' },
  { id: 'frame_void', type: 'frame', name: 'Бездна', description: 'Тьма смотрит на тебя', price: 200, rarity: 'epic', icon: '🧿' },
  { id: 'frame_love', type: 'frame', name: 'Амур', description: 'Только любовь', price: 50, rarity: 'rare', icon: '💘' },
  
  // MEDALS
  { id: 'medal_rich', type: 'medal', name: 'Богач', description: 'Потратил кучу баллов', price: 200, icon: '🤑', rarity: 'epic' },
  { id: 'medal_peace', type: 'medal', name: 'Миротворец', description: 'За закрытые ссоры', price: 100, icon: '🕊️', rarity: 'rare' },
  { id: 'medal_star', type: 'medal', name: 'Звезда', description: 'Сияешь ярче всех', price: 150, icon: '🌟', rarity: 'legendary' },
  { id: 'medal_coffee', type: 'medal', name: 'Кофеман', description: 'Спонсор бодрости', price: 50, icon: '☕', rarity: 'common' },
  { id: 'medal_heart', type: 'medal', name: 'Любимка', description: 'Официально занят(а)', price: 75, icon: '❤️', rarity: 'rare' },
  { id: 'medal_crown', type: 'medal', name: 'Монарх', description: 'Не подходи', price: 400, icon: '👑', rarity: 'legendary' },
];
