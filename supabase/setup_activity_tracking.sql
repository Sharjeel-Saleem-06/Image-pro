-- =====================================================
-- IMAGEPRO ACTIVITY TRACKING - ENHANCED SETUP
-- =====================================================
-- Run this in Supabase SQL Editor after setup.sql
-- This adds activity tracking and statistics
-- =====================================================

-- =====================================================
-- 1. ADD ACTIVITY STATS TO PROFILES TABLE
-- =====================================================
-- Add columns to track total activities
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS images_converted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS images_edited INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ocr_extractions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_enhancements INTEGER DEFAULT 0;

-- =====================================================
-- 2. CREATE FUNCTION TO INCREMENT ACTIVITY COUNTERS
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_user_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
    -- Insert activity record
    INSERT INTO public.user_activity (user_id, activity_type, metadata)
    VALUES (p_user_id, p_activity_type, p_metadata);
    
    -- Update profile counters based on activity type
    CASE p_activity_type
        WHEN 'image_converted' THEN
            UPDATE public.profiles 
            SET images_converted = images_converted + 1
            WHERE id = p_user_id;
        WHEN 'image_edited' THEN
            UPDATE public.profiles 
            SET images_edited = images_edited + 1
            WHERE id = p_user_id;
        WHEN 'ocr_extraction' THEN
            UPDATE public.profiles 
            SET ocr_extractions = ocr_extractions + 1
            WHERE id = p_user_id;
        WHEN 'ai_enhancement' THEN
            UPDATE public.profiles 
            SET ai_enhancements = ai_enhancements + 1
            WHERE id = p_user_id;
        ELSE
            -- Do nothing for unknown types
            NULL;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. CREATE VIEW FOR USER STATISTICS
-- =====================================================
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    p.images_converted,
    p.images_edited,
    p.ocr_extractions,
    p.ai_enhancements,
    (p.images_converted + p.images_edited + p.ocr_extractions + p.ai_enhancements) as total_activities,
    (SELECT COUNT(*) FROM public.user_activity WHERE user_id = p.id) as activity_count,
    (SELECT COUNT(DISTINCT DATE(created_at)) FROM public.user_activity WHERE user_id = p.id) as active_days,
    (SELECT MAX(created_at) FROM public.user_activity WHERE user_id = p.id) as last_activity,
    p.created_at as joined_at
FROM public.profiles p;

-- Grant access to view
GRANT SELECT ON public.user_stats TO authenticated;

-- Enable RLS on the view (users can only see their own stats)
ALTER VIEW public.user_stats SET (security_invoker = on);

-- =====================================================
-- 4. CREATE FUNCTION TO GET USER ACTIVITY SUMMARY
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(p_user_id UUID)
RETURNS TABLE (
    activity_type TEXT,
    total_count BIGINT,
    last_performed TIMESTAMP WITH TIME ZONE,
    recent_activities JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.activity_type,
        COUNT(*)::BIGINT as total_count,
        MAX(ua.created_at) as last_performed,
        jsonb_agg(
            jsonb_build_object(
                'timestamp', ua.created_at,
                'metadata', ua.metadata
            ) ORDER BY ua.created_at DESC
        ) FILTER (WHERE ua.created_at >= NOW() - INTERVAL '7 days') as recent_activities
    FROM public.user_activity ua
    WHERE ua.user_id = p_user_id
    GROUP BY ua.activity_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE FUNCTION TO GET RECENT ACTIVITY
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_recent_activity(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    activity_type TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.id,
        ua.activity_type,
        ua.metadata,
        ua.created_at
    FROM public.user_activity ua
    WHERE ua.user_id = p_user_id
    ORDER BY ua.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE FUNCTION TO GET ACTIVITY BY DATE RANGE
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_activity_by_date_range(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    date DATE,
    activity_type TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(ua.created_at) as date,
        ua.activity_type,
        COUNT(*)::BIGINT as count
    FROM public.user_activity ua
    WHERE ua.user_id = p_user_id
        AND ua.created_at >= p_start_date
        AND ua.created_at <= p_end_date
    GROUP BY DATE(ua.created_at), ua.activity_type
    ORDER BY date DESC, activity_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.increment_user_activity(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_activity_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_activity(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_activity_by_date_range(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- =====================================================
-- 8. CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_activity_user_type_date 
ON public.user_activity(user_id, activity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_activity_stats 
ON public.profiles(id, images_converted, images_edited, ocr_extractions, ai_enhancements);

-- =====================================================
-- DONE! Activity tracking is now ready
-- =====================================================
-- 
-- Usage examples:
-- 
-- 1. Increment activity (call from your app):
--    SELECT public.increment_user_activity(
--        'user-uuid-here', 
--        'image_converted',
--        '{"format": "png->jpg", "size": "2MB"}'::jsonb
--    );
--
-- 2. Get user stats:
--    SELECT * FROM public.user_stats WHERE user_id = 'user-uuid-here';
--
-- 3. Get activity summary:
--    SELECT * FROM public.get_user_activity_summary('user-uuid-here');
--
-- 4. Get recent activities:
--    SELECT * FROM public.get_recent_activity('user-uuid-here', 20);
--
-- =====================================================

