
"use client";

import { useState, useEffect, useCallback }from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import type { Transaction, Property } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getTransactions, deleteTransaction, getAllMockProperties } from "@/lib/mock-db"; 
import { useAuth } from "@/context/auth-context";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Pick<Property, 'id' | 'name'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    if (!user) {
        setIsLoading(false);
        return;
    };
    const ownerId = userProfile?.role === 'admin' ? user.uid : userProfile?.adminId;
    if (!ownerId) {
      setIsLoading(false);
      return;
    }
    const [transactionsData, propertiesData] = await Promise.all([
      getTransactions(ownerId),
      getAllMockProperties(ownerId)
    ]);
    setTransactions(transactionsData);
    setProperties(propertiesData);
    setIsLoading(false);
  }, [user, userProfile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
  
  const handleDialogUpdate = () => {
      fetchData();
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Financial Transactions</h2>
          <Button onClick={openNewDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        </div>

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

      <TransactionFormDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUpdate={handleDialogUpdate}
        initialData={editingTransaction}
        properties={properties}
      />
    </>
  );
}
