import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import AuthRequiredModal from '@/components/AuthRequiredModal';
import { useAuthRequired } from '@/hooks/useAuthRequired';
import {
  convertImageFormat,
  getImageInfo,
  validateImageFile,
  downloadBlob,
  getFormatRecommendation,
  generateThumbnail,
  rotateImage,
  flipImage
} from '@/lib/imageUtils';
import { updateImageProcessed, updateProcessingStats } from '@/lib/statsUtils';
import { trackActivity } from '@/lib/activityTracking';
import JSZip from 'jszip';
import {
  Upload,
  Download,
  X,
  FileImage,
  Zap,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface ProcessedFile {
  id: string;
  originalFile: File;
  originalInfo: any;
  convertedBlob?: Blob;
  thumbnail: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  progress: number;
  outputFormat: string;
  useGlobalFormat: boolean;
  quality: number;
  sizeBefore: number;
  sizeAfter?: number;
}

const ImageConverter = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [outputFormat, setOutputFormat] = useState('webp');
  const [quality, setQuality] = useState([85]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [resize, setResize] = useState({ width: 0, height: 0, enabled: false, maintainAspect: true });
  const [transform, setTransform] = useState({ rotate: 0, flipH: false, flipV: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAdvancedSettings = () => {
    setResize({ width: 0, height: 0, enabled: false, maintainAspect: true });
    setTransform({ rotate: 0, flipH: false, flipV: false });
  };

  // Auth requirement
  const { showAuthModal, setShowAuthModal, requireAuth } = useAuthRequired();

  const supportedFormats = [
    { value: 'webp', label: 'WebP', description: 'Modern format with excellent compression' },
    { value: 'jpeg', label: 'JPEG', description: 'Universal format for photos' },
    { value: 'png', label: 'PNG', description: 'Lossless format with transparency' },
    { value: 'gif', label: 'GIF', description: 'Animated images and simple graphics' },
    { value: 'bmp', label: 'BMP', description: 'Uncompressed bitmap format' },
    { value: 'tiff', label: 'TIFF', description: 'High-quality format for printing' },
    { value: 'ico', label: 'ICO', description: 'Favicon format' },
    { value: 'avif', label: 'AVIF', description: 'Next-gen compression (if supported)' }
  ];

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
    await processNewFiles(droppedFiles);
  }, [requireAuth]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check if user is authenticated
    if (!requireAuth()) {
      e.target.value = ''; // Reset input
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    await processNewFiles(selectedFiles);
  }, [requireAuth]);

  const processNewFiles = async (newFiles: File[]) => {
    const validFiles: ProcessedFile[] = [];

    for (const file of newFiles) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        // Show error for invalid files
        continue;
      }

      try {
        const info = await getImageInfo(file);
        const thumbnail = await generateThumbnail(file);
        const recommendedFormat = await getFormatRecommendation(file);

        const processedFile: ProcessedFile = {
          id: `${Date.now()}-${Math.random()}`,
          originalFile: file,
          originalInfo: info,
          thumbnail,
          status: 'pending',
          progress: 0,
          outputFormat: outputFormat, // Use global format initially
          useGlobalFormat: true, // Default to using global settings
          quality: quality[0],
          sizeBefore: file.size,
        };

        validFiles.push(processedFile);
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const convertSingleFile = async (fileData: ProcessedFile): Promise<ProcessedFile> => {
    try {
      setFiles(prev => prev.map(f =>
        f.id === fileData.id
          ? { ...f, status: 'processing', progress: 20 }
          : f
      ));

      // 1. Transform (Rotate/Flip)
      let currentFile: File | Blob = fileData.originalFile;

      if (transform.rotate !== 0) {
        currentFile = await rotateImage(currentFile as File, transform.rotate);
      }

      if (transform.flipH || transform.flipV) {
        currentFile = await flipImage(currentFile as File, transform.flipH, transform.flipV);
      }

      setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, progress: 50 } : f));

      // 2. Convert & Resize
      const convertedBlob = await convertImageFormat(currentFile as File, {
        format: fileData.outputFormat,
        quality: fileData.quality,
        preserveExif: false,
        maxWidth: resize.enabled && resize.width > 0 ? resize.width : undefined,
        maxHeight: resize.enabled && resize.height > 0 ? resize.height : undefined,
      });

      setFiles(prev => prev.map(f =>
        f.id === fileData.id
          ? {
            ...f,
            status: 'completed',
            progress: 100,
            convertedBlob,
            sizeAfter: convertedBlob.size
          }
          : f
      ));

      // Update stats
      const sizeSaved = Math.max(0, fileData.sizeBefore - convertedBlob.size);
      updateImageProcessed(sizeSaved);
      updateProcessingStats('conversions');

      // Track activity in Supabase
      await trackActivity('image_converted', {
        format: `${fileData.originalFile.type.split('/')[1]} → ${fileData.outputFormat}`,
        originalSize: fileData.sizeBefore,
        convertedSize: convertedBlob.size,
        quality: fileData.quality,
        success: true
      }).catch(err => console.warn('Failed to track activity:', err));

      return {
        ...fileData,
        status: 'completed',
        progress: 100,
        convertedBlob,
        sizeAfter: convertedBlob.size
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';

      setFiles(prev => prev.map(f =>
        f.id === fileData.id
          ? { ...f, status: 'error', error: errorMessage, progress: 0 }
          : f
      ));

      return {
        ...fileData,
        status: 'error',
        error: errorMessage,
        progress: 0
      };
    }
  };

  const convertAllFiles = async () => {
    setIsProcessing(true);

    const pendingFiles = files.filter(f => f.status === 'pending');

    for (const file of pendingFiles) {
      await convertSingleFile(file);
    }

    setIsProcessing(false);
  };

  const downloadSingle = (fileData: ProcessedFile) => {
    if (!fileData.convertedBlob) return;

    const filename = `${fileData.originalFile.name.split('.')[0]}.${fileData.outputFormat}`;
    downloadBlob(fileData.convertedBlob, filename);
  };

  const downloadAll = async () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.convertedBlob);

    if (completedFiles.length === 0) return;

    if (completedFiles.length === 1) {
      downloadSingle(completedFiles[0]);
      return;
    }

    // Create ZIP file for multiple downloads
    const zip = new JSZip();

    for (const file of completedFiles) {
      if (file.convertedBlob) {
        const filename = `${file.originalFile.name.split('.')[0]}.${file.outputFormat}`;
        zip.file(filename, file.convertedBlob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'converted-images.zip');
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const updateFileFormat = (id: string, format: string) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, outputFormat: format, status: 'pending', useGlobalFormat: false } : f
    ));
  };

  const updateFileQuality = (id: string, newQuality: number) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, quality: newQuality, status: 'pending' } : f
    ));
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';

    const absBytes = Math.abs(bytes);
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(absBytes) / Math.log(k));
    const formattedSize = parseFloat((absBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];

    return bytes < 0 ? `-${formattedSize}` : formattedSize;
  };

  const getCompressionRatio = (before: number, after?: number) => {
    if (!after || !before || isNaN(before) || isNaN(after)) return 0;
    const ratio = ((before - after) / before) * 100;
    return Math.round(ratio);
  };

  const getSpaceSaved = () => {
    const spaceDiff = totalSizeBefore - totalSizeAfter;
    if (spaceDiff <= 0) return '0 Bytes';
    return formatFileSize(spaceDiff);
  };

  const completedFiles = files.filter(f => f.status === 'completed');
  const totalSizeBefore = files.reduce((sum, f) => sum + (f.sizeBefore || 0), 0);
  const totalSizeAfter = completedFiles.reduce((sum, f) => sum + (f.sizeAfter || 0), 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Image Converter
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Convert images between 12+ formats with AI-powered optimization.
            Batch process multiple files and download as ZIP.
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8">
            <CardContent className="p-8">
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <motion.div
                  animate={{ scale: isDragging ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-2xl font-semibold mb-2">
                    {isDragging ? 'Drop your images here' : 'Upload Images'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Drag & drop images or click to browse. Supports PNG, JPG, WebP, GIF, BMP, TIFF
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Global Settings */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Conversion Settings
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Global Output Format</label>
                    <Select
                      value={outputFormat}
                      onValueChange={(value) => {
                        setOutputFormat(value);
                        setFiles(prev => prev.map(f =>
                          f.status === 'pending' && f.useGlobalFormat
                            ? { ...f, outputFormat: value }
                            : f
                        ));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedFormats.map(format => (
                          <SelectItem key={format.value} value={format.value}>
                            <div>
                              <div className="font-medium">{format.label}</div>
                              <div className="text-xs text-gray-500">{format.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block">Quality: {quality[0]}%</Label>
                    <Slider
                      value={quality}
                      onValueChange={setQuality}
                      max={100}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>

                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t space-y-6"
                  >
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetAdvancedSettings}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset Defaults
                      </Button>
                    </div>

                    {/* Resize Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Resize Image</Label>
                          <Switch
                            checked={resize.enabled}
                            onCheckedChange={(checked) => setResize(prev => ({ ...prev, enabled: checked }))}
                          />
                        </div>

                        <div className={`grid grid-cols-2 gap-4 ${!resize.enabled && 'opacity-50 pointer-events-none'}`}>
                          <div>
                            <Label htmlFor="width" className="text-xs text-gray-500">Width (px)</Label>
                            <Input
                              id="width"
                              type="number"
                              placeholder="Width"
                              value={resize.width || ''}
                              onChange={(e) => setResize(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="height" className="text-xs text-gray-500">Height (px)</Label>
                            <Input
                              id="height"
                              type="number"
                              placeholder="Height"
                              value={resize.height || ''}
                              onChange={(e) => setResize(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 ${!resize.enabled && 'opacity-50 pointer-events-none'}`}>
                          <Switch
                            id="aspect"
                            checked={resize.maintainAspect}
                            onCheckedChange={(checked) => setResize(prev => ({ ...prev, maintainAspect: checked }))}
                          />
                          <Label htmlFor="aspect" className="text-sm cursor-pointer">Maintain Aspect Ratio</Label>
                        </div>
                      </div>

                      {/* Transform Settings */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Transform</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500 mb-2 block">Rotation</Label>
                            <div className="flex gap-2">
                              {[0, 90, 180, 270].map((deg) => (
                                <Button
                                  key={deg}
                                  variant={transform.rotate === deg ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setTransform(prev => ({ ...prev, rotate: deg }))}
                                  className="flex-1"
                                >
                                  {deg}°
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500 mb-2 block">Flip</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={transform.flipH ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTransform(prev => ({ ...prev, flipH: !prev.flipH }))}
                                className="flex-1"
                              >
                                Horz
                              </Button>
                              <Button
                                variant={transform.flipV ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTransform(prev => ({ ...prev, flipV: !prev.flipV }))}
                                className="flex-1"
                              >
                                Vert
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> Advanced settings (Resize, Rotate, Flip) will be applied to all images in the queue during conversion.
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <FileImage className="w-5 h-5 mr-2" />
                    Files ({files.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
                      disabled={isProcessing}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                    <Button
                      onClick={convertAllFiles}
                      disabled={isProcessing || files.every(f => f.status !== 'pending')}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Convert All
                    </Button>
                    {completedFiles.length > 0 && (
                      <Button
                        onClick={downloadAll}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary Stats */}
                {completedFiles.length > 0 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {completedFiles.length}
                        </div>
                        <div className="text-sm text-gray-600">Files Converted</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {getSpaceSaved()}
                        </div>
                        <div className="text-sm text-gray-600">Space Saved</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {getCompressionRatio(totalSizeBefore, totalSizeAfter)}%
                        </div>
                        <div className="text-sm text-gray-600">Compression</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <AnimatePresence>
                    {files.map((file) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="border rounded-lg p-4 bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                            <img
                              src={file.thumbnail}
                              alt={file.originalFile.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{file.originalFile.name}</h4>
                              <Badge variant={
                                file.status === 'completed' ? 'default' :
                                  file.status === 'error' ? 'destructive' :
                                    file.status === 'processing' ? 'secondary' : 'outline'
                              }>
                                {file.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {file.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                                {file.status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                {file.status}
                              </Badge>
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {file.originalInfo.width} × {file.originalInfo.height} • {formatFileSize(file.sizeBefore)}
                              {file.sizeAfter && (
                                <span className={`ml-2 ${file.sizeAfter < file.sizeBefore ? 'text-green-600' : 'text-orange-600'
                                  }`}>
                                  → {formatFileSize(file.sizeAfter)}
                                  {file.sizeAfter < file.sizeBefore ? (
                                    <span>({getCompressionRatio(file.sizeBefore, file.sizeAfter)}% smaller)</span>
                                  ) : (
                                    <span>({Math.abs(getCompressionRatio(file.sizeBefore, file.sizeAfter))}% larger)</span>
                                  )}
                                </span>
                              )}
                            </div>

                            {file.status === 'processing' && (
                              <Progress value={file.progress} className="mt-2" />
                            )}

                            {file.error && (
                              <div className="text-red-600 text-sm mt-1">{file.error}</div>
                            )}
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-4">
                            {/* Global Sync Checkbox */}
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`use-global-${file.id}`}
                                checked={file.useGlobalFormat}
                                onCheckedChange={(checked) => {
                                  const isChecked = checked === true;
                                  setFiles(prev => prev.map(f =>
                                    f.id === file.id
                                      ? {
                                        ...f,
                                        useGlobalFormat: isChecked,
                                        outputFormat: isChecked ? outputFormat : f.outputFormat
                                      }
                                      : f
                                  ));
                                }}
                                disabled={file.status === 'processing'}
                              />
                              <Label
                                htmlFor={`use-global-${file.id}`}
                                className="text-xs cursor-pointer text-gray-500 whitespace-nowrap hidden sm:inline-block"
                              >
                                Use Global
                              </Label>
                            </div>

                            <Select
                              value={file.outputFormat}
                              onValueChange={(value) => updateFileFormat(file.id, value)}
                              disabled={file.status === 'processing' || file.useGlobalFormat}
                            >
                              <SelectTrigger className={`w-24 ${file.useGlobalFormat ? 'opacity-70 bg-gray-50' : ''}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {supportedFormats
                                  .filter(format => file.useGlobalFormat || format.value !== file.originalInfo.format)
                                  .map(format => (
                                    <SelectItem key={format.value} value={format.value}>
                                      {format.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>

                            {file.status === 'completed' && file.convertedBlob && (
                              <Button
                                size="sm"
                                onClick={() => downloadSingle(file)}
                                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFile(file.id)}
                              disabled={file.status === 'processing'}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Features Info */}
        {files.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Batch Processing</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Convert multiple images simultaneously with optimized performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">AI Optimization</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Smart format recommendations based on image content and size
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Easy Download</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Download individual files or get all conversions in a ZIP archive
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        featureName="Image Converter"
      />
    </Layout>
  );
};

export default ImageConverter;