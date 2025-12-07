import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { validateImageFile, downloadBlob } from '@/lib/imageUtils';
import { updateImageProcessed, updateProcessingStats } from '@/lib/statsUtils';
import Tesseract, { createWorker } from 'tesseract.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import {
  Upload,
  Download,
  FileText,
  Copy,
  Eye,
  EyeOff,
  Languages,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  RotateCcw,
  Settings,
  Info,
  Globe,
  Trash2,
  FileImage,
  Clock,
  Target,
  Sparkles,
  BookOpen,
  Archive,
  BarChart3,
  ImageIcon,
  Cpu,
  Gauge
} from 'lucide-react';

interface OCRResult {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  language: string;
  text?: string;
  confidence?: number;
  error?: string;
  processingTime?: number;
  wordCount?: number;
  lines?: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

interface OCRStats {
  totalProcessed: number;
  averageAccuracy: number;
  totalProcessingTime: number;
  languagesUsed: string[];
}

const SUPPORTED_LANGUAGES = [
  { code: 'eng', name: 'English', accuracy: 95, flag: '🇺🇸' },
  { code: 'spa', name: 'Spanish', accuracy: 93, flag: '🇪🇸' },
  { code: 'fra', name: 'French', accuracy: 92, flag: '🇫🇷' },
  { code: 'deu', name: 'German', accuracy: 94, flag: '🇩🇪' },
  { code: 'ita', name: 'Italian', accuracy: 91, flag: '🇮🇹' },
  { code: 'por', name: 'Portuguese', accuracy: 90, flag: '🇵🇹' },
  { code: 'rus', name: 'Russian', accuracy: 88, flag: '🇷🇺' },
  { code: 'ara', name: 'Arabic', accuracy: 85, flag: '🇸🇦' },
  { code: 'chi_sim', name: 'Chinese (Simplified)', accuracy: 87, flag: '🇨🇳' },
  { code: 'chi_tra', name: 'Chinese (Traditional)', accuracy: 86, flag: '🇹🇼' },
  { code: 'jpn', name: 'Japanese', accuracy: 84, flag: '🇯🇵' },
  { code: 'kor', name: 'Korean', accuracy: 83, flag: '🇰🇷' },
  { code: 'hin', name: 'Hindi', accuracy: 82, flag: '🇮🇳' },
  { code: 'urd', name: 'Urdu', accuracy: 80, flag: '🇵🇰' },
  { code: 'tha', name: 'Thai', accuracy: 81, flag: '🇹🇭' },
  { code: 'vie', name: 'Vietnamese', accuracy: 79, flag: '🇻🇳' }
];

const QUALITY_MODES = [
  { 
    value: 'fast', 
    label: 'Fast Mode', 
    description: 'Quick processing with good accuracy',
    icon: Zap,
    color: 'text-yellow-600'
  },
  { 
    value: 'balanced', 
    label: 'Balanced Mode', 
    description: 'Optimal balance of speed and accuracy',
    icon: Gauge,
    color: 'text-blue-600'
  },
  { 
    value: 'accurate', 
    label: 'Accurate Mode', 
    description: 'Maximum accuracy with slower processing',
    icon: Target,
    color: 'text-green-600'
  }
];

export default function OCR() {
  const [files, setFiles] = useState<OCRResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [defaultLanguage, setDefaultLanguage] = useState('eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [qualityMode, setQualityMode] = useState('balanced');
  const [currentStep, setCurrentStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);
  const { toast } = useToast();
  const [stats, setStats] = useState<OCRStats>({
    totalProcessed: 0,
    averageAccuracy: 0,
    totalProcessingTime: 0,
    languagesUsed: []
  });

  // Initialize worker once
  useEffect(() => {
    const initWorker = async () => {
      try {
        if (!workerRef.current) {
          workerRef.current = await createWorker();
          console.log('OCR Worker initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize OCR worker:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to initialize OCR engine. Please refresh the page.",
          variant: "destructive"
        });
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [toast]);

  // Load stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('ocr-stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    }
  }, []);

  const updateStats = useCallback((newResult: OCRResult) => {
    setStats(prevStats => {
      const newStats = {
        totalProcessed: prevStats.totalProcessed + 1,
        averageAccuracy: ((prevStats.averageAccuracy * prevStats.totalProcessed) + (newResult.confidence || 0)) / (prevStats.totalProcessed + 1),
        totalProcessingTime: prevStats.totalProcessingTime + (newResult.processingTime || 0),
        languagesUsed: Array.from(new Set([...prevStats.languagesUsed, newResult.language]))
      };
      localStorage.setItem('ocr-stats', JSON.stringify(newStats));
      return newStats;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (PNG, JPG, WebP, etc.)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
    setProgress(0);
    setCurrentStep('');
    
    // Add to files array
    const newFile: OCRResult = {
      id: `${Date.now()}-${Math.random()}`,
      file: file,
      preview: url,
      status: 'pending',
      progress: 0,
      language: defaultLanguage
    };
    
    setFiles(prev => {
      const filtered = prev.filter(f => !(f.file.name === file.name && f.file.size === file.size));
      return [...filtered, newFile];
    });

    toast({
      title: "File Selected",
      description: `${file.name} is ready for OCR processing`
    });
  }, [defaultLanguage, toast]);

  const processOCR = useCallback(async () => {
    if (!selectedFile || isProcessing) return;

    setIsProcessing(true);
    setProgress(0);
    setActiveTab('results');
    
    const startTime = Date.now();
    const fileId = `${selectedFile.name}-${selectedFile.size}`;

    try {
      // Update file status
      setFiles(prev => prev.map(f => 
        f.file.name === selectedFile.name && f.file.size === selectedFile.size
          ? { ...f, status: 'processing' as const, progress: 0 }
          : f
      ));

      // Step 1: Initialize worker
      setCurrentStep('Initializing OCR engine...');
      setProgress(5);
      
      if (!workerRef.current) {
        workerRef.current = await createWorker();
      }
      
      const worker = workerRef.current;

      // Step 2: Load language
      setCurrentStep(`Loading ${SUPPORTED_LANGUAGES.find(l => l.code === defaultLanguage)?.name || defaultLanguage} language model...`);
      setProgress(15);
      
      await worker.loadLanguage(defaultLanguage);
      setProgress(25);
      
      await worker.initialize(defaultLanguage);
      setProgress(35);

      // Step 3: Configure OCR parameters
      setCurrentStep('Configuring OCR parameters...');
      setProgress(40);
      
      await worker.setParameters({
        tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
        tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine only
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: '', // Allow all characters
        tessedit_do_invert: '0'
      });

      // Step 4: Process image
      setCurrentStep('Analyzing image and extracting text...');
      setProgress(50);

      const { data } = await worker.recognize(selectedFile, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const ocrProgress = 50 + (m.progress * 45); // 50% to 95%
            setProgress(ocrProgress);
            setCurrentStep(`Extracting text... ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      // Step 5: Process results
      setCurrentStep('Processing results...');
      setProgress(95);

      const processingTime = Date.now() - startTime;
      
      // Process line-level data with better error handling
      const lines = data.lines?.map(line => ({
        text: line.text || '',
        confidence: line.confidence || 0,
        bbox: line.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 }
      })) || [];

      // Count words more accurately
      const wordCount = data.text ? data.text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;

      const completedResult: OCRResult = {
        id: fileId,
        file: selectedFile,
        preview: previewUrl,
        status: 'completed',
        progress: 100,
        language: defaultLanguage,
        text: data.text || '',
        confidence: data.confidence || 0,
        lines,
        processingTime,
        wordCount
      };

      // Update files array
      setFiles(prev => prev.map(f => 
        f.file.name === selectedFile.name && f.file.size === selectedFile.size
          ? completedResult
          : f
      ));
      
      setResult(completedResult);
      setProgress(100);
      setCurrentStep('Text extraction completed!');
      
      // Update stats
      updateStats(completedResult);
      updateImageProcessed();
      updateProcessingStats('ocr', processingTime);

      toast({
        title: "OCR Complete! 🎉",
        description: `Text extracted with ${Math.round(data.confidence)}% confidence in ${(processingTime / 1000).toFixed(1)}s`
      });

    } catch (error) {
      console.error('OCR processing failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      setFiles(prev => prev.map(f => 
        f.file.name === selectedFile.name && f.file.size === selectedFile.size
          ? { ...f, status: 'error' as const, progress: 0, error: errorMessage }
          : f
      ));
      
      setProgress(0);
      setCurrentStep('');
      
      toast({
        title: "OCR Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, defaultLanguage, previewUrl, isProcessing, updateStats, toast]);

  const copyToClipboard = useCallback(async () => {
    if (!result?.text) return;

      try {
      await navigator.clipboard.writeText(result.text);
        toast({
        title: "Copied! 📋",
        description: "Text has been copied to your clipboard"
        });
      } catch (error) {
        toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive"
      });
    }
  }, [result, toast]);

  const downloadText = useCallback(async (format: 'txt' | 'docx' | 'json') => {
    if (!result?.text) return;

    try {
      let blob: Blob;
      let filename: string;

      if (format === 'txt') {
        blob = new Blob([result.text], { type: 'text/plain' });
        filename = `ocr-result-${Date.now()}.txt`;
      } else if (format === 'json') {
        const jsonData = {
          text: result.text,
          confidence: result.confidence,
          lines: result.lines,
          processingTime: result.processingTime,
          language: result.language,
          wordCount: result.wordCount,
          extractedAt: new Date().toISOString()
        };
        blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        filename = `ocr-result-${Date.now()}.json`;
      } else if (format === 'docx') {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "OCR Extraction Result",
                    bold: true,
                    size: 32
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Language: ${SUPPORTED_LANGUAGES.find(l => l.code === result.language)?.name || result.language}`,
                    size: 24
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Confidence: ${Math.round(result.confidence || 0)}%`,
                    size: 24
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Processing Time: ${(result.processingTime || 0) / 1000}s`,
                    size: 24
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Extracted Text:",
                    bold: true,
                    size: 28
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: result.text,
                    size: 24
                  })
                ]
              })
            ]
          }]
        });

