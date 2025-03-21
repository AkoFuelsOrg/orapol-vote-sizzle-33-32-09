
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CreditCard, Megaphone, Calendar, Target, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useVibezone } from '@/context/VibezoneContext';
import { Video } from '@/lib/types';

interface PromoteVideoDialogProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
}

const PromoteVideoDialog: React.FC<PromoteVideoDialogProps> = ({ 
  video, 
  isOpen, 
  onClose 
}) => {
  const { createCampaign } = useVibezone();
  const [title, setTitle] = useState(`Promote: ${video.title}`);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('10');
  const [dailyLimit, setDailyLimit] = useState('2');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a campaign title');
      return;
    }
    
    if (isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }
    
    setLoading(true);
    
    try {
      const campaignData = {
        video_id: video.id,
        title: title.trim(),
        description: description.trim(),
        budget: parseFloat(budget),
        daily_limit: dailyLimit ? parseFloat(dailyLimit) : null,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        target_audience: {}
      };
      
      const success = await createCampaign(campaignData);
      
      if (success) {
        toast.success('Campaign created successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Megaphone className="mr-2 h-5 w-5" />
            Promote Your Video
          </DialogTitle>
          <DialogDescription>
            Create a promotion campaign to increase views on your video
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Campaign Title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Campaign Description (Optional)</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Describe your campaign goals"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget" className="flex items-center">
                <CreditCard className="mr-1 h-4 w-4" />
                Total Budget ($)
              </Label>
              <Input 
                id="budget" 
                type="number" 
                min="1" 
                step="0.01" 
                value={budget} 
                onChange={e => setBudget(e.target.value)} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dailyLimit" className="flex items-center">
                <Target className="mr-1 h-4 w-4" />
                Daily Limit ($)
              </Label>
              <Input 
                id="dailyLimit" 
                type="number" 
                min="0" 
                step="0.01" 
                value={dailyLimit} 
                onChange={e => setDailyLimit(e.target.value)} 
                placeholder="Optional"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                Start Date
              </Label>
              <Input 
                id="startDate" 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                End Date
              </Label>
              <Input 
                id="endDate" 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                placeholder="Optional"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Megaphone className="mr-2 h-4 w-4" />
                  Create Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PromoteVideoDialog;
