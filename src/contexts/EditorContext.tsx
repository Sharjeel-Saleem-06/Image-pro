import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// History entry interface
export interface HistoryEntry {
    id: string;
    blob: Blob | null; // null for original/empty
    preview: string;   // object URL or base64
    toolId: string;
    toolName?: string; // Optional but recommended for UI
    timestamp: number;
    metadata?: any;
    settings?: any;
}

interface EditorContextType {
    history: HistoryEntry[];
    historyIndex: number;
    currentImage: HistoryEntry | null;
    uploadedImage: File | null; // Keep track of the original uploaded file
    canUndo: boolean;
    canRedo: boolean;

    // Actions
    addToHistory: (newEntry: HistoryEntry) => void;
    setUploadedImage: (file: File | null) => void;
    undo: () => void;
    redo: () => void;
    setHistoryIndex: (index: number) => void;
    resetHistory: () => void;

    // Helpers to get current blob/preview easily
    getCurrentBlob: () => Blob | null;
    getCurrentPreview: () => string | null;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);

    const currentImage = historyIndex >= 0 ? history[historyIndex] : null;
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const addToHistory = useCallback((newEntry: HistoryEntry) => {
        setHistory(prev => {
            // If we are in the middle of history, slice off the future
            const newHistory = [...prev.slice(0, historyIndex + 1), newEntry];
            // Optional: Limit history size to prevent memory leaks (e.g., last 20 steps)
            if (newHistory.length > 20) {
                return newHistory.slice(newHistory.length - 20);
            }
            return newHistory;
        });
        setHistoryIndex(prev => {
            // Correct calculation of new index based on *sliced* history logic
            // But since we just calculated newHistory above, we know it's length-1.
            // However, we need to be careful about the async nature of setState using 'prev'.
            // Simplified: just update index to "after current".
            // A safer way is to trust that the new entry is appended.
            return historyIndex + 1;
            // Note: This logic assumes 'historyIndex' in dependency is fresh, which it is in useCallback [historyIndex]
            // But inside setState callback it's better to be explicit.
            // Actually, let's keep it simple: we update both states.
        });
    }, [historyIndex]);

    // Fix for addToHistory index sync:
    // We need to ensure setHistoryIndex uses the *result* of the history slice.
    // So let's rewrite it slightly to be safer.
    const addToHistorySafe = useCallback((newEntry: HistoryEntry) => {
        setHistory(prev => {
            const sliced = prev.slice(0, historyIndex + 1);
            const updated = [...sliced, newEntry];
            // Limit to 50
            if (updated.length > 50) return updated.slice(updated.length - 50);
            return updated;
        });
        setHistoryIndex(prev => {
            // If we were at index 5, and added one, we are now at index 6.
            // Even if we sliced, we are appending 1.
            return prev + 1; // Wait, if we sliced the history, prev might be wrong relative to *total* length if we accessed it differently.
            // But historyIndex tracks the *active* item.
            // If I am at step 2 of 10, slice gives 0,1,2. Append 3. New index is 3.
            // So prev + 1 is correct.
            // BUT if we hit the limit of 50, the index shifts.
            // If length > 50, we remove the first item (index 0). So index should strictly be 49 (last item).
            // Let's handle generic add without complicated math here, user just wants persistence.
            // Re-calculating in useEffect is safer, or just checking max length.
        });
    }, [historyIndex]);

    // Revamped addToHistory to be perfectly robust
    const addEntry = useCallback((entry: HistoryEntry) => {
        setHistory(currentHistory => {
            const upToCurrent = currentHistory.slice(0, historyIndex + 1);
            const newHistory = [...upToCurrent, entry];

            // Cap at 30 to save memory
            if (newHistory.length > 30) {
                newHistory.shift(); // Remove oldest
                // If we shift, we must adjust index?
                // Actually if we just set index to length-1 it works.
            }
            return newHistory;
        });

        setHistoryIndex(prev => {
            // If we capped logic executes, we theoretically shift indices.
            // But to be simple: always jump to the specific new end.
            // We can't know the exact new length inside this setter easily without calculating it again.
            // So we use a purely functional update or effect.
            // Let's just create a helper that sets both atomically-ish.
            return prev + 1; // Temporary, fixed in effect? No, let's just use a ref or simple logic.
            // Actually, if we cap history, the index effectively stays at max-1.

        });
    }, [historyIndex]);

    // Real implementation of addToHistory
    const safeAddHistory = (entry: HistoryEntry) => {
        let newHist = [...history.slice(0, historyIndex + 1), entry];
        if (newHist.length > 30) {
            newHist = newHist.slice(1);
        }
        setHistory(newHist);
        setHistoryIndex(newHist.length - 1);
    };

    const undo = useCallback(() => {
        if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
    }, [historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
    }, [historyIndex, history.length]);

    const resetHistory = useCallback(() => {
        setHistory([]);
        setHistoryIndex(-1);
        setUploadedImage(null);
    }, []);

    const getCurrentBlob = useCallback(() => currentImage?.blob || null, [currentImage]);
    const getCurrentPreview = useCallback(() => currentImage?.preview || null, [currentImage]);

    const value = {
        history,
        historyIndex,
        currentImage,
        uploadedImage,
        canUndo,
        canRedo,
        addToHistory: safeAddHistory,
        setUploadedImage,
        undo,
        redo,
        setHistoryIndex,
        resetHistory,
        getCurrentBlob,
        getCurrentPreview
    };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};
