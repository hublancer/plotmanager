
"use client";

import type { RentalItem, Transaction } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { MapPin, Phone, Building, DollarSign, Info, Tag, User, Calendar, FileText, BadgeInfo, LocateFixed, Loader2, Receipt } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getTransactions, addTransaction } from "@/lib/mock-db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent } from "../ui/card";

interface RentalDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    rental: RentalItem | null;
    onUpdate: () => void;
}

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) => {
    if (!value && typeof value !== 'number') return null;
    return (
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md text-sm">
            <div className="text-primary mt-1">{icon}</div>
            <div>
                <p className="text-muted-foreground">{label}</p>
                <p className="font-semibold">{typeof value === 'number' ? `PKR ${value.toLocaleString()}` : value}</p>
            </div>
        </div>
    );
};

export function RentalDetailsDialog({ isOpen, onOpenChange, rental, onUpdate }: RentalDetailsDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [paymentHistory, setPaymentHistory] = useState<Transaction[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && user && rental) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                const transactions = await getTransactions(user.uid, rental.propertyId, rental.plotNumber);
                setPaymentHistory(transactions.filter(t => t.type === 'income' && t.category === 'rent'));
                setIsLoadingHistory(false);
            };
            fetchHistory();
        }
    }, [isOpen, user, rental]);

    const handleRecordPayment = async () => {
        if (!user || !rental) {
          toast({ title: "Error", description: "User or rental data is missing.", variant: "destructive" });
          return;
        }
        setIsSubmitting(true);
        try {
          await addTransaction({
            userId: user.uid,
            propertyId: rental.propertyId,
            plotNumber: rental.plotNumber,
            contactName: rental.tenantName,
            amount: rental.rentAmount,
            date: new Date().toISOString(),
            type: "income",
            category: "rent",
            notes: `Rent for ${rental.propertyName}${rental.plotNumber ? ` (Plot #${rental.plotNumber})` : ''} - ${format(new Date(), 'MMMM yyyy')}`,
            createdBy: user.uid,
          });
    
          toast({
            title: "Payment Recorded",
            description: `Rent payment for ${rental.propertyName} has been successfully recorded.`,
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


    if (!rental) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{rental.propertyName}{rental.plotNumber ? ` - Plot #${rental.plotNumber}` : ''}</DialogTitle>
                    <DialogDescription>{rental.address}</DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
                    {/* Left Column - Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-md text-primary border-b pb-1">Tenant & Rental Info</h3>
                        <DetailRow icon={<User className="h-5 w-5"/>} label="Tenant Name" value={rental.tenantName} />
                        <DetailRow icon={<Phone className="h-5 w-5"/>} label="Tenant Contact" value={rental.tenantContact} />
                        <DetailRow icon={<DollarSign className="h-5 w-5"/>} label={`Rent Amount (${rental.rentFrequency})`} value={rental.rentAmount} />
                        <DetailRow icon={<Calendar className="h-5 w-5"/>} label="Agreement Start Date" value={format(new Date(rental.startDate), 'PPP')} />
                    </div>
                     {/* Right Column - Payment History */}
                    <div className="space-y-4">
                         <h3 className="font-semibold text-md text-primary border-b pb-1">Payment History</h3>
                         <Card className="h-[300px] flex flex-col">
                           <ScrollArea className="flex-1">
                               <CardContent className="p-0">
                                {isLoadingHistory ? (
                                    <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div>
                                ) : paymentHistory.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                        <Receipt className="h-10 w-10 text-muted-foreground mb-2"/>
                                        <p className="text-muted-foreground">No rent payments recorded yet.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount (PKR)</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {paymentHistory.map(payment => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>{format(new Date(payment.date), 'dd MMM, yyyy')}</TableCell>
                                                    <TableCell className="text-right font-mono">{payment.amount.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                               </CardContent>
                           </ScrollArea>
                            <div className="p-2 border-t">
                                <Button className="w-full" onClick={handleRecordPayment} disabled={isSubmitting || rental.paymentStatus === 'Paid'}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    {rental.paymentStatus === 'Paid' ? 'Rent Paid for this Period' : `Record Payment (PKR ${rental.rentAmount.toLocaleString()})`}
                                </Button>
                            </div>
                         </Card>
                    </div>
                </div>
                 <DialogFooter className="sm:justify-between items-center pt-4 border-t gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                       {rental.tenantContact && (
                        <>
                            <Button asChild variant="outline" className="flex-1 bg-green-500 text-white hover:bg-green-600 border-green-600">
                                <a href={`https://wa.me/${rental.tenantContact.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                    <WhatsAppIcon className="h-5 w-5 fill-current mr-2" />
                                    WhatsApp
                                </a>
                            </Button>
                            <Button asChild variant="outline" className="flex-1">
                                <a href={`tel:${rental.tenantContact.replace(/\D/g, '')}`} aria-label="Call">
                                    <Phone className="h-5 w-5 mr-2" />
                                    Call
                                </a>
                            </Button>
                        </>
                       )}
                    </div>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
