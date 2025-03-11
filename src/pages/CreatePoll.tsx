
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, ImagePlus, Loader2, Upload } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import Header from '../components/Header';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { PollOption } from '../lib/types';
import { Json } from '@/integrations/supabase/types';
import { useBreakpoint } from '../hooks/use-mobile';

interface OptionWithImage {
  text: string;
  imageUrl: string;
}

const CreatePoll: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<OptionWithImage[]>([
    { text: '', imageUrl: '' },
    { text: '', imageUrl: '' }
  ]);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPollImage, setUploadingPollImage] = useState(false);
  const [uploadingOptionImage, setUploadingOptionImage] = useState<number | null>(null);
  const { user } = useSupabase();
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();
  
  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { text: '', imageUrl: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text: value };
    setOptions(newOptions);
  };

  const handleOptionImageChange = (index: number, imageUrl: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], imageUrl };
    setOptions(newOptions);
  };

  const handleUploadPollImage = async (file: File) => {
    if (!user) {
      toast.error("You must be logged in to upload images");
      return;
    }

    try {
      setUploadingPollImage(true);
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
      
      console.log('Attempting to upload to poll_images bucket, filepath:', filePath);
      
      const { error: uploadError, data } = await supabase.storage
        .from('poll_images')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) {
        console.error('Error details:', uploadError);
        throw uploadError;
      }
      
      const { data: urlData } = supabase.storage
        .from('poll_images')
        .getPublicUrl(filePath);
        
      console.log('Upload successful, public URL:', urlData.publicUrl);
      setImageUrl(urlData.publicUrl);
      toast.success("Poll image uploaded successfully");
    } catch (error: any) {
      console.error('Error uploading poll image:', error);
      toast.error(error.message || "Error uploading image");
    } finally {
      setUploadingPollImage(false);
    }
  };

  const handleUploadOptionImage = async (index: number, file: File) => {
    if (!user) {
      toast.error("You must be logged in to upload images");
      return;
    }

    try {
      setUploadingOptionImage(index);
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
      
      console.log('Attempting to upload to option_images bucket, filepath:', filePath);
      
      const { error: uploadError, data } = await supabase.storage
        .from('option_images')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) {
        console.error('Error details:', uploadError);
        throw uploadError;
      }
      
      const { data: urlData } = supabase.storage
        .from('option_images')
        .getPublicUrl(filePath);
      
      console.log('Upload successful, public URL:', urlData.publicUrl);
      handleOptionImageChange(index, urlData.publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || "Error uploading image");
    } finally {
      setUploadingOptionImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = options.filter(opt => opt.text.trim().length > 0);
    if (!question.trim() || validOptions.length < 2) {
      toast.error("Please provide a question and at least two options");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create a poll");
      navigate('/auth');
      return;
    }

    try {
      setIsSubmitting(true);

      const formattedOptions: PollOption[] = validOptions.map(opt => ({
        id: uuidv4(),
        text: opt.text.trim(),
        votes: 0,
        imageUrl: opt.imageUrl || null
      }));

      const { data, error } = await supabase
        .from('polls')
        .insert({
          question: question.trim(),
          options: formattedOptions as unknown as Json,
          user_id: user.id,
          image: imageUrl || null
        })
        .select();

      if (error) {
        throw error;
      }

      toast.success("Poll created successfully");
      navigate('/');
    } catch (error: any) {
      console.error('Error creating poll:', error);
      toast.error(error.message || "Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDesktop = breakpoint === "desktop";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className={`pt-20 px-4 ${isDesktop ? 'max-w-4xl' : 'max-w-lg'} mx-auto pb-20`}>
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold">Create Poll</h2>
          <p className="text-muted-foreground">Ask a question and collect opinions</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isDesktop ? (
              <div className="space-y-6">
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
                    
                    {imageUrl ? (
                      <div className="relative rounded-lg overflow-hidden border border-border h-[106px]">
                        <img 
                          src={imageUrl} 
                          alt="Poll image preview" 
                          className="w-full h-full object-cover"
                          onError={() => {
                            toast.error("Invalid image");
                            setImageUrl('');
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center h-[106px] rounded-lg border border-dashed border-primary/30 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUploadPollImage(e.target.files[0]);
                            }
                          }}
                          disabled={uploadingPollImage}
                        />
                        <div className="text-center text-muted-foreground">
                          {uploadingPollImage ? (
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
                  </div>
                </div>
                
                {/* Options section - full width */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Options
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {options.map((option, index) => (
                      <div key={index} className="border border-border rounded-lg p-3">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={option.text}
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
                        
                        {/* Option image upload */}
                        <div className="mt-2">
                          {option.imageUrl ? (
                            <div className="relative rounded-lg overflow-hidden border border-border">
                              <img 
                                src={option.imageUrl} 
                                alt={`Option ${index + 1} image`} 
                                className="w-full h-32 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleOptionImageChange(index, '')}
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
                                    handleUploadOptionImage(index, e.target.files[0]);
                                  }
                                }}
                                disabled={uploadingOptionImage !== null}
                              />
                              <div className="text-center text-muted-foreground">
                                {uploadingOptionImage === index ? (
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
              </div>
            ) : (
              <>
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
                    Add Poll Image (Optional)
                  </label>
                  
                  {imageUrl ? (
                    <div className="mt-2 relative rounded-lg overflow-hidden border border-border">
                      <img 
                        src={imageUrl} 
                        alt="Poll image preview" 
                        className="w-full h-48 object-cover"
                        onError={() => {
                          toast.error("Invalid image");
                          setImageUrl('');
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center h-48 rounded-lg border border-dashed border-primary/30 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadPollImage(e.target.files[0]);
                          }
                        }}
                        disabled={uploadingPollImage}
                      />
                      <div className="text-center text-muted-foreground">
                        {uploadingPollImage ? (
                          <Loader2 className="mx-auto h-10 w-10 animate-spin" />
                        ) : (
                          <>
                            <Upload className="mx-auto h-10 w-10 mb-2" />
                            <p>Click to upload poll image</p>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Options
                  </label>
                  <div className="space-y-4">
                    {options.map((option, index) => (
                      <div key={index} className="border border-border rounded-lg p-3">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={option.text}
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
                        
                        {/* Option image upload */}
                        <div className="mt-2">
                          {option.imageUrl ? (
                            <div className="relative rounded-lg overflow-hidden border border-border">
                              <img 
                                src={option.imageUrl} 
                                alt={`Option ${index + 1} image`} 
                                className="w-full h-32 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleOptionImageChange(index, '')}
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
                                    handleUploadOptionImage(index, e.target.files[0]);
                                  }
                                }}
                                disabled={uploadingOptionImage !== null}
                              />
                              <div className="text-center text-muted-foreground">
                                {uploadingOptionImage === index ? (
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
              </>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreatePoll;
