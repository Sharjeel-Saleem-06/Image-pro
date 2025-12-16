// User Profile Page
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/supabase';
import { getUserStats, UserStats } from '@/lib/activityTracking';
import Layout from '@/components/Layout';
import {
    User,
    Mail,
    Calendar,
    Edit2,
    Save,
    X,
    Image,
    FileText,
    Sparkles,
    Wand2,
    BarChart3,
    Shield,
    Settings,
    LogOut,
    Camera,
    Loader2,
    CheckCircle,
} from 'lucide-react';

const ProfilePage: React.FC = () => {
    const { user, profile, signOut, refreshProfile, isAuthenticated } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/auth/login', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Initialize form data from profile
    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setBio(profile.bio || '');
        }
    }, [profile]);

    // Fetch user stats from database
    useEffect(() => {
        const fetchStats = async () => {
            if (!isAuthenticated) return;
            
            setStatsLoading(true);
            const stats = await getUserStats();
            setUserStats(stats);
            setStatsLoading(false);
        };

        fetchStats();
    }, [isAuthenticated]);

    const handleSaveProfile = async () => {
        if (!user?.id) return;

        setLoading(true);
        setError(null);

        try {
            const { error } = await updateUserProfile(user.id, {
                full_name: fullName,
                bio: bio,
            });

            if (error) throw error;

            await refreshProfile();
            setIsEditing(false);
            toast({
                title: 'Profile Updated! ✨',
                description: 'Your profile has been saved successfully',
            });
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
        toast({
            title: 'Signed out',
            description: 'You have been signed out successfully',
        });
    };

    // User activity stats from Supabase
    const stats = [
        { 
            label: 'Images Converted', 
            value: statsLoading ? '...' : (userStats?.images_converted || 0).toString(), 
            icon: Image 
        },
        { 
            label: 'Images Edited', 
            value: statsLoading ? '...' : (userStats?.images_edited || 0).toString(), 
            icon: Wand2 
        },
        { 
            label: 'OCR Extractions', 
            value: statsLoading ? '...' : (userStats?.ocr_extractions || 0).toString(), 
            icon: FileText 
        },
        { 
            label: 'AI Enhancements', 
            value: statsLoading ? '...' : (userStats?.ai_enhancements || 0).toString(), 
            icon: Sparkles 
        },
    ];

    if (!isAuthenticated) {
        return null;
    }

    return (
        <Layout>
            <div className="min-h-screen py-12 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Your Profile
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Manage your account and view your activity
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-1"
                        >
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardContent className="p-6">
                                    {/* Avatar */}
                                    <div className="relative w-32 h-32 mx-auto mb-6">
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                                            {profile?.full_name?.charAt(0)?.toUpperCase() ||
                                                user?.email?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <button className="absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                            <Camera className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                        </button>
                                    </div>

                                    {/* User Info */}
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                            {profile?.full_name || 'ImagePro User'}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center">
                                            <Mail className="w-4 h-4 mr-2" />
                                            {user?.email}
                                        </p>
                                        <div className="flex items-center justify-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Joined {profile?.created_at
                                                ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                                : 'Recently'}
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {profile?.bio && (
                                        <p className="text-gray-600 dark:text-gray-300 text-center mb-6 italic">
                                            "{profile.bio}"
                                        </p>
                                    )}

                                    {/* Account Badge */}
                                    <div className="flex justify-center mb-6">
                                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                            <Shield className="w-3 h-3 mr-1" />
                                            Free Account
                                        </Badge>
                                    </div>

                                    <Separator className="mb-6" />

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Edit Profile
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={handleSignOut}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Sign Out
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Main Content */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-2 space-y-6"
                        >
                            {/* Edit Profile Form */}
                            {isEditing && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Edit2 className="w-5 h-5" />
                                                Edit Profile
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {error && (
                                                <Alert variant="destructive">
                                                    <AlertDescription>{error}</AlertDescription>
                                                </Alert>
                                            )}

                                            <div>
                                                <Label htmlFor="fullName">Full Name</Label>
                                                <Input
                                                    id="fullName"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="Your full name"
                                                    className="mt-1.5"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="bio">Bio</Label>
                                                <Input
                                                    id="bio"
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value)}
                                                    placeholder="Tell us about yourself"
                                                    className="mt-1.5"
                                                />
                                            </div>

                                            <div className="flex space-x-3 pt-4">
                                                <Button
                                                    onClick={handleSaveProfile}
                                                    disabled={loading}
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                                >
                                                    {loading ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Save className="w-4 h-4 mr-2" />
                                                    )}
                                                    Save Changes
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsEditing(false)}
                                                    disabled={loading}
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Activity Stats */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5" />
                                        Your Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        {stats.map((stat, index) => (
                                            <motion.div
                                                key={stat.label}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                                        <stat.icon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                                        {stat.value}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    {stat.label}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <Link to="/converter">
                                            <Button variant="outline" className="w-full h-auto py-4 flex-col">
                                                <Image className="w-6 h-6 mb-2" />
                                                <span className="text-xs">Convert</span>
                                            </Button>
                                        </Link>
                                        <Link to="/editor">
                                            <Button variant="outline" className="w-full h-auto py-4 flex-col">
                                                <Wand2 className="w-6 h-6 mb-2" />
                                                <span className="text-xs">Editor</span>
                                            </Button>
                                        </Link>
                                        <Link to="/ocr">
                                            <Button variant="outline" className="w-full h-auto py-4 flex-col">
                                                <FileText className="w-6 h-6 mb-2" />
                                                <span className="text-xs">OCR</span>
                                            </Button>
                                        </Link>
                                        <Link to="/ai-enhancer">
                                            <Button variant="outline" className="w-full h-auto py-4 flex-col">
                                                <Sparkles className="w-6 h-6 mb-2" />
                                                <span className="text-xs">AI Tools</span>
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProfilePage;
