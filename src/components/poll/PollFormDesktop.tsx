
import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import PollOptionItem from './PollOptionItem';
import PollImageUpload from './PollImageUpload';

interface PollFormDesktopProps {
  question: string;
  setQuestion: (question: string) => void;
  options: Array<{ text: string; imageUrl: string }>;
  imageUrl: string;
  isSubmitting: boolean;
  uploadingPollImage: boolean;
  uploadingOptionImage: number | null;
  handleAddOption: () => void;
  handleRemoveOption: (index: number) => void;
  handleOptionChange: (index: number, value: string) => void;
  handleOptionImageChange: (index: number, imageUrl: string) => void;
  handleUploadPollImage: (file: File) => Promise<void>;
  handleUploadOptionImage: (index: number, file: File) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

const PollFormDesktop: React.FC<PollFormDesktopProps> = ({
  question,
  setQuestion,
  options,
  imageUrl,
  isSubmitting,
  uploadingPollImage,
  uploadingOptionImage,
  handleAddOption,
  handleRemoveOption,
  handleOptionChange,
  handleOptionImageChange,
  handleUploadPollImage,
  handleUploadOptionImage,
  handleSubmit
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex gap-6">
        {/* Question field - takes up 2/3 of the space */}
        <div className="w-2/3">
          <label htmlFor="question" className="block text-sm font-medium mb-2">
            Your Question
          </label>
          <input
            id="question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to ask?"
            className="w-full p-3 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
            maxLength={100}
            required
          />
        </div>
        
        {/* Poll image upload - takes up 1/3 of the space */}
        <div className="w-1/3">
          <label className="block text-sm font-medium mb-2">
            Add Poll Image (Optional)
          </label>
          <PollImageUpload
            imageUrl={imageUrl}
            isUploading={uploadingPollImage}
            onUpload={handleUploadPollImage}
            onRemove={() => handleOptionImageChange(-1, '')}
          />
        </div>
      </div>
      
      {/* Options section - full width */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Options
        </label>
        <div className="grid grid-cols-2 gap-4">
          {options.map((option, index) => (
            <PollOptionItem
              key={index}
              index={index}
              text={option.text}
              imageUrl={option.imageUrl}
              totalOptions={options.length}
              isUploading={uploadingOptionImage === index}
              onTextChange={handleOptionChange}
              onRemove={handleRemoveOption}
              onImageUpload={handleUploadOptionImage}
              onRemoveImage={() => handleOptionImageChange(index, '')}
            />
          ))}
          
          <div className="flex flex-col gap-4">
            {options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="h-full min-h-[156px] p-3 flex items-center justify-center border border-dashed border-primary/30 rounded-lg text-primary/70 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="text-center">
                  <Plus size={24} className="mx-auto mb-2" />
                  <span>Add Option</span>
                </div>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full p-3.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium btn-animate disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Creating Poll...
                </>
              ) : (
                'Create Poll'
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PollFormDesktop;
