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
  X
} from 'lucide-react';
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
  getAvailableAPIs
} from '@/lib/professionalAI';
import { trackActivity } from '@/lib/activityTracking';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'enhance' | 'remove' | 'extract' | 'artistic';
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

// History entry interface for the new stack-based system
interface HistoryEntry {
  id: string;
  blob: Blob | null; // null for original
  preview: string;
  toolId: string | null; // null for original
  toolName: string;
  timestamp: number;
  settings?: any;
}

const AIEnhancer = () => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // NEW: History stack system instead of results object
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tool-specific settings
  const [upscaleScale, setUpscaleScale] = useState([2]);
  const [styleTransferStyle, setStyleTransferStyle] = useState('sketch');
  const [asciiDensity, setAsciiDensity] = useState([10]);
  const [asciiWidth, setAsciiWidth] = useState([80]);
  const [asciiColored, setAsciiColored] = useState(false);
  const [useProAPIs, setUseProAPIs] = useState(true); // Toggle for pro APIs

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth requirement
  const { showAuthModal, setShowAuthModal, requireAuth } = useAuthRequired();

  // Check available professional APIs
  const availableAPIs = getAvailableAPIs();
  const hasProAPIs = availableAPIs.replicate || availableAPIs.huggingface || availableAPIs.stability;

  const aiTools: AITool[] = [
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
    { id: 'enhance', label: 'Enhance', icon: Zap },
    { id: 'remove', label: 'Remove', icon: Scissors },
    { id: 'artistic', label: 'Artistic', icon: Palette }
  ];

  const [activeCategory, setActiveCategory] = useState('all');
  const filteredTools = activeCategory === 'all'
    ? aiTools
    : aiTools.filter(tool => tool.category === activeCategory);

  // Get current displayed image
  const currentImage = historyIndex >= 0 ? history[historyIndex] : null;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1; // Fixed: check if there are future items in history

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Check if user is authenticated
    if (!requireAuth()) {
      e.target.value = ''; // Reset input
      return;
    }

    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);

      // Initialize history with original image
      const originalEntry: HistoryEntry = {
        id: 'original',
        blob: null,
        preview: preview,
        toolId: null,
        toolName: 'Original',
        timestamp: Date.now()
      };

      setHistory([originalEntry]);
      setHistoryIndex(0);
      setRedoStack([]);
      setSelectedTool(null);
      setError(null);
    }
  }, [requireAuth]);

  // FIXED: Process image from CURRENT state, not always original
  const processImage = async (toolId: string) => {
    if (!uploadedImage || historyIndex < 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    const startTime = Date.now();

    try {
      // Get the CURRENT image to process (from history stack)
      const currentEntry = history[historyIndex];
      let sourceFile: File;

      if (currentEntry.blob) {
        // Convert previous result blob to File
        sourceFile = new File([currentEntry.blob], uploadedImage.name, {
          type: currentEntry.blob.type || 'image/png'
        });
      } else {
        // Use original uploaded file
        sourceFile = uploadedImage;
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
            toolId === 'ascii-art' ? { width: asciiWidth[0], colored: asciiColored } : undefined
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

      // Add to history (trim any future history if we're not at the end)
      const newHistory = [...history.slice(0, historyIndex + 1), newEntry];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      // Clear redo stack when new action is performed
      setRedoStack([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Undo function
  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
    }
  }, [canUndo]);

  // Redo function  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history.length]);

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
                AI Enhancer
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Transform your images with cutting-edge AI tools. Remove backgrounds, enhance quality,
              extract text, and apply artistic effects.
            </p>
          </motion.div>

          {/* Upload Section */}
          {!uploadedImage && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
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
                        Upload Image for AI Processing
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Upload any image to get started with AI-powered enhancements
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
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9"
                  >
                    <Upload className="w-4 h-4 mr-2" /> New Image
                  </Button>
                  {historyIndex > 0 && (
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
                            )}
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

          {/* AI Suggestions */}
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
                    <Eye className="w-6 h-6" />
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <Star className="w-8 h-8 text-yellow-500" />
                      <div>
                        <h4 className="font-medium">Recommended</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Try AI Upscaler for better quality</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <Sparkles className="w-8 h-8 text-purple-500" />
                      <div>
                        <h4 className="font-medium">Popular</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Background removal is trending</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <Wand2 className="w-8 h-8 text-blue-500" />
                      <div>
                        <h4 className="font-medium">Quick Fix</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Auto enhance in one click</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        featureName="AI Enhancement Tools"
      />
    </Layout>
  );
};

export default AIEnhancer;