
# VIRALYZE Database Setup

This document outlines the database schema and setup required for the VIRALYZE app.

## Required Tables

### 1. Profiles Table
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  platforms TEXT[] DEFAULT '{}',
  niche TEXT,
  followers INTEGER DEFAULT 0,
  goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Saved Items Table
```sql
CREATE TABLE IF NOT EXISTS saved_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('hook', 'script', 'caption', 'calendar', 'rewrite', 'image')),
  title TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Usage Log Table
```sql
CREATE TABLE IF NOT EXISTS usage_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  day DATE NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, kind, day)
);
```

## Row Level Security (RLS) Policies

### Profiles Table
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Saved Items Table
```sql
-- Enable RLS
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own saved items" ON saved_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved items" ON saved_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved items" ON saved_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved items" ON saved_items
  FOR DELETE USING (auth.uid() = user_id);
```

### Usage Log Table
```sql
-- Enable RLS
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own usage log" ON usage_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage log" ON usage_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage log" ON usage_log
  FOR UPDATE USING (auth.uid() = user_id);
```

## Indexes for Performance
```sql
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_type ON saved_items(type);
CREATE INDEX IF NOT EXISTS idx_saved_items_created_at ON saved_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_log_user_day ON usage_log(user_id, day);
CREATE INDEX IF NOT EXISTS idx_usage_log_kind ON usage_log(kind);
```

## Environment Variables

Create a `.env` file with the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://vcgqzbqyknxaekniddfl.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

## Setup Instructions

1. **Apply the migration**: Run the SQL commands above in your Supabase SQL editor
2. **Verify RLS**: Check that all policies are active
3. **Set environment variables**: Add your API keys to the `.env` file
4. **Test authentication**: Ensure sign up/sign in works
5. **Test data flow**: Create profile, generate content, save items

## Verification Checklist

Use the in-app verification checklist (floating button) to ensure all features work:

- ✅ Authentication (sign up/login/logout)
- ✅ Profile setup and editing
- ✅ Content generation (hooks, scripts, captions)
- ✅ Saving and viewing saved items
- ✅ Quota system and limits
- ✅ Upgrade modal triggers
- ✅ Image generation
- ✅ Data export functionality
- ✅ Guest mode with local storage
- ✅ Data sync on login
