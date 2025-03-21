
import React, { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { useSupabase } from '@/context/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Upload, Image, Loader2, AlertTriangle, Film } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const UploadVideo: React.FC = () => {
  const { uploadVideo } = useVibezone();
  const { user } = useSupabase();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isAdvertisement, setIsAdvertisement] = useState(false);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  // Redirect if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }
  
  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video size must be less than 100MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('video/')) {
      toast.error('Only video files are allowed');
      return;
    }
    
    setVideoFile(file);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setVideoPreview(objectUrl);
    
    // Load video to get duration
    const video = document.createElement('video');
    video.src = objectUrl;
    video.addEventListener('loadedmetadata', () => {
      setVideoDuration(Math.round(video.duration));
    });
  };
  
  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Thumbnail size must be less than 5MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    
    setThumbnailFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setThumbnailPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleCaptureThumbnail = () => {
    // Capture the current frame from the video as a thumbnail
    const video = videoPreviewRef.current;
    if (!video) return;
    
    // Create a canvas and draw the current video frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert the canvas to a Blob
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Failed to capture thumbnail');
        return;
      }
      
      // Create a File object from the Blob
      const file = new File([blob], 'thumbnail.png', { type: 'image/png' });
      setThumbnailFile(file);
      
      // Create a preview URL
      const objectUrl = URL.createObjectURL(blob);
      setThumbnailPreview(objectUrl);
      
      toast.success('Thumbnail captured from video');
    }, 'image/png');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile) {
      toast.error('Please select a video to upload');
      return;
    }
    
    if (!title.trim()) {
      toast.error('Please enter a title for your video');
      return;
    }
    
    setUploading(true);
    
    try {
      const result = await uploadVideo(
        {
          title: title.trim(),
          description: description.trim(),
          duration: videoDuration,
          is_advertisement: isAdvertisement
        },
        videoFile,
        thumbnailFile || undefined
      );
      
      if (result) {
        toast.success('Video uploaded successfully!');
        navigate(`/vibezone/watch/${result.id}`);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Upload Video</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Share your video with the world</CardTitle>
          <CardDescription>
            Upload a video to share with the Vibezone community
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Video Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="video-upload">Video</Label>
              
              {!videoFile ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900">Click to upload video</p>
                  <p className="mt-1 text-xs text-gray-500">MP4, WebM, or OGG (Max. 100MB)</p>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden bg-black">
                  <video 
                    src={videoPreview || undefined}
                    className="w-full h-auto max-h-[400px]"
                    controls
                    ref={videoPreviewRef}
                  />
                  <div className="bg-gray-100 p-2 flex justify-between items-center">
                    <span className="text-sm truncate max-w-[250px]">{videoFile.name}</span>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreview(null);
                          setVideoDuration(0);
                          if (videoInputRef.current) videoInputRef.current.value = '';
                        }}
                      >
                        Change
                      </Button>
                      {videoPreview && (
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline"
                          onClick={handleCaptureThumbnail}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          Capture Thumbnail
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                className="hidden"
                ref={videoInputRef}
                onChange={handleVideoChange}
              />
            </div>
            
            {/* Thumbnail Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail-upload">Thumbnail (Optional)</Label>
              
              {!thumbnailFile ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <Image className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-1 text-sm font-medium text-gray-900">Click to upload thumbnail</p>
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG, GIF (Max. 5MB)</p>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={thumbnailPreview || undefined}
                    alt="Thumbnail preview"
                    className="w-full h-auto max-h-[200px] object-contain bg-gray-100 rounded-lg"
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                    }}
                  >
                    Change
                  </Button>
                </div>
              )}
              
              <input
                id="thumbnail-upload"
                type="file"
                accept="image/*"
                className="hidden"
                ref={thumbnailInputRef}
                onChange={handleThumbnailChange}
              />
            </div>
            
            {/* Video Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your video"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video"
                  rows={4}
                />
              </div>

              {/* Advertisement Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isAdvertisement" 
                  checked={isAdvertisement} 
                  onCheckedChange={(checked) => setIsAdvertisement(checked === true)}
                />
                <Label htmlFor="isAdvertisement" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  This is an advertisement video
                </Label>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/vibezone')}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-red-500 hover:bg-red-600" 
              disabled={!videoFile || !title.trim() || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  Upload Video
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default UploadVideo;
