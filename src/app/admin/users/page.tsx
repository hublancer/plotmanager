
"use client";

import { useState, useEffect, useCallback } from "react";
import { getUsers } from "@/lib/mock-db";
import type { UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View all registered users and their subscription status.</CardDescription>
        </CardHeader>
        <CardContent>
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
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{user.role}</Badge></TableCell>
                    <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>{getSubscriptionStatus(user)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
