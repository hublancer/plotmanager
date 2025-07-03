
'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, UserCog } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { updateUser } from '@/lib/mock-db';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();

  const handleRoleChange = async (newRole: UserProfile['role']) => {
    if (!user || !newRole) return;

    try {
      await updateUser(user.uid, { role: newRole });
      toast({
        title: "Role Updated",
        description: "Your role has been changed. The UI will now update. For a full refresh, please reload the page.",
      });
      // The auth context will automatically refetch the user profile,
      // but a hard reload might be needed for some things to fully update.
      // We can rely on the context for now.
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update your role.",
        variant: "destructive"
      });
    }
  };

  if (loading || !user) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
            <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-5 w-64 mx-auto mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} data-ai-hint="user avatar" />
            <AvatarFallback className="text-3xl">
              {user.displayName?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{user.displayName || 'User Name'}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="font-medium text-muted-foreground">Email Verified</span>
              <span className={`font-semibold ${user.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user.emailVerified ? 'Yes' : 'No'}
              </span>
            </div>
            {userProfile?.activePlan && (
               <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                  <span className="font-medium text-muted-foreground">Subscription Plan</span>
                  <Badge variant="secondary" className="text-green-600 border-green-500">
                      <ShieldCheck className="mr-1 h-4 w-4" />
                      Active
                  </Badge>
               </div>
            )}
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="font-medium text-muted-foreground">Account Created</span>
              <span className="font-semibold text-foreground">
                  {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="font-medium text-muted-foreground">Last Sign In</span>
              <span className="font-semibold text-foreground">
                  {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="pt-4 flex justify-center">
              <Button variant="outline" onClick={() => alert("This feature is not yet implemented.")}>Edit Profile</Button>
            </div>
        </CardContent>
      </Card>
      
      {/* Demo Role Switcher */}
      {userProfile?.role === 'admin' && (
        <Card className="w-full max-w-2xl mx-auto shadow-lg border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCog className="h-6 w-6 text-primary"/> Demo Role Switcher</CardTitle>
            <CardDescription>
              As an admin, you can switch your role here to preview what other users see. This is for testing purposes only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="role-switcher" className="font-medium">Switch View To:</Label>
              <Select defaultValue={userProfile.role} onValueChange={(value) => handleRoleChange(value as UserProfile['role'])}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                  <SelectItem value="manager">Manager (Full Access)</SelectItem>
                  <SelectItem value="agent">Agent (Limited Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
