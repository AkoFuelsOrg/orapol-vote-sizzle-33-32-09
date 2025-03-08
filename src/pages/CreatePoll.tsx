
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { usePollContext } from '../context/PollContext';
import Header from '../components/Header';

const CreatePoll: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const { addPoll } = usePollContext();
  const navigate = useNavigate();
  
  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = options.filter(opt => opt.trim().length > 0);
    if (question.trim() && validOptions.length >= 2) {
      addPoll(question, validOptions);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20 px-4 max-w-lg mx-auto pb-20">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold">Create Poll</h2>
          <p className="text-muted-foreground">Ask a question and collect opinions</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
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
            
            <div>
              <label className="block text-sm font-medium mb-2">
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
                      className="flex-1 p-3 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                      maxLength={50}
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="p-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
                
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="w-full p-3 flex items-center justify-center border border-dashed border-primary/30 rounded-lg text-primary/70 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Plus size={18} className="mr-1.5" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                className="w-full p-3.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium btn-animate"
              >
                Create Poll
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreatePoll;
