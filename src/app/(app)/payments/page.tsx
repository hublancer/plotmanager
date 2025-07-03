
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
import { PlusCircle, Edit, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import type { Transaction, Property } from "@/types";
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
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, getAllMockProperties } from "@/lib/mock-db"; 
import { useAuth } from "@/context/auth-context";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Pick<Property, 'id' | 'name'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "income",
      date: new Date(),
    },
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setIsLoading(true);
      const [transactionsData, propertiesData] = await Promise.all([
        getTransactions(user.uid),
        getAllMockProperties(user.uid)
      ]);
      setTransactions(transactionsData);
      setProperties(propertiesData);
      setIsLoading(false);
    };
    fetchData();
  }, [user]);
  
  useEffect(() => {
    if (editingTransaction) {
      form.reset({
        ...editingTransaction,
        date: new Date(editingTransaction.date),
        amount: Number(editingTransaction.amount)
      });
    } else {
      form.reset({ type: "income", contactName: "", amount: 0, category: "", date: new Date(), propertyId: "", notes: "" });
    }
  }, [editingTransaction, form, isDialogOpen]);


  const handleFormSubmit = async (values: TransactionFormValues) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }
    const dataToSave = {
        ...values,
        userId: user.uid,
        date: values.date.toISOString(),
    };

    if (editingTransaction) {
      const updated = await updateTransaction(editingTransaction.id, dataToSave);
      if (updated) {
        setTransactions(transactions.map(p => p.id === editingTransaction.id ? updated : p));
        toast({ title: "Transaction Updated", description: "The transaction has been updated." });
      }
    } else {
      const newTransaction = await addTransaction(dataToSave);
      setTransactions([newTransaction, ...transactions]);
      toast({ title: "Transaction Added", description: "New transaction record created." });
    }
    setIsDialogOpen(false);
    setEditingTransaction(null);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };
  
  const openNewDialog = () => {
    setEditingTransaction(null);
    setIsDialogOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    const success = await deleteTransaction(id);
    if (success) {
      setTransactions(transactions.filter(p => p.id !== id));
      toast({ title: "Transaction Deleted", description: "Transaction record removed.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Financial Transactions</h2>
        <Button onClick={openNewDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
              <FormField control={form.control} name="type" render={({ field }) => (<FormItem className="space-y-3"><FormLabel>Transaction Type</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><RadioGroupItem value="income" id="r1" /><Label htmlFor="r1">Income</Label></FormItem><FormItem className="flex items-center space-x-2"><RadioGroupItem value="expense" id="r2" /><Label htmlFor="r2">Expense</Label></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="contactName" render={({ field }) => (<FormItem><FormLabel>{form.watch("type") === 'income' ? 'Payer Name' : 'Payee Name'}</FormLabel><FormControl><Input placeholder={form.watch("type") === 'income' ? "e.g., Ali Khan (Tenant)" : "e.g., Plumber ABC"} {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Rent, Sale, Maintenance, Salary" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (PKR)</FormLabel><FormControl><Input type="number" placeholder="50000" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Transaction Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="propertyId" render={({ field }) => (<FormItem><FormLabel>Property (Optional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Link to a property" /></SelectTrigger></FormControl><SelectContent>{properties.map(prop => (<SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Add any relevant details" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Save Transaction</Button>
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
                <TableHead className="w-12"></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Amount (PKR)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin inline-block" />
                    <span className="ml-2">Loading transactions...</span>
                  </TableCell>
                </TableRow>
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                        {transaction.type === 'income' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.contactName}</TableCell>
                    <TableCell className="capitalize">{transaction.category}</TableCell>
                    <TableCell>{transaction.propertyName || "N/A"}</TableCell>
                    <TableCell className={cn("text-right font-semibold", transaction.type === 'income' ? 'text-green-600' : 'text-red-500')}>
                        PKR {transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(transaction)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteTransaction(transaction.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">No transactions found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
