import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGroup } from '../context/GroupContext';
import { useSupabase } from '../context/SupabaseContext';
import { Group, GroupMember } from '../lib/types';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Users, UserPlus, UserCheck, ArrowLeft, Edit, Trash2, Loader2, Calendar, Info, Shield } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import GroupPostInterface from '../components/GroupPostInterface';
import GroupPosts from '../components/GroupPosts';
import { useBreakpoint } from '../hooks/use-mobile';
import { cn } from '../lib/utils';
import { isBreakpoint } from '@/utils/breakpoint-utils';

const GroupProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getGroup, isGroupMember, joinGroup, leaveGroup, fetchGroupMembers } = useGroup();
  const { user } = useSupabase();
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpoint(breakpoint, "mobile");
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    avatarFile: null as File | null,
    coverFile: null as File | null,
    avatarPreview: '',
    coverPreview: '',
  });
  const [activeTab, setActiveTab] = useState('posts');
  
  useEffect(() => {
    if (id) {
      fetchGroupData();
    }
  }, [id, user]);
  
  const fetchGroupData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const groupData = await getGroup(id);
      if (!groupData) {
        toast.error('Group not found');
        navigate('/groups');
        return;
      }
      
      setGroup(groupData);
      setEditForm({
        name: groupData.name,
        description: groupData.description || '',
        avatarFile: null,
        coverFile: null,
        avatarPreview: groupData.avatar_url || '',
        coverPreview: groupData.cover_url || '',
      });
      
      const memberList = await fetchGroupMembers(id);
      setMembers(memberList);
      
      if (user) {
        const memberStatus = await isGroupMember(id);
        setIsMember(memberStatus);
        setIsOwner(groupData.created_by === user.id);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast.error('Failed to load group information');
    } finally {
      setLoading(false);
    }
  };
  
  const handleJoinGroup = async () => {
    if (!id || !user) return;
    
    setActionLoading(true);
    const success = await joinGroup(id);
    if (success) {
      setIsMember(true);
      fetchGroupData(); // Refresh member count and other data
    }
    setActionLoading(false);
  };
  
  const handleLeaveGroup = async () => {
    if (!id || !user) return;
    
    setActionLoading(true);
    const success = await leaveGroup(id);
    if (success) {
      setIsMember(false);
      fetchGroupData(); // Refresh member count and other data
    }
    setActionLoading(false);
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditForm(prev => ({
        ...prev,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file),
      }));
    }
  };
  
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditForm(prev => ({
        ...prev,
        coverFile: file,
        coverPreview: URL.createObjectURL(file),
      }));
    }
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !user || !isOwner) return;
    
    setActionLoading(true);
    try {
      let avatarUrl = group.avatar_url;
      let coverUrl = group.cover_url;
      
      // Upload avatar if changed
      if (editForm.avatarFile) {
        const fileExt = editForm.avatarFile.name.split('.').pop();
        const filePath = `groups/${user.id}/avatar-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, editForm.avatarFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = urlData.publicUrl;
      }
      
      // Upload cover if changed
      if (editForm.coverFile) {
        const fileExt = editForm.coverFile.name.split('.').pop();
        const filePath = `groups/${user.id}/cover-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, editForm.coverFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        coverUrl = urlData.publicUrl;
      }
      
      // Update group
      const { error } = await supabase
        .from('groups')
        .update({
          name: editForm.name,
          description: editForm.description,
          avatar_url: avatarUrl,
          cover_url: coverUrl,
        })
        .eq('id', group.id);
      
      if (error) throw error;
      
      toast.success('Group updated successfully');
      setEditDialogOpen(false);
      fetchGroupData(); // Refresh group data
    } catch (error: any) {
      console.error('Error updating group:', error);
      toast.error(error.message || 'Failed to update group');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleDeleteGroup = async () => {
    if (!group || !user || !isOwner) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id);
      
      if (error) throw error;
      
      toast.success('Group deleted successfully');
      navigate('/groups');
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(error.message || 'Failed to delete group');
      setActionLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading group...</p>
        </div>
      </div>
    );
  }
  
  if (!group) {
    return (
      <div className="container py-12 px-4">
        <div className="max-w-lg mx-auto text-center bg-white shadow-lg rounded-xl p-8 border border-gray-100">
          <div className="w-16 h-16 bg-red-50 flex items-center justify-center rounded-full mx-auto mb-4">
            <Users className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Group not found</h2>
          <p className="text-gray-500 mb-6">The group you're looking for doesn't exist or has been deleted.</p>
          <Button asChild size="lg" className="animate-fade-in">
            <Link to="/groups">
              <ArrowLeft size={18} className="mr-2" />
              Back to Groups
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pb-12 animate-in">
      <div className="relative">
        <div className="w-full h-48 sm:h-64 md:h-80 bg-gray-100 overflow-hidden">
          {group.cover_url ? (
            <img 
              src={group.cover_url} 
              alt="Cover" 
              className="w-full h-full object-cover transform hover:scale-[1.02] transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center text-gray-400 opacity-50">
                <Users size={48} className="mx-auto mb-2" />
                <span className="text-sm">{group.name}</span>
              </div>
            </div>
          )}
          
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
            <Button 
              asChild 
              variant="secondary" 
              size="sm"
              className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <Link to="/groups">
                <ArrowLeft size={16} className="mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Link>
            </Button>
          </div>
        </div>
        
        <div className={cn(
          "container px-4",
          isMobile ? "-mt-12" : "-mt-16"
        )}>
          <Card className="border shadow-md relative z-10 overflow-visible">
            <CardHeader className={cn(
              "flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 pb-6",
              isMobile ? "pt-0" : "pt-6"
            )}>
              <Avatar className={cn(
                "border-4 border-white bg-white shadow-md",
                isMobile ? "w-20 h-20 -mt-10" : "w-28 h-28 -mt-14"
              )}>
                <AvatarImage
                  src={group.avatar_url || ''}
                  alt={group.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/80 to-blue-600 text-white">
                  {group.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className={cn(
                "space-y-1 flex-1", 
                isMobile ? "" : "pt-3"
              )}>
                <CardTitle className={cn(
                  "bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent",
                  isMobile ? "text-xl" : "text-3xl"
                )}>
                  {group.name}
                </CardTitle>
                
                <CardDescription className={cn(
                  "text-base max-w-2xl",
                  isMobile ? "line-clamp-2" : "line-clamp-1"
                )}>
                  {group.description || 'No description provided'}
                </CardDescription>
                
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="mr-1.5 h-4 w-4 text-primary/70" />
                    <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="mr-1.5 h-4 w-4 text-primary/70" />
                    <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className={cn(
                "flex gap-2 sm:justify-end", 
                isMobile ? "w-full" : "flex-col md:flex-row"
              )}>
                {user && (
                  isOwner ? (
                    <>
                      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-primary/20 hover:border-primary/40 w-full sm:w-auto">
                            <Edit className="h-3.5 w-3.5 mr-2 text-primary/70" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[525px]">
                          <DialogHeader>
                            <DialogTitle>Edit Group</DialogTitle>
                            <DialogDescription>
                              Update your group's information
                            </DialogDescription>
                          </DialogHeader>
                          
                          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Group Name</Label>
                              <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter group name"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Group description"
                                rows={3}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-avatar">Group Avatar</Label>
                              <div className="flex items-center space-x-4">
                                {editForm.avatarPreview && (
                                  <Avatar className="w-16 h-16">
                                    <AvatarImage src={editForm.avatarPreview} alt="Preview" />
                                    <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                )}
                                <Input
                                  id="edit-avatar"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAvatarChange}
                                  className="max-w-xs"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-cover">Cover Image</Label>
                              {editForm.coverPreview && (
                                <div className="w-full h-32 mb-2 overflow-hidden rounded-md">
                                  <img
                                    src={editForm.coverPreview}
                                    alt="Cover preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <Input
                                id="edit-cover"
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                              />
                            </div>
                            
                            <DialogFooter className="pt-4">
                              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={actionLoading}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={actionLoading || !editForm.name.trim()}>
                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Group</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this group? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
                              Cancel
                            </Button>
                            <Button 
                              type="button" 
                              variant="destructive" 
                              onClick={handleDeleteGroup} 
                              disabled={actionLoading}
                            >
                              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Delete Group
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    isMember ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleLeaveGroup}
                        disabled={actionLoading}
                        className="border-primary/20 hover:border-primary/40 w-full sm:w-auto"
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <UserCheck className="h-4 w-4 mr-2 text-primary/70" />
                        )}
                        Leave Group
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={handleJoinGroup}
                        disabled={actionLoading}
                        className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 w-full sm:w-auto"
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Join Group
                      </Button>
                    )
                  )
                )}
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
      
      <div className="container mt-6 px-4">
        <Tabs defaultValue="posts" className="animate-fade-in" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full sm:w-auto flex bg-background border">
            <TabsTrigger 
              value="posts"
              className="flex-1 sm:flex-initial data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="members"
              className="flex-1 sm:flex-initial data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Members
            </TabsTrigger>
            <TabsTrigger 
              value="about"
              className="flex-1 sm:flex-initial data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              About
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-0 animate-fade-in space-y-6">
            {id && isMember && (
              <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="text-lg leading-tight flex items-center">
                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      Share with the group
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <GroupPostInterface groupId={id} />
                </CardContent>
              </Card>
            )}
            
            {id && <GroupPosts groupId={id} />}
          </TabsContent>
          
          <TabsContent value="members" className="mt-0 animate-fade-in">
            <Card className="border-border/60 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xl">Members ({group.member_count})</CardTitle>
                <CardDescription>
                  People who have joined this group
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="bg-muted/30 p-4 rounded-full mb-4">
                      <Users className="h-8 w-8 text-muted-foreground/70" />
                    </div>
                    <p className="text-muted-foreground">This group has no members yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map(member => (
                          <TableRow key={member.id} className="hover:bg-muted/30">
                            <TableCell className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border border-primary/10">
                                <AvatarImage src={member.user?.avatar_url || ''} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary-foreground">
                                  {member.user?.username ? member.user.username.charAt(0).toUpperCase() : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <Link to={`/user/${member.user_id}`} className="hover:text-primary transition-colors">
                                {member.user?.username || 'Anonymous'}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                member.role === 'admin' ? "bg-primary/10 text-primary" : 
                                member.role === 'moderator' ? "bg-blue-100 text-blue-700" : 
                                "bg-gray-100 text-gray-800"
                              )}>
                                {member.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                                <span className="capitalize">{member.role}</span>
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(member.joined_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="about" className="mt-0 animate-fade-in">
            <Card className="border-border/60 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xl flex items-center">
                  <Info className="h-5 w-5 mr-2 text-primary/70" />
                  About this Group
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  {group.description ? (
                    <div className="bg-muted/20 p-4 rounded-lg border border-border/40 mb-6">
                      <p className="text-base leading-relaxed">{group.description}</p>
                    </div>
                  ) : (
                    <div className="bg-muted/20 p-4 rounded-lg border border-border/40 mb-6 text-muted-foreground italic">
                      No description provided.
                    </div>
                  )}
                  
                  <h3 className="text-lg font-medium mt-6 mb-4 text-foreground">Group Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/10 p-4 rounded-lg border border-border/30">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-primary/70 mr-3" />
                        <div>
                          <p className="text-sm text-muted-foreground">Created on</p>
                          <p className="font-medium">{new Date(group.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/10 p-4 rounded-lg border border-border/30">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-primary/70 mr-3" />
                        <div>
                          <p className="text-sm text-muted-foreground">Members</p>
                          <p className="font-medium">{group.member_count} {group.member_count === 1 ? 'person' : 'people'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GroupProfile;
