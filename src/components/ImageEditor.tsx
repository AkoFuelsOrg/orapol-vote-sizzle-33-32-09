import React, { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  filter?: string; // Adding this property to handle custom filters
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
    { name: 'Vintage', class: '', style: { filter: 'sepia(50%) brightness(90%) contrast(120%)' }, filter: 'sepia(50%) brightness(90%) contrast(120%)' },
    { name: 'Cool', class: '', style: { filter: 'hue-rotate(180deg) saturate(130%)' }, filter: 'hue-rotate(180deg) saturate(130%)' },
    { name: 'Warm', class: '', style: { filter: 'sepia(30%) saturate(140%) brightness(110%)' }, filter: 'sepia(30%) saturate(140%) brightness(110%)' },
    { name: 'High Contrast', class: '', style: { filter: 'contrast(150%) brightness(110%)' }, filter: 'contrast(150%) brightness(110%)' },
    { name: 'Muted', class: '', style: { filter: 'saturate(70%) brightness(105%)' }, filter: 'saturate(70%) brightness(105%)' },
    { name: 'Dramatic', class: '', style: { filter: 'contrast(140%) brightness(95%) saturate(120%)' }, filter: 'contrast(140%) brightness(95%) saturate(120%)' },
    // New filters
    { name: 'Noir', class: '', style: { filter: 'grayscale(100%) contrast(120%) brightness(90%)' }, filter: 'grayscale(100%) contrast(120%) brightness(90%)' },
    { name: 'Vibrant', class: '', style: { filter: 'saturate(180%) brightness(110%) contrast(110%)' }, filter: 'saturate(180%) brightness(110%) contrast(110%)' },
    { name: 'Pastel', class: '', style: { filter: 'saturate(60%) brightness(130%) contrast(90%)' }, filter: 'saturate(60%) brightness(130%) contrast(90%)' },
    { name: 'Retro', class: '', style: { filter: 'sepia(60%) hue-rotate(-30deg) saturate(140%)' }, filter: 'sepia(60%) hue-rotate(-30deg) saturate(140%)' },
    { name: 'Purple', class: '', style: { filter: 'hue-rotate(270deg) saturate(130%) brightness(110%)' }, filter: 'hue-rotate(270deg) saturate(130%) brightness(110%)' },
    { name: 'Ocean', class: '', style: { filter: 'hue-rotate(190deg) saturate(160%) brightness(105%)' }, filter: 'hue-rotate(190deg) saturate(160%) brightness(105%)' },
    { name: 'Sunset', class: '', style: { filter: 'hue-rotate(-20deg) saturate(150%) contrast(110%) brightness(110%)' }, filter: 'hue-rotate(-20deg) saturate(150%) contrast(110%) brightness(110%)' },
    { name: 'Forest', class: '', style: { filter: 'hue-rotate(90deg) saturate(150%) brightness(95%)' }, filter: 'hue-rotate(90deg) saturate(150%) brightness(95%)' },
    { name: 'Faded', class: '', style: { filter: 'contrast(85%) brightness(110%) saturate(75%)' }, filter: 'contrast(85%) brightness(110%) saturate(75%)' }
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
        } else if (selectedFilter === 'Vintage') {
          // Vintage: sepia effect + adjusted brightness and contrast
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Apply sepia at 50%
          data[i] = Math.min(255, (r * (1 - 0.5)) + (r * 0.393 + g * 0.769 + b * 0.189) * 0.5);
          data[i + 1] = Math.min(255, (g * (1 - 0.5)) + (r * 0.349 + g * 0.686 + b * 0.168) * 0.5);
          data[i + 2] = Math.min(255, (b * (1 - 0.5)) + (r * 0.272 + g * 0.534 + b * 0.131) * 0.5);
          
          // Reduce brightness to 90%
          data[i] *= 0.9;
          data[i + 1] *= 0.9;
          data[i + 2] *= 0.9;
          
          // Increase contrast by 20%
          const factor = (259 * (120 + 255)) / (255 * (259 - 120));
          data[i] = factor * (data[i] - 128) + 128;
          data[i + 1] = factor * (data[i + 1] - 128) + 128;
          data[i + 2] = factor * (data[i + 2] - 128) + 128;
        } else if (selectedFilter === 'Cool') {
          // Cool: hue-rotate and increased saturation
          // Convert RGB to HSL, modify, then back to RGB
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newH = (h + 180) % 360; // hue-rotate 180 degrees
          const newS = Math.min(100, s * 1.3); // saturate 130%
          const [r, g, b] = hslToRgb(newH, newS, l);
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        } else if (selectedFilter === 'Warm') {
          // Warm: slight sepia, increased saturation and brightness
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Apply sepia at 30%
          data[i] = Math.min(255, (r * 0.7) + (r * 0.393 + g * 0.769 + b * 0.189) * 0.3);
          data[i + 1] = Math.min(255, (g * 0.7) + (r * 0.349 + g * 0.686 + b * 0.168) * 0.3);
          data[i + 2] = Math.min(255, (b * 0.7) + (r * 0.272 + g * 0.534 + b * 0.131) * 0.3);
          
          // Increase brightness to 110%
          data[i] = Math.min(255, data[i] * 1.1);
          data[i + 1] = Math.min(255, data[i + 1] * 1.1);
          data[i + 2] = Math.min(255, data[i + 2] * 1.1);
          
          // Increase saturation
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newS = Math.min(100, s * 1.4); // Increase saturation by 40%
          const [newR, newG, newB] = hslToRgb(h, newS, l);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        } else if (selectedFilter === 'High Contrast') {
          // High contrast and slightly increased brightness
          const factor = (259 * (150 + 255)) / (255 * (259 - 150));
          data[i] = factor * (data[i] - 128) + 128;
          data[i + 1] = factor * (data[i + 1] - 128) + 128;
          data[i + 2] = factor * (data[i + 2] - 128) + 128;
          
          // Increase brightness to 110%
          data[i] = Math.min(255, data[i] * 1.1);
          data[i + 1] = Math.min(255, data[i + 1] * 1.1);
          data[i + 2] = Math.min(255, data[i + 2] * 1.1);
        } else if (selectedFilter === 'Muted') {
          // Reduce saturation to 70% and slightly increase brightness
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newS = s * 0.7; // Reduce saturation to 70%
          const newL = Math.min(100, l * 1.05); // Increase brightness slightly
          const [newR, newG, newB] = hslToRgb(h, newS, newL);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        } else if (selectedFilter === 'Dramatic') {
          // Dramatic: higher contrast, slightly darker, more saturated
          // First increase contrast
          const factor = (259 * (140 + 255)) / (255 * (259 - 140));
          data[i] = factor * (data[i] - 128) + 128;
          data[i + 1] = factor * (data[i + 1] - 128) + 128;
          data[i + 2] = factor * (data[i + 2] - 128) + 128;
          
          // Reduce brightness slightly to 95%
          data[i] *= 0.95;
          data[i + 1] *= 0.95;
          data[i + 2] *= 0.95;
          
          // Increase saturation
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newS = Math.min(100, s * 1.2); // Increase saturation by 20%
          const [newR, newG, newB] = hslToRgb(h, newS, l);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        } 
        // New filter implementations
        else if (selectedFilter === 'Noir') {
          // Noir: high contrast grayscale with darker blacks
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = data[i + 1] = data[i + 2] = avg;
          
          // Apply high contrast
          const factor = (259 * (120 + 255)) / (255 * (259 - 120));
          data[i] = factor * (data[i] - 128) + 128;
          
          // Reduce brightness to 90%
          data[i] *= 0.9;
          data[i + 1] *= 0.9;
          data[i + 2] *= 0.9;
        } else if (selectedFilter === 'Vibrant') {
          // Vibrant: high saturation and brightness
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newS = Math.min(100, s * 1.8); // Increase saturation by 80%
          const newL = Math.min(100, l * 1.1); // Increase lightness by 10%
          const [newR, newG, newB] = hslToRgb(h, newS, newL);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
          
          // Add a bit of contrast
          const factor = (259 * (110 + 255)) / (255 * (259 - 110));
          data[i] = factor * (data[i] - 128) + 128;
          data[i + 1] = factor * (data[i + 1] - 128) + 128;
          data[i + 2] = factor * (data[i + 2] - 128) + 128;
        } else if (selectedFilter === 'Pastel') {
          // Pastel: lower saturation, higher brightness, lower contrast
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newS = s * 0.6; // Reduce saturation to 60%
          const newL = Math.min(100, l * 1.3); // Increase lightness by 30%
          const [newR, newG, newB] = hslToRgb(h, newS, newL);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
          
          // Lower contrast
          const factor = (259 * (90 + 255)) / (255 * (259 - 90));
          data[i] = factor * (data[i] - 128) + 128;
          data[i + 1] = factor * (data[i + 1] - 128) + 128;
          data[i + 2] = factor * (data[i + 2] - 128) + 128;
        } else if (selectedFilter === 'Retro') {
          // Retro: sepia-like with color shift and vintage look
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // First apply sepia at 60%
          data[i] = Math.min(255, (r * 0.4) + (r * 0.393 + g * 0.769 + b * 0.189) * 0.6);
          data[i + 1] = Math.min(255, (g * 0.4) + (r * 0.349 + g * 0.686 + b * 0.168) * 0.6);
          data[i + 2] = Math.min(255, (b * 0.4) + (r * 0.272 + g * 0.534 + b * 0.131) * 0.6);
          
          // Then apply hue shift to add a vintage feel
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newH = (h - 30 + 360) % 360; // Shift hue by -30 degrees
          const newS = Math.min(100, s * 1.4); // Increase saturation
          const [newR, newG, newB] = hslToRgb(newH, newS, l);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        } else if (selectedFilter === 'Purple') {
          // Purple: hue rotation to emphasize purple tones
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newH = (h + 270) % 360; // Shift to purple
          const newS = Math.min(100, s * 1.3); // Increase saturation
          const newL = Math.min(100, l * 1.1); // Increase brightness slightly
          const [newR, newG, newB] = hslToRgb(newH, newS, newL);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        } else if (selectedFilter === 'Ocean') {
          // Ocean: blue-green hue shift with vibrant saturation
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newH = (h + 190) % 360; // Shift to blue-green
          const newS = Math.min(100, s * 1.6); // Increase saturation
          const newL = Math.min(100, l * 1.05); // Slight brightness boost
          const [newR, newG, newB] = hslToRgb(newH, newS, newL);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        } else if (selectedFilter === 'Sunset') {
          // Sunset: orangish-red hue shift with high saturation
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newH = (h - 20 + 360) % 360; // Shift toward orange-red
          const newS = Math.min(100, s * 1.5); // Increase saturation
          const newL = Math.min(100, l * 1.1); // Increase brightness slightly
          const [newR, newG, newB] = hslToRgb(newH, newS, newL);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
          
          // Add a bit of contrast
          const factor = (259 * (110 + 255)) / (255 * (259 - 110));
          data[i] = factor * (data[i] - 128) + 128;
          data[i + 1] = factor * (data[i + 1] - 128) + 128;
          data[i + 2] = factor * (data[i + 2] - 128) + 128;
        } else if (selectedFilter === 'Forest') {
          // Forest: green-shifted with lower brightness
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newH = (h + 90) % 360; // Shift toward green
          const newS = Math.min(100, s * 1.5); // Increase saturation
          const newL = l * 0.95; // Slightly decrease brightness
          const [newR, newG, newB] = hslToRgb(newH, newS, newL);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        } else if (selectedFilter === 'Faded') {
          // Faded: low contrast, slightly higher brightness, lower saturation
          // Lower contrast
          const contrastFactor = (259 * (85 + 255)) / (255 * (259 - 85));
          data[i] = contrastFactor * (data[i] - 128) + 128;
          data[i + 1] = contrastFactor * (data[i + 1] - 128) + 128;
          data[i + 2] = contrastFactor * (data[i + 2] - 128) + 128;
          
          // Increase brightness to 110%
          data[i] = Math.min(255, data[i] * 1.1);
          data[i + 1] = Math.min(255, data[i + 1] * 1.1);
          data[i + 2] = Math.min(255, data[i + 2] * 1.1);
          
          // Lower saturation
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newS = s * 0.75; // Reduce saturation to 75%
          const [newR, newG, newB] = hslToRgb(h, newS, l);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
  };
  
  // Helper function: Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    
    return [h, s * 100, l * 100];
  };
  
  // Helper function: Convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }
    
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
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
            <ScrollArea className="h-[280px] pr-4">
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
            </ScrollArea>
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
