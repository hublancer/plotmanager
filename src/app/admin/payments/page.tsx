
"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getPayments, approvePayment, rejectPayment } from "@/lib/mock-db";
import type { Payment } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Payment['status']>('pending');
  const { toast } = useToast();

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    const data = await getPayments(filter);
    setPayments(data);
    setIsLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleApprove = async (id: string) => {
    const success = await approvePayment(id);
    if (success) {
      toast({ title: "Payment Approved", description: "The user's subscription has been activated." });
      fetchPayments();
    } else {
      toast({ title: "Error", description: "Failed to approve payment.", variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    const success = await rejectPayment(id);
    if (success) {
      toast({ title: "Payment Rejected", variant: "destructive" });
      fetchPayments();
    } else {
      toast({ title: "Error", description: "Failed to reject payment.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Payments</CardTitle>
          <CardDescription>Review and approve user subscription payments.</CardDescription>
           <div className="flex gap-2 pt-2">
            <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
            <Button variant={filter === 'approved' ? 'default' : 'outline'} onClick={() => setFilter('approved')}>Approved</Button>
            <Button variant={filter === 'rejected' ? 'default' : 'outline'} onClick={() => setFilter('rejected')}>Rejected</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount (PKR)</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Status</TableHead>
                {filter === 'pending' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">No payments found for this status.</TableCell></TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.userEmail}</TableCell>
                    <TableCell>{p.planName}</TableCell>
                    <TableCell>{p.amount.toLocaleString()}</TableCell>
                    <TableCell>{p.trxId}</TableCell>
                    <TableCell>{format(new Date(p.createdAt), 'PPP p')}</TableCell>
                    <TableCell><Badge variant={p.status === 'approved' ? 'secondary' : p.status === 'rejected' ? 'destructive' : 'outline'}>{p.status}</Badge></TableCell>
                    {filter === 'pending' && (
                        <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-500 hover:bg-green-50" onClick={() => handleApprove(p.id)}><CheckCircle className="mr-2 h-4 w-4"/>Approve</Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-500 hover:bg-red-50" onClick={() => handleReject(p.id)}><XCircle className="mr-2 h-4 w-4"/>Reject</Button>
                        </TableCell>
                    )}
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
