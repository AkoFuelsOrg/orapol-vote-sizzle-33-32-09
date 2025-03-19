
import React, { useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { useSupabase } from '../context/SupabaseContext';
import { Loader2, Users, Plus, Store, Storefront } from 'lucide-react';
import { toast } from 'sonner';

const CreateMarketplaceForm: React.FC<{
  onSuccess?: () => void;
  onCancel?: () => void;
}> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { createMarketplace } = useMarketplace();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Marketplace name is required');
      return;
    }
    
    setLoading(true);
    try {
      const marketplaceId = await createMarketplace(name, description, avatarFile || undefined, coverFile || undefined);
      if (marketplaceId) {
        setName('');
        setDescription('');
        setAvatarFile(null);
        setAvatarPreview(null);
        setCoverFile(null);
        setCoverPreview(null);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error creating marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="marketplace-name">Marketplace Name</Label>
        <Input
          id="marketplace-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter marketplace name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="marketplace-description">Description</Label>
        <Textarea
          id="marketplace-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this marketplace about?"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="marketplace-avatar">Marketplace Avatar</Label>
        <div className="flex items-center space-x-4">
          {avatarPreview && (
            <Avatar className="w-16 h-16">
              <AvatarImage src={avatarPreview} alt="Preview" />
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          <Input
            id="marketplace-avatar"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="max-w-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="marketplace-cover">Cover Image</Label>
        {coverPreview && (
          <div className="w-full h-32 mb-2 overflow-hidden rounded-md">
            <img
              src={coverPreview}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <Input
          id="marketplace-cover"
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
        />
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Marketplace
        </Button>
      </DialogFooter>
    </form>
  );
};

const MarketplaceCard: React.FC<{
  marketplace: {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    member_count: number;
  };
  isMember?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
}> = ({ marketplace, isMember, onJoin, onLeave }) => {
  const [loading, setLoading] = useState(false);
  
  const handleJoin = async () => {
    if (!onJoin) return;
    setLoading(true);
    await onJoin();
    setLoading(false);
  };
  
  const handleLeave = async () => {
    if (!onLeave) return;
    setLoading(true);
    await onLeave();
    setLoading(false);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={marketplace.avatar_url || ''} alt={marketplace.name} />
          <AvatarFallback>{marketplace.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg leading-tight">
            <Link to={`/marketplace/${marketplace.id}`} className="hover:underline">
              {marketplace.name}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-1">
            {marketplace.description || 'No description'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-1 h-4 w-4" />
          <span>{marketplace.member_count} {marketplace.member_count === 1 ? 'member' : 'members'}</span>
        </div>
      </CardContent>
      <CardFooter>
        {isMember !== undefined && (
          isMember ? (
            <Button variant="outline" size="sm" onClick={handleLeave} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Leave Marketplace'}
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={handleJoin} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join Marketplace'}
            </Button>
          )
        )}
        {isMember === undefined && (
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link to={`/marketplace/${marketplace.id}`}>View Marketplace</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const Marketplaces: React.FC = () => {
  const { marketplaces, myMarketplaces, joinedMarketplaces, loadingMarketplaces, joinMarketplace, leaveMarketplace, isMarketplaceMember } = useMarketplace();
  const { user } = useSupabase();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [marketplaceMemberships, setMarketplaceMemberships] = useState<Record<string, boolean>>({});
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  
  React.useEffect(() => {
    if (user && marketplaces.length > 0) {
      setLoadingMemberships(true);
      
      Promise.all(marketplaces.map(async marketplace => {
        const isMember = await isMarketplaceMember(marketplace.id);
        return { marketplaceId: marketplace.id, isMember };
      }))
        .then(results => {
          const memberships: Record<string, boolean> = {};
          results.forEach(result => {
            memberships[result.marketplaceId] = result.isMember;
          });
          setMarketplaceMemberships(memberships);
          setLoadingMemberships(false);
        })
        .catch(error => {
          console.error('Error checking marketplace memberships:', error);
          setLoadingMemberships(false);
        });
    } else {
      setLoadingMemberships(false);
    }
  }, [user, marketplaces]);
  
  const handleJoinMarketplace = async (marketplaceId: string) => {
    if (!user) {
      toast.error('You must be logged in to join a marketplace');
      return;
    }
    
    const success = await joinMarketplace(marketplaceId);
    if (success) {
      setMarketplaceMemberships(prev => ({ ...prev, [marketplaceId]: true }));
    }
  };
  
  const handleLeaveMarketplace = async (marketplaceId: string) => {
    if (!user) return;
    
    const success = await leaveMarketplace(marketplaceId);
    if (success) {
      setMarketplaceMemberships(prev => ({ ...prev, [marketplaceId]: false }));
    }
  };
  
  // Mobile drawer for creating marketplaces
  const [sheetOpen, setSheetOpen] = useState(false);
  
  if (loadingMarketplaces) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const renderMarketplaceList = (marketplaceList: any[], emptyMessage: string) => {
    if (marketplaceList.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketplaceList.map(marketplace => (
          <MarketplaceCard
            key={marketplace.id}
            marketplace={marketplace}
            isMember={marketplaceMemberships[marketplace.id]}
            onJoin={() => handleJoinMarketplace(marketplace.id)}
            onLeave={() => handleLeaveMarketplace(marketplace.id)}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div className="container py-6 animate-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplaces</h1>
          <p className="text-muted-foreground">Discover, join, and create marketplaces</p>
        </div>
        
        {user && (
          <>
            {/* Desktop dialog for creating marketplaces */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="hidden sm:flex">
                  <Storefront className="h-4 w-4 mr-2" />
                  Create Marketplace
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create a New Marketplace</DialogTitle>
                  <DialogDescription>
                    Create a marketplace where you can share products and services.
                  </DialogDescription>
                </DialogHeader>
                <CreateMarketplaceForm
                  onSuccess={() => setCreateDialogOpen(false)}
                  onCancel={() => setCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            
            {/* Mobile sheet for creating marketplaces */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <Button onClick={() => setSheetOpen(true)} className="sm:hidden w-full">
                <Storefront className="h-4 w-4 mr-2" />
                Create Marketplace
              </Button>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Create a New Marketplace</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <CreateMarketplaceForm
                    onSuccess={() => setSheetOpen(false)}
                    onCancel={() => setSheetOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
      
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          {user && (
            <>
              <TabsTrigger value="joined">Joined</TabsTrigger>
              <TabsTrigger value="created">Created</TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="discover" className="mt-0">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Discover Marketplaces</h2>
            {loadingMemberships ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              renderMarketplaceList(marketplaces, 'No marketplaces available')
            )}
          </div>
        </TabsContent>
        
        {user && (
          <>
            <TabsContent value="joined" className="mt-0">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Marketplaces You've Joined</h2>
                {renderMarketplaceList(joinedMarketplaces, 'You haven\'t joined any marketplaces yet')}
              </div>
            </TabsContent>
            
            <TabsContent value="created" className="mt-0">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Marketplaces You've Created</h2>
                {renderMarketplaceList(myMarketplaces, 'You haven\'t created any marketplaces yet')}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Marketplaces;
