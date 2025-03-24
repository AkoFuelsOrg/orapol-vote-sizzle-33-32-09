
import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
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
import { Loader2, Users, Plus, UserCircle, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useBreakpoint } from '../hooks/use-mobile';

const CreateGroupForm: React.FC<{
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
  const { createGroup } = useGroup();

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
      toast.error('Group name is required');
      return;
    }
    
    setLoading(true);
    try {
      const groupId = await createGroup(name, description, avatarFile || undefined, coverFile || undefined);
      if (groupId) {
        setName('');
        setDescription('');
        setAvatarFile(null);
        setAvatarPreview(null);
        setCoverFile(null);
        setCoverPreview(null);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="group-name">Group Name</Label>
        <Input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter group name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="group-description">Description</Label>
        <Textarea
          id="group-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this group about?"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="group-avatar">Group Avatar</Label>
        <div className="flex items-center space-x-4">
          {avatarPreview && (
            <Avatar className="w-16 h-16">
              <AvatarImage src={avatarPreview} alt="Preview" />
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          <Input
            id="group-avatar"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="max-w-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="group-cover">Cover Image</Label>
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
          id="group-cover"
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
          Create Group
        </Button>
      </DialogFooter>
    </form>
  );
};

const GroupCard: React.FC<{
  group: {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    member_count: number;
  };
  isMember?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
}> = ({ group, isMember, onJoin, onLeave }) => {
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
          <AvatarImage src={group.avatar_url || ''} alt={group.name} />
          <AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg leading-tight">
            <Link to={`/group/${group.id}`} className="hover:underline">
              {group.name}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-1">
            {group.description || 'No description'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-1 h-4 w-4" />
          <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
        </div>
      </CardContent>
      <CardFooter>
        {isMember !== undefined && (
          isMember ? (
            <Button variant="outline" size="sm" onClick={handleLeave} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Leave Group'}
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={handleJoin} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join Group'}
            </Button>
          )
        )}
        {isMember === undefined && (
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link to={`/group/${group.id}`}>View Group</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const Groups: React.FC = () => {
  const { groups, myGroups, joinedGroups, loadingGroups, joinGroup, leaveGroup, isGroupMember } = useGroup();
  const { user } = useSupabase();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [groupMemberships, setGroupMemberships] = useState<Record<string, boolean>>({});
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  
  React.useEffect(() => {
    if (user && groups.length > 0) {
      setLoadingMemberships(true);
      
      Promise.all(groups.map(async group => {
        const isMember = await isGroupMember(group.id);
        return { groupId: group.id, isMember };
      }))
        .then(results => {
          const memberships: Record<string, boolean> = {};
          results.forEach(result => {
            memberships[result.groupId] = result.isMember;
          });
          setGroupMemberships(memberships);
          setLoadingMemberships(false);
        })
        .catch(error => {
          console.error('Error checking group memberships:', error);
          setLoadingMemberships(false);
        });
    } else {
      setLoadingMemberships(false);
    }
  }, [user, groups]);
  
  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      toast.error('You must be logged in to join a group');
      return;
    }
    
    const success = await joinGroup(groupId);
    if (success) {
      setGroupMemberships(prev => ({ ...prev, [groupId]: true }));
    }
  };
  
  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    
    const success = await leaveGroup(groupId);
    if (success) {
      setGroupMemberships(prev => ({ ...prev, [groupId]: false }));
    }
  };
  
  // Mobile drawer for creating groups
  const [sheetOpen, setSheetOpen] = useState(false);
  
  if (loadingGroups) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const renderGroupList = (groupList: any[], emptyMessage: string) => {
    if (groupList.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupList.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            isMember={groupMemberships[group.id]}
            onJoin={() => handleJoinGroup(group.id)}
            onLeave={() => handleLeaveGroup(group.id)}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div className="container py-6 animate-in px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Discover, join, and create groups</p>
        </div>
        
        {user && (
          <>
            {/* Desktop dialog for creating groups */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="hidden sm:flex">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px] mx-4 sm:mx-auto max-w-[calc(100%-2rem)]">
                <DialogHeader>
                  <DialogTitle>Create a New Group</DialogTitle>
                  <DialogDescription>
                    Create a group to connect with people who share your interests.
                  </DialogDescription>
                </DialogHeader>
                <CreateGroupForm
                  onSuccess={() => setCreateDialogOpen(false)}
                  onCancel={() => setCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            
            {/* Mobile sheet for creating groups */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <Button onClick={() => setSheetOpen(true)} className="sm:hidden w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Create a New Group</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <CreateGroupForm
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
        <TabsList className="mb-4 w-full sm:w-auto flex">
          <TabsTrigger value="discover" className="flex-1 sm:flex-initial">Discover</TabsTrigger>
          {user && (
            <>
              <TabsTrigger value="joined" className="flex-1 sm:flex-initial">Joined</TabsTrigger>
              <TabsTrigger value="created" className="flex-1 sm:flex-initial">Created</TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="discover" className="mt-0">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Discover Groups</h2>
            {loadingMemberships ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              renderGroupList(groups, 'No groups available')
            )}
          </div>
        </TabsContent>
        
        {user && (
          <>
            <TabsContent value="joined" className="mt-0">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Groups You've Joined</h2>
                {renderGroupList(joinedGroups, 'You haven\'t joined any groups yet')}
              </div>
            </TabsContent>
            
            <TabsContent value="created" className="mt-0">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Groups You've Created</h2>
                {renderGroupList(myGroups, 'You haven\'t created any groups yet')}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Groups;
