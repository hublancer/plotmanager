"use client";

import { useState, useEffect }from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { Transaction, Property } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { addTransaction, updateTransaction } from "@/lib/mock-db"; 
import { useAuth } from "@/context/auth-context";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";

const transactionFormSchema = z.object({
  type: z.enum(["income", "expense"], { required_error: "Transaction type is required."}),
  contactName: z.string().min(2, "Name is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().min(2, "Category is required."),
  date: z.date({ required_error: "Payment date is required." }),
  propertyId: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
    initialData?: Transaction | null;
    properties: Pick<Property, 'id' | 'name'>[];
}

export function TransactionFormDialog({ isOpen, onOpenChange, onUpdate, initialData, properties }: TransactionFormDialogProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
  });
  
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
          form.reset({
            ...initialData,
            date: new Date(initialData.date),
            amount: Number(initialData.amount)
          });
        } else {
          form.reset({ type: "income", contactName: "", amount: undefined, category: "", date: new Date(), propertyId: "", notes: "" });
        }
    }
  }, [initialData, form, isOpen]);

  const handleFormSubmit = async (values: TransactionFormValues) => {
    if (!user || !userProfile) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }

    const ownerId = userProfile.role === 'admin' ? user.uid : userProfile.adminId;
    if (!ownerId) {
        toast({ title: "Error", description: "Could not determine business owner.", variant: "destructive" });
        return;
    }

    try {
        if (initialData) {
          const dataToSave: Partial<Transaction> = { ...values, date: values.date.toISOString() };
          await updateTransaction(initialData.id, dataToSave);
          toast({ title: "Transaction Updated" });
        } else {
          const dataToSave = {
            ...values,
            userId: ownerId,
            createdBy: user.uid,
            date: values.date.toISOString(),
          };
          await addTransaction(dataToSave as Omit<Transaction, 'id' | 'propertyName'>);
          toast({ title: "Transaction Added" });
        }
        onUpdate();
        onOpenChange(false);
    } catch (e) {
        toast({ title: "Error", description: "Could not save transaction", variant: "destructive"});
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{initialData ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
              <FormField control={form.control} name="type" render={({ field }) => (<FormItem className="space-y-3"><FormLabel>Transaction Type</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><RadioGroupItem value="income" id="r1" /><Label htmlFor="r1">Income</Label></FormItem><FormItem className="flex items-center space-x-2"><RadioGroupItem value="expense" id="r2" /><Label htmlFor="r2">Expense</Label></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="contactName" render={({ field }) => (<FormItem><FormLabel>{form.watch("type") === 'income' ? 'Payer Name' : 'Payee Name'}</FormLabel><FormControl><Input placeholder={form.watch("type") === 'income' ? "e.g., Ali Khan (Tenant)" : "e.g., Plumber ABC"} {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Rent, Sale, Maintenance, Salary" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (PKR)</FormLabel><FormControl><Input type="number" placeholder="50000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Transaction Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="propertyId" render={({ field }) => (<FormItem><FormLabel>Property (Optional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Link to a property" /></SelectTrigger></FormControl><SelectContent>{properties.map(prop => (<SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Add any relevant details" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Transaction
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  );
}
