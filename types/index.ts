
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
  type: 'hook' | 'script' | 'caption' | 'calendar' | 'rewrite' | 'image';
  title: string;
  payload: any;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
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
