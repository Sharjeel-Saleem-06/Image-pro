import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { fabric } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Layout from '@/components/Layout';
import AuthRequiredModal from '@/components/AuthRequiredModal';
import { useAuthRequired } from '@/hooks/useAuthRequired';
import { trackActivity } from '@/lib/activityTracking';
import {
  Upload,
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Type,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Move,
  MousePointer,
  Pen,
  Square,
  Circle,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  Image as ImageIcon,
  Palette,
  Sliders,
  Sparkles,
  Save
} from 'lucide-react';

interface CanvasObject {
  id: string;
  type: string;
  visible: boolean;
  name: string;
}

const ImageEditorNew = () => {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<any[]>([]);
  const historyStepRef = useRef<number>(0);

  // State
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Adjustments
  const [brightness, setBrightness] = useState([0]);
  const [contrast, setContrast] = useState([0]);
  const [saturation, setSaturation] = useState([0]);
  const [blur, setBlur] = useState([0]);
  
  // Text properties
  const [textValue, setTextValue] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState([32]);
  const [fontFamily, setFontFamily] = useState('Arial');
  
  // Drawing properties
  const [brushSize, setBrushSize] = useState([5]);
  const [brushColor, setBrushColor] = useState('#000000');
  
  // Zoom
  const [zoom, setZoom] = useState(100);

  const { showAuthModal, setShowAuthModal, requireAuth } = useAuthRequired();

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f0f0f0',
      preserveObjectStacking: true,
      selection: selectedTool === 'select',
      isDrawingMode: selectedTool === 'draw'
    });

    fabricCanvasRef.current = canvas;

    // Set up drawing brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize[0];
    }

    // Canvas event listeners
    canvas.on('object:added', () => saveHistory());
    canvas.on('object:modified', () => saveHistory());
    canvas.on('object:removed', () => saveHistory());
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => setSelectedObject(null));

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update tool mode
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.selection = selectedTool === 'select';
    canvas.isDrawingMode = selectedTool === 'draw';
    
    if (selectedTool === 'draw' && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize[0];
    }

    canvas.defaultCursor = selectedTool === 'move' ? 'grab' : 'default';
  }, [selectedTool, brushColor, brushSize]);

  // Handle selection
  const handleSelection = (e: any) => {
    if (e.selected && e.selected.length > 0) {
      const obj = e.selected[0];
      setSelectedObject(obj.id || null);
    }
  };

  // Save history for undo/redo
  const saveHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = canvas.toJSON(['id', 'name']);
    historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    historyRef.current.push(json);
    historyStepRef.current = historyRef.current.length - 1;

    setCanUndo(historyStepRef.current > 0);
    setCanRedo(false);
    updateObjectsList();
  }, []);

  // Undo
  const undo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyStepRef.current === 0) return;

    historyStepRef.current--;
    const state = historyRef.current[historyStepRef.current];
    
    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      setCanUndo(historyStepRef.current > 0);
      setCanRedo(true);
      updateObjectsList();
    });
  };

  // Redo
  const redo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyStepRef.current >= historyRef.current.length - 1) return;

    historyStepRef.current++;
    const state = historyRef.current[historyStepRef.current];
    
    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      setCanUndo(true);
      setCanRedo(historyStepRef.current < historyRef.current.length - 1);
      updateObjectsList();
    });
  };

  // Update objects list
  const updateObjectsList = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objs: CanvasObject[] = canvas.getObjects().map((obj: any, index) => ({
      id: obj.id || `obj-${index}`,
      type: obj.type || 'unknown',
      visible: obj.visible !== false,
      name: obj.name || `Layer ${index + 1}`
    }));

    setObjects(objs);
  };

  // Upload and load image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    // Auth check
    const canProceed = await requireAuth();
    if (!canProceed) return;

    setUploadedImage(file);
    const canvas = fabricCanvasRef.current;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target?.result as string, (img) => {
        // Scale image to fit canvas
        const scale = Math.min(
          canvas.width! / img.width!,
          canvas.height! / img.height!,
          1
        );

        img.scale(scale);
        img.set({
          left: (canvas.width! - img.width! * scale) / 2,
          top: (canvas.height! - img.height! * scale) / 2,
          selectable: false,
          evented: false,
          id: 'background-image',
          name: 'Background Image'
        });

        canvas.clear();
        canvas.add(img);
        canvas.sendToBack(img);
        canvas.renderAll();
        
        setImageLoaded(true);
        saveHistory();
      });
    };
    reader.readAsDataURL(file);
  };

  // Apply filter
  const applyFilter = (filterType: string, value: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const bgImage = canvas.getObjects().find((obj: any) => obj.id === 'background-image');
    if (!bgImage || bgImage.type !== 'image') return;

    const img = bgImage as fabric.Image;
    
    // Clear existing filters of same type
    if (img.filters) {
      img.filters = img.filters.filter((f: any) => {
        const typeMap: any = {
          brightness: 'Brightness',
          contrast: 'Contrast',
          saturation: 'Saturation',
          blur: 'Blur'
        };
        return f.type !== typeMap[filterType];
      });
    } else {
      img.filters = [];
    }

    // Add new filter
    switch (filterType) {
      case 'brightness':
        if (value !== 0) {
          img.filters.push(new fabric.Image.filters.Brightness({ brightness: value / 100 }));
        }
        break;
      case 'contrast':
        if (value !== 0) {
          img.filters.push(new fabric.Image.filters.Contrast({ contrast: value / 100 }));
        }
        break;
      case 'saturation':
        if (value !== 0) {
          img.filters.push(new fabric.Image.filters.Saturation({ saturation: value / 100 }));
        }
        break;
      case 'blur':
        if (value > 0) {
          img.filters.push(new fabric.Image.filters.Blur({ blur: value / 100 }));
        }
        break;
    }

    img.applyFilters();
    canvas.renderAll();
    saveHistory();
  };

  // Transform functions
  const rotateImage = (direction: 'left' | 'right') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const bgImage = canvas.getObjects().find((obj: any) => obj.id === 'background-image');
    if (!bgImage) return;

    const currentAngle = bgImage.angle || 0;
    const newAngle = direction === 'right' ? currentAngle + 90 : currentAngle - 90;
    bgImage.rotate(newAngle);
    canvas.renderAll();
    saveHistory();
  };

  const flipImage = (direction: 'horizontal' | 'vertical') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const bgImage = canvas.getObjects().find((obj: any) => obj.id === 'background-image');
    if (!bgImage) return;

    if (direction === 'horizontal') {
      bgImage.set('flipX', !bgImage.flipX);
    } else {
      bgImage.set('flipY', !bgImage.flipY);
    }
    canvas.renderAll();
    saveHistory();
  };

  // Add text
  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !textValue.trim()) return;

    const text = new fabric.IText(textValue, {
      left: canvas.width! / 2 - 100,
      top: canvas.height! / 2,
      fontSize: fontSize[0],
      fill: textColor,
      fontFamily: fontFamily,
      id: `text-${Date.now()}`,
      name: `Text: ${textValue.substring(0, 20)}`
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setTextValue('');
    saveHistory();
  };

  // Add shape
  const addShape = (shape: 'rect' | 'circle') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let obj: fabric.Object;

    if (shape === 'rect') {
      obj = new fabric.Rect({
        left: canvas.width! / 2 - 50,
        top: canvas.height! / 2 - 50,
        width: 100,
        height: 100,
        fill: brushColor,
        stroke: '#000',
        strokeWidth: 2,
        id: `rect-${Date.now()}`,
        name: 'Rectangle'
      });
    } else {
      obj = new fabric.Circle({
        left: canvas.width! / 2 - 50,
        top: canvas.height! / 2 - 50,
        radius: 50,
        fill: brushColor,
        stroke: '#000',
        strokeWidth: 2,
        id: `circle-${Date.now()}`,
        name: 'Circle'
      });
    }

    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
    saveHistory();
  };

  // Delete selected
  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach(obj => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    saveHistory();
  };

  // Toggle object visibility
  const toggleObjectVisibility = (id: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const obj = canvas.getObjects().find((o: any) => o.id === id);
    if (obj) {
      obj.set('visible', !obj.visible);
      canvas.renderAll();
      updateObjectsList();
    }
  };

  // Download result
  const downloadResult = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2 // 2x resolution
    });

    const link = document.createElement('a');
    link.download = `edited-${uploadedImage?.name || 'image'}.png`;
    link.href = dataURL;
    link.click();

    // Track activity
    await trackActivity('image_edited', {
      objectsCount: canvas.getObjects().length,
      hasText: canvas.getObjects().some((o: any) => o.type === 'i-text'),
      hasShapes: canvas.getObjects().some((o: any) => ['rect', 'circle'].includes(o.type)),
      success: true
    }).catch(console.warn);
  };

  // Zoom functions
  const handleZoom = (delta: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const newZoom = Math.max(10, Math.min(zoom + delta, 200));
    setZoom(newZoom);
    canvas.setZoom(newZoom / 100);
    canvas.renderAll();
  };

  return (
    <Layout>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Pro Image Editor
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Professional canvas-based editor with layers, filters, and more
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT SIDEBAR - Tools */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {!imageLoaded ? (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                ) : (
                  <>
                    {/* Tool Selection */}
                    <div className="space-y-2">
                      <Label>Select Tool</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={selectedTool === 'select' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTool('select')}
                        >
                          <MousePointer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedTool === 'move' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTool('move')}
                        >
                          <Move className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedTool === 'draw' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTool('draw')}
                        >
                          <Pen className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedTool === 'text' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTool('text')}
                        >
                          <Type className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <Label>Transform</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rotateImage('left')}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rotateImage('right')}
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => flipImage('horizontal')}
                        >
                          <FlipHorizontal className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => flipImage('vertical')}
                        >
                          <FlipVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Shapes */}
                    <div className="space-y-2">
                      <Label>Add Shapes</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addShape('rect')}
                        >
                          <Square className="w-4 h-4 mr-1" />
                          Rect
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addShape('circle')}
                        >
                          <Circle className="w-4 h-4 mr-1" />
                          Circle
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* CENTER - Canvas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Canvas</CardTitle>
                  {imageLoaded && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={undo}
                        disabled={!canUndo}
                      >
                        <Undo className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={redo}
                        disabled={!canRedo}
                      >
                        <Redo className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleZoom(-10)}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <Badge variant="outline">{zoom}%</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleZoom(10)}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={deleteSelected}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-green-600 to-blue-600"
                        size="sm"
                        onClick={downloadResult}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <canvas ref={canvasRef} />
                </div>
              </CardContent>
            </Card>

            {/* RIGHT SIDEBAR - Properties */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="w-5 h-5" />
                  Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <Tabs defaultValue="adjustments" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="adjustments">Adjust</TabsTrigger>
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="layers">Layers</TabsTrigger>
                    </TabsList>

                    <TabsContent value="adjustments" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Brightness</Label>
                        <Slider
                          value={brightness}
                          onValueChange={(v) => {
                            setBrightness(v);
                            applyFilter('brightness', v[0]);
                          }}
                          min={-100}
                          max={100}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Contrast</Label>
                        <Slider
                          value={contrast}
                          onValueChange={(v) => {
                            setContrast(v);
                            applyFilter('contrast', v[0]);
                          }}
                          min={-100}
                          max={100}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Saturation</Label>
                        <Slider
                          value={saturation}
                          onValueChange={(v) => {
                            setSaturation(v);
                            applyFilter('saturation', v[0]);
                          }}
                          min={-100}
                          max={100}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Blur</Label>
                        <Slider
                          value={blur}
                          onValueChange={(v) => {
                            setBlur(v);
                            applyFilter('blur', v[0]);
                          }}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Text Content</Label>
                        <Input
                          value={textValue}
                          onChange={(e) => setTextValue(e.target.value)}
                          placeholder="Enter text..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Font Size</Label>
                        <Slider
                          value={fontSize}
                          onValueChange={setFontSize}
                          min={12}
                          max={120}
                          step={1}
                        />
                        <div className="text-sm text-gray-500">{fontSize[0]}px</div>
                      </div>

                      <div className="space-y-2">
                        <Label>Font Family</Label>
                        <Select value={fontFamily} onValueChange={setFontFamily}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier">Courier</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                            <SelectItem value="Impact">Impact</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Color</Label>
                        <Input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                        />
                      </div>

                      <Button onClick={addText} className="w-full">
                        <Type className="w-4 h-4 mr-2" />
                        Add Text
                      </Button>
                    </TabsContent>

                    <TabsContent value="layers" className="space-y-2 mt-4">
                      {objects.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <Layers className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>No layers yet</p>
                        </div>
                      ) : (
                        objects.map((obj) => (
                          <div
                            key={obj.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {obj.type}
                              </Badge>
                              <span className="text-sm truncate">{obj.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleObjectVisibility(obj.id)}
                            >
                              {obj.visible ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ImageEditorNew;

