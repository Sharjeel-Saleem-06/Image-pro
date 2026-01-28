import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Layout from '@/components/Layout';
import AuthRequiredModal from '@/components/AuthRequiredModal';
import { useAuthRequired } from '@/hooks/useAuthRequired';
import {
  Upload,
  Download,
  Sparkles,
  Image as ImageIcon,
  Scissors,
  Zap,
  Palette,
  Type,
  Wand2,
  Brain,
  Eye,
  FileText,
  Layers,
  Star,
  ArrowRight,
  CheckCircle,
  Loader2,
  Copy,
  RotateCw,
  Settings,
  Undo,
  Redo,
  Image,
  X,
  Share2,
  Hash,
  MessageSquare,
  FileSearch,
  CopyCheck,
  Search,
  Camera,
  Scan,
  Focus,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Globe,
  Clock,
  Activity,
  BarChart,
  Accessibility,
  Clipboard,
  Lightbulb
} from 'lucide-react';
import { type HistoryEntry } from '@/contexts/EditorContext'; // Use type only
import { analyzeImageWithGrok, type SocialPlatform, type SocialTone } from '@/lib/grokAI'; // Import Grok AI
import {
  generateASCIIArt,
  removeBackground,
  upscaleImage,
  applyStyleTransfer,
  autoEnhanceImage,
} from '@/lib/aiUtils';
import {
  smartRemoveBackground,
  smartUpscale,
  smartFaceRestore,
  generateImageWithZImageTurbo,
  getAvailableAPIs
} from '@/lib/professionalAI';
import { trackActivity } from '@/lib/activityTracking';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'enhance' | 'remove' | 'extract' | 'artistic' | 'generation';
  color: string;
  features: string[];
}

interface ProcessingResult {
  type: string;
  result: string | Blob;
  processingTime: number;
  originalSize?: number;
  newSize?: number;
}

// HistoryEntry is now imported from Context