        blob = await Packer.toBlob(doc);
        filename = `ocr-result-${Date.now()}.docx`;
      } else {
        throw new Error('Unsupported format');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started! 📥",
        description: `${filename} is being downloaded`
      });

    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive"
      });
    }
  }, [result, toast]);

  const selectedLanguageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === defaultLanguage);
  const qualityModeInfo = QUALITY_MODES.find(mode => mode.value === qualityMode);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              OCR Text Extractor
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Extract text from images with advanced AI-powered OCR technology. Support for 16+ languages with industry-leading accuracy.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { label: 'Languages', value: '16+', icon: Languages, color: 'from-purple-500 to-purple-600' },
                { label: 'Accuracy', value: '99%+', icon: Target, color: 'from-green-500 to-green-600' },
                { label: 'Speed', value: '<5s', icon: Clock, color: 'from-blue-500 to-blue-600' },
                { label: 'Formats', value: '3', icon: FileText, color: 'from-orange-500 to-orange-600' }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Upload & Settings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Upload Card */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    Upload Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                      isDragging
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                    
                    {selectedFile ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          size="sm"
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Drop your image here
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            or click to browse files
                          </p>
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Image
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Settings Card */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    OCR Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Language Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Language
                    </label>
                    <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{lang.flag}</span>
                              <div>
                                <div className="font-medium">{lang.name}</div>
                                <div className="text-xs text-gray-500">~{lang.accuracy}% accuracy</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedLanguageInfo && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-lg">{selectedLanguageInfo.flag}</span>
                          <span className="font-medium">{selectedLanguageInfo.name}</span>
                          <Badge variant="secondary">~{selectedLanguageInfo.accuracy}% accuracy</Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quality Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Quality Mode
                    </label>
                    <div className="grid gap-3">
                      {QUALITY_MODES.map((mode) => {
                        const Icon = mode.icon;
                        return (
                          <div
                            key={mode.value}
                            onClick={() => setQualityMode(mode.value)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              qualityMode === mode.value
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-5 h-5 ${mode.color}`} />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">{mode.label}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{mode.description}</div>
                              </div>
                              {qualityMode === mode.value && (
                                <CheckCircle className="w-5 h-5 text-purple-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Process Button */}
                  <Button
                    onClick={processOCR}
                    disabled={!selectedFile || isProcessing}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                    <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Extract Text
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalProcessed}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Images Processed</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{Math.round(stats.averageAccuracy)}%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Avg Accuracy</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{(stats.totalProcessingTime / 1000).toFixed(1)}s</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total Time</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{stats.languagesUsed.length}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Languages Used</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Panel - Preview & Results */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 space-y-6"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="results" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Results
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-6">
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        Image Preview
                  </CardTitle>
                </CardHeader>
                    <CardContent>
                      {previewUrl ? (
                        <div className="relative">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-white/90 text-gray-900">
                              {selectedFile?.name}
                        </Badge>
                      </div>
                        </div>
                      ) : (
                        <div className="h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                          <div className="text-center">
                            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No image selected</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="results" className="mt-6">
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        Extraction Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isProcessing ? (
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                              <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              Processing Image...
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              {currentStep || 'Preparing OCR engine...'}
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Progress</span>
                              <span className="font-medium text-gray-900 dark:text-white">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-3" />
                          </div>
                        </div>
                      ) : result ? (
                        <div className="space-y-6">
                          {/* Result Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                              <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                              <div className="text-lg font-bold text-green-600">{Math.round(result.confidence || 0)}%</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Confidence</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                              <div className="text-lg font-bold text-blue-600">{(result.processingTime || 0).toFixed(1)}s</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Time</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
                              <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                              <div className="text-lg font-bold text-purple-600">{result.wordCount || 0}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Words</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg">
                              <Languages className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                              <div className="text-lg font-bold text-orange-600">{SUPPORTED_LANGUAGES.find(l => l.code === result.language)?.flag || '🌐'}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{SUPPORTED_LANGUAGES.find(l => l.code === result.language)?.name || result.language}</div>
                            </div>
                          </div>

                          {/* Extracted Text */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Extracted Text</h3>
                              <div className="flex gap-2">
                                <Button
                                  onClick={copyToClipboard}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                              </div>
                            </div>
                            <Textarea
                              value={result.text || ''}
                              readOnly
                              className="min-h-[200px] bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                              placeholder="Extracted text will appear here..."
                            />
                          </div>

                          {/* Download Options */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Download Options</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Button
                                onClick={() => downloadText('txt')}
                                variant="outline"
                                className="h-12"
                              >
                                <FileText className="w-5 h-5 mr-2" />
                                Download TXT
                              </Button>
                              <Button
                                onClick={() => downloadText('docx')}
                                variant="outline"
                                className="h-12"
                              >
                                <Archive className="w-5 h-5 mr-2" />
                                Download DOCX
                              </Button>
                              <Button
                                onClick={() => downloadText('json')}
                                variant="outline"
                                className="h-12"
                              >
                                <Cpu className="w-5 h-5 mr-2" />
                                Download JSON
                        </Button>
                      </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-96 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mb-4">
                              <FileText className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              No Results Yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              Upload an image and click "Extract Text" to see results here
                            </p>
                          </div>
                    </div>
                      )}
                </CardContent>
              </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}