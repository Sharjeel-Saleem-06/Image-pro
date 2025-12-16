/**
 * Activity Tracking Utility
 * Tracks user activities and syncs with Supabase database
 */

import { supabase } from './supabase';

export type ActivityType = 
    | 'image_converted'
    | 'image_edited'
    | 'ocr_extraction'
    | 'ai_enhancement';

export interface ActivityMetadata {
    tool?: string;
    format?: string;
    size?: string;
    duration?: number;
    success?: boolean;
    error?: string;
    [key: string]: any;
}

export interface UserStats {
    images_converted: number;
    images_edited: number;
    ocr_extractions: number;
    ai_enhancements: number;
    total_activities: number;
    activity_count: number;
    active_days: number;
    last_activity: string | null;
    joined_at: string;
}

/**
 * Track a user activity
 * @param activityType - Type of activity performed
 * @param metadata - Additional data about the activity
 * @returns Promise<boolean> - Success status
 */
export const trackActivity = async (
    activityType: ActivityType,
    metadata: ActivityMetadata = {}
): Promise<boolean> => {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            console.warn('No user logged in, activity not tracked');
            return false;
        }

        // Call the database function to increment activity
        const { error } = await supabase.rpc('increment_user_activity', {
            p_user_id: user.id,
            p_activity_type: activityType,
            p_metadata: metadata
        });

        if (error) {
            console.error('Error tracking activity:', error);
            return false;
        }

        console.log(`✅ Activity tracked: ${activityType}`, metadata);
        return true;
    } catch (error) {
        console.error('Error in trackActivity:', error);
        return false;
    }
};

/**
 * Get user statistics from database
 * @returns Promise<UserStats | null>
 */
export const getUserStats = async (): Promise<UserStats | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return null;
        }

        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error fetching user stats:', error);
            return null;
        }

        return data as UserStats;
    } catch (error) {
        console.error('Error in getUserStats:', error);
        return null;
    }
};

/**
 * Get recent user activities
 * @param limit - Number of recent activities to fetch
 * @returns Promise<any[]>
 */
export const getRecentActivities = async (limit: number = 10): Promise<any[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return [];
        }

        const { data, error } = await supabase.rpc('get_recent_activity', {
            p_user_id: user.id,
            p_limit: limit
        });

        if (error) {
            console.error('Error fetching recent activities:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getRecentActivities:', error);
        return [];
    }
};

/**
 * Get activity summary by type
 * @returns Promise<any[]>
 */
export const getActivitySummary = async (): Promise<any[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return [];
        }

        const { data, error } = await supabase.rpc('get_user_activity_summary', {
            p_user_id: user.id
        });

        if (error) {
            console.error('Error fetching activity summary:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getActivitySummary:', error);
        return [];
    }
};

/**
 * Get activities by date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Promise<any[]>
 */
export const getActivitiesByDateRange = async (
    startDate: Date,
    endDate: Date
): Promise<any[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return [];
        }

        const { data, error } = await supabase.rpc('get_activity_by_date_range', {
            p_user_id: user.id,
            p_start_date: startDate.toISOString(),
            p_end_date: endDate.toISOString()
        });

        if (error) {
            console.error('Error fetching activities by date range:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getActivitiesByDateRange:', error);
        return [];
    }
};

/**
 * Helper function to format activity type for display
 */
export const formatActivityType = (type: ActivityType): string => {
    const labels: Record<ActivityType, string> = {
        image_converted: 'Image Conversion',
        image_edited: 'Image Edit',
        ocr_extraction: 'OCR Extraction',
        ai_enhancement: 'AI Enhancement'
    };
    return labels[type] || type;
};

/**
 * Helper function to get activity icon name
 */
export const getActivityIcon = (type: ActivityType): string => {
    const icons: Record<ActivityType, string> = {
        image_converted: 'Image',
        image_edited: 'Wand2',
        ocr_extraction: 'FileText',
        ai_enhancement: 'Sparkles'
    };
    return icons[type] || 'Activity';
};

