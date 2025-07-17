
"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getPayments, approvePayment, rejectPayment } from "@/lib/mock-db";
import type { Payment } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Mail, FileText, CircleDollarSign } from "lucide-react";
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

  const PaymentCard = ({ payment }: { payment: Payment }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
            <h3 className="font-bold">{payment.planName} Plan</h3>
            <Badge variant={payment.status === 'approved' ? 'secondary' : payment.status === 'rejected' ? 'destructive' : 'outline'}>{payment.status}</Badge>
        </div>
        <div className="mt-4 space-y-2 text-sm">
           <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> <span>{payment.userEmail}</span></div>
           <div className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-muted-foreground"/> <span>PKR {payment.amount.toLocaleString()}</span></div>
           <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/> <span>Trx ID: {payment.trxId}</span></div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Submitted: {format(new Date(payment.createdAt), 'PPP p')}</p>
        {filter === 'pending' && (
            <div className="flex justify-end gap-2 mt-4">
                <Button size="sm" variant="outline" className="text-red-600 border-red-500 hover:bg-red-50" onClick={() => handleReject(payment.id)}><XCircle className="mr-2 h-4 w-4"/>Reject</Button>
                <Button size="sm" variant="outline" className="text-green-600 border-green-500 hover:bg-green-50" onClick={() => handleApprove(payment.id)}><CheckCircle className="mr-2 h-4 w-4"/>Approve</Button>
            </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Payments</CardTitle>
          <CardDescription>Review and approve user subscription payments.</CardDescription>
           <div className="flex gap-2 pt-2 flex-wrap">
            <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
            <Button variant={filter === 'approved' ? 'default' : 'outline'} onClick={() => setFilter('approved')}>Approved</Button>
            <Button variant={filter === 'rejected' ? 'default' : 'outline'} onClick={() => setFilter('rejected')}>Rejected</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin mx-auto h-8 w-8" /></div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No payments found for this status.</div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>User Email</TableHead><TableHead>Plan</TableHead><TableHead>Amount (PKR)</TableHead><TableHead>Transaction ID</TableHead><TableHead>Submitted At</TableHead><TableHead>Status</TableHead>{filter === 'pending' && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
                  <TableBody>
                    {payments.map((p) => (
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
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {payments.map((p) => <PaymentCard key={p.id} payment={p} />)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
