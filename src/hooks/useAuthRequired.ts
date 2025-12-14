// useAuthRequired hook - Handles auth requirement for features
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthRequiredReturn {
    isAuthenticated: boolean;
    showAuthModal: boolean;
    setShowAuthModal: (show: boolean) => void;
    requireAuth: (callback?: () => void) => boolean;
    checkAuthAndRun: (callback: () => void) => void;
}

export const useAuthRequired = (): UseAuthRequiredReturn => {
    const { isAuthenticated } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Check if authenticated, if not show modal and return false
    const requireAuth = useCallback((callback?: () => void): boolean => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return false;
        }
        if (callback) {
            callback();
        }
        return true;
    }, [isAuthenticated]);

    // Check auth and run callback if authenticated
    const checkAuthAndRun = useCallback((callback: () => void) => {
        if (isAuthenticated) {
            callback();
        } else {
            setShowAuthModal(true);
        }
    }, [isAuthenticated]);

    return {
        isAuthenticated,
        showAuthModal,
        setShowAuthModal,
        requireAuth,
        checkAuthAndRun,
    };
};

export default useAuthRequired;
