
-- VIRALYZE Streak Feature Migration
-- Run this SQL in your Supabase SQL editor

-- 1. Create user_streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Enable RLS
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
CREATE POLICY "Users can view their own streaks" ON user_streaks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own streaks" ON user_streaks
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own streaks" ON user_streaks
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 4. Create function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS TABLE(
    current_streak INTEGER,
    is_new_day BOOLEAN,
    show_popup BOOLEAN
) AS $$
DECLARE
    existing_streak RECORD;
    today_date DATE := CURRENT_DATE;
    yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
    new_streak INTEGER := 0;
    is_new_day_result BOOLEAN := FALSE;
    show_popup_result BOOLEAN := FALSE;
BEGIN
    -- Get existing streak data
    SELECT * INTO existing_streak 
    FROM user_streaks 
    WHERE user_id = user_uuid;
    
    -- If no streak record exists, create one
    IF existing_streak IS NULL THEN
        INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
        VALUES (user_uuid, 1, 1, today_date);
        
        new_streak := 1;
        is_new_day_result := TRUE;
        show_popup_result := TRUE;
    ELSE
        -- Check if this is a new day
        IF existing_streak.last_activity_date < today_date THEN
            is_new_day_result := TRUE;
            
            -- Check if streak should continue (yesterday) or reset
            IF existing_streak.last_activity_date = yesterday_date THEN
                -- Continue streak
                new_streak := existing_streak.current_streak + 1;
                show_popup_result := TRUE;
            ELSE
                -- Reset streak (missed a day)
                new_streak := 1;
                show_popup_result := TRUE;
            END IF;
            
            -- Update the record
            UPDATE user_streaks 
            SET 
                current_streak = new_streak,
                longest_streak = GREATEST(longest_streak, new_streak),
                last_activity_date = today_date,
                updated_at = NOW()
            WHERE user_id = user_uuid;
        ELSE
            -- Same day, no change needed
            new_streak := existing_streak.current_streak;
            is_new_day_result := FALSE;
            show_popup_result := FALSE;
        END IF;
    END IF;
    
    -- Return the results
    RETURN QUERY SELECT new_streak, is_new_day_result, show_popup_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to get user streak
CREATE OR REPLACE FUNCTION get_user_streak(user_uuid UUID)
RETURNS TABLE(
    current_streak INTEGER,
    longest_streak INTEGER,
    last_activity_date DATE
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        COALESCE(us.current_streak, 0) as current_streak,
        COALESCE(us.longest_streak, 0) as longest_streak,
        us.last_activity_date
    FROM user_streaks us
    WHERE us.user_id = user_uuid;
    
    -- If no record found, return defaults
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0, 0, NULL::DATE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_streaks TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_streak(UUID) TO authenticated;
