
export interface OnboardingData {
  platforms: string[];
  niche: string;
  followers: number;
  goal: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  type: 'hook' | 'script' | 'caption' | 'calendar' | 'rewrite' | 'image';
  title: string;
  payload: {
    content: string;
    input?: string;
    generated_at: string;
    tool?: string;
    imageSize?: string;
    profile?: OnboardingData;
    source?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface QuotaUsage {
  textRequests: number;
  imageRequests: number;
  maxTextRequests: number;
  maxImageRequests: number;
  resetDate: string;
}

export interface Profile {
  id: string;
  user_id: string;
  platforms: string[];
  niche: string;
  followers: number;
  goal: string;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  kind: 'text' | 'image';
  day: string;
  count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  kind?: string;
}

export interface APIStatus {
  openai: {
    status: 'connected' | 'warning' | 'error' | 'unknown';
    message: string;
  };
  supabase: {
    status: 'connected' | 'warning' | 'error' | 'unknown';
    message: string;
  };
}
