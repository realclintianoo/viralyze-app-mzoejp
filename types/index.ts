
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
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface QuotaUsage {
  textRequests: number;
  imageRequests: number;
  maxTextRequests: number;
  maxImageRequests: number;
  resetDate: string;
}

export interface OnboardingData {
  platforms: string[];
  niche: string;
  followers: number;
  goal: string;
}
