
"use client";

import { useState, useEffect, useCallback } from "react";
import { getUsers } from "@/lib/mock-db";
import type { UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Mail, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const data = await getUsers();
    setUsers(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const getSubscriptionStatus = (user: UserProfile) => {
      if (user.role === 'super_admin') {
          return <Badge variant="default">Super Admin</Badge>
      }
      
      const sub = user.subscription;
      if (!sub || sub.status === 'pending_payment') {
          return <Badge variant="outline">No Plan</Badge>;
      }
      
      if (sub.status === 'expired') {
          return <Badge variant="destructive">Expired</Badge>;
      }
      
      const isExpired = sub.endDate && new Date(sub.endDate) < new Date();
      if (isExpired) {
           return <Badge variant="destructive">Expired</Badge>;
      }
      
      return <Badge variant="secondary" className="border-green-500 text-green-600">{sub.planName}</Badge>
  }

  const UserCard = ({ user }: { user: UserProfile }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12"><AvatarImage src={user.photoURL || undefined} /><AvatarFallback>{user.displayName?.substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
          <div>
            <h3 className="font-bold text-lg">{user.displayName}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Role</span> <Badge variant="outline" className="capitalize">{user.role}</Badge></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Subscription</span> {getSubscriptionStatus(user)}</div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Registered</span> <span className="font-medium">{user.createdAt ? format(new Date(user.createdAt), 'PPP') : 'N/A'}</span></div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View all registered users and their subscription status.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin mx-auto h-8 w-8" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No users found.</div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Registered On</TableHead>
                      <TableHead>Subscription Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.uid}>
                          <TableCell>{user.displayName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{user.role}</Badge></TableCell>
                          <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'PPP') : 'N/A'}</TableCell>
                          <TableCell>{getSubscriptionStatus(user)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {users.map((user) => <UserCard key={user.uid} user={user} />)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
