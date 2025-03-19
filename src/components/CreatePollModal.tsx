
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Plus, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '@/context/SupabaseContext';

interface CreatePollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPollCreated: () => void;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({ 
  open, 
  onOpenChange,
  onPollCreated
}) => {
  const { user } = useSupabase();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length >= 6) {
      toast.error("Maximum 6 options allowed");
      return;
    }
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("Minimum 2 options required");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to create a poll");
      return;
    }
    
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }
    
    const validOptions = options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('polls')
        .insert({
          question,
          options: validOptions,
          user_id: user.id,
          total_votes: 0
        });
        
      if (error) throw error;
      
      // Reset form
      setQuestion('');
      setOptions(['', '']);
      onOpenChange(false);
      onPollCreated();
      
      toast.success("Poll created successfully");
    } catch (error: any) {
      console.error('Error creating poll:', error);
      toast.error(error.message || "Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Poll</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium mb-1">
              Question
            </label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              className="w-full p-2.5 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
              maxLength={100}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Options
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 p-2.5 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                    maxLength={50}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="w-full p-2 flex items-center justify-center border border-dashed border-primary/30 rounded-lg text-primary/70 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Plus size={18} className="mr-1" />
                  <span>Add Option</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !question.trim() || options.filter(o => o.trim()).length < 2}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creating..." : "Create Poll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePollModal;
