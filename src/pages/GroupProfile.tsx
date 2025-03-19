
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGroup } from '../context/GroupContext';
import { useSupabase } from '../context/SupabaseContext';
import { Group, GroupMember } from '../lib/types';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Users, UserPlus, UserCheck, ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

const GroupProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getGroup, isGroupMember, joinGroup, leaveGroup, fetchGroupMembers } = useGroup();
  const { user } = useSupabase();
  const navigate = useNavigate();
  
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!group) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Group not found</h2>
        <p className="mb-6">The group you're looking for doesn't exist or has been deleted.</p>
        <Button asChild>
          <Link to="/groups">Back to Groups</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container pb-8 animate-in">
      <div className="mb-2 mt-2">
        <Link to="/groups" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Groups</span>
        </Link>
      </div>
      
      {/* Cover Image */}
      <div className="w-full h-48 md:h-64 bg-gray-200 relative mt-4 overflow-hidden rounded-t-xl">
        {group.cover_url ? (
          <img 
            src={group.cover_url} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100"></div>
        )}
      </div>
      
      {/* Group Profile Card */}
      <Card className="border-0 shadow-sm mt-[-3rem] relative z-10">
        <CardHeader className="flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 pt-8">
          <Avatar className="w-24 h-24 border-4 border-white mt-[-3rem] bg-white">
            <AvatarImage
              src={group.avatar_url || ''}
              alt={group.name}
            />
            <AvatarFallback className="text-2xl">
              {group.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <CardTitle className="text-2xl">{group.name}</CardTitle>
            <CardDescription className="text-base max-w-2xl">
              {group.description || 'No description provided'}
            </CardDescription>
            
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <Users className="mr-1 h-4 w-4" />
              <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0 w-full md:w-auto">
            {user && (
              isOwner ? (
                <>
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Group
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
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Group
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
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserCheck className="h-4 w-4 mr-2" />
                    )}
                    Leave Group
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleJoinGroup}
                    disabled={actionLoading}
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
      
      <Tabs defaultValue="members" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Members ({group.member_count})</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">This group has no members yet.</p>
              ) : (
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
                      <TableRow key={member.id}>
                        <TableCell className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user?.avatar_url || ''} />
                            <AvatarFallback>
                              {member.user?.username ? member.user.username.charAt(0).toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <Link to={`/user/${member.user_id}`} className="hover:underline">
                            {member.user?.username || 'Anonymous'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{member.role}</span>
                        </TableCell>
                        <TableCell>
                          {new Date(member.joined_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="about" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">About this Group</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>{group.description || 'No description provided.'}</p>
              
              <h3 className="text-lg font-medium mt-6">Group Information</h3>
              <ul className="list-none p-0 space-y-2">
                <li>
                  <span className="font-medium">Created:</span> {new Date(group.created_at).toLocaleDateString()}
                </li>
                <li>
                  <span className="font-medium">Members:</span> {group.member_count}
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupProfile;