const AIEnhancer = () => {
  // LOCAL state for AI Enhancer (not shared with Editor)
  const [localHistory, setLocalHistory] = useState<HistoryEntry[]>([]);
  const [localHistoryIndex, setLocalHistoryIndex] = useState(-1);
  const [localUploadedImage, setLocalUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Computed values from local state
  const currentImage = localHistoryIndex >= 0 ? localHistory[localHistoryIndex] : null;
  const canUndo = localHistoryIndex > 0;
  const canRedo = localHistoryIndex < localHistory.length - 1;

  // Local history management functions
  const addToHistory = useCallback((entry: HistoryEntry) => {
    setLocalHistory(prev => {
      const upToCurrent = prev.slice(0, localHistoryIndex + 1);
      const newHistory = [...upToCurrent, entry];
      if (newHistory.length > 30) {
        return newHistory.slice(1);
      }
      return newHistory;
    });
    setLocalHistoryIndex(prev => Math.min(prev + 1, 29));
  }, [localHistoryIndex]);

  const undo = useCallback(() => {
    if (localHistoryIndex > 0) setLocalHistoryIndex(localHistoryIndex - 1);
  }, [localHistoryIndex]);

  const redo = useCallback(() => {
    if (localHistoryIndex < localHistory.length - 1) setLocalHistoryIndex(localHistoryIndex + 1);
  }, [localHistoryIndex, localHistory.length]);

  const resetHistory = useCallback(() => {
    setLocalHistory([]);
    setLocalHistoryIndex(-1);
    setLocalUploadedImage(null);
  }, []);

  // Keep the rest of the state...
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<string>('caption');
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>('all');
  const [activeTone, setActiveTone] = useState<SocialTone>('professional');
  const [grokSuggestions, setGrokSuggestions] = useState<string | null>(null); // For the enhancer tab suggestions

  // Independent Upload States for tabs
  const [socialImage, setSocialImage] = useState<File | null>(null);
  const [socialPreview, setSocialPreview] = useState<string | null>(null);

  const [analyzerImage, setAnalyzerImage] = useState<File | null>(null);
  const [analyzerPreview, setAnalyzerPreview] = useState<string | null>(null);
  const [analyzerType, setAnalyzerType] = useState<string>('scene_analysis');

  // Tool-specific settings
  const [upscaleScale, setUpscaleScale] = useState([2]);
  const [styleTransferStyle, setStyleTransferStyle] = useState('sketch');
  const [asciiDensity, setAsciiDensity] = useState([10]);
  const [asciiWidth, setAsciiWidth] = useState([80]);


  const [asciiColored, setAsciiColored] = useState(false);
  const [useProAPIs, setUseProAPIs] = useState(true); // Toggle for pro APIs

  // Generation State
  const [activeTab, setActiveTab] = useState("enhance");
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [genSettings, setGenSettings] = useState({
    width: 1024,
    height: 1024,
    steps: 9,
    seed: 42,
    randomizeSeed: true
  });
  const [generatedResult, setGeneratedResult] = useState<{ blob: Blob, url: string; prompt: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth requirement
  const { showAuthModal, setShowAuthModal, requireAuth } = useAuthRequired();

  // Check available professional APIs
  const availableAPIs = getAvailableAPIs();
  const hasProAPIs = availableAPIs.replicate || availableAPIs.huggingface || availableAPIs.stability;

  const aiTools: AITool[] = [
    {
      id: 'text-to-image',
      name: 'Text to Image',
      description: 'Generate images from text description',
      icon: Wand2,
      category: 'generation',
      color: 'from-green-500 to-emerald-500',
      features: ['Z-Image-Turbo', 'Fast Generation', 'High Quality']
    },
    {
      id: 'upscale',
      name: 'AI Upscaler',
      description: 'Enhance resolution up to 4x with Real-ESRGAN',
      icon: Zap,
      category: 'enhance',
      color: 'from-blue-500 to-cyan-500',
      features: ['2x/4x upscaling', 'Real-ESRGAN AI', 'Preserves details']
    },
    {
      id: 'background-remove',
      name: 'Remove Background',
      description: 'AI-powered background removal (RMBG-2.0)',
      icon: Scissors,
      category: 'remove',
      color: 'from-red-500 to-pink-500',
      features: ['RMBG-2.0 AI', 'Edge detection', 'Transparent PNG']
    },
    {
      id: 'face-restore',
      name: 'Face Restoration',
      description: 'Restore & enhance faces with GFPGAN/CodeFormer',
      icon: Brain,
      category: 'enhance',
      color: 'from-pink-500 to-rose-500',
      features: ['Old photo repair', 'Face enhancement', 'Detail recovery']
    },
    {
      id: 'style-transfer',
      name: 'Style Transfer',
      description: 'Apply artistic styles to your images',
      icon: Palette,
      category: 'artistic',
      color: 'from-purple-500 to-pink-500',
      features: ['Oil painting', 'Watercolor', 'Sketch styles', 'Cartoon']
    },
    {
      id: 'enhance',
      name: 'Auto Enhancement',
      description: 'Improve image quality automatically',
      icon: Sparkles,
      category: 'enhance',
      color: 'from-yellow-500 to-orange-500',
      features: ['Auto brightness', 'Sharpening', 'Color correction']
    },
    {
      id: 'ascii-art',
      name: 'ASCII Art',
      description: 'Convert images to ASCII text art',
      icon: Type,
      category: 'artistic',
      color: 'from-gray-500 to-gray-700',
      features: ['Multiple densities', 'Color/Monochrome', 'Custom width']
    }
  ];

  const categories = [
    { id: 'all', label: 'All Tools', icon: Sparkles },
    { id: 'generation', label: 'Generate', icon: Wand2 },
    { id: 'enhance', label: 'Enhance', icon: Zap },
    { id: 'remove', label: 'Remove', icon: Scissors },
    { id: 'artistic', label: 'Artistic', icon: Palette }
  ];

  const [activeCategory, setActiveCategory] = useState('all');
  const filteredTools = activeCategory === 'all'
    ? aiTools
    : aiTools.filter(tool => tool.category === activeCategory);

  // Get current displayed image from Context
  // const currentImage... (already from context)
  // const canUndo... (already from context)
  // const canRedo... (already from context)

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow file upload without auth (auth will be checked during processing)
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLocalUploadedImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);

      // Reset Local History
      resetHistory();

      const originalEntry: HistoryEntry = {
        id: 'original',
        blob: null,
        preview: preview,
        toolId: 'original',
        toolName: 'Original',
        timestamp: Date.now()
      };

      // Add to local context (async safe)
      setTimeout(() => addToHistory(originalEntry), 0);

      setSelectedTool(null);
      setError(null);
    }
  }, [requireAuth, setUploadedImage, resetHistory, addToHistory]);

  // FIXED: Process image from CURRENT state, not always original
  const processImage = async (toolId: string) => {
    // Require auth for processing
    if (!requireAuth()) return;
    
    if (!localUploadedImage || localHistoryIndex < 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    const startTime = Date.now();

    try {
      // Get the CURRENT image to process (from history stack)
      const currentEntry = localHistory[localHistoryIndex];
      let sourceFile: File;

      if (currentEntry.blob) {
        // Convert previous result blob to File
        sourceFile = new File([currentEntry.blob], localUploadedImage.name, {
          type: currentEntry.blob.type || 'image/png'
        });
      } else {
        // Use original uploaded file
        sourceFile = localUploadedImage;
      }

      let result: string | Blob;

      // Progress simulation
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      switch (toolId) {
        case 'upscale':
          // calling smartUpscale which handles: HF Space -> Replicate -> Stability -> Local
          result = await smartUpscale(sourceFile, upscaleScale[0] as 2 | 4, false);
          break;

        case 'background-remove':
          // Use professional API if available
          if (useProAPIs && (availableAPIs.huggingface || availableAPIs.stability || availableAPIs.removebg)) {
            result = await smartRemoveBackground(sourceFile);
          } else {
            result = await removeBackground(sourceFile);
          }
          break;

        case 'face-restore':
          // calling smartFaceRestore which handles: HF Space -> Replicate -> Local
          result = await smartFaceRestore(sourceFile, upscaleScale[0] as 2 | 4);
          break;

        case 'style-transfer':
          result = await applyStyleTransfer(sourceFile, styleTransferStyle as any);
          break;

        case 'enhance':
          result = await autoEnhanceImage(sourceFile);
          break;

        case 'ascii-art':
          result = await generateASCIIArt(sourceFile, {
            density: asciiDensity[0],
            width: asciiWidth[0],
            colored: asciiColored
          });
          break;

        case 'text-to-image':
          result = await generateImageWithZImageTurbo({
            prompt: generationPrompt
          });
          break;

        default:
          throw new Error('Unknown tool');
      }

      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Create new history entry
      let displayResult: string;
      let resultBlob: Blob | null = null;

      if (result instanceof Blob) {
        resultBlob = result;
        displayResult = URL.createObjectURL(result);
      } else {
        // ASCII art is a string, convert to blob
        resultBlob = new Blob([result], { type: 'text/plain' });
        displayResult = result;
      }

      const newEntry: HistoryEntry = {
        id: `${toolId}-${Date.now()}`,
        blob: resultBlob,
        preview: displayResult,
        toolId: toolId,
        toolName: aiTools.find(t => t.id === toolId)?.name || toolId,
        timestamp: Date.now(),
        settings: toolId === 'upscale' ? { scale: upscaleScale[0] } :
          toolId === 'style-transfer' ? { style: styleTransferStyle } :
            toolId === 'ascii-art' ? { width: asciiWidth[0], colored: asciiColored } :
              toolId === 'text-to-image' ? { prompt: generationPrompt } : undefined
      };

      // Track AI enhancement activity in Supabase
      const duration = Date.now() - startTime;
      await trackActivity('ai_enhancement', {
        tool: toolId,
        toolName: aiTools.find(t => t.id === toolId)?.name,
        duration,
        success: true,
        useProAPIs
      }).catch(err => console.warn('Failed to track activity:', err));

      // Add to global history
      addToHistory(newEntry);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Keydown listener for Undo/Redo is handled below, methods are from context

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const downloadResult = () => {
    if (!currentImage || historyIndex < 0) return;

    if (currentImage.toolId === 'ascii-art' && currentImage.blob) {
      // Download ASCII art as text file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(currentImage.blob);
      link.download = `ascii-art-${Date.now()}.txt`;
      link.click();
    } else if (currentImage.blob) {
      // Download image
      const link = document.createElement('a');
      link.href = currentImage.preview;
      link.download = `ai-processed-${currentImage.toolName || 'image'}-${Date.now()}.png`;
      link.click();
    }
  };

  const copyASCIIToClipboard = async () => {
    if (!currentImage || currentImage.toolId !== 'ascii-art' || !currentImage.blob) return;

    try {
      const text = await currentImage.blob.text();
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Studio
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Professional AI tools for image enhancement and generation.
            </p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-3xl grid-cols-4 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <TabsTrigger
                  value="enhance"
                  className="rounded-lg py-3 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Enhancer
                </TabsTrigger>
                <TabsTrigger
                  value="generate"
                  className="rounded-lg py-3 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
                >
                  <Wand2 className="w-4 h-4 mr-2" /> Generator
                </TabsTrigger>
                <TabsTrigger
                  value="social"
                  className="rounded-lg py-3 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Social Studio
                </TabsTrigger>
                <TabsTrigger
                  value="analyze"
                  className="rounded-lg py-3 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
                >
                  <Scan className="w-4 h-4 mr-2" /> Deep Analysis
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ==================== ENHANCER TAB ==================== */}
            <TabsContent value="enhance" className="space-y-8">
              {!uploadedImage && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <CardContent className="p-12">
                        <div className="text-center">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
                          >
                            <Upload className="w-10 h-10 text-white" />
                          </motion.div>
                          <h3 className="text-2xl font-semibold mb-4">
                            Upload Image for Enhancing
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-8">
                            Upload any image to remove background, upscale, or restore faces
                          </p>
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-xl"
                          >
                            <Upload className="w-5 h-5 mr-2" />
                            Choose Image
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Feature Showcase (Visible when no image) */}
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                  >
                    <div className="text-center">
                      <h2 className="text-3xl font-bold mb-4">Available AI Capabilities</h2>
                      <p className="text-gray-600 dark:text-gray-400">Explore our powerful suite of AI image processing tools</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {aiTools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <motion.div
                            key={tool.id}
                            whileHover={{ y: -5 }}
                            className="cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Card className="h-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
                              <CardContent className="p-6">
                                <div className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center mb-4`}>
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{tool.name}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                  {tool.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {tool.features.map((feature, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-gray-100 dark:bg-gray-700/50">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}

              {uploadedImage && (
                <div className="space-y-6">

                  {/* WORKSPACE HEADER */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
                  >
                    {/* Left: Status & Controls */}
                    <div className="flex items-center gap-3">
                      {/* API Status Badge */}
                      <Badge className={`${hasProAPIs ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-500'} text-white px-3 py-1`}>
                        {hasProAPIs ? '⚡ Pro AI Active' : '🔧 Local Mode'}
                      </Badge>

                      {/* Undo/Redo */}
                      <div className="flex items-center gap-1 border-l pl-3 border-gray-200 dark:border-gray-700">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={undo}
                          disabled={!canUndo}
                          className="h-9 px-3 disabled:opacity-30"
                          title="Undo (Ctrl+Z)"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180 mr-1" /> Undo
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={redo}
                          disabled={!canRedo}
                          className="h-9 px-3 disabled:opacity-30"
                          title="Redo (Ctrl+Y)"
                        >
                          Redo <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>

                      {/* History Position */}
                      {history.length > 1 && (
                        <span className="text-sm text-gray-500 border-l pl-3 border-gray-200 dark:border-gray-700">
                          Step {historyIndex + 1} of {history.length}
                        </span>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={resetHistory}
                        className="h-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4 mr-2" /> Close
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9"
                      >
                        <Upload className="w-4 h-4 mr-2" /> New Image
                      </Button>
                      {historyIndex >= 0 && (
                        <Button
                          size="sm"
                          onClick={downloadResult}
                          className="h-9 bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        >
                          <Download className="w-4 h-4 mr-2" /> Save Result
                        </Button>
                      )}
                    </div>
                  </motion.div>

                  {/* MAIN CONTENT: Image + Tools */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT: Image Canvas (2 cols) */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Image Display */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700"
                      >
                        {/* Checkerboard pattern for transparency */}
                        <div
                          className="absolute inset-0 opacity-10"
                          style={{
                            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                          }}
                        />

                        {/* Image */}
                        <div className="relative z-10 flex items-center justify-center min-h-[400px] max-h-[70vh] p-4">
                          {currentImage ? (
                            currentImage.toolId === 'ascii-art' ? (
                              <div className="overflow-auto bg-white rounded-lg p-4 font-mono whitespace-pre text-[8px] leading-[8px] max-h-[65vh] w-full">
                                {currentImage.preview}
                              </div>
                            ) : (
                              <div className="relative max-w-full max-h-[65vh]">
                                {/* Processed Image (Always visible) */}
                                <img
                                  src={currentImage.preview}
                                  alt={currentImage.toolName}
                                  className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md"
                                  id="processed-image"
                                />

                                {/* Original Image Overlay (Hidden by default, shown on hover via button) */}
                                {historyIndex > 0 && history[0] && (
                                  <img
                                    src={history[0].preview}
                                    alt="Original"
                                    className="absolute top-0 left-0 max-w-full max-h-[65vh] object-contain rounded-lg shadow-md opacity-0 transition-opacity duration-200 pointer-events-none"
                                    id="original-overlay"
                                    style={{
                                      width: 'auto',
                                      height: 'auto',
                                      maxWidth: '100%',
                                      maxHeight: '65vh'
                                    }}
                                  />
                                )}
                              </div>
                            )
                          ) : (
                            <div className="text-center text-gray-400">
                              <ImageIcon className="w-20 h-20 mx-auto mb-4 opacity-30" />
                              <p>Image preview</p>
                            </div>
                          )}
                        </div>

                        {/* Compare Button (Overlay) */}
                        {historyIndex > 0 && currentImage && currentImage.toolId !== 'ascii-art' && (
                          <div className="absolute bottom-4 left-4 z-20">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-black/70 text-white hover:bg-black/80 backdrop-blur"
                              onMouseDown={() => {
                                const overlay = document.getElementById('original-overlay');
                                if (overlay) overlay.style.opacity = '1';
                              }}
                              onMouseUp={() => {
                                const overlay = document.getElementById('original-overlay');
                                if (overlay) overlay.style.opacity = '0';
                              }}
                              onMouseLeave={() => {
                                const overlay = document.getElementById('original-overlay');
                                if (overlay) overlay.style.opacity = '0';
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" /> Hold to Compare
                            </Button>
                          </div>
                        )}

                        {/* Processing Overlay */}
                        {isProcessing && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                            <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                            <p className="text-white font-medium mb-2">Processing with AI...</p>
                            <div className="w-48">
                              <Progress value={processingProgress} className="h-2" />
                            </div>
                          </div>
                        )}
                      </motion.div>

                      {/* History Timeline */}
                      {history.length > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                        >
                          <h4 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400">History Timeline</h4>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {history.map((entry, idx) => (
                              <button
                                key={entry.id}
                                onClick={() => setHistoryIndex(idx)}
                                className={`
                              flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                              ${idx === historyIndex
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
                            `}
                              >
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                                  {idx + 1}
                                </span>
                                {entry.toolName}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* RIGHT: Tools Panel (1 col) */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="font-bold text-lg">AI Tools</h3>
                          <p className="text-sm text-gray-500">{hasProAPIs ? 'Using professional AI APIs' : 'Enable API keys for better results'}</p>
                        </div>

                        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                          {aiTools.map((tool) => {
                            const Icon = tool.icon;
                            const hasBeenApplied = history.some(h => h.toolId === tool.id);
                            const isExpanded = selectedTool === tool.id;

                            return (
                              <div
                                key={tool.id}
                                className={`rounded-xl border transition-all ${isExpanded
                                  ? 'border-purple-300 dark:border-purple-700 shadow-md bg-purple-50/50 dark:bg-purple-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                                  }`}
                              >
                                {/* Tool Header */}
                                <button
                                  onClick={() => setSelectedTool(isExpanded ? null : tool.id)}
                                  className="w-full p-3 flex items-center gap-3 text-left"
                                >
                                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-sm`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-sm">{tool.name}</h4>
                                      {hasBeenApplied && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{tool.description}</p>
                                  </div>
                                  <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>

                                {/* Expanded Settings */}
                                {isExpanded && (
                                  <div className="px-3 pb-3 pt-0 space-y-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="pt-3">
                                      {/* Tool-specific settings */}
                                      {tool.id === 'upscale' && (
                                        <div className="space-y-2">
                                          <div className="flex justify-between text-xs font-medium">
                                            <span>Scale Factor</span>
                                            <span className="text-purple-600">{upscaleScale[0]}x</span>
                                          </div>
                                          <Slider value={upscaleScale} onValueChange={setUpscaleScale} max={4} min={2} step={2} />
                                        </div>
                                      )}

                                      {tool.id === 'style-transfer' && (
                                        <Select value={styleTransferStyle} onValueChange={setStyleTransferStyle}>
                                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="sketch">Sketch</SelectItem>
                                            <SelectItem value="watercolor">Watercolor</SelectItem>
                                            <SelectItem value="oil-painting">Oil Painting</SelectItem>
                                            <SelectItem value="cartoon">Cartoon</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}

                                      {tool.id === 'text-to-image' && (
                                        <div className="space-y-2">
                                          <Label className="text-xs font-medium">Prompt</Label>
                                          <Textarea
                                            value={generationPrompt}
                                            onChange={(e) => setGenerationPrompt(e.target.value)}
                                            placeholder="Describe image..."
                                            className="h-24 text-sm"
                                          />
                                        </div>
                                      )}

                                      {tool.id === 'ascii-art' && (
                                        <div className="space-y-3">
                                          <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-medium">
                                              <span>Width</span>
                                              <span>{asciiWidth[0]}</span>
                                            </div>
                                            <Slider value={asciiWidth} onValueChange={setAsciiWidth} max={120} min={40} step={10} />
                                          </div>
                                          <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={asciiColored} onChange={(e) => setAsciiColored(e.target.checked)} className="rounded" />
                                            Colored output
                                          </label>
                                        </div>
                                      )}
                                    </div>

                                    <Button
                                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                                      onClick={() => processImage(tool.id)}
                                      disabled={isProcessing}
                                    >
                                      {isProcessing ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                                      ) : (
                                        <><Sparkles className="w-4 h-4 mr-2" /> Apply {tool.name}</>
                                      )}
                                    </Button>
                                  </div>
                                )
                                }
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Error Display */}
                      {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              )}

              {/* AI Suggestions with Grok */}
              {uploadedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-12"
                >
                  <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-600" />
                        AI Smart Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!grokSuggestions ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                          <p className="text-gray-600 dark:text-gray-300 max-w-md">
                            Let our advanced AI analyze your image and suggest specific enhancements, critiques, and improvements.
                          </p>
                          <Button
                            onClick={async () => {
                              if (!uploadedImage) return;
                              setIsAnalyzing(true);
                              try {
                                const result = await analyzeImageWithGrok(uploadedImage, 'suggestions');
                                setGrokSuggestions(result);
                              } catch (e) {
                                console.error(e);
                                // Error is handled in function usually, or we show toast
                              } finally {
                                setIsAnalyzing(false);
                              }
                            }}
                            disabled={isAnalyzing}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                          >
                            {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Image...</> : <><Lightbulb className="w-4 h-4 mr-2" /> Get AI Ideas</>}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="prose dark:prose-invert max-w-none bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                            <p className="whitespace-pre-wrap text-sm">{grokSuggestions}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setGrokSuggestions(null)}>
                            <RotateCw className="w-4 h-4 mr-2" /> Reset Analysis
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            {/* ==================== GENERATOR TAB ==================== */}
            <TabsContent value="generate">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Generation Controls */}
                <Card className="lg:col-span-1 h-fit bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" /> Generation Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Prompt</Label>
                      <Textarea
                        placeholder="A futuristic city with flying cars, cyberpunk style..."
                        className="h-32 resize-none"
                        value={generationPrompt}
                        onChange={(e) => setGenerationPrompt(e.target.value)}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <Label>Width</Label>
                          <span className="text-gray-500">{genSettings.width}px</span>
                        </div>
                        <Slider
                          min={512} max={2048} step={64}
                          value={[genSettings.width]}
                          onValueChange={([val]) => setGenSettings(prev => ({ ...prev, width: val }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <Label>Height</Label>
                          <span className="text-gray-500">{genSettings.height}px</span>
                        </div>
                        <Slider
                          min={512} max={2048} step={64}
                          value={[genSettings.height]}
                          onValueChange={([val]) => setGenSettings(prev => ({ ...prev, height: val }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <Label>Inference Steps</Label>
                          <span className="text-gray-500">{genSettings.steps} (Recommended: 9)</span>
                        </div>
                        <Slider
                          min={1} max={20} step={1}
                          value={[genSettings.steps]}
                          onValueChange={([val]) => setGenSettings(prev => ({ ...prev, steps: val }))}
                        />
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <Label>Random Seed</Label>
                          <input
                            type="checkbox"
                            checked={genSettings.randomizeSeed}
                            onChange={(e) => setGenSettings(prev => ({ ...prev, randomizeSeed: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </div>

                        {!genSettings.randomizeSeed && (
                          <div className="space-y-2">
                            <Label>Seed Value</Label>
                            <input
                              type="number"
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              value={genSettings.seed}
                              onChange={(e) => setGenSettings(prev => ({ ...prev, seed: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20"
                      disabled={!generationPrompt.trim() || isGenerating}
                      onClick={async () => {
                        setIsGenerating(true);
                        setError(null);
                        try {
                          const blob = await generateImageWithZImageTurbo({
                            prompt: generationPrompt,
                            width: genSettings.width,
                            height: genSettings.height,
                            steps: genSettings.steps,
                            seed: genSettings.randomizeSeed ? undefined : genSettings.seed
                          });
                          const url = URL.createObjectURL(blob);
                          setGeneratedResult({ blob, url, prompt: generationPrompt });
                        } catch (e: any) {
                          setError(e.message);
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                    >
                      {isGenerating ? (
                        <> <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating... </>
                      ) : (
                        <> <Wand2 className="w-5 h-5 mr-2" /> Generate Image </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Result Area */}
                <div className="lg:col-span-2">
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="relative min-h-[500px] h-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-6 overflow-hidden">

                    {!generatedResult && !isGenerating && (
                      <div className="text-center text-gray-400">
                        <Wand2 className="w-24 h-24 mx-auto mb-6 opacity-20" />
                        <h3 className="text-xl font-medium mb-2">Ready to Imagine</h3>
                        <p>Enter a prompt and settings to generate your image</p>
                      </div>
                    )}

                    {isGenerating && (
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-green-500 animate-spin"></div>
                          <Wand2 className="w-8 h-8 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-lg font-medium animate-pulse">Creating your masterpiece...</p>
                        <p className="text-sm text-gray-500">Using Z-Image-Turbo Model</p>
                      </div>
                    )}

                    {generatedResult && !isGenerating && (
                      <div className="w-full h-full flex flex-col gap-6">
                        <div className="relative flex-1 rounded-xl overflow-hidden shadow-2xl bg-black/5 flex items-center justify-center">
                          <img
                            src={generatedResult.url}
                            alt={generatedResult.prompt}
                            className="max-w-full max-h-[600px] object-contain"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <Button
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = generatedResult.url;
                              link.download = `generated-${Date.now()}.png`;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" /> Download
                          </Button>

                          <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => {
                              // Move to Enhancer tab with generated image
                              const file = new File([generatedResult.blob], "generated.png", { type: "image/png" });
                              setLocalUploadedImage(file);
                              setImagePreview(generatedResult.url);

                              const entry: HistoryEntry = {
                                id: 'generated-import',
                                blob: generatedResult.blob,
                                preview: generatedResult.url,
                                toolId: 'import',
                                toolName: 'Imported Generation',
                                timestamp: Date.now()
                              };
                              resetHistory();
                              setTimeout(() => addToHistory(entry), 0);
                              // Switch tab
                              setActiveTab("enhance");
                            }}
                          >
                            <Sparkles className="w-4 h-4 mr-2" /> Edit & Enhance
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>



            {/* ==================== SOCIAL STUDIO TAB ==================== */}
            <TabsContent value="social">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Upload & Preview */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-pink-500" /> Source Image
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!socialImage ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                setSocialImage(file);
                                setSocialPreview(URL.createObjectURL(file));
                              }
                            };
                            input.click();
                          }}
                        >
                          <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-4">
                            <Instagram className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                          </div>
                          <h4 className="font-semibold mb-2">Upload for Social Media</h4>
                          <p className="text-sm text-gray-500">Click to upload an image to generate captions & hashtags</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative group">
                            <img src={socialPreview!} alt="Social Context" className="w-full h-auto object-cover max-h-[400px]" />
                            <button
                              onClick={() => { setSocialImage(null); setSocialPreview(null); }}
                              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  setSocialImage(file);
                                  setSocialPreview(URL.createObjectURL(file));
                                }
                              };
                              input.click();
                            }}
                          >
                            <Camera className="w-4 h-4 mr-2" /> Change Image
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Actions */}
                <Card className="lg:col-span-2 h-fit bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-500" /> Content Generator
                    </CardTitle>
                    <p className="text-sm text-gray-500">AI-powered social media manager for professional content.</p>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Platform Selector */}
                    <div className="space-y-3">
                      <Label>Target Platform</Label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <Button variant={activePlatform === 'all' ? 'default' : 'outline'} onClick={() => setActivePlatform('all')} className="justify-start">
                          <Globe className="w-4 h-4 mr-2" /> All
                        </Button>
                        <Button variant={activePlatform === 'instagram' ? 'default' : 'outline'} onClick={() => setActivePlatform('instagram')} className={`justify-start ${activePlatform === 'instagram' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : ''}`}>
                          <Instagram className="w-4 h-4 mr-2" /> Instagram
                        </Button>
                        <Button variant={activePlatform === 'twitter' ? 'default' : 'outline'} onClick={() => setActivePlatform('twitter')} className={`justify-start ${activePlatform === 'twitter' ? 'bg-black text-white hover:bg-gray-800' : ''}`}>
                          <Twitter className="w-4 h-4 mr-2" /> Twitter/X
                        </Button>
                        <Button variant={activePlatform === 'linkedin' ? 'default' : 'outline'} onClick={() => setActivePlatform('linkedin')} className={`justify-start ${activePlatform === 'linkedin' ? 'bg-blue-700 text-white hover:bg-blue-800' : ''}`}>
                          <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                        </Button>
                        <Button variant={activePlatform === 'facebook' ? 'default' : 'outline'} onClick={() => setActivePlatform('facebook')} className={`justify-start ${activePlatform === 'facebook' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}>
                          <Facebook className="w-4 h-4 mr-2" /> Facebook
                        </Button>
                      </div>
                    </div>

                    {/* Tone Selector */}
                    <div className="space-y-3">
                      <Label>Content Tone</Label>
                      <Select value={activeTone} onValueChange={(val: any) => setActiveTone(val)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">👔 Professional (Corporate/LinkedIn)</SelectItem>
                          <SelectItem value="casual">😊 Casual (Friends/Lifestyle)</SelectItem>
                          <SelectItem value="humorous">😂 Humorous (Witty/Funny)</SelectItem>
                          <SelectItem value="inspirational">✨ Inspirational (Motivational)</SelectItem>
                          <SelectItem value="dramatic">🎭 Dramatic (Storytelling)</SelectItem>
                          <SelectItem value="witty">🧠 Witty (Clever/Smart)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button
                        variant={analysisType === 'caption' ? 'default' : 'outline'}
                        onClick={() => setAnalysisType('caption')}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" /> Captions
                      </Button>
                      <Button
                        variant={analysisType === 'hashtags' ? 'default' : 'outline'}
                        onClick={() => setAnalysisType('hashtags')}
                      >
                        <Hash className="w-4 h-4 mr-2" /> Hashtags
                      </Button>
                      <Button
                        variant={analysisType === 'virality_score' ? 'default' : 'outline'}
                        onClick={() => setAnalysisType('virality_score')}
                        className={analysisType === 'virality_score' ? 'bg-orange-600 text-white' : ''}
                      >
                        <Activity className="w-4 h-4 mr-2" /> Virality Score
                      </Button>
                      <Button
                        variant={analysisType === 'best_time' ? 'default' : 'outline'}
                        onClick={() => setAnalysisType('best_time')}
                        className={analysisType === 'best_time' ? 'bg-green-600 text-white' : ''}
                      >
                        <Clock className="w-4 h-4 mr-2" /> Best Time
                      </Button>
                    </div>

                    <div className="relative min-h-[250px] p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      {isAnalyzing ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-xl z-20">
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                          <p className="font-medium">Crafting perfect content...</p>
                        </div>
                      ) : null}

                      {analysisResult ? (
                        <div className="prose dark:prose-invert max-w-none">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="text-lg font-semibold capitalize text-gray-700 dark:text-gray-200">{analysisType.replace('_', ' ')} Results</h4>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(analysisResult)}>
                                <Clipboard className="w-4 h-4 mr-2" /> Copy
                              </Button>
                            </div>
                          </div>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-mono bg-white dark:bg-gray-800 p-4 rounded-lg border">
                            {analysisResult}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-gray-400">
                          <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                          <p>Select platform, tone, and type to start</p>
                        </div>
                      )}
                    </div>

                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                      disabled={!socialImage || isAnalyzing}
                      onClick={async () => {
                        if (!socialImage) return;
                        setIsAnalyzing(true);
                        setAnalysisResult(null);
                        try {
                          const result = await analyzeImageWithGrok(socialImage, analysisType as any, activePlatform, activeTone);
                          setAnalysisResult(result);
                        } catch (e: any) {
                          setAnalysisResult(`Error: ${e.message}`);
                        } finally {
                          setIsAnalyzing(false);
                        }
                      }}
                    >
                      {isAnalyzing ? 'Processing...' : 'Generate Content'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ==================== ANALYZER TAB ==================== */}
            <TabsContent value="analyze">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Upload */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200 dark:border-gray-700">
                    <CardHeader><CardTitle>Image to Analyze</CardTitle></CardHeader>
                    <CardContent>
                      {!analyzerImage ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                setAnalyzerImage(file);
                                setAnalyzerPreview(URL.createObjectURL(file));
                              }
                            };
                            input.click();
                          }}
                        >
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                            <Scan className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h4 className="font-semibold mb-2">Upload for Analysis</h4>
                          <p className="text-sm text-gray-500">Get deep insights, object detection, and technical specs</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative group">
                            <img src={analyzerPreview!} alt="Analyzer Context" className="w-full h-auto object-cover max-h-[400px]" />
                            <button
                              onClick={() => { setAnalyzerImage(null); setAnalyzerPreview(null); }}
                              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Analysis Options */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Focus className="w-5 h-5 text-purple-500" /> Deep Vision Analysis
                      </CardTitle>
                      <p className="text-sm text-gray-500">Advanced computer vision breakdown</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Button
                          variant={analyzerType === 'scene_analysis' ? 'default' : 'outline'}
                          onClick={() => setAnalyzerType('scene_analysis')}
                          className="h-24 flex flex-col gap-2 p-2 text-center"
                        >
                          <Scan className="w-5 h-5" />
                          <span className="text-xs">Scene</span>
                        </Button>
                        <Button
                          variant={analyzerType === 'object_detection' ? 'default' : 'outline'}
                          onClick={() => setAnalyzerType('object_detection')}
                          className="h-24 flex flex-col gap-2 p-2 text-center"
                        >
                          <Search className="w-5 h-5" />
                          <span className="text-xs">Objects</span>
                        </Button>
                        <Button
                          variant={analyzerType === 'technical' ? 'default' : 'outline'}
                          onClick={() => setAnalyzerType('technical')}
                          className="h-24 flex flex-col gap-2 p-2 text-center"
                        >
                          <Settings className="w-5 h-5" />
                          <span className="text-xs">Tech Spec</span>
                        </Button>
                        <Button
                          variant={analyzerType === 'color_palette' ? 'default' : 'outline'}
                          onClick={() => setAnalyzerType('color_palette')}
                          className="h-24 flex flex-col gap-2 p-2 text-center"
                        >
                          <Palette className="w-5 h-5" />
                          <span className="text-xs">Colors</span>
                        </Button>
                        <Button
                          variant={analyzerType === 'accessibility' ? 'default' : 'outline'}
                          onClick={() => setAnalyzerType('accessibility')}
                          className="h-24 flex flex-col gap-2 p-2 text-center"
                        >
                          <Accessibility className="w-5 h-5" />
                          <span className="text-xs">SEO & Alt</span>
                        </Button>
                      </div>

                      <div className="relative min-h-[300px] p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                        {isAnalyzing ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-xl z-20">
                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                            <p className="font-medium">Analyzing Image Data...</p>
                          </div>
                        ) : null}

                        {analysisResult ? (
                          <div className="prose dark:prose-invert max-w-none">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="text-lg font-semibold capitalize text-gray-700 dark:text-gray-200">{analyzerType.replace('_', ' ')} Report</h4>
                              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(analysisResult)}>
                                <Clipboard className="w-4 h-4 mr-2" /> Copy
                              </Button>
                            </div>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-mono bg-white dark:bg-gray-800 p-4 rounded-lg border">
                              {analysisResult}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full py-8 text-gray-400">
                            <Scan className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select an analysis mode to begin</p>
                          </div>
                        )}
                      </div>

                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                        disabled={!analyzerImage || isAnalyzing}
                        onClick={async () => {
                          if (!analyzerImage) return;
                          setIsAnalyzing(true);
                          setAnalysisResult(null);
                          try {
                            const result = await analyzeImageWithGrok(analyzerImage, analyzerType as any, 'all');
                            setAnalysisResult(result);
                          } catch (e: any) {
                            setAnalysisResult(`Error: ${e.message}`);
                          } finally {
                            setIsAnalyzing(false);
                          }
                        }}
                      >
                        Start Analysis
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        featureName="AI Enhancement Tools"
      />
    </Layout >
  );
};

export default AIEnhancer;