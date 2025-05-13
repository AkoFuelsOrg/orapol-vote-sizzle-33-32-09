import React, { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  SlidersHorizontal, 
  Pencil, 
  Sliders, 
  Image as ImageIcon, 
  RotateCcw, 
  RotateCw,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface FilterOption {
  name: string;
  class: string;
  style?: React.CSSProperties;
}

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState('filters');
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const filters: FilterOption[] = [
    { name: 'Original', class: '' },
    { name: 'Grayscale', class: 'grayscale' },
    { name: 'Sepia', class: 'sepia' },
    { name: 'Vintage', class: '', style: { filter: 'sepia(50%) brightness(90%) contrast(120%)' } },
    { name: 'Cool', class: '', style: { filter: 'hue-rotate(180deg) saturate(130%)' } },
    { name: 'Warm', class: '', style: { filter: 'sepia(30%) saturate(140%) brightness(110%)' } },
    { name: 'High Contrast', class: '', style: { filter: 'contrast(150%) brightness(110%)' } },
    { name: 'Muted', class: '', style: { filter: 'saturate(70%) brightness(105%)' } },
    { name: 'Dramatic', class: '', style: { filter: 'contrast(140%) brightness(95%) saturate(120%)' } }
  ];

  // Load and draw the image when the component mounts
  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    
    image.onload = () => {
      originalImageRef.current = image;
      drawImage();
    };
  }, [imageUrl]);

  // Redraw the image whenever editing parameters change
  useEffect(() => {
    if (originalImageRef.current) {
      drawImage();
    }
  }, [brightness, contrast, saturation, selectedFilter, rotation]);

  const drawImage = () => {
    if (!originalImageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions accounting for rotation
    const img = originalImageRef.current;
    const needsSwap = rotation === 90 || rotation === 270;
    
    canvas.width = needsSwap ? img.height : img.width;
    canvas.height = needsSwap ? img.width : img.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set the origin to the center of the canvas
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Rotate the canvas
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Draw the image centered
    ctx.drawImage(
      img, 
      -img.width / 2, 
      -img.height / 2, 
      img.width, 
      img.height
    );
    
    // Restore the canvas context
    ctx.restore();
    
    // Apply brightness, contrast, and saturation
    if (brightness !== 100 || contrast !== 100 || saturation !== 100 || selectedFilter) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Apply brightness
        if (brightness !== 100) {
          data[i] = data[i] * brightness / 100;
          data[i + 1] = data[i + 1] * brightness / 100;
          data[i + 2] = data[i + 2] * brightness / 100;
        }
        
        // Apply contrast
        if (contrast !== 100) {
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          data[i] = factor * (data[i] - 128) + 128;
          data[i + 1] = factor * (data[i + 1] - 128) + 128;
          data[i + 2] = factor * (data[i + 2] - 128) + 128;
        }
        
        // Apply saturation
        if (saturation !== 100) {
          const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
          data[i] = gray * (1 - saturation / 100) + data[i] * (saturation / 100);
          data[i + 1] = gray * (1 - saturation / 100) + data[i + 1] * (saturation / 100);
          data[i + 2] = gray * (1 - saturation / 100) + data[i + 2] * (saturation / 100);
        }

        // Apply specific filter effects
        if (selectedFilter === 'Grayscale') {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = data[i + 1] = data[i + 2] = avg;
        } else if (selectedFilter === 'Sepia') {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
  };
  
  const handleSave = () => {
    if (!canvasRef.current) return;
    
    try {
      const editedImageUrl = canvasRef.current.toDataURL('image/jpeg');
      onSave(editedImageUrl);
      toast.success('Image saved successfully');
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Failed to save image');
    }
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setSelectedFilter('');
    toast.info('Image adjustments reset');
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4">
        <div className="flex justify-center mb-6 relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-[300px] object-contain rounded-lg"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter size={16} />
              <span>Filters</span>
            </TabsTrigger>
            <TabsTrigger value="adjust" className="flex items-center gap-2">
              <Sliders size={16} />
              <span>Adjust</span>
            </TabsTrigger>
            <TabsTrigger value="transform" className="flex items-center gap-2">
              <ImageIcon size={16} />
              <span>Transform</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="py-4">
            <div className="grid grid-cols-3 gap-3">
              {filters.map((filter) => (
                <div 
                  key={filter.name}
                  onClick={() => setSelectedFilter(filter.name)}
                  className={`cursor-pointer p-1 rounded-md text-center border ${
                    selectedFilter === filter.name ? 'border-primary bg-primary/10' : 'border-gray-200'
                  }`}
                >
                  <div 
                    className={`mb-2 h-16 rounded overflow-hidden ${filter.class}`}
                    style={filter.style || {}}
                  >
                    {imageUrl && (
                      <img 
                        src={imageUrl} 
                        alt={filter.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium">{filter.name}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="adjust" className="py-4 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Brightness</label>
                <span className="text-xs">{brightness}%</span>
              </div>
              <Slider 
                value={[brightness]} 
                min={30} 
                max={200} 
                step={1}
                onValueChange={(val) => setBrightness(val[0])} 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Contrast</label>
                <span className="text-xs">{contrast}%</span>
              </div>
              <Slider 
                value={[contrast]} 
                min={30} 
                max={200} 
                step={1}
                onValueChange={(val) => setContrast(val[0])} 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Saturation</label>
                <span className="text-xs">{saturation}%</span>
              </div>
              <Slider 
                value={[saturation]} 
                min={0} 
                max={200} 
                step={1}
                onValueChange={(val) => setSaturation(val[0])} 
              />
            </div>
          </TabsContent>

          <TabsContent value="transform" className="py-4 space-y-6">
            <div className="flex justify-center gap-6">
              <Button 
                onClick={handleRotateLeft} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCcw size={16} />
                <span>Rotate Left</span>
              </Button>
              <Button 
                onClick={handleRotateRight} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCw size={16} />
                <span>Rotate Right</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="pt-4 border-t flex justify-between">
        <Button variant="ghost" onClick={resetAdjustments} className="text-sm">
          Reset
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="text-sm">
            Cancel
          </Button>
          <Button onClick={handleSave} className="text-sm">
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
