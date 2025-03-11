
import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { PollOption } from '@/lib/types';
import { Json } from '@/integrations/supabase/types';
import { useSupabase } from '@/context/SupabaseContext';

interface OptionWithImage {
  text: string;
  imageUrl: string;
}

export function useCreatePoll() {
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
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
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
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
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

  return {
    question,
    setQuestion,
    options,
    imageUrl,
    setImageUrl,
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
  };
}
