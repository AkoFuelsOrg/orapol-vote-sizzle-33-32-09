
import React, { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { useSupabase } from '@/context/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Upload, Image, Loader2, AlertTriangle, Film, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';

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
  
  // Advertisement campaign related states
  const [isAdvertisement, setIsAdvertisement] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  
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
    
    if (isAdvertisement) {
      // Validate advertisement campaign fields
      if (!campaignTitle.trim()) {
        toast.error('Please enter a campaign title');
        return;
      }
      
      if (!budget.trim() || isNaN(Number(budget)) || Number(budget) <= 0) {
        toast.error('Please enter a valid budget amount');
        return;
      }
      
      if (!startDate) {
        toast.error('Please select a start date for your campaign');
        return;
      }
    }
    
    setUploading(true);
    
    try {
      // Upload the video first
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
        // If video is an advertisement, create campaign record
        if (isAdvertisement && result.id) {
          // Create campaign in database
          const { error } = await supabase
            .from('video_campaigns')
            .insert({
              video_id: result.id,
              user_id: user.id,
              title: campaignTitle.trim(),
              description: campaignDescription.trim(),
              budget: Number(budget),
              daily_limit: dailyLimit ? Number(dailyLimit) : null,
              start_date: new Date(startDate).toISOString(),
              end_date: endDate ? new Date(endDate).toISOString() : null,
              target_audience: targetAudience ? JSON.parse(targetAudience) : {},
              status: 'pending' // Initial status
            });
            
          if (error) {
            console.error('Error creating campaign:', error);
            toast.error('Video uploaded but campaign creation failed');
          } else {
            toast.success('Video and campaign created successfully!');
          }
        } else {
          toast.success('Video uploaded successfully!');
        }
        
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
              
              {/* Advertisement Option */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is-advertisement" 
                  checked={isAdvertisement}
                  onCheckedChange={(checked) => setIsAdvertisement(checked as boolean)}
                />
                <Label 
                  htmlFor="is-advertisement" 
                  className="text-sm font-medium cursor-pointer flex items-center"
                >
                  Run this video as an advertisement
                  <Badge variant="secondary" className="ml-2">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Paid promotion
                  </Badge>
                </Label>
              </div>
            </div>
            
            {/* Campaign Details Section - shown only when isAdvertisement is true */}
            {isAdvertisement && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Campaign Details</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-title">Campaign Title *</Label>
                    <Input
                      id="campaign-title"
                      value={campaignTitle}
                      onChange={(e) => setCampaignTitle(e.target.value)}
                      placeholder="Enter a title for your campaign"
                      required={isAdvertisement}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="campaign-description">Campaign Description</Label>
                    <Textarea
                      id="campaign-description"
                      value={campaignDescription}
                      onChange={(e) => setCampaignDescription(e.target.value)}
                      placeholder="Describe your advertising campaign"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Total Budget ($) *</Label>
                      <Input
                        id="budget"
                        type="number"
                        min="1"
                        step="0.01"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="E.g., 100.00"
                        required={isAdvertisement}
                      />
                      <p className="text-xs text-gray-500">Total amount you're willing to spend</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="daily-limit">Daily Spend Limit ($)</Label>
                      <Input
                        id="daily-limit"
                        type="number"
                        min="1"
                        step="0.01"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(e.target.value)}
                        placeholder="Optional"
                      />
                      <p className="text-xs text-gray-500">Maximum daily spend (optional)</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date *</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required={isAdvertisement}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-gray-500">Leave empty for continuous campaign</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target-audience">Target Audience</Label>
                    <Textarea
                      id="target-audience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder='{"interests": ["sports", "music"], "age_range": "18-35", "regions": ["US", "EU"]}'
                      rows={2}
                    />
                    <p className="text-xs text-gray-500">Enter JSON format targeting parameters (optional)</p>
                  </div>
                </div>
              </div>
            )}
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
                  {isAdvertisement ? 'Create Campaign' : 'Upload Video'}
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
