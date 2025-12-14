import { useState, useRef, useCallback } from 'react';
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
  processWithAI,
  AIProcessingOptions
} from '@/lib/aiUtils';

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

const AIEnhancer = () => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<{ [key: string]: ProcessingResult }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tool-specific settings
  const [upscaleScale, setUpscaleScale] = useState([2]);
  const [styleTransferStyle, setStyleTransferStyle] = useState('sketch');
  const [asciiDensity, setAsciiDensity] = useState([10]);
  const [asciiWidth, setAsciiWidth] = useState([80]);
  const [asciiColored, setAsciiColored] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth requirement
  const { showAuthModal, setShowAuthModal, requireAuth } = useAuthRequired();

  const aiTools: AITool[] = [
    {
      id: 'upscale',
      name: 'AI Upscaler',
      description: 'Enhance image resolution up to 4x using AI',
      icon: Zap,
      category: 'enhance',
      color: 'from-blue-500 to-cyan-500',
      features: ['2x/4x upscaling', 'Preserves details', 'High quality']
    },
    {
      id: 'background-remove',
      name: 'Remove Background',
      description: 'Automatically remove background with transparency',
      icon: Scissors,
      category: 'remove',
      color: 'from-red-500 to-pink-500',
      features: ['One-click removal', 'Edge detection', 'Transparent PNG']
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
      name: 'AI Enhancement',
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

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Check if user is authenticated
    if (!requireAuth()) {
      e.target.value = ''; // Reset input
      return;
    }

    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResults({});
      setSelectedTool(null);
      setError(null);
    }
  }, [requireAuth]);

  const processImage = async (toolId: string) => {
    if (!uploadedImage) return;

    setSelectedTool(toolId);
    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    const startTime = Date.now();

    try {
      let result: string | Blob;
      let originalSize = uploadedImage.size;
      let newSize = 0;

      // Progress simulation
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      switch (toolId) {
        case 'upscale':
          result = await upscaleImage(uploadedImage, upscaleScale[0]);
          newSize = (result as Blob).size;
          break;

        case 'background-remove':
          result = await removeBackground(uploadedImage);
          newSize = (result as Blob).size;
          break;

        case 'style-transfer':
          result = await applyStyleTransfer(uploadedImage, styleTransferStyle as any);
          newSize = (result as Blob).size;
          break;

        case 'enhance':
          result = await autoEnhanceImage(uploadedImage);
          newSize = (result as Blob).size;
          break;

        case 'ascii-art':
          result = await generateASCIIArt(uploadedImage, {
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

      const processingTime = Date.now() - startTime;

      // Convert blob to URL for display
      let displayResult: string;
      if (result instanceof Blob) {
        displayResult = URL.createObjectURL(result);
      } else {
        displayResult = result;
      }

      setResults(prev => ({
        ...prev,
        [toolId]: {
          type: toolId,
          result: displayResult,
          processingTime,
          originalSize,
          newSize
        }
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
      setSelectedTool(null);
      setProcessingProgress(0);
    }
  };

  const downloadResult = (toolId: string) => {
    const result = results[toolId];
    if (!result) return;

    if (toolId === 'ascii-art') {
      // Download ASCII art as text file
      const blob = new Blob([result.result as string], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ascii-art-${Date.now()}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // Download image
      const link = document.createElement('a');
      link.href = result.result as string;
      link.download = `ai-processed-${toolId}-${Date.now()}.png`;
      link.click();
    }
  };

  const copyASCIIToClipboard = async (toolId: string) => {
    const result = results[toolId];
    if (result && typeof result.result === 'string') {
      try {
        await navigator.clipboard.writeText(result.result);
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
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
          )}

          {uploadedImage && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Original Image */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1"
              >
                <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Original Image</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Change
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4">
                      <img
                        src={imagePreview!}
                        alt="Original"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p>Size: {formatFileSize(uploadedImage.size)}</p>
                      <p>Type: {uploadedImage.type}</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Tools */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2"
              >
                <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-6 h-6" />
                      AI Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Category Filter */}
                    <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
                      <TabsList className="grid w-full grid-cols-4">
                        {categories.map((category) => {
                          const Icon = category.icon;
                          return (
                            <TabsTrigger
                              key={category.id}
                              value={category.id}
                              className="flex items-center gap-2"
                            >
                              <Icon className="w-4 h-4" />
                              <span className="hidden sm:inline">{category.label}</span>
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                    </Tabs>

                    {/* Error Display */}
                    {error && (
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    {/* Tools Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      {filteredTools.map((tool) => {
                        const Icon = tool.icon;
                        const isCurrentlyProcessing = selectedTool === tool.id && isProcessing;
                        const hasResult = results[tool.id];

                        return (
                          <motion.div
                            key={tool.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            className="relative"
                          >
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg hover:shadow-lg transition-all">
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  <div className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                    <Icon className="w-6 h-6 text-white" />
                                  </div>

                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2">{tool.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                                      {tool.description}
                                    </p>

                                    <div className="flex flex-wrap gap-1 mb-4">
                                      {tool.features.map((feature) => (
                                        <Badge key={feature} variant="secondary" className="text-xs">
                                          {feature}
                                        </Badge>
                                      ))}
                                    </div>

                                    {isCurrentlyProcessing && (
                                      <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                          <span>Processing...</span>
                                          <span>{processingProgress}%</span>
                                        </div>
                                        <Progress value={processingProgress} />
                                      </div>
                                    )}

                                    {hasResult && (
                                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                            Processing Complete
                                          </span>
                                        </div>
                                        <div className="text-xs text-green-600 dark:text-green-300">
                                          <p>Time: {formatTime(hasResult.processingTime)}</p>
                                          {hasResult.newSize && (
                                            <p>Size: {formatFileSize(hasResult.originalSize!)} → {formatFileSize(hasResult.newSize)}</p>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => processImage(tool.id)}
                                        disabled={isProcessing}
                                        className="flex-1"
                                        size="sm"
                                      >
                                        {isCurrentlyProcessing ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            {hasResult ? 'Process Again' : 'Process'}
                                          </>
                                        )}
                                      </Button>

                                      {hasResult && (
                                        <>
                                          <Button
                                            onClick={() => downloadResult(tool.id)}
                                            variant="outline"
                                            size="sm"
                                          >
                                            <Download className="w-4 h-4" />
                                          </Button>
                                          {tool.id === 'ascii-art' && (
                                            <Button
                                              onClick={() => copyASCIIToClipboard(tool.id)}
                                              variant="outline"
                                              size="sm"
                                            >
                                              <Copy className="w-4 h-4" />
                                            </Button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Settings & Results Panel */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1 space-y-6"
              >
                {/* Tool Settings */}
                <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Tool Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Upscale Settings */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Upscale Factor: {upscaleScale[0]}x
                      </Label>
                      <Slider
                        value={upscaleScale}
                        onValueChange={setUpscaleScale}
                        max={4}
                        min={2}
                        step={1}
                        className="mb-2"
                      />
                      <p className="text-xs text-gray-500">Higher values take longer to process</p>
                    </div>

                    {/* Style Transfer Settings */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Style Transfer</Label>
                      <Select value={styleTransferStyle} onValueChange={setStyleTransferStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sketch">Sketch</SelectItem>
                          <SelectItem value="watercolor">Watercolor</SelectItem>
                          <SelectItem value="oil-painting">Oil Painting</SelectItem>
                          <SelectItem value="cartoon">Cartoon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* ASCII Art Settings */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        ASCII Width: {asciiWidth[0]} chars
                      </Label>
                      <Slider
                        value={asciiWidth}
                        onValueChange={setAsciiWidth}
                        max={120}
                        min={40}
                        step={10}
                        className="mb-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        ASCII Density: {asciiDensity[0]}
                      </Label>
                      <Slider
                        value={asciiDensity}
                        onValueChange={setAsciiDensity}
                        max={20}
                        min={5}
                        step={1}
                        className="mb-2"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="ascii-colored"
                        checked={asciiColored}
                        onChange={(e) => setAsciiColored(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="ascii-colored" className="text-sm">
                        Colored ASCII
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Preview */}
                {Object.keys(results).length > 0 && (
                  <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(results).map(([toolId, result]) => (
                        <div key={toolId} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">
                              {aiTools.find(t => t.id === toolId)?.name}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newResults = { ...results };
                                delete newResults[toolId];
                                setResults(newResults);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {toolId === 'ascii-art' ? (
                            <Textarea
                              value={result.result as string}
                              readOnly
                              className="font-mono text-xs h-32 resize-none"
                            />
                          ) : (
                            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                              <img
                                src={result.result as string}
                                alt={`${toolId} result`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
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