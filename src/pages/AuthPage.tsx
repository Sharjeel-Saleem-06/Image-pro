// Auth Page - Beautiful Login/Signup for ImagePro
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    signUpWithEmail,
    signInWithEmail,
    signInWithMagicLink,
    signInWithGoogle,
} from '@/lib/supabase';
import {
    Image,
    Mail,
    Lock,
    User,
    ArrowRight,
    Sparkles,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle,
    Wand2,
    Shield,
    Zap,
} from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot-password';

const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [magicLinkLoading, setMagicLinkLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isMagicLinkModalOpen, setIsMagicLinkModalOpen] = useState(false);
    const [magicLinkEmail, setMagicLinkEmail] = useState('');

    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    // Clear messages when mode changes
    useEffect(() => {
        setError(null);
        setSuccess(null);
    }, [mode]);

    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateForm = (): boolean => {
        setError(null);

        if (!email.trim()) {
            setError('Email is required');
            return false;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return false;
        }

        if (mode === 'signup') {
            if (!fullName.trim()) {
                setError('Full name is required');
                return false;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters');
                return false;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
        }

        if ((mode === 'login' || mode === 'signup') && !password) {
            setError('Password is required');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (mode === 'login') {
                const { error } = await signInWithEmail(email, password);
                if (error) throw error;

                toast({
                    title: 'Welcome back! 👋',
                    description: 'Successfully signed in to ImagePro',
                });

                const from = location.state?.from?.pathname || '/';
                navigate(from, { replace: true });

            } else if (mode === 'signup') {
                const { error } = await signUpWithEmail(email, password, fullName);
                if (error) throw error;

                setSuccess('Account created! Please check your email to verify your account.');
                toast({
                    title: 'Account created! 🎉',
                    description: 'Check your email to verify your account',
                });

            } else if (mode === 'forgot-password') {
                // Will implement with Supabase reset password
                setSuccess('Password reset link sent! Check your email.');
                toast({
                    title: 'Reset link sent! 📧',
                    description: 'Check your email to reset your password',
                });
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const openMagicLinkModal = () => {
        setError(null);
        if (email && validateEmail(email)) {
            setMagicLinkEmail(email);
        }
        setIsMagicLinkModalOpen(true);
    };

    const sendMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!magicLinkEmail.trim()) {
            setError('Please enter your email address');
            return;
        }

        if (!validateEmail(magicLinkEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        setMagicLinkLoading(true);
        setError(null);

        try {
            const { error } = await signInWithMagicLink(magicLinkEmail);
            if (error) throw error;

            setIsMagicLinkModalOpen(false);
            setSuccess(`Magic link sent to ${magicLinkEmail}! Check your email.`);
            toast({
                title: 'Magic link sent! ✨',
                description: 'Check your email for the sign-in link',
            });
            setMagicLinkEmail('');
        } catch (err: any) {
            console.error('Magic link error:', err);
            setError(err.message || 'Failed to send magic link. Please try again.');
        } finally {
            setMagicLinkLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError(null);

        try {
            const { error } = await signInWithGoogle();
            if (error) throw error;
            // Will redirect to Google OAuth
        } catch (err: any) {
            console.error('Google sign-in error:', err);
            setError(err.message || 'Failed to sign in with Google');
            setGoogleLoading(false);
        }
    };

    const features = [
        { icon: Wand2, text: 'AI-Powered Image Processing' },
        { icon: Shield, text: '100% Private & Secure' },
        { icon: Zap, text: 'Lightning Fast Editing' },
        { icon: Sparkles, text: 'Save Your Work & History' },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding & Features */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                    {/* Animated Circles */}
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                        animate={{
                            x: [0, 50, 0],
                            y: [0, 30, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl"
                        animate={{
                            x: [0, -30, 0],
                            y: [0, 50, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"
                        animate={{
                            rotate: [0, 360],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />

                    {/* Floating particles */}
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-white/30 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [-20, 20, -20],
                                opacity: [0.2, 0.8, 0.2],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 4,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16 text-white">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3 mb-12">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                        >
                            <Image className="w-7 h-7 text-white" />
                        </motion.div>
                        <span className="text-3xl font-bold">ImagePro</span>
                    </Link>

                    {/* Main Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
                            Transform Your Images
                            <br />
                            <span className="text-white/80">With AI Power</span>
                        </h1>
                        <p className="text-xl text-white/70 mb-10 max-w-md leading-relaxed">
                            Join thousands of creators using ImagePro to convert, edit, and enhance images with cutting-edge AI technology.
                        </p>
                    </motion.div>

                    {/* Features List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.text}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="flex items-center space-x-4"
                            >
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <span className="text-lg text-white/90">{feature.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Bottom Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-12 pt-8 border-t border-white/20"
                    >
                        <div className="flex space-x-8">
                            <div>
                                <div className="text-3xl font-bold">10K+</div>
                                <div className="text-white/60">Active Users</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">50K+</div>
                                <div className="text-white/60">Images Processed</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">99%</div>
                                <div className="text-white/60">Satisfaction</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Image className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ImagePro
                        </span>
                    </div>

                    {/* Auth Card */}
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-2xl">
                        <CardContent className="p-8">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <motion.h2
                                    key={mode}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                                >
                                    {mode === 'login' && 'Welcome Back'}
                                    {mode === 'signup' && 'Create Account'}
                                    {mode === 'forgot-password' && 'Reset Password'}
                                </motion.h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {mode === 'login' && 'Sign in to continue to ImagePro'}
                                    {mode === 'signup' && 'Start your image transformation journey'}
                                    {mode === 'forgot-password' && "We'll send you a reset link"}
                                </p>
                            </div>

                            {/* Error/Success Messages */}
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <Alert variant="destructive" className="mb-6">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    </motion.div>
                                )}
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <AlertDescription className="text-green-800 dark:text-green-200">
                                                {success}
                                            </AlertDescription>
                                        </Alert>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Social Login Buttons */}
                            {(mode === 'login' || mode === 'signup') && (
                                <>
                                    <div className="space-y-3 mb-6">
                                        {/* Google Button */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-12 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                            onClick={handleGoogleSignIn}
                                            disabled={loading || magicLinkLoading || googleLoading}
                                        >
                                            {googleLoading ? (
                                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                            ) : (
                                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                                    <path
                                                        fill="#4285F4"
                                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    />
                                                    <path
                                                        fill="#34A853"
                                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    />
                                                    <path
                                                        fill="#FBBC05"
                                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    />
                                                    <path
                                                        fill="#EA4335"
                                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    />
                                                </svg>
                                            )}
                                            Continue with Google
                                        </Button>

                                        {/* Magic Link Button */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-12 text-base font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-800 transition-all group"
                                            onClick={openMagicLinkModal}
                                            disabled={loading || magicLinkLoading || googleLoading}
                                        >
                                            {magicLinkLoading ? (
                                                <Loader2 className="w-5 h-5 mr-3 animate-spin text-purple-600" />
                                            ) : (
                                                <Sparkles className="w-5 h-5 mr-3 text-purple-600 group-hover:text-purple-700" />
                                            )}
                                            <span className="text-purple-700 dark:text-purple-400">
                                                Continue with Magic Link
                                            </span>
                                        </Button>
                                    </div>

                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <Separator className="w-full" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white dark:bg-gray-800 px-3 text-gray-500">
                                                Or with email & password
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Auth Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {mode === 'signup' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-200">
                                            Full Name
                                        </Label>
                                        <div className="relative mt-1.5">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <Input
                                                id="fullName"
                                                type="text"
                                                placeholder="John Doe"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="pl-11 h-12 text-base bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                                disabled={loading}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                <div>
                                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-200">
                                        Email Address
                                    </Label>
                                    <div className="relative mt-1.5">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-11 h-12 text-base bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {(mode === 'login' || mode === 'signup') && (
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-200">
                                                Password
                                            </Label>
                                            {mode === 'login' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMode('forgot-password')}
                                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                                >
                                                    Forgot password?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative mt-1.5">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-11 pr-11 h-12 text-base bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {mode === 'signup' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-200">
                                            Confirm Password
                                        </Label>
                                        <div className="relative mt-1.5">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <Input
                                                id="confirmPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="pl-11 h-12 text-base bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                                disabled={loading}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={loading || magicLinkLoading || googleLoading}
                                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Please wait...
                                        </>
                                    ) : (
                                        <>
                                            {mode === 'login' && 'Sign In'}
                                            {mode === 'signup' && 'Create Account'}
                                            {mode === 'forgot-password' && 'Send Reset Link'}
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Mode Switchers */}
                            <div className="mt-6 text-center">
                                {mode === 'login' && (
                                    <p className="text-gray-600 dark:text-gray-300">
                                        Don't have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={() => setMode('signup')}
                                            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                        >
                                            Sign up
                                        </button>
                                    </p>
                                )}
                                {mode === 'signup' && (
                                    <p className="text-gray-600 dark:text-gray-300">
                                        Already have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={() => setMode('login')}
                                            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                        >
                                            Sign in
                                        </button>
                                    </p>
                                )}
                                {mode === 'forgot-password' && (
                                    <button
                                        type="button"
                                        onClick={() => setMode('login')}
                                        className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center mx-auto"
                                    >
                                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                                        Back to sign in
                                    </button>
                                )}
                            </div>

                            {/* Terms */}
                            {mode === 'signup' && (
                                <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
                                    By creating an account, you agree to our{' '}
                                    <Link to="/terms" className="text-blue-600 hover:underline">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link to="/privacy" className="text-blue-600 hover:underline">
                                        Privacy Policy
                                    </Link>
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Back to Home */}
                    <div className="mt-8 text-center">
                        <Link
                            to="/"
                            className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center"
                        >
                            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                            Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
            {/* Magic Link Modal */}
            <Dialog open={isMagicLinkModalOpen} onOpenChange={setIsMagicLinkModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sign in with Magic Link</DialogTitle>
                        <DialogDescription>
                            Enter your email address and we'll send you a link to sign in instantly.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={sendMagicLink} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="magicLinkEmail">Email Address</Label>
                            <Input
                                id="magicLinkEmail"
                                type="email"
                                placeholder="name@example.com"
                                value={magicLinkEmail}
                                onChange={(e) => setMagicLinkEmail(e.target.value)}
                                disabled={magicLinkLoading}
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsMagicLinkModalOpen(false)}
                                disabled={magicLinkLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                disabled={magicLinkLoading}
                            >
                                {magicLinkLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Send Magic Link
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AuthPage;
