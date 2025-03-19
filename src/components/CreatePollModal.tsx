
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { usePollContext } from '../context/PollContext';
import { toast } from "sonner";
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';

interface CreatePollModalProps {
  isOpen?: boolean;
  onClose: () => void;
  groupId?: string;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({ isOpen, onClose, groupId }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const { addPoll } = usePollContext();
  const { user } = useSupabase();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a poll");
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
    
    setLoading(true);
    
    try {
      // If this is a group poll, save it to the database
      if (groupId) {
        // Create the options array in the format expected by the database
        const optionsArray = validOptions.map(text => ({
          text: text,
          votes: 0
        }));
        
        // Create the complete poll object with options
        const pollData = {
          question: question,
          user_id: user.id,
          group_id: groupId,
          options: optionsArray, // This is the JSON field that the database expects
          total_votes: 0,
          comment_count: 0
        };
        
        // Insert the poll into the database
        const { data: poll, error: pollError } = await supabase
          .from('polls')
          .insert(pollData)
          .select('id')
          .single();
          
        if (pollError) throw pollError;
        
        toast.success("Poll created in group successfully");
      } else {
        // Use the context method for regular polls
        addPoll(question, validOptions);
      }
      
      setQuestion('');
      setOptions(['', '']);
      onClose();
    } catch (error: any) {
      console.error("Error creating poll:", error);
      toast.error(error.message || "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-xl shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {groupId ? "Create Group Poll" : "Create New Poll"}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
              disabled={loading}
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
                    disabled={loading}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      disabled={loading}
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
                  disabled={loading}
                >
                  <Plus size={18} className="mr-1" />
                  <span>Add Option</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="pt-2 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors btn-animate"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePollModal;
