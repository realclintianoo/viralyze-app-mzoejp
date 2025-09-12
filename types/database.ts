
export interface Profile {
  id: string;
  platforms: string[];
  niche: string | null;
  followers: number;
  goal: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedItem {
  id: number;
  user_id: string;
  type: 'hook' | 'script' | 'caption' | 'calendar' | 'rewrite' | 'image';
  title: string;
  payload: any;
  created_at: string;
}

export interface UsageLog {
  id: number;
  user_id: string;
  kind: string;
  day: string;
  count: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      saved_items: {
        Row: SavedItem;
        Insert: Omit<SavedItem, 'id' | 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Omit<SavedItem, 'id' | 'user_id' | 'created_at'>>;
      };
      usage_log: {
        Row: UsageLog;
        Insert: Omit<UsageLog, 'id'>;
        Update: Partial<Omit<UsageLog, 'id' | 'user_id' | 'kind' | 'day'>>;
      };
    };
  };
}
