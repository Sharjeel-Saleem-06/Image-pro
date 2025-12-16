import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import {
  Upload,
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Palette,
  Type,
  Undo,
  Redo,
  Save,
  Image as ImageIcon,
  Settings,
  Move,
  ZoomIn,
  ZoomOut,
  Square,
  Circle,
  Brush,
  Eraser,
  Eye,
  EyeOff,
  Layers,
  Filter,
  Sparkles,
  X
} from 'lucide-react';

interface EditorSettings {
  brightness: number[];
  contrast: number[];
  saturation: number[];
  blur: number[];
  hue: number[];
  gamma: number[];
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  selectedFilter: string;
  textOverlays: TextOverlay[];
}

interface EditAction {
  type: string;
  settings: EditorSettings;
  timestamp: number;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  visible: boolean;
}

const ImageEditor = () => {
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [editHistory, setEditHistory] = useState<EditAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEffect, setCurrentEffect] = useState<string>('');
  const [isRestoringFromHistory, setIsRestoringFromHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Editor settings
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  const [blur, setBlur] = useState([0]);
  const [hue, setHue] = useState([0]);
  const [gamma, setGamma] = useState([1]);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [zoom, setZoom] = useState([100]);

  // Crop settings
  const [cropMode, setCropMode] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Text overlay
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [newText, setNewText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState([24]);
  const [fontFamily, setFontFamily] = useState('Arial');
  
  // Filters
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  // Text overlay drag functionality
  const [draggedText, setDraggedText] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [sliderTimeout, setSliderTimeout] = useState<NodeJS.Timeout | null>(null);

  const filters = [
    { value: 'none', label: 'None' },
    { value: 'grayscale', label: 'Grayscale' },
    { value: 'sepia', label: 'Sepia' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'cool', label: 'Cool' },
    { value: 'warm', label: 'Warm' },
    { value: 'dramatic', label: 'Dramatic' }
  ];

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(img);
        resetSettings();
        // Initialize history with original image
        setTimeout(() => {
          initializeHistory();
        }, 100);
      };
      img.src = URL.createObjectURL(file);
    }
  }, []);

  const resetSettings = () => {
    setBrightness([100]);
    setContrast([100]);
    setSaturation([100]);
    setBlur([0]);
    setHue([0]);
    setGamma([1]);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setZoom([100]);
    setSelectedFilter('none');
    setTextOverlays([]);
    setCropMode(false);
    setEditHistory([]);
    setHistoryIndex(-1);
  };

  const initializeHistory = useCallback(() => {
    if (!uploadedImage) return;
    
    console.log('Initializing history for new image');
    
    const initialSettings: EditorSettings = {
      brightness: [100],
      contrast: [100],
      saturation: [100],
      blur: [0],
      hue: [0],
      gamma: [1],
      rotation: 0,
      flipX: false,
      flipY: false,
      selectedFilter: 'none',
      textOverlays: []
    };
    
    const initialAction: EditAction = {
      type: 'initial',
      settings: initialSettings,
      timestamp: Date.now()
    };
    
    setEditHistory([initialAction]);
    setHistoryIndex(0);
    
    console.log('History initialized with initial settings - Index: 0, Length: 1');
  }, [uploadedImage]);

  const getCurrentSettings = useCallback((): EditorSettings => {
    return {
      brightness,
      contrast,
      saturation,
      blur,
      hue,
      gamma,
      rotation,
      flipX,
      flipY,
      selectedFilter,
      textOverlays
    };
  }, [brightness, contrast, saturation, blur, hue, gamma, rotation, flipX, flipY, selectedFilter, textOverlays]);

  const saveToHistory = useCallback(() => {
    if (!uploadedImage || isRestoringFromHistory) {
      console.log('Skipping history save - no image or restoring from history');
      return;
    }
    
    try {
      const currentSettings = getCurrentSettings();
      const newAction: EditAction = {
        type: 'edit',
        settings: currentSettings,
        timestamp: Date.now()
      };
      
      // Update both history and index in a single operation
      setEditHistory(prevHistory => {
        // Remove any history after current index (for branching)
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push(newAction);
        
        // Limit history to 20 items for performance
        if (newHistory.length > 20) {
          newHistory.shift();
          // Adjust index after shifting
          setHistoryIndex(newHistory.length - 1);
          return newHistory;
        }
        
        // Set index to the newly added item
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
      
      console.log('Saved to history - New index will be:', historyIndex + 1);
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }, [uploadedImage, historyIndex, getCurrentSettings, isRestoringFromHistory]);

  const undo = useCallback(() => {
    console.log('Undo called - Current index:', historyIndex, 'History length:', editHistory.length);
    if (historyIndex > 0 && !isRestoringFromHistory) {
      const newIndex = historyIndex - 1;
      console.log('Undoing to index:', newIndex);
      setIsRestoringFromHistory(true);
      setHistoryIndex(newIndex);
      
      // Use setTimeout to ensure state update completes
      setTimeout(() => {
        restoreFromHistory(newIndex);
      }, 0);
    } else {
      console.log('Cannot undo - at beginning of history or already restoring');
    }
  }, [historyIndex, editHistory.length, isRestoringFromHistory]);

  const redo = useCallback(() => {
    console.log('Redo called - Current index:', historyIndex, 'History length:', editHistory.length);
    if (historyIndex < editHistory.length - 1 && !isRestoringFromHistory) {
      const newIndex = historyIndex + 1;
      console.log('Redoing to index:', newIndex);
      setIsRestoringFromHistory(true);
      setHistoryIndex(newIndex);
      
      // Use setTimeout to ensure state update completes
      setTimeout(() => {
        restoreFromHistory(newIndex);
      }, 0);
    } else {
      console.log('Cannot redo - at end of history or already restoring');
    }
  }, [historyIndex, editHistory.length, isRestoringFromHistory]);

  const restoreFromHistory = useCallback((index: number) => {
    if (!editHistory[index]) {
      console.log('Cannot restore - missing history item at index:', index);
      setIsRestoringFromHistory(false);
      return;
    }
    
    try {
      console.log('Restoring from history index:', index);
      const settings = editHistory[index].settings;
      
      // Batch all state updates together to prevent race conditions
      Promise.resolve().then(() => {
        setBrightness(settings.brightness);
        setContrast(settings.contrast);
        setSaturation(settings.saturation);
        setBlur(settings.blur);
        setHue(settings.hue);
        setGamma(settings.gamma);
        setRotation(settings.rotation);
        setFlipX(settings.flipX);
        setFlipY(settings.flipY);
        setSelectedFilter(settings.selectedFilter);
        setTextOverlays(settings.textOverlays);
        
        // Allow time for all state updates to complete
        setTimeout(() => {
          setIsRestoringFromHistory(false);
          console.log('Successfully restored settings from history');
        }, 100);
      });
      
    } catch (error) {
      console.error('Error restoring from history:', error);
      setIsRestoringFromHistory(false);
    }
  }, [editHistory]);

  const updatePreviewFromCanvas = () => {
    if (!canvasRef.current || !previewCanvasRef.current) return;
    
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const previewCtx = previewCanvas.getContext('2d');
    
    if (!previewCtx) return;
    
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(canvas, 0, 0);
  };

  const applyFilters = useCallback((ctx: CanvasRenderingContext2D, imageData: ImageData) => {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Apply brightness
      const brightnessFactor = brightness[0] / 100;
      r *= brightnessFactor;
      g *= brightnessFactor;
      b *= brightnessFactor;
      
      // Apply contrast
      const contrastFactor = contrast[0] / 100;
      r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;
      
      // Apply saturation
      const saturationFactor = saturation[0] / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;
      
      // Apply hue shift
      if (hue[0] !== 0) {
        const hueShift = hue[0] * Math.PI / 180;
        const cosA = Math.cos(hueShift);
        const sinA = Math.sin(hueShift);
        
        const newR = r * (cosA + (1 - cosA) / 3) + g * ((1 - cosA) / 3 - sinA / Math.sqrt(3)) + b * ((1 - cosA) / 3 + sinA / Math.sqrt(3));
        const newG = r * ((1 - cosA) / 3 + sinA / Math.sqrt(3)) + g * (cosA + (1 - cosA) / 3) + b * ((1 - cosA) / 3 - sinA / Math.sqrt(3));
        const newB = r * ((1 - cosA) / 3 - sinA / Math.sqrt(3)) + g * ((1 - cosA) / 3 + sinA / Math.sqrt(3)) + b * (cosA + (1 - cosA) / 3);
        
        r = newR;
        g = newG;
        b = newB;
      }
      
      // Apply gamma correction
      const gammaValue = gamma[0];
      r = Math.pow(r / 255, 1 / gammaValue) * 255;
      g = Math.pow(g / 255, 1 / gammaValue) * 255;
      b = Math.pow(b / 255, 1 / gammaValue) * 255;
      
      // Apply filter effects
      switch (selectedFilter) {
        case 'grayscale':
          const grayValue = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = grayValue;
          break;
        case 'sepia':
          const newR = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          const newG = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          const newB = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
          r = newR; g = newG; b = newB;
          break;
        case 'vintage':
          r = Math.min(255, r * 1.2);
          g = Math.min(255, g * 1.1);
          b = Math.min(255, b * 0.8);
          break;
        case 'cool':
          r = Math.min(255, r * 0.8);
          g = Math.min(255, g * 0.9);
          b = Math.min(255, b * 1.2);
          break;
        case 'warm':
          r = Math.min(255, r * 1.2);
          g = Math.min(255, g * 1.1);
          b = Math.min(255, b * 0.8);
          break;
        case 'dramatic':
          const dramatic = 0.299 * r + 0.587 * g + 0.114 * b;
          r = Math.min(255, dramatic > 128 ? r * 1.3 : r * 0.7);
          g = Math.min(255, dramatic > 128 ? g * 1.3 : g * 0.7);
          b = Math.min(255, dramatic > 128 ? b * 1.3 : b * 0.7);
          break;
      }
      
      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
    
    return imageData;
  }, [brightness, contrast, saturation, hue, gamma, selectedFilter]);

  const updatePreview = useCallback(() => {
    if (!uploadedImage || !canvasRef.current || !previewCanvasRef.current) return;
    
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    
    if (!ctx || !previewCtx) return;
    
    // Set canvas size to match image
    canvas.width = uploadedImage.width;
    canvas.height = uploadedImage.height;
    previewCanvas.width = uploadedImage.width;
    previewCanvas.height = uploadedImage.height;
    
    // Clear both canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // Apply transformations to main canvas
    ctx.save();
    
    // Apply rotation and flip
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.translate(-centerX, -centerY);
    
    // Draw the original image
    ctx.drawImage(uploadedImage, 0, 0);
    ctx.restore();
    
    // Apply pixel-level filters
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const filteredData = applyFilters(ctx, imageData);
    ctx.putImageData(filteredData, 0, 0);
    
    // Apply blur filter if needed
    if (blur[0] > 0) {
      ctx.filter = `blur(${blur[0]}px)`;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
      }
      ctx.filter = 'none';
    }
    
    // Draw text overlays on main canvas
    textOverlays.forEach(overlay => {
      if (overlay.visible) {
        ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
        ctx.fillStyle = overlay.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillText(overlay.text, overlay.x, overlay.y);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    });
    
    // Copy to preview canvas
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(canvas, 0, 0);
    
  }, [uploadedImage, rotation, flipX, flipY, blur, textOverlays, applyFilters]);

  // Auto-update preview when any setting changes
  useEffect(() => {
    updatePreview();
  }, [updatePreview, brightness, contrast, saturation, hue, gamma, selectedFilter]);

  const rotateImage = (direction: 'left' | 'right') => {
    setRotation(prev => prev + (direction === 'right' ? 90 : -90));
    // Save to history after rotation
    if (!isRestoringFromHistory) {
      setTimeout(() => saveToHistory(), 100);
    }
  };

  const flipImage = (direction: 'horizontal' | 'vertical') => {
    if (direction === 'horizontal') {
      setFlipX(prev => !prev);
    } else {
      setFlipY(prev => !prev);
    }
    // Save to history after flip
    if (!isRestoringFromHistory) {
      setTimeout(() => saveToHistory(), 100);
    }
  };

  const startCrop = () => {
    setCropMode(true);
  };

  const applyCrop = () => {
    if (!canvasRef.current || !cropMode || !uploadedImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);
    
    if (width > 10 && height > 10) {
      // Get the current canvas content
      const imageData = ctx.getImageData(x, y, width, height);
      
      // Create new canvas with cropped dimensions
      const newCanvas = document.createElement('canvas');
      newCanvas.width = width;
      newCanvas.height = height;
      const newCtx = newCanvas.getContext('2d');
      
      if (newCtx) {
        newCtx.putImageData(imageData, 0, 0);
        
        // Create new image from cropped canvas
        const croppedImg = new Image();
        croppedImg.onload = () => {
          setUploadedImage(croppedImg);
          setCropMode(false);
          setCropStart({ x: 0, y: 0 });
          setCropEnd({ x: 0, y: 0 });
          
          // Update text overlay positions relative to new crop
          setTextOverlays(prev => prev.map(overlay => ({
            ...overlay,
            x: Math.max(0, overlay.x - x),
            y: Math.max(0, overlay.y - y)
          })).filter(overlay => 
            overlay.x < width && overlay.y < height
          ));
          
          // Reset transformations
          setRotation(0);
          setFlipX(false);
          setFlipY(false);
          
          setTimeout(() => {
            updatePreview();
            saveToHistory();
          }, 100);
        };
        croppedImg.src = newCanvas.toDataURL();
      }
    }
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    
    // Position text in center of visible area
    const centerX = uploadedImage ? uploadedImage.width / 4 : 50;
    const centerY = uploadedImage ? uploadedImage.height / 4 : 50;
    
    const overlay: TextOverlay = {
      id: Date.now().toString(),
      text: newText,
      x: centerX,
      y: centerY,
      fontSize: fontSize[0],
      color: textColor,
      fontFamily: fontFamily,
      visible: true
    };
    
    setTextOverlays(prev => [...prev, overlay]);
    setNewText('');
    
    // Trigger preview update and save to history
    setTimeout(() => {
      updatePreview();
      saveToHistory();
    }, 100);
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === id ? { ...overlay, ...updates } : overlay
    ));
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
    setTimeout(() => {
      updatePreview();
      saveToHistory();
    }, 100);
  };

  const toggleTextOverlay = (id: string) => {
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === id ? { ...overlay, visible: !overlay.visible } : overlay
    ));
    setTimeout(() => {
      updatePreview();
    }, 100);
  };

  const downloadImage = () => {
    if (!canvasRef.current || !uploadedImage) return;
    
    const canvas = canvasRef.current;
      const link = document.createElement('a');
    link.download = `edited-image-${Date.now()}.png`;
    link.href = canvas.toDataURL();
      link.click();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (cropMode) {
      setCropStart({ x, y });
      setCropEnd({ x, y });
      setIsDragging(true);
      return;
    }
    
    // Check if clicking on text overlay
    const clickedText = textOverlays.find(overlay => {
      if (!overlay.visible) return false;
      
      // Create temporary canvas to measure text
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return false;
      
      tempCtx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
      const textMetrics = tempCtx.measureText(overlay.text);
      const textWidth = textMetrics.width;
      const textHeight = overlay.fontSize;
      
      return x >= overlay.x && x <= overlay.x + textWidth &&
             y >= overlay.y && y <= overlay.y + textHeight;
    });
    
    if (clickedText) {
      setDraggedText(clickedText.id);
      setDragOffset({
        x: x - clickedText.x,
        y: y - clickedText.y
      });
      setIsDragging(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (!isDragging) return;
    
    if (cropMode) {
      setCropEnd({ x, y });
      return;
    }
    
    if (draggedText) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;
      
      updateTextOverlay(draggedText, { x: newX, y: newY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    if (draggedText) {
      setDraggedText(null);
      setDragOffset({ x: 0, y: 0 });
      // Save to history after text move
      setTimeout(() => {
        updatePreview();
        saveToHistory();
      }, 100);
    }
  };

  // Improved effect functions
  const applyEffect = (effectType: string) => {
    if (!uploadedImage) return;
    
    setIsProcessing(true);
    setCurrentEffect(effectType);
    
    switch (effectType) {
      case 'sharpen':
        // Apply sharpening effect by increasing contrast and saturation
        setSaturation([Math.min(200, saturation[0] + 20)]);
        setContrast([Math.min(200, contrast[0] + 15)]);
        break;
      case 'soften':
        setBlur([Math.min(10, blur[0] + 1)]);
        break;
      case 'enhance':
        setBrightness([Math.min(200, brightness[0] + 10)]);
        setContrast([Math.min(200, contrast[0] + 10)]);
        setSaturation([Math.min(200, saturation[0] + 15)]);
        break;
      case 'vintage':
        setSelectedFilter('vintage');
        break;
      case 'bw':
        setSelectedFilter('grayscale');
        break;
    }
    
    setTimeout(() => {
      updatePreview();
      setIsProcessing(false);
      setCurrentEffect('');
      // Save to history after effect is applied
      setTimeout(() => {
        saveToHistory();
      }, 500);
    }, 100);
  };

  const resetToOriginal = () => {
    if (!uploadedImage) return;
    
    // Reset all settings to default
    setBrightness([100]);
    setContrast([100]);
    setSaturation([100]);
    setBlur([0]);
    setHue([0]);
    setGamma([1]);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setZoom([100]);
    setSelectedFilter('none');
    setTextOverlays([]);
    setCropMode(false);
    
    setTimeout(() => {
      updatePreview();
      saveToHistory();
    }, 100);
  };

  // Improved advanced effect functions
  const applyAdvancedEffect = (effectType: string) => {
    if (!uploadedImage || !canvasRef.current) return;
    
    setIsProcessing(true);
    setCurrentEffect(effectType);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      setCurrentEffect('');
      return;
    }
    
    try {
      // Show processing message
      console.log(`Applying ${effectType} effect...`);
      
      // Get current image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const originalData = new Uint8ClampedArray(imageData.data);
      
      switch (effectType) {
        case 'sharpen':
          // Apply sharpening kernel
          const sharpenKernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
          ];
          applyConvolutionFilter(imageData, canvas.width, canvas.height, sharpenKernel);
          console.log('Sharpen effect applied successfully');
          break;
          
        case 'blur':
          // Apply Gaussian blur kernel
          const blurKernel = [
            1/16, 2/16, 1/16,
            2/16, 4/16, 2/16,
            1/16, 2/16, 1/16
          ];
          applyConvolutionFilter(imageData, canvas.width, canvas.height, blurKernel);
          console.log('Blur effect applied successfully');
          break;
          
        case 'edge-detect':
          // Apply edge detection kernel
          const edgeKernel = [
            -1, -1, -1,
            -1, 8, -1,
            -1, -1, -1
          ];
          applyConvolutionFilter(imageData, canvas.width, canvas.height, edgeKernel);
          console.log('Edge detection applied successfully');
          break;
          
        case 'noise-reduction':
          // Apply median filter for noise reduction
          applyMedianFilter(imageData, canvas.width, canvas.height);
          console.log('Noise reduction applied successfully');
          break;
      }
      
      // Apply the processed data back to canvas
      ctx.putImageData(imageData, 0, 0);
      
      // Update preview
      updatePreviewFromCanvas();
      
      // Save to history and finish processing
      setTimeout(() => {
        saveToHistory();
        setIsProcessing(false);
        setCurrentEffect('');
        console.log(`${effectType} effect completed and saved to history`);
      }, 100);
      
    } catch (error) {
      console.error('Error applying advanced effect:', error);
      setIsProcessing(false);
      setCurrentEffect('');
      // Show error message to user
      alert(`Error applying ${effectType} effect. Please try again.`);
    }
  };

  // Improved convolution filter helper
  const applyConvolutionFilter = (imageData: ImageData, width: number, height: number, kernel: number[]) => {
    const data = imageData.data;
    const output = new Uint8ClampedArray(data.length);
    
    // Copy original data to output
    output.set(data);
    
    const kernelSize = Math.sqrt(kernel.length);
    const half = Math.floor(kernelSize / 2);
    
    for (let y = half; y < height - half; y++) {
      for (let x = half; x < width - half; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels only
          let sum = 0;
          
          for (let ky = 0; ky < kernelSize; ky++) {
            for (let kx = 0; kx < kernelSize; kx++) {
              const pixelY = y + ky - half;
              const pixelX = x + kx - half;
              const pixelIndex = (pixelY * width + pixelX) * 4 + c;
              const kernelIndex = ky * kernelSize + kx;
              
              sum += data[pixelIndex] * kernel[kernelIndex];
            }
          }
          
          const outputIndex = (y * width + x) * 4 + c;
          output[outputIndex] = Math.max(0, Math.min(255, sum));
        }
        
        // Keep alpha channel unchanged
        const alphaIndex = (y * width + x) * 4 + 3;
        output[alphaIndex] = data[alphaIndex];
      }
    }
    
    // Copy the result back to the original data
    for (let i = 0; i < data.length; i++) {
      data[i] = output[i];
    }
  };

  // Median filter for noise reduction
  const applyMedianFilter = (imageData: ImageData, width: number, height: number) => {
    const data = imageData.data;
    const output = new Uint8ClampedArray(data.length);
    
    // Copy original data to output
    output.set(data);
    
    const getMedian = (arr: number[]) => {
      const sorted = arr.slice().sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels only
          const values: number[] = [];
          
          // Collect 3x3 neighborhood values
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const pixelIndex = ((y + dy) * width + (x + dx)) * 4 + c;
              values.push(data[pixelIndex]);
            }
          }
          
          const outputIndex = (y * width + x) * 4 + c;
          output[outputIndex] = getMedian(values);
        }
        
        // Keep alpha channel unchanged
        const alphaIndex = (y * width + x) * 4 + 3;
        output[alphaIndex] = data[alphaIndex];
      }
    }
    
    // Copy the result back to the original data
    for (let i = 0; i < data.length; i++) {
      data[i] = output[i];
    }
  };

  const manualSaveToHistory = () => {
    saveToHistory();
  };

  const toolCategories = [
  {
    name: 'Transform',
    icon: Move,
    tools: [
    { icon: RotateCw, label: 'Rotate Right', action: () => rotateImage('right') },
    { icon: RotateCcw, label: 'Rotate Left', action: () => rotateImage('left') },
        { icon: FlipHorizontal, label: 'Flip H', action: () => flipImage('horizontal') },
        { icon: FlipVertical, label: 'Flip V', action: () => flipImage('vertical') }
      ]
  },
  {
    name: 'Edit',
    icon: Crop,
    tools: [
        { icon: Crop, label: 'Crop', action: startCrop },
        { icon: Type, label: 'Add Text', action: () => document.getElementById('text-input')?.focus() },
        { icon: Filter, label: 'B&W', action: () => applyEffect('bw') },
        { icon: Sparkles, label: 'Enhance', action: () => applyEffect('enhance') }
      ]
    },
    {
      name: 'Advanced',
      icon: Settings,
      tools: [
        { icon: Sparkles, label: 'Sharpen', action: () => applyAdvancedEffect('sharpen') },
        { icon: Circle, label: 'Blur', action: () => applyAdvancedEffect('blur') },
        { icon: Square, label: 'Edge Detect', action: () => applyAdvancedEffect('edge-detect') },
        { icon: Brush, label: 'Noise Reduce', action: () => applyAdvancedEffect('noise-reduction') }
      ]
    }
  ];

  const handleSliderChange = (setter: (value: number[]) => void, value: number[]) => {
    setter(value);
    
    // Don't save to history if we're restoring from history
    if (isRestoringFromHistory) return;
    
    // Clear existing timeout
    if (sliderTimeout) {
      clearTimeout(sliderTimeout);
    }
    
    // Set new timeout to save to history after user stops adjusting
    const timeout = setTimeout(() => {
      if (!isRestoringFromHistory) {
        saveToHistory();
      }
    }, 1000);
    
    setSliderTimeout(timeout);
  };

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    if (!isRestoringFromHistory) {
      setTimeout(() => saveToHistory(), 100);
    }
  };

  const handleFontChange = (value: string) => {
    setFontFamily(value);
    if (!isRestoringFromHistory) {
      setTimeout(() => saveToHistory(), 100);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Advanced Image Editor
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Professional image editing with real-time filters, text overlays, cropping, and advanced adjustments.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Tools Panel */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-4"
            >
              {/* Upload */}
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Upload className="w-5 h-5" />
                    Upload Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                    variant="outline"
                    disabled={isProcessing}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </Button>
                </CardContent>
              </Card>

              {/* Tools */}
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5" />
                    Quick Tools
                    {isProcessing && (
                      <div className="ml-auto">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {toolCategories.map((category) => (
                    <div key={category.name}>
                      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <category.icon className="w-4 h-4" />
                        {category.name}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {category.tools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <Button
                            key={tool.label}
                            variant="outline"
                            size="sm"
                            onClick={tool.action}
                            disabled={!uploadedImage || isProcessing}
                              className="flex flex-col items-center gap-1 h-16 text-xs"
                            >
                              <Icon className="w-4 h-4" />
                              {tool.label}
                            </Button>
                          );
                      })}
                      </div>
                      {category.name !== 'Advanced' && <Separator className="mt-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Crop Controls */}
              {cropMode && (
                <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">
                      Crop Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Click and drag on the image to select crop area
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={applyCrop}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={isProcessing}
                      >
                        Apply Crop
                      </Button>
                      <Button
                        onClick={() => setCropMode(false)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={isProcessing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* History */}
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    History
                    {isRestoringFromHistory && (
                      <div className="ml-auto">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    <Badge variant="secondary" className="ml-auto">
                      {historyIndex + 1}/{editHistory.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      {isRestoringFromHistory ? 'Restoring...' : `Position: ${historyIndex + 1} of ${editHistory.length}`}
                    </div>
                    <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                        onClick={() => {
                          console.log('Undo button clicked - Current state:', { historyIndex, historyLength: editHistory.length });
                          undo();
                        }}
                        disabled={!uploadedImage || historyIndex <= 0 || isProcessing || isRestoringFromHistory}
                        className="flex-1"
                      >
                        <Undo className="w-4 h-4 mr-1" />
                      Undo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                        onClick={() => {
                          console.log('Redo button clicked - Current state:', { historyIndex, historyLength: editHistory.length });
                          redo();
                        }}
                        disabled={!uploadedImage || historyIndex >= editHistory.length - 1 || isProcessing || isRestoringFromHistory}
                        className="flex-1"
                      >
                        <Redo className="w-4 h-4 mr-1" />
                        Redo
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={manualSaveToHistory}
                      disabled={!uploadedImage || isProcessing}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save State
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Editor */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg h-[600px]">
                <CardContent className="p-6 h-full">
                  {uploadedImage ? (
                    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden relative">
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="text-sm font-medium">
                              {currentEffect ? `Applying ${currentEffect}...` : 'Processing...'}
                            </span>
                          </div>
                        </div>
                      )}
                      <canvas
                        ref={previewCanvasRef}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        className={`max-w-full max-h-full object-contain transition-all duration-200 ${
                          cropMode ? 'cursor-crosshair' : 
                          draggedText ? 'cursor-grabbing' : 
                          textOverlays.some(t => t.visible) ? 'cursor-grab' : 'cursor-default'
                        } ${isProcessing ? 'pointer-events-none' : ''}`}
                        style={{
                          transform: `scale(${zoom[0] / 100})`,
                          filter: blur[0] > 0 ? `blur(${blur[0]}px)` : 'none'
                        }}
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      
                      {/* Crop overlay */}
                      {cropMode && isDragging && (
                        <div
                          className="absolute border-2 border-blue-500 bg-blue-500/20"
                          style={{
                            left: Math.min(cropStart.x, cropEnd.x),
                            top: Math.min(cropStart.y, cropEnd.y),
                            width: Math.abs(cropEnd.x - cropStart.x),
                            height: Math.abs(cropEnd.y - cropStart.y),
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <ImageIcon className="w-20 h-20 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
                        No image selected
                      </h3>
                      <p className="text-gray-400 dark:text-gray-500 text-center">
                        Upload an image to start editing
                      </p>
                      <Button
                      onClick={() => fileInputRef.current?.click()}
                        className="mt-4"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Image
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Settings Panel */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-4"
            >
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette className="w-5 h-5" />
                    Adjustments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">Basic</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-6 mt-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Brightness: {brightness[0]}%
                        </Label>
                        <Slider
                          value={brightness}
                          onValueChange={(value) => handleSliderChange(setBrightness, value)}
                          max={200}
                          min={0}
                          step={1}
                          disabled={!uploadedImage || isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Contrast: {contrast[0]}%
                        </Label>
                        <Slider
                          value={contrast}
                          onValueChange={(value) => handleSliderChange(setContrast, value)}
                          max={200}
                          min={0}
                          step={1}
                          disabled={!uploadedImage || isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Saturation: {saturation[0]}%
                        </Label>
                        <Slider
                          value={saturation}
                          onValueChange={(value) => handleSliderChange(setSaturation, value)}
                          max={200}
                          min={0}
                          step={1}
                          disabled={!uploadedImage || isProcessing}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Filter
                        </Label>
                        <Select value={selectedFilter} onValueChange={handleFilterChange} disabled={!uploadedImage || isProcessing}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {filters.map(filter => (
                              <SelectItem key={filter.value} value={filter.value}>
                                {filter.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-6 mt-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Hue: {hue[0]}°
                        </Label>
                        <Slider
                          value={hue}
                          onValueChange={(value) => handleSliderChange(setHue, value)}
                          max={180}
                          min={-180}
                          step={1}
                          disabled={!uploadedImage || isProcessing}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Gamma: {gamma[0].toFixed(1)}
                        </Label>
                        <Slider
                          value={gamma}
                          onValueChange={(value) => handleSliderChange(setGamma, value)}
                          max={3}
                          min={0.1}
                          step={0.1}
                          disabled={!uploadedImage || isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Blur: {blur[0]}px
                        </Label>
                        <Slider
                          value={blur}
                          onValueChange={(value) => handleSliderChange(setBlur, value)}
                          max={10}
                          min={0}
                          step={0.5}
                          disabled={!uploadedImage || isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Zoom: {zoom[0]}%
                        </Label>
                        <Slider
                          value={zoom}
                          onValueChange={(value) => handleSliderChange(setZoom, value)}
                          max={300}
                          min={25}
                          step={5}
                          disabled={!uploadedImage || isProcessing}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSliderChange(setZoom, [Math.max(25, zoom[0] - 25)])}
                          disabled={!uploadedImage || zoom[0] <= 25 || isProcessing}
                          className="flex-1"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSliderChange(setZoom, [100])}
                          disabled={!uploadedImage || isProcessing}
                          className="flex-1"
                        >
                          Reset
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSliderChange(setZoom, [Math.min(300, zoom[0] + 25)])}
                          disabled={!uploadedImage || zoom[0] >= 300 || isProcessing}
                          className="flex-1"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Text Overlay */}
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Type className="w-5 h-5" />
                    Text Overlay
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Text</Label>
                    <Input
                      id="text-input"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Enter text..."
                      disabled={!uploadedImage || isProcessing}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newText.trim()) {
                          addTextOverlay();
                        }
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Size</Label>
                      <Slider
                        value={fontSize}
                        onValueChange={(value) => handleSliderChange(setFontSize, value)}
                        max={100}
                        min={12}
                        step={2}
                        disabled={!uploadedImage || isProcessing}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Color</Label>
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        disabled={!uploadedImage || isProcessing}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Font</Label>
                    <Select value={fontFamily} onValueChange={handleFontChange} disabled={!uploadedImage || isProcessing}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={addTextOverlay}
                    disabled={!uploadedImage || !newText.trim() || isProcessing}
                    className="w-full"
                  >
                    Add Text
                  </Button>

                  {/* Text Overlays List */}
                  {textOverlays.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Text Layers</Label>
                      {textOverlays.map((overlay) => (
                        <div key={overlay.id} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleTextOverlay(overlay.id)}
                            disabled={isProcessing}
                          >
                            {overlay.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <span className="flex-1 text-sm truncate">{overlay.text}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTextOverlay(overlay.id)}
                            disabled={isProcessing}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={resetToOriginal}
                    variant="outline"
                    className="w-full"
                    disabled={!uploadedImage || isProcessing}
                  >
                    Reset All
                  </Button>
                  <Button
                    onClick={downloadImage}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!uploadedImage || isProcessing}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ImageEditor;