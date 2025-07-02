
"use client";

import { useState, useEffect }from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import type { PaymentRecord, Property } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getPayments, addPayment, updatePayment, deletePayment, getAllMockProperties } from "@/lib/mock-db"; 
import { useAuth } from "@/context/auth-context";


const paymentFormSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  plotNumber: z.string().optional(),
  tenantOrBuyerName: z.string().min(2, "Name is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  date: z.date({ required_error: "Payment date is required." }),
  paymentMethod: z.string().optional(),
  type: z.enum(["rent", "installment", "sale", "token"]),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [properties, setProperties] = useState<Pick<Property, 'id' | 'name'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      type: "rent",
    },
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setIsLoading(true);
      const [paymentsData, propertiesData] = await Promise.all([
        getPayments(user.uid),
        getAllMockProperties(user.uid)
      ]);
      setPayments(paymentsData);
      setProperties(propertiesData);
      setIsLoading(false);
    };
    fetchData();
  }, [user]);
  
  useEffect(() => {
    if (editingPayment) {
      form.reset({
        ...editingPayment,
        date: new Date(editingPayment.date),
        amount: Number(editingPayment.amount)
      });
    } else {
      form.reset({ propertyId: "", plotNumber: "", tenantOrBuyerName: "", amount: 0, date: new Date(), paymentMethod: "", type: "rent", notes: "" });
    }
  }, [editingPayment, form, isDialogOpen]);


  const handleFormSubmit = async (values: PaymentFormValues) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }
    if (editingPayment) {
      const updated = await updatePayment(editingPayment.id, { ...values, userId: user.uid, date: values.date.toISOString() });
      if (updated) {
        setPayments(payments.map(p => p.id === editingPayment.id ? updated : p));
        toast({ title: "Payment Updated", description: "The payment record has been updated." });
      }
    } else {
      const newPayment = await addPayment({ ...values, userId: user.uid, date: values.date.toISOString() });
      setPayments([...payments, newPayment]);
      toast({ title: "Payment Added", description: "New payment record created." });
    }
    setIsDialogOpen(false);
    setEditingPayment(null);
  };

  const openEditDialog = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setIsDialogOpen(true);
  };
  
  const openNewDialog = () => {
    setEditingPayment(null);
    setIsDialogOpen(true);
  };

  const handleDeletePayment = async (id: string) => {
    const success = await deletePayment(id);
    if (success) {
      setPayments(payments.filter(p => p.id !== id));
      toast({ title: "Payment Deleted", description: "Payment record removed.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Payment Records</h2>
        <Button onClick={openNewDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Payment
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingPayment ? "Edit Payment Record" : "Add New Payment Record"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a property" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map(prop => (
                          <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="plotNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plot Number (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., A-101" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenantOrBuyerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant/Buyer Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Ali Khan" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (PKR)</FormLabel>
                    <FormControl><Input type="number" placeholder="50000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Payment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select payment type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="installment">Installment</SelectItem>
                        <SelectItem value="sale">Full Sale</SelectItem>
                        <SelectItem value="token">Token / Bayana</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., Bank Transfer, Cash, Cheque" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="e.g., Token money for Plot A-101, Monthly rent for Apt B2" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Save Payment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Plot</TableHead>
                <TableHead>Tenant/Buyer</TableHead>
                <TableHead>Amount (PKR)</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin inline-block" />
                    <span className="ml-2">Loading payments...</span>
                  </TableCell>
                </TableRow>
              ) : payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.propertyName || payment.propertyId}</TableCell>
                    <TableCell>{payment.plotNumber || "N/A"}</TableCell>
                    <TableCell>{payment.tenantOrBuyerName}</TableCell>
                    <TableCell>PKR {payment.amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{payment.type}</TableCell>
                    <TableCell>{payment.paymentMethod || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(payment)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeletePayment(payment.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">No payment records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
