
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const UploadVideo: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdvertisement, setIsAdvertisement] = useState(false);
  const navigate = useNavigate();
  const { user } = useSupabase();
  
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
    }
  };
  
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to upload videos');
      return;
    }
    
    if (!video) {
      toast.error('Please select a video to upload');
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload video file
      const videoFileName = `${Date.now()}-${video.name}`;
      const { error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, video);
      
      if (videoError) throw videoError;
      
      // Get video URL
      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoFileName);
      
      let thumbnailUrl = null;
      
      // Upload thumbnail if provided
      if (thumbnail) {
        const thumbnailFileName = `${Date.now()}-${thumbnail.name}`;
        const { error: thumbnailError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnail);
        
        if (thumbnailError) throw thumbnailError;
        
        // Get thumbnail URL
        const { data: thumbnailUrlData } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(thumbnailFileName);
        
        thumbnailUrl = thumbnailUrlData.publicUrl;
      }
      
      // Save video data to database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          title,
          description,
          video_url: videoUrlData.publicUrl,
          thumbnail_url: thumbnailUrl,
          user_id: user.id,
          is_advertisement: isAdvertisement
        });
      
      if (dbError) throw dbError;
      
      toast.success('Video uploaded successfully!');
      navigate('/');
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast.error(error.message || 'Failed to upload video');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20 px-4 max-w-2xl mx-auto pb-20">
        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Upload Video</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter video title"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter video description"
                rows={4}
              />
            </div>
            
            <div>
              <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-1">
                Video File *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="video-upload"
                      className="relative cursor-pointer rounded-md bg-white font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                    >
                      <span>Upload a file</span>
                      <input
                        id="video-upload"
                        name="video-upload"
                        type="file"
                        className="sr-only"
                        accept="video/*"
                        onChange={handleVideoChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">MP4, WebM, or Ogg</p>
                </div>
              </div>
              {video && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {video.name}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="thumbnail-upload"
                      className="relative cursor-pointer rounded-md bg-white font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                    >
                      <span>Upload a file</span>
                      <input
                        id="thumbnail-upload"
                        name="thumbnail-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, or GIF</p>
                </div>
              </div>
              {thumbnail && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {thumbnail.name}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="advertisement" 
                checked={isAdvertisement}
                onCheckedChange={(checked) => setIsAdvertisement(checked === true)}
              />
              <label
                htmlFor="advertisement"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mark as advertisement
              </label>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Video'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default UploadVideo;
