
import React, { useState, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Slider } from './ui/slider';
import { X, ZoomIn, Image } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  isOpen: boolean;
  aspectRatio?: number;
  onSkipCropping?: (imageUrl: string) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ImageCropper: React.FC<ImageCropperProps> = ({ 
  imageUrl, 
  onCrop, 
  onCancel, 
  isOpen,
  aspectRatio = 16 / 9,
  onSkipCropping
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [zoom, setZoom] = useState([1]);
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
    setImgRef(e.currentTarget);
  }, [aspectRatio]);

  const handleZoomChange = (value: number[]) => {
    setZoom(value);
    if (imgRef) {
      imgRef.style.transform = `scale(${value[0]})`;
    }
  };

  const handleResetZoom = () => {
    setZoom([1]);
    if (imgRef) {
      imgRef.style.transform = 'scale(1)';
    }
  };

  const handleCropImage = () => {
    if (!completedCrop || !imgRef) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = imgRef.naturalWidth / imgRef.width;
    const scaleY = imgRef.naturalHeight / imgRef.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    // First, save the current transformation matrix
    ctx.save();
    
    // Draw cropped image
    ctx.drawImage(
      imgRef,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );
    
    // Restore the transform
    ctx.restore();

    canvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleSkipCropping = () => {
    if (onSkipCropping) {
      // Create a blob from the original image URL to maintain the same workflow
      fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
          onSkipCropping(imageUrl);
        })
        .catch(error => {
          console.error('Error fetching image for skip cropping:', error);
          // Fallback to just passing the URL
          onSkipCropping(imageUrl);
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onCancel();
    }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="relative mt-4">
          <div className="overflow-hidden transition-all max-h-[60vh] flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentageCrop) => setCrop(percentageCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              className="max-h-full object-contain"
            >
              <img
                src={imageUrl}
                onLoad={onImageLoad}
                className="transition-transform duration-200 max-h-[60vh] object-contain"
                style={{ transformOrigin: 'center' }}
              />
            </ReactCrop>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <ZoomIn size={20} className="text-muted-foreground" />
            <div className="flex-1">
              <Slider
                value={zoom}
                min={0.5}
                max={3}
                step={0.1}
                onValueChange={handleZoomChange}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetZoom}
              className="ml-2"
            >
              Reset
            </Button>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          
          {onSkipCropping && (
            <Button 
              variant="outline" 
              onClick={handleSkipCropping}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <Image className="mr-2 h-4 w-4" />
              Use Original
            </Button>
          )}
          
          <Button onClick={handleCropImage} className="bg-primary text-primary-foreground">
            Apply Crop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
