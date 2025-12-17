import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, History, Trash2, Calendar, Image as ImageIcon } from 'lucide-react';

interface HistoryItem {
    id: string;
    user_id: string;
    image_url: string;
    tool_used: string;
    created_at: string;
}

const HistoryPage = () => {
    const [images, setImages] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('image_history')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setImages(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, fileName: string) => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;

        // Note: This is a basic delete from DB only for now to update UI, 
        // full implementation would require deleting from Storage bucket too.
        // We'll focus on DB removal for the UI feedback.
        const { error } = await supabase
            .from('image_history')
            .delete()
            .eq('id', id);

        if (!error) {
            setImages(images.filter(img => img.id !== id));
        } else {
            console.error("Delete error:", error);
        }
    };

    return (
        <Layout>
            <div className="min-h-screen py-12 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-12"
                    >
                        <div>
                            <h1 className="text-4xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white">
                                <History className="w-10 h-10 text-indigo-500" />
                                History Gallery
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                                Your collection of AI-enhanced and edited masterpieces.
                            </p>
                        </div>
                    </motion.div>

                    {/* Gallery Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                <div key={n} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : images.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                        >
                            {images.map((img, index) => (
                                <motion.div
                                    key={img.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative"
                                >
                                    <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800 rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
                                            <img
                                                src={img.image_url}
                                                alt={`History ${img.id}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                                                <a
                                                    href={img.image_url}
                                                    download
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-3 bg-white text-gray-900 rounded-full hover:bg-gray-200 hover:scale-110 transition-all shadow-xl"
                                                    title="Download"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </a>
                                            </div>
                                        </div>

                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                                                    <ImageIcon className="w-3 h-3" />
                                                    {img.tool_used || 'Editor'}
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(img.id, img.image_url)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Remove from list"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <Calendar className="w-3 h-3 mr-2" />
                                                {new Date(img.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-6">
                                <History className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No History Yet</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-8">
                                Start editing your images to build your personal gallery of creations.
                            </p>
                            <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600">
                                <a href="/editor">Go to Editor</a>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default HistoryPage;
