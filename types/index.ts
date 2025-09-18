
export interface User {
  id: string;
  email?: string;
  platforms: string[];
  niche: string;
  followers: number;
  goal: string;
  created_at?: string;
  updated_at?: string;
}

export interface SavedItem {
  id: string;
  user_id?: string;
  type: 'hook' | 'script' | 'caption' | 'calendar' | 'rewrite' | 'image' | 'chat';
  title: string;
  payload: any;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isError?: boolean;
}

export interface QuotaUsage {
  text: number;
  image: number;
}

export interface OnboardingData {
  platforms: string[];
  niche: string;
  followers: number;
  goal: string;
}

export interface UserStats {
  streak: number;
  level: number;
  xp: number;
  badges: Badge[];
  totalGenerated: {
    hooks: number;
    scripts: number;
    captions: number;
    images: number;
  };
  lastActiveDate: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: string;
  category: 'milestone' | 'streak' | 'activity' | 'special';
}

export interface PresetPrompt {
  id: string;
  title: string;
  prompt: string;
  category: string;
  icon: string;
}

export interface InputMode {
  id: 'text' | 'image';
  title: string;
  icon: string;
  active: boolean;
}
