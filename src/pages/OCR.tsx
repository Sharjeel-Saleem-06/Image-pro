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
import AuthRequiredModal from '@/components/AuthRequiredModal';
import { useAuthRequired } from '@/hooks/useAuthRequired';
import { validateImageFile, downloadBlob } from '@/lib/imageUtils';
import { updateImageProcessed, updateProcessingStats } from '@/lib/statsUtils';
import Tesseract, { createWorker, PSM, OEM } from 'tesseract.js';
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
  const [ocrModel, setOcrModel] = useState<'groq' | 'ocrspace'>('groq');
  const [qualityMode, setQualityMode] = useState('balanced');
  const [currentStep, setCurrentStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);

  // Auth requirement
  const { showAuthModal, setShowAuthModal, requireAuth } = useAuthRequired();
  const { toast } = useToast();
  const [stats, setStats] = useState<OCRStats>({
    totalProcessed: 0,
    averageAccuracy: 0,
    totalProcessingTime: 0,
    languagesUsed: []
  });

  // Initialize worker once
  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

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

  const handleFileSelect = useCallback((file: File) => {
    // Check if user is authenticated
    if (!requireAuth()) return;

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
  }, [defaultLanguage, toast, requireAuth]);

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

    // Check if user is authenticated
    if (!requireAuth()) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  }, [requireAuth, handleFileSelect]);

  const processOCR = useCallback(async () => {
    if (!selectedFile || isProcessing) return;

    setIsProcessing(true);
    setProgress(0);
    setActiveTab('results');

    const startTime = Date.now();
    const fileId = `${selectedFile.name}-${selectedFile.size}`;

    // API Keys from env
    const groqKeys = [
      import.meta.env.VITE_GROQ_API_KEY,
      import.meta.env.VITE_GROQ_API_KEY_2
    ].filter(Boolean); // Filter out undefined keys

    const ocrSpaceApiKey = import.meta.env.VITE_OCR_SPACE_API_KEY || 'K82021121088957';

    try {
      // Update file status
      setFiles(prev => prev.map(f =>
        f.file.name === selectedFile.name && f.file.size === selectedFile.size
          ? { ...f, status: 'processing' as const, progress: 0 }
          : f
      ));

      let extractedData: { text: string; confidence: number; processingTime?: number } | null = null;
      let usedModel = '';

      // FORCE AI ONLY - NO LOCAL FALLBACK 

      // 1. Try Groq (Key 1 -> Key 2)
      if (ocrModel === 'groq') {
        const { extractTextWithGroq } = await import('@/lib/ocrGroq');
        const langName = SUPPORTED_LANGUAGES.find(l => l.code === defaultLanguage)?.name || defaultLanguage;

        for (let i = 0; i < groqKeys.length; i++) {
          const currentKey = groqKeys[i];
          const keyLabel = i === 0 ? "Primary" : "Backup";

          try {
            setCurrentStep(qualityMode === 'accurate'
              ? `Initializing AI Vision (${keyLabel} Connection)...`
              : `Initializing AI Vision (${keyLabel})...`);

            setProgress(20 + (i * 10)); // Increment progress for second try

            const aiResult = await extractTextWithGroq(
              selectedFile,
              qualityMode as 'fast' | 'balanced' | 'accurate',
              currentKey,
              (stage) => {
                setCurrentStep(stage);
                setProgress(prev => Math.min(prev + 10, 90));
              },
              langName
            );

            extractedData = {
              text: aiResult.text,
              confidence: aiResult.confidence,
              processingTime: aiResult.processingTime
            };
            usedModel = `AI Vision (${qualityMode})`;
            break; // Success! Exit loop

          } catch (groqError) {
            console.warn(`Groq API Key ${i + 1} failed:`, groqError);
            if (i === groqKeys.length - 1) {
              // Both keys failed, do NOT throw yet, fallthrough to OCR.Space logic below
              console.log("All Groq keys failed, switching to backup provider...");
            }
          }
        }
      }

      // 2. Fallback to OCR.Space (if Groq failed OR if user selected 'ocrspace')
      if (!extractedData) {
        if (ocrModel === 'groq') {
          setCurrentStep('AI Vision unavailable, switching to Cloud Backup...');
          await new Promise(r => setTimeout(r, 1000)); // Brief pause for UX
        }

        // --- MODEL 2: OCR.SPACE ---
        try {
          let fileToUpload = selectedFile;

          // OCR.Space Free Tier Limit: 1 MB
          if (fileToUpload.size > 1024 * 1024) {
            setCurrentStep('Optimizing image for Cloud (Limit 1MB)...');
            setProgress(10);

            const { compressImage } = await import('@/lib/imageUtils');
            try {
              fileToUpload = await compressImage(selectedFile, {
                maxSizeMB: 0.95, // Target just under 1MB
                maxWidthOrHeight: 2048,
                useWebWorker: true,
                quality: 80
              });
              console.log(`Image compressed from ${(selectedFile.size / 1024).toFixed(2)}KB to ${(fileToUpload.size / 1024).toFixed(2)}KB`);
            } catch (cError) {
              console.warn("Compression failed, trying original:", cError);
            }
          }

          setCurrentStep('Uploading to OCR.Space Cloud...');
          setProgress(20);

          const formData = new FormData();
          formData.append('file', fileToUpload);
          formData.append('apikey', ocrSpaceApiKey);
          formData.append('language', defaultLanguage);
          formData.append('isOverlayRequired', 'false');
          formData.append('detectOrientation', 'true');
          formData.append('scale', 'true');
          formData.append('OCREngine', qualityMode === 'accurate' ? '2' : '1'); // Engine 2 is better

          const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

          setCurrentStep('Processing Cloud Response...');
          setProgress(70);

          const data = await response.json();

          if (data.IsErroredOnProcessing) {
            throw new Error(typeof data.ErrorMessage === 'string' ? data.ErrorMessage : data.ErrorMessage?.[0] || 'Unknown OCR.Space error');
          }

          if (!data.ParsedResults || data.ParsedResults.length === 0) {
            throw new Error('No results returned from OCR service');
          }

          const parsedResult = data.ParsedResults[0];
          extractedData = {
            text: parsedResult.ParsedText,
            confidence: 90, // OCR.Space doesn't always return confidence for text block, assume high
            processingTime: Date.now() - startTime
          };
          usedModel = 'OCR.Space (Cloud)';

        } catch (error) {
          console.error("OCR.Space Failed:", error);
          // NO LOCAL FALLBACK - User requested disable
          throw new Error("All AI and Cloud OCR services failed. Please check your internet connection or try again later.");
        }
      }

      if (!extractedData) throw new Error("No text extracted.");

      setCurrentStep('Finalizing results...');
      setProgress(100);

      const wordCount = extractedData.text ? extractedData.text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;

      const completedResult: OCRResult = {
        id: fileId,
        file: selectedFile,
        preview: previewUrl,
        status: 'completed',
        progress: 100,
        language: defaultLanguage,
        text: extractedData.text,
        confidence: extractedData.confidence,
        lines: [],
        processingTime: extractedData.processingTime || (Date.now() - startTime),
        wordCount
      };

      setFiles(prev => prev.map(f =>
        f.file.name === selectedFile.name && f.file.size === selectedFile.size
          ? completedResult
          : f
      ));

      setResult(completedResult);
      setCurrentStep('Extraction completed!');
      updateStats(completedResult);
      updateImageProcessed();
      updateProcessingStats('ocrExtractions');

      toast({
        title: "Extraction Complete! ✨",
        description: `Processed using ${usedModel}`,
        duration: 5000,
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
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, defaultLanguage, previewUrl, isProcessing, updateStats, qualityMode, toast, ocrModel]);

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
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 pb-12">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              OCR Text Extractor
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Convert images to text instantly with AI-powered accuracy.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar (Settings & Upload) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-4 space-y-6 lg:sticky lg:top-8"
            >
              {/* Upload Card */}
              <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="w-5 h-5 text-purple-500" />
                    Input Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative group border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
                      ${isDragging
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }
                      ${selectedFile ? 'py-4' : 'py-10'}
                    `}
                    onClick={() => !selectedFile && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <FileImage className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-gray-900 dark:text-white">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="cursor-pointer">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white mb-1">
                          Click to upload
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          or drag and drop here
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* OCR Controls */}
              <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-500" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Model Selector */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      OCR Engine
                    </label>
                    <Select value={ocrModel} onValueChange={(val: 'groq' | 'ocrspace') => setOcrModel(val)}>
                      <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="groq">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <span>AI Vision (Groq)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ocrspace">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" />
                            <span>OCR.Space (Cloud)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Target Language
                    </label>
                    <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                      <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <div className="flex items-center gap-2">
                              <span className="text-base">{lang.flag}</span>
                              <span>{lang.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mode Grid */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Processing Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {QUALITY_MODES.map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = qualityMode === mode.value;
                        return (
                          <div
                            key={mode.value}
                            onClick={() => setQualityMode(mode.value)}
                            className={`
                              cursor-pointer rounded-lg p-2 text-center border-2 transition-all duration-200
                              ${isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }
                            `}
                          >
                            <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                            <div className={`text-xs font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                              {mode.label.split(' ')[0]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Extract Button */}
                  <Button
                    onClick={processOCR}
                    disabled={!selectedFile || isProcessing}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        <span>Start Extraction</span>
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Mini Stats (Processed) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProcessed}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Processed</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(stats.averageAccuracy)}%</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Accuracy</div>
                </div>
              </div>

            </motion.div>

            {/* Right Main Area (Results) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-8 h-full flex flex-col"
            >
              <Card className="flex-1 flex flex-col border-gray-200/50 dark:border-gray-700/50 shadow-md min-h-[600px]">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full">
                  <div className="p-2 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1 rounded-lg">
                      <TabsTrigger value="upload" className="px-4 py-2 text-sm">Preview Input</TabsTrigger>
                      <TabsTrigger value="results" className="px-4 py-2 text-sm">Extraction Results</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 p-6 relative bg-white dark:bg-gray-900/50">
                    <TabsContent value="upload" className="h-full m-0">
                      {previewUrl ? (
                        <div className="h-full flex items-center justify-center bg-gray-50/50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4">
                          <img src={previewUrl} alt="Preview" className="max-w-full max-h-[500px] object-contain shadow-sm rounded-lg" />
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                          <p>No image to preview</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="results" className="h-full m-0 flex flex-col">
                      {isProcessing ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-6">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-gray-100 dark:border-gray-800 border-t-purple-600 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xs">
                              {Math.round(progress)}%
                            </div>
                          </div>
                          <div className="text-center space-y-2">
                            <h3 className="text-lg font-medium">{currentStep}</h3>
                            <p className="text-sm text-gray-500">This usually takes 2-5 seconds...</p>
                          </div>
                        </div>
                      ) : result ? (
                        <div className="flex flex-col h-full gap-4">
                          {/* Metrics Bar */}
                          <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 px-3 border-r border-gray-200 dark:border-gray-600 last:border-0">
                              <Target className="w-4 h-4 text-green-500" />
                              <div>
                                <span className="text-xs text-gray-500 uppercase block">Confidence</span>
                                <span className="font-semibold text-sm">{Math.round(result.confidence || 0)}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 border-r border-gray-200 dark:border-gray-600 last:border-0">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <div>
                                <span className="text-xs text-gray-500 uppercase block">Time</span>
                                <span className="font-semibold text-sm">{(result.processingTime || 0).toFixed(2)}s</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 px-3">
                              <BookOpen className="w-4 h-4 text-purple-500" />
                              <div>
                                <span className="text-xs text-gray-500 uppercase block">Words</span>
                                <span className="font-semibold text-sm">{result.wordCount}</span>
                              </div>
                            </div>

                            <div className="flex-1" />

                            {/* Quick Actions */}
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8">
                                <Copy className="w-3.5 h-3.5 mr-2" />
                                Copy
                              </Button>
                            </div>
                          </div>

                          {/* Editor Area */}
                          <div className="relative flex-1 group">
                            <Textarea
                              value={result.text}
                              readOnly
                              className="h-full min-h-[400px] w-full resize-none bg-white dark:bg-gray-950 p-6 font-mono text-sm leading-relaxed border-gray-200 dark:border-gray-800 focus:ring-0 focus:border-purple-500 rounded-lg shadow-inner"
                            />

                            {/* Floating Download Actions (Bottom Right) */}
                            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="secondary" onClick={() => downloadText('txt')} className="shadow-lg">
                                <FileText className="w-3 h-3 mr-2" /> TXT
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => downloadText('docx')} className="shadow-lg">
                                <Archive className="w-3 h-3 mr-2" /> DOCX
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => downloadText('json')} className="shadow-lg">
                                <Cpu className="w-3 h-3 mr-2" /> JSON
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 gap-4 opacity-60">
                          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Zap className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                          </div>
                          <div className="max-w-xs">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ready to Extract</h3>
                            <p>Upload an image and configure settings to see the magic happen.</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        featureName="OCR Text Extractor"
      />
    </Layout>
  );
}