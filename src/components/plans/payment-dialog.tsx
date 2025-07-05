
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { submitPayment } from "@/lib/mock-db";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import type { Plan } from "@/types";

interface PaymentDialogProps {
  plan: Plan;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDialog({ plan, isOpen, onOpenChange }: PaymentDialogProps) {
  const [trxId, setTrxId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, refetchUserProfile } = useAuth(); // We need the user's UID and email

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!trxId.trim()) {
      toast({ title: "Error", description: "Please enter a valid Transaction ID.", variant: "destructive" });
      return;
    }
    if (!user || !user.email) {
      toast({ title: "Error", description: "You must be logged in with a valid email.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPayment({
        userId: user.uid,
        userEmail: user.email,
        plan: plan,
        trxId: trxId.trim(),
      });
      toast({
        title: "Submission Received!",
        description: "Your payment is being verified. Your account will be activated upon approval.",
      });
      await refetchUserProfile(); // Refresh the user profile to show pending status
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit payment:", error);
      toast({
        title: "Submission Failed",
        description: "Could not save your transaction ID. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase - {plan.name} Plan</DialogTitle>
          <DialogDescription>
            To activate your plan, please complete the payment using the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg border">
            <h3 className="font-semibold text-foreground">Payment Details</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please transfer <span className="font-bold text-foreground">PKR {plan.price.toLocaleString()}</span> to the following account:
            </p>
            <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
              <li><strong>Service:</strong> SadaPay</li>
              <li><strong>Account Number:</strong> 0340633938</li>
              <li><strong>Account Name:</strong> Abdul Wahab</li>
            </ul>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="trxId">Transaction ID (TID/TRX ID)</Label>
              <Input
                id="trxId"
                placeholder="Enter the transaction ID from your receipt"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
