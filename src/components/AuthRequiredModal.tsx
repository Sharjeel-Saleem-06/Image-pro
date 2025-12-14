// Auth Required Modal - Professional auth prompt for protected features
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Lock,
    Sparkles,
    Image,
    ArrowRight,
    Shield,
    Zap,
    Mail,
} from 'lucide-react';

interface AuthRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
    isOpen,
    onClose,
    featureName = 'this feature',
}) => {
    const benefits = [
        { icon: Shield, text: 'Save your work securely' },
        { icon: Zap, text: 'Access all premium features' },
        { icon: Sparkles, text: 'Sync across devices' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
                <DialogHeader className="text-center">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', duration: 0.6 }}
                        className="mx-auto mb-4"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Lock className="w-10 h-10 text-white" />
                        </div>
                    </motion.div>

                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        Sign In Required
                    </DialogTitle>
                    <DialogDescription className="text-base text-gray-600 dark:text-gray-300 mt-2">
                        Please sign in or create an account to use{' '}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {featureName}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {/* Benefits */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="py-4 space-y-3"
                >
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={benefit.text}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg flex items-center justify-center">
                                <benefit.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">{benefit.text}</span>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                    <Link to="/auth/login" onClick={onClose}>
                        <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
                            <Mail className="w-5 h-5 mr-2" />
                            Sign In / Sign Up
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>

                    <Button
                        variant="ghost"
                        className="w-full h-10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        onClick={onClose}
                    >
                        Maybe Later
                    </Button>
                </div>

                {/* Footer */}
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
                    🔒 Your data is 100% private and secure
                </p>
            </DialogContent>
        </Dialog>
    );
};

export default AuthRequiredModal;
