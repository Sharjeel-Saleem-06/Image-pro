import React, { useState, useEffect, useMemo } from 'react';
import FilerobotImageEditor, {
  TABS,
  TOOLS,
} from 'react-filerobot-image-editor';
import { useEditor, HistoryEntry } from '@/contexts/EditorContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';

import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as imgly from "@imgly/background-removal"; // Fix import issue
import { removeBackground } from "@imgly/background-removal"; // Keep named import just in case, but use imgly.removeBackground or fallback
import { smartFaceRestore } from '@/lib/professionalAI'; // Import for face enhancement
import { autoEnhanceImage } from '@/lib/aiUtils';
import Groq from 'groq-sdk';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sliders,
  Palette,
  Crop,
  Type,
  Maximize,
  Stamp,
  Upload,
  Image as ImageIcon,
  Wand2,
  Layers,
  MousePointer2,
  Sparkles,
  Brain,
  Download,
  History,
  Cloud,
  Save,
  Undo2,
  Redo2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ImageEditor = () => {
  const { uploadedImage, currentImage, addToHistory, setUploadedImage, undo, redo, canUndo, canRedo } = useEditor();
  const [isReady, setIsReady] = useState(false);

  // AI Analysis State
  const [isAiAnalysisDialogOpen, setIsAiAnalysisDialogOpen] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [bgRemovalLoading, setBgRemovalLoading] = useState(false);
  const [faceEnhanceLoading, setFaceEnhanceLoading] = useState(false); // Add state
  const [colorPopLoading, setColorPopLoading] = useState(false);

  // History & Save States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedImages, setSavedImages] = useState<any[]>([]);

  // Fetch History on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('image_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setSavedImages(data);
  };

  const handleSaveToCloud = async () => {
    const activeImageSrc = currentImage?.preview || (uploadedImage ? URL.createObjectURL(uploadedImage) : null);
    if (!activeImageSrc) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please login to save images.");
        return;
      }

      // Convert src to Blob
      let blob: Blob;
      if (activeImageSrc.startsWith('blob:')) {
        const res = await fetch(activeImageSrc);
        blob = await res.blob();
      } else {
        // Base64 or URL
        const res = await fetch(activeImageSrc);
        blob = await res.blob();
      }

      const fileName = `history/${user.id}/${Date.now()}.png`;

      // Upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('processed_images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('processed_images')
        .getPublicUrl(fileName);

      // Save to DB
      const { error: dbError } = await supabase
        .from('image_history')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          tool_used: currentImage?.toolName || 'editor',
          created_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      alert("Image saved to cloud history!");
      fetchHistory(); // Refresh list

    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save image.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const activeImageSrc = currentImage?.preview || (uploadedImage ? URL.createObjectURL(uploadedImage) : null);
    if (!activeImageSrc) return;

    const link = document.createElement('a');
    link.href = activeImageSrc;
    link.download = `edited-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAnalyzeImage = async () => {
    if (!uploadedImage && !currentImage?.preview) return;

    setAiAnalysisLoading(true);
    setAiAnalysisResult(null);

    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true
      });

      let imageUrl = currentImage?.preview || (uploadedImage ? URL.createObjectURL(uploadedImage) : '');
      let base64Image = "";

      if (imageUrl.startsWith('blob:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        base64Image = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
    } else {
        base64Image = imageUrl;
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Perform a deep professional analysis of this image. Identify the subject, lighting conditions, composition, and list 3 specific, advanced editing techniques to improve it dramatically."
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image,
                },
              },
            ],
          },
        ],
        model: "llama-3.3-70b-versatile", // User requested this model
        temperature: 0.5,
        max_tokens: 1024,
      });

      setAiAnalysisResult(chatCompletion.choices[0]?.message?.content || "No insights available.");
    } catch (error) {
      console.error("AI Analysis Error:", error);
      // Fallback message
      setAiAnalysisResult("Failed to analyze image. Ensure your API key is valid for 'llama-3.3-70b-versatile' or try again. Note: This model might not support images.");
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const handleRemoveBackground = async () => {
    const activeImageSrc = currentImage?.preview || (uploadedImage ? URL.createObjectURL(uploadedImage) : null);
    if (!activeImageSrc) return;

    setBgRemovalLoading(true);
    try {
      // Use imgly namespace to avoid default export issues
      const blob = await imgly.removeBackground(activeImageSrc);
      const url = URL.createObjectURL(blob);

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const newEntry: HistoryEntry = {
          id: Date.now().toString(),
          blob: blob,
          preview: base64data,
          toolId: 'ai-remove-bg',
          toolName: 'AI Background Removal',
          timestamp: Date.now(),
        };
        addToHistory(newEntry);
      };
    } catch (error) {
      console.error("Background Removal Error:", error);
      alert("Failed to remove background. Please try again.");
    } finally {
      setBgRemovalLoading(false);
    }
  };

  const handleFaceEnhance = async () => {
    const activeImageSrc = currentImage?.preview || (uploadedImage ? URL.createObjectURL(uploadedImage) : null);
    if (!activeImageSrc) return;

    setFaceEnhanceLoading(true);
    try {
      // Convert src to Blob/File for the lib function
      const response = await fetch(activeImageSrc);
      const blob = await response.blob();
      const file = new File([blob], "image.png", { type: "image/png" });

      // Use smartFaceRestore
      const result = await smartFaceRestore(file, 2); // 2x upscale by default for enhancement

      let resultBlob: Blob;
      let resultPreview: string;

      if (result instanceof Blob) {
        resultBlob = result;
        resultPreview = URL.createObjectURL(result);
    } else {
        // If string (url)
        const res = await fetch(result);
        resultBlob = await res.blob();
        resultPreview = result;
      }

      const reader = new FileReader();
      reader.readAsDataURL(resultBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const newEntry: HistoryEntry = {
          id: Date.now().toString(),
          blob: resultBlob,
          preview: base64data,
          toolId: 'ai-face-enhance',
          toolName: 'AI Face Enhance',
          timestamp: Date.now(),
        };
        addToHistory(newEntry);
      };

    } catch (error) {
      console.error("Face Enhance Error:", error);
      alert("Failed to enhance face. Service might be busy.");
    } finally {
      setFaceEnhanceLoading(false);
    }
  };

  const handleColorPop = async () => {
    const activeImageSrc = currentImage?.preview || (uploadedImage ? URL.createObjectURL(uploadedImage) : null);
    if (!activeImageSrc) return;

    setColorPopLoading(true);
    try {
      const response = await fetch(activeImageSrc);
      const blob = await response.blob();
      const file = new File([blob], "image.png", { type: "image/png" });

      const resultBlob = await autoEnhanceImage(file);

      const reader = new FileReader();
      reader.readAsDataURL(resultBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const newEntry: HistoryEntry = {
      id: Date.now().toString(),
          blob: resultBlob,
          preview: base64data,
          toolId: 'ai-color-pop',
          toolName: 'AI Color Pop',
          timestamp: Date.now(),
        };
        addToHistory(newEntry);
      };

    } catch (error) {
      console.error("Color Pop Error:", error);
      alert("Failed to auto-enhance image.");
    } finally {
      setColorPopLoading(false);
    }
  };

  // Detect Dark Mode (keep existing)
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    checkTheme();

    // Observe changes on both html and body
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Comprehensive Theme Palette
  const themePalette = useMemo(() => {
    if (isDarkMode) {
      return {
        // Dark Mode - Deep Slate Theme
        'bg-primary': '#020617',       // Canvas Background (Slate 950)
        'bg-secondary': '#1e293b',     // Sidebar/Toolbar Background (Slate 800)
        'bg-primary-active': '#334155', // Active Tool Background (Slate 700)
        'bg-secondary-active': '#334155', // Active Sidebar Item
        'bg-primary-hover': '#1e293b', // Hover State
        'bg-secondary-hover': '#334155', // Sidebar Hover

        // Additional Low-Level Overrides for Filerobot Defaults that might cause white boxes
        'bg-stateless': '#1e293b',     // Fix for potential default white stateless background
        'bg-active': '#334155',
        'bg-hover': '#334155',
        'active-secondary': '#334155',
        'active-secondary-hover': '#334155',

        'accent-primary': '#6366f1',   // Branding (Indigo 500)
        'accent-primary-active': '#4f46e5',
        'accent-primary-hover': '#4f46e5',

        'icons-primary': '#f8fafc',    // Main Icons (Slate 50)
        'icons-secondary': '#94a3b8',  // Secondary Icons (Slate 400)
        'icons-hover': '#ffffff',
        'icons-placeholder': '#475569',

        'borders-primary': '#334155',  // Input Borders
        'borders-secondary': '#1e293b', // Dividers
        'borders-strong': '#475569',

        'light-shadow': 'none',        // Remove light shadows if any
        'medium-shadow': 'none',

        'txt-primary': '#f8fafc',      // Main Text (White)
        'txt-secondary': '#cbd5e1',    // Labels (Light Grey)
        'txt-primary-invert': '#020617', // Button Text (Black)
        'btn-disabled-text': '#64748b',
        'error-primary': '#ef4444',
      };
    } else {
      return {
        // Light Mode - Clean Theme
        'bg-primary': '#f8fafc',       // Canvas (Slate 50)
        'bg-secondary': '#ffffff',     // Sidebar (White)
        'bg-primary-active': '#e2e8f0', // Active Item (Slate 200)
        'bg-secondary-active': '#e2e8f0',
        'bg-primary-hover': '#f1f5f9',
        'bg-secondary-hover': '#f1f5f9',

        'bg-stateless': '#ffffff',
        'bg-active': '#e2e8f0',
        'bg-hover': '#f1f5f9',
        'active-secondary': '#e2e8f0',
        'active-secondary-hover': '#f1f5f9',

        'accent-primary': '#4f46e5',   // Branding (Indigo 600)
        'accent-primary-active': '#4338ca',
        'accent-primary-hover': '#4338ca',

        'icons-primary': '#1e293b',    // Main Icons (Slate 800)
        'icons-secondary': '#64748b',  // Secondary Icons (Slate 500)
        'icons-hover': '#0f172a',
        'icons-placeholder': '#cbd5e1',

        'borders-primary': '#cbd5e1',  // Borders
        'borders-secondary': '#f1f5f9',
        'borders-strong': '#94a3b8',

        'light-shadow': '0px 2px 8px rgba(0, 0, 0, 0.05)',

        'txt-primary': '#0f172a',      // Main Text (Slate 900)
        'txt-secondary': '#334155',    // Labels (Slate 700)
        'txt-primary-invert': '#ffffff',
        'btn-disabled-text': '#94a3b8',
        'error-primary': '#dc2626',
      };
    }
  }, [isDarkMode]);


  // Compute the source URL dynamically
  const source = useMemo(() => {
    if (currentImage?.preview) return currentImage.preview;
    if (uploadedImage) return URL.createObjectURL(uploadedImage);
    return null;
  }, [uploadedImage, currentImage]);

  // Helper to convert base64 to Blob
  const base64ToBlob = (base64: string) => {
    try {
      const arr = base64.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.error('Failed to convert base64 to blob', e);
      return null;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (editedImageObject: any) => {
    try {
      const blob = base64ToBlob(editedImageObject.imageBase64);
      if (!blob) throw new Error("Failed to process image");

      // 1. Add to Local History Context
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        blob: blob,
        preview: editedImageObject.imageBase64,
        toolId: 'filerobot-editor',
        toolName: 'Advanced Editor',
        timestamp: Date.now(),
        settings: editedImageObject.designState
      };
      addToHistory(newEntry);

      // 2. Save to Cloud (Supabase)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Just local save if no user, but alert to let them know
        alert("Image saved locally! Log in to save to cloud history.");
      return;
    }
    
      const fileName = `history/${user.id}/${Date.now()}_edited.png`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('processed_images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('processed_images')
        .getPublicUrl(fileName);

      // Insert into DB
      const { error: dbError } = await supabase
        .from('image_history')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          tool_used: 'Advanced Editor',
          created_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      alert("Image saved to history successfully!");
      fetchHistory(); // Refresh the history list
      
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save image to cloud. saved locally.");
    }
  };

  const handleClose = () => {
    // Editor closed
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedImage(e.target.files[0]);
    }
  };


  const editorFeatures = [
    {
      id: 'adjust',
      name: 'Smart Adjust',
      description: 'Fine-tune brightness, contrast, and saturation with precision sliders.',
      icon: Sliders,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'filters',
      name: 'Pro Filters',
      description: 'Apply cinematic grade presets and color grading instantly.',
      icon: Palette,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'ai-insights',
      name: 'AI Insights',
      description: 'Analyze image content and get smart editing suggestions using AI.',
      icon: Wand2,
      color: 'from-fuchsia-500 to-rose-500'
    },
    {
      id: 'crop',
      name: 'Precision Crop',
      description: 'Crop to exact aspect ratios for social media and web.',
    icon: Crop,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'text',
      name: 'Typography',
      description: 'Add beautiful text layer with custom fonts and styles.',
      icon: Type,
      color: 'from-emerald-500 to-green-500'
    },
    {
      id: 'resize',
      name: 'Smart Resize',
      description: 'Scale images up or down while preserving quality.',
      icon: Maximize,
      color: 'from-indigo-500 to-violet-500'
    },
    {
      id: 'watermark',
      name: 'Watermarking',
      description: 'Protect your work with custom logos and text watermarks.',
      icon: Stamp,
      color: 'from-yellow-500 to-amber-500'
    }
  ];

  if (!source) {
  return (
    <Layout>
        <div className="min-h-screen py-12 px-4 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto space-y-12">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Pro Image Editor
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                A complete suite of professional editing tools. Adjust, filter, crop, and perfect your images in seconds.
            </p>
          </motion.div>

            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="max-w-4xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-dashed border-indigo-200 dark:border-indigo-900 shadow-2xl hover:border-indigo-400 dark:hover:border-indigo-700 transition-all duration-300">
                <CardContent className="p-16 text-center">
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('upload-trigger')?.click()}>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative w-24 h-24 bg-white dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-110 transition-transform duration-300 ring-1 ring-gray-200 dark:ring-gray-700">
                      <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      </div>

                  <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                    Start Editing
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg max-w-lg mx-auto">
                    Drag and drop your image here, or click to browse your files.
                    Supports JPG, PNG, WebP up to 25MB.
                  </p>

                  <label className="inline-block">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-8 text-xl rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all"
                      onClick={() => document.getElementById('upload-trigger')?.click()}
                    >
                      <Upload className="w-6 h-6 mr-3" />
                      Upload Photo
                    </Button>
                    <input
                      id="upload-trigger"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleUpload}
                    />
                  </label>
                </CardContent>
              </Card>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {editorFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ y: -5 }}
                      className="cursor-pointer"
                      onClick={() => document.getElementById('upload-trigger')?.click()}
                    >
                      <Card className="h-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group">
                        <CardContent className="p-8">
                          <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                            {feature.name}
                      </h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {feature.description}
                          </p>
                </CardContent>
              </Card>
            </motion.div>
                  );
                })}
                      </div>
            </motion.div>

                      </div>
                      </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-70px)] w-full max-w-[1920px] mx-auto bg-gray-50 dark:bg-gray-900">

        {/* Editor Area - Takes remaining height */}
        <div className="flex-1 relative w-full overflow-hidden">
          <FilerobotImageEditor
            key={isDarkMode ? 'dark-mode' : 'light-mode'}
            source={source}
            onSave={(editedImageObject, designState) => {
              handleSave(editedImageObject);
            }}
            onClose={() => {
              handleClose();
              setUploadedImage(null);
            }}
            savingPixelRatio={4}
            previewPixelRatio={window.devicePixelRatio}
            annotationsCommon={{
              fill: '#4F46E5',
            }}
            Text={{ text: 'Double click to edit...' }}
            Rotate={{ angle: 90, componentType: 'slider' }}
            tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.FILTERS, TABS.FINETUNE, TABS.RESIZE, TABS.WATERMARK]}
            defaultTabId={TABS.ADJUST}
            defaultToolId={null}
            theme={{
              palette: themePalette,
              typography: {
                fontFamily: 'Inter, system-ui, sans-serif',
              }
            }}
          />



                      </div>
                      
        {/* Improved Quick Actions Bar */}
        <div className="h-auto bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.03)] z-10 px-6 py-4">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
              <span className="text-sm font-bold tracking-wide text-slate-900 dark:text-white uppercase hidden md:block">AI Magic</span>
                  </div>
                  
            <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar flex-1 justify-center">

              {/* Global Undo/Redo Controls */}
              <div className="flex items-center gap-2 mr-2 border-r pr-4 border-slate-200 dark:border-slate-800">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Undo Last Action"
                >
                  <Undo2 className="w-5 h-5" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Redo Action"
                >
                  <Redo2 className="w-5 h-5" />
                </button>
                  </div>
                  
              {[
                {
                  id: 'remove-bg',
                  name: 'Remove BG',
                  icon: Layers,
                  desc: 'Transparent',
                  action: handleRemoveBackground,
                  loading: bgRemovalLoading,
                  color: 'text-emerald-500',
                  bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                  borderHover: 'hover:border-emerald-500'
                },
                {
                  id: 'enhance-face',
                  name: 'Enhance Face',
                  icon: Wand2,
                  desc: 'Restore',
                  action: handleFaceEnhance,
                  loading: faceEnhanceLoading,
                  color: 'text-pink-500',
                  bg: 'bg-pink-50 dark:bg-pink-900/20',
                  borderHover: 'hover:border-pink-500'
                },
                {
                  id: 'color-pop',
                  name: 'Color Pop',
                  icon: Palette,
                  desc: 'Vibrant',
                  action: handleColorPop,
                  loading: colorPopLoading,
                  color: 'text-violet-500',
                  bg: 'bg-violet-50 dark:bg-violet-900/20',
                  borderHover: 'hover:border-violet-500'
                },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={tool.action}
                  disabled={tool.loading}
                  className={`group flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-transparent ${tool.borderHover} hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-wait min-w-[180px]`}
                >
                  <div className={`p-2 rounded-lg ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
                    {tool.loading ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <tool.icon className="w-5 h-5" />
                    )}
                        </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">
                      {tool.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-none">
                      {tool.desc}
                    </span>
                  </div>
                </button>
                      ))}
                    </div>

            {/* Right Side: Download Only */}
            <div className="flex items-center border-l pl-6 border-slate-200 dark:border-slate-800">
                  <Button
                    variant="outline"
                onClick={handleDownload}
                className="gap-2 rounded-xl h-11 px-6 border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-bold transition-all"
              >
                <Download className="w-4 h-4" />
                    Download
                  </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default ImageEditor;