
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { useSupabase } from '@/context/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Play, Pause, StopCircle, Trash2, Megaphone, Ban, Info } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  budget: number;
  daily_limit: number | null;
  start_date: string;
  end_date: string | null;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'rejected';
  impressions: number;
  clicks: number;
  created_at: string;
  video?: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    views: number;
  };
}

const MyCampaigns: React.FC = () => {
  const { fetchCampaigns, updateCampaignStatus, deleteCampaign } = useVibezone();
  const { user } = useSupabase();
  const navigate = useNavigate();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const loadCampaigns = async () => {
      setLoading(true);
      const data = await fetchCampaigns();
      setCampaigns(data);
      setLoading(false);
    };
    
    loadCampaigns();
  }, [user, fetchCampaigns, navigate]);
  
  const handleStatusChange = async (campaignId: string, newStatus: Campaign['status']) => {
    setActionInProgress(campaignId);
    
    try {
      const success = await updateCampaignStatus(campaignId, newStatus);
      
      if (success) {
        setCampaigns(prev => 
          prev.map(campaign => 
            campaign.id === campaignId 
              ? { ...campaign, status: newStatus } 
              : campaign
          )
        );
        
        toast.success(`Campaign ${newStatus} successfully`);
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast.error('Failed to update campaign status');
    } finally {
      setActionInProgress(null);
    }
  };
  
  const handleDeleteCampaign = async () => {
    if (!deletingCampaign) return;
    
    setActionInProgress(deletingCampaign);
    
    try {
      const success = await deleteCampaign(deletingCampaign);
      
      if (success) {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== deletingCampaign));
        toast.success('Campaign deleted successfully');
        setDeletingCampaign(null);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    } finally {
      setActionInProgress(null);
    }
  };
  
  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500">Pending</Badge>;
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Promotion Campaigns</h1>
      </div>
      
      {campaigns.length === 0 ? (
        <div className="bg-gray-50 border rounded-lg p-8 text-center">
          <Megaphone className="h-12 w-12 mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold">No campaigns yet</h2>
          <p className="mt-2 text-gray-600">
            You haven't created any promotion campaigns for your videos yet.
          </p>
          <Button 
            className="mt-4"
            onClick={() => navigate('/vibezone')}
          >
            Go to Videos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map(campaign => (
            <Card key={campaign.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{campaign.title}</CardTitle>
                    <CardDescription>
                      Created {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                {campaign.video && (
                  <div className="flex mb-4">
                    <div className="flex-shrink-0 w-24 h-16 bg-gray-200 rounded overflow-hidden">
                      {campaign.video.thumbnail_url ? (
                        <img 
                          src={campaign.video.thumbnail_url} 
                          alt={campaign.video.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 text-xs">
                          No thumbnail
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium">{campaign.video.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {campaign.video.views} views
                      </p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto mt-1 text-xs" 
                        onClick={() => navigate(`/vibezone/watch/${campaign.video?.id}`)}
                      >
                        View Video
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Budget</p>
                    <p className="font-medium">{formatCurrency(campaign.budget)}</p>
                  </div>
                  {campaign.daily_limit && (
                    <div>
                      <p className="text-gray-500">Daily Limit</p>
                      <p className="font-medium">{formatCurrency(campaign.daily_limit)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p className="font-medium">{format(new Date(campaign.start_date), 'MMM d, yyyy')}</p>
                  </div>
                  {campaign.end_date && (
                    <div>
                      <p className="text-gray-500">End Date</p>
                      <p className="font-medium">{format(new Date(campaign.end_date), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                  <div>
                    <p className="text-gray-500">Impressions</p>
                    <p className="font-medium">{campaign.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Clicks</p>
                    <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                  </div>
                </div>
                
                {campaign.description && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p>{campaign.description}</p>
                  </div>
                )}
              </CardContent>
              
              <Separator />
              
              <CardFooter className="pt-4">
                <div className="flex space-x-2">
                  {campaign.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleStatusChange(campaign.id, 'active')}
                      disabled={!!actionInProgress}
                    >
                      {actionInProgress === campaign.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      Start
                    </Button>
                  )}
                  
                  {campaign.status === 'active' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleStatusChange(campaign.id, 'paused')}
                      disabled={!!actionInProgress}
                    >
                      {actionInProgress === campaign.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pause className="h-4 w-4 mr-1" />
                      )}
                      Pause
                    </Button>
                  )}
                  
                  {campaign.status === 'paused' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleStatusChange(campaign.id, 'active')}
                      disabled={!!actionInProgress}
                    >
                      {actionInProgress === campaign.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      Resume
                    </Button>
                  )}
                  
                  {['pending', 'active', 'paused'].includes(campaign.status) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleStatusChange(campaign.id, 'completed')}
                      disabled={!!actionInProgress}
                    >
                      {actionInProgress === campaign.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <StopCircle className="h-4 w-4 mr-1" />
                      )}
                      Complete
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeletingCampaign(campaign.id)}
                    disabled={!!actionInProgress}
                  >
                    {actionInProgress === campaign.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCampaign} onOpenChange={(open) => !open && setDeletingCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the campaign and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCampaign} 
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyCampaigns;
