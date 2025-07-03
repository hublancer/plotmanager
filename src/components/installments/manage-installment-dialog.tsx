
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { addTransaction, getTransactions } from "@/lib/mock-db";
import type { InstallmentDetails, Transaction } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Receipt } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ManageInstallmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  installmentPlan: InstallmentDetails;
}

export function ManageInstallmentDialog({ isOpen, onOpenChange, onUpdate, installmentPlan }: ManageInstallmentDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [paymentHistory, setPaymentHistory] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const fetchHistory = async () => {
        setIsLoading(true);
        const transactions = await getTransactions(user.uid, installmentPlan.id);
        setPaymentHistory(transactions.filter(t => t.type === 'income' && t.category === 'installment'));
        setIsLoading(false);
      };
      fetchHistory();
    }
  }, [isOpen, user, installmentPlan.id]);

  const handleRecordPayment = async () => {
    if (!user) {
      toast({ title: "Not logged in", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await addTransaction({
        userId: user.uid,
        propertyId: installmentPlan.id,
        contactName: installmentPlan.buyerName || "N/A",
        amount: installmentPlan.installmentAmount,
        date: new Date().toISOString(),
        type: "income",
        category: "installment",
        notes: `Installment ${installmentPlan.paidInstallments + 1} of ${installmentPlan.totalInstallments}`,
      });

      toast({
        title: "Payment Recorded",
        description: `Installment for ${installmentPlan.name} has been successfully recorded.`,
      });
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to record payment:", error);
      toast({
        title: "Error",
        description: "Could not record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFullyPaid = installmentPlan.status === 'Fully Paid';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Installments: {installmentPlan.name}</DialogTitle>
          <DialogDescription>
            View payment history and record new installment payments for this plan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Summary Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Plan Summary</h3>
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Buyer:</span> <span className="font-medium">{installmentPlan.buyerName}</span></div>
                <div className="flex justify-between"><span>Total Price:</span> <span className="font-medium">PKR {installmentPlan.totalInstallmentPrice?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Down Payment:</span> <span className="font-medium">PKR {installmentPlan.downPayment?.toLocaleString()}</span></div>
                <div className="flex justify-between text-green-600"><span>Total Paid:</span> <span className="font-medium">PKR {installmentPlan.paidAmount?.toLocaleString()}</span></div>
                <div className="flex justify-between text-red-600"><span>Remaining:</span> <span className="font-medium">PKR {installmentPlan.remainingAmount?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Installments Paid:</span> <span className="font-medium">{installmentPlan.paidInstallments} / {installmentPlan.totalInstallments}</span></div>
                <div className="flex justify-between"><span>Installment Amount:</span> <span className="font-medium">PKR {installmentPlan.installmentAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></div>
              </CardContent>
            </Card>
          </div>
          {/* Payment History Section */}
          <div className="space-y-4">
             <h3 className="font-semibold text-lg">Payment History</h3>
             <Card className="h-[240px]">
                <ScrollArea className="h-full">
                  <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div>
                    ) : paymentHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <Receipt className="h-10 w-10 text-muted-foreground mb-2"/>
                            <p className="text-muted-foreground">No installment payments recorded yet.</p>
                            <p className="text-xs text-muted-foreground">Down payment is not listed here.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount (PKR)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentHistory.map(payment => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right font-mono">{payment.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                  </CardContent>
                </ScrollArea>
             </Card>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          <Button 
            onClick={handleRecordPayment} 
            disabled={isSubmitting || isFullyPaid}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isFullyPaid ? (
              "Plan Fully Paid"
            ) : (
              `Record Payment (PKR ${installmentPlan.installmentAmount.toLocaleString(undefined, {maximumFractionDigits: 0})})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
