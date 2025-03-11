
import React from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface PollImageUploadProps {
  imageUrl: string;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
  height?: string;
}

const PollImageUpload: React.FC<PollImageUploadProps> = ({
  imageUrl,
  isUploading,
  onUpload,
  onRemove,
  height = 'h-[106px]'
}) => {
  return (
    <>
      {imageUrl ? (
        <div className={`relative rounded-lg overflow-hidden border border-border ${height}`}>
          <img 
            src={imageUrl} 
            alt="Poll image preview" 
            className="w-full h-full object-cover"
            onError={() => {
              toast.error("Invalid image");
              onRemove();
            }}
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className={`flex items-center justify-center ${height} rounded-lg border border-dashed border-primary/30 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors`}>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUpload(e.target.files[0]);
              }
            }}
            disabled={isUploading}
          />
          <div className="text-center text-muted-foreground">
            {isUploading ? (
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            ) : (
              <>
                <Upload className="mx-auto h-8 w-8 mb-1" />
                <p className="text-sm">Click to upload poll image</p>
              </>
            )}
          </div>
        </label>
      )}
    </>
  );
};

export default PollImageUpload;
