
'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, loading } = useAuth();

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
  );
}
