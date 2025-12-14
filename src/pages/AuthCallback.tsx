// Auth Callback Page - Handles OAuth redirects and magic links
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type CallbackStatus = 'loading' | 'success' | 'error';

const AuthCallback: React.FC = () => {
    const [status, setStatus] = useState<CallbackStatus>('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Check for errors in URL params
                const error = searchParams.get('error');
                const errorDescription = searchParams.get('error_description');

                if (error) {
                    // Handle specific errors
                    if (error === 'access_denied' && errorDescription?.includes('expired')) {
                        throw new Error('The magic link has expired. Please request a new one.');
                    }
                    throw new Error(errorDescription || error);
                }

                // For implicit flow, the tokens are in the URL hash
                // Supabase client handles this automatically when detectSessionInUrl is true

                // Check if we have a hash with access_token (implicit flow)
                if (location.hash && location.hash.includes('access_token')) {
                    // The supabase client should handle this automatically
                    // Wait a bit for the auth state to update
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                // Check for session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                if (session) {
                    setStatus('success');
                    setMessage('Successfully signed in! Redirecting...');

                    // Redirect to home after a short delay
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 1500);
                } else {
                    // No session found, might be email confirmation
                    // Try to get the user
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        setStatus('success');
                        setMessage('Email verified! Redirecting...');
                        setTimeout(() => {
                            navigate('/', { replace: true });
                        }, 1500);
                    } else {
                        // No user found, redirect to login
                        setStatus('success');
                        setMessage('Please sign in to continue.');
                        setTimeout(() => {
                            navigate('/auth/login', { replace: true });
                        }, 2000);
                    }
                }
            } catch (error: any) {
                console.error('Auth callback error:', error);
                setStatus('error');
                setMessage(error.message || 'An error occurred during authentication');
            }
        };

        handleAuthCallback();
    }, [navigate, searchParams, location.hash]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, -30, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl text-center max-w-md w-full"
            >
                {/* Logo */}
                <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Image className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ImagePro
                    </span>
                </Link>

                {/* Status Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="mb-6"
                >
                    {status === 'loading' && (
                        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                    )}
                </motion.div>

                {/* Status Text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {status === 'loading' && 'Processing Authentication...'}
                        {status === 'success' && 'Authentication Successful!'}
                        {status === 'error' && 'Authentication Failed'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {message || (status === 'loading' && 'Please wait while we verify your credentials...')}
                    </p>
                </motion.div>

                {/* Error Actions */}
                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3"
                    >
                        <Link to="/auth/login">
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                Try Again
                            </Button>
                        </Link>
                        <Link to="/">
                            <Button variant="outline" className="w-full">
                                Back to Home
                            </Button>
                        </Link>
                    </motion.div>
                )}

                {/* Loading Animation */}
                {status === 'loading' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-center space-x-2"
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                animate={{
                                    y: [-5, 5, -5],
                                }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    delay: i * 0.1,
                                }}
                            />
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default AuthCallback;
