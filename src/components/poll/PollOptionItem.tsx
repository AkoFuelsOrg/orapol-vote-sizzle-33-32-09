
import React from 'react';
import { X, Upload, Loader2 } from 'lucide-react';

interface PollOptionItemProps {
  index: number;
  text: string;
  imageUrl: string;
  totalOptions: number;
  isUploading: boolean;
  onTextChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onImageUpload: (index: number, file: File) => void;
  onRemoveImage: (index: number) => void;
}

const PollOptionItem: React.FC<PollOptionItemProps> = ({
  index,
  text,
  imageUrl,
  totalOptions,
  isUploading,
  onTextChange,
  onRemove,
  onImageUpload,
  onRemoveImage
}) => {
  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={text}
          onChange={(e) => onTextChange(index, e.target.value)}
          placeholder={`Option ${index + 1}`}
          className="flex-1 p-3 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
          maxLength={50}
          required
        />
        {totalOptions > 2 && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      {/* Option image upload */}
      <div className="mt-2">
        {imageUrl ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img 
              src={imageUrl} 
              alt={`Option ${index + 1} image`} 
              className="w-full h-32 object-cover"
            />
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center h-32 rounded-lg border border-dashed border-primary/30 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onImageUpload(index, e.target.files[0]);
                }
              }}
              disabled={isUploading}
            />
            <div className="text-center text-muted-foreground">
              {isUploading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Upload className="mx-auto h-6 w-6 mb-1" />
                  <p className="text-sm">Click to upload image</p>
                </>
              )}
            </div>
          </label>
        )}
      </div>
    </div>
  );
};

export default PollOptionItem;
