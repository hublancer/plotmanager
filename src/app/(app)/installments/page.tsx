
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getDerivedInstallmentItems, endInstallmentPlan } from "@/lib/mock-db"; 
import type { InstallmentItem } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ManageInstallmentDialog } from "@/components/installments/manage-installment-dialog";
import { Eye, PlusCircle, Loader2, Trash2, Settings, Edit, User, Calendar, CircleDollarSign } from "lucide-react";

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<InstallmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InstallmentItem | null>(null);

  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const installmentsData = await getDerivedInstallmentItems(user.uid);
      setInstallments(installmentsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ title: "Error", description: "Could not fetch installment data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);
  
  const handleOpenManageDialog = (plan: InstallmentItem) => {
    setSelectedPlan(plan);
    setIsManageDialogOpen(true);
  };

  const handleEndInstallmentPlan = async (item: InstallmentItem) => {
    const success = await endInstallmentPlan(item.propertyId, item.source === 'plot' ? item.id : undefined);
    if (success) {
      toast({ title: "Installment Plan Ended", description: "The property/plot is now marked as available." });
      fetchAllData();
    } else {
      toast({ title: "Error", description: "Could not end the installment plan.", variant: "destructive" });
    }
  };

  const calculateProgress = (paid?: number, total?: number) => {
    if (paid === undefined || total === undefined || total === 0) return 0;
    return (paid / total) * 100;
  };

  const InstallmentCard = ({ item }: { item: InstallmentItem }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/properties/${item.propertyId}`} className="font-bold hover:underline">{item.propertyName}</Link>
            {item.plotNumber && <p className="text-sm text-muted-foreground">Plot #{item.plotNumber}</p>}
          </div>
          <Badge variant={item.status === 'Overdue' ? 'destructive' : (item.status === 'Fully Paid' ? 'secondary' : 'outline')}>
            {item.status}
          </Badge>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> <span>Buyer: {item.buyerName || "N/A"}</span></div>
          <div className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-muted-foreground" /> <span>Total: PKR {item.totalInstallmentPrice?.toLocaleString()}</span></div>
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Next Due: {item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : 'N/A'}</span></div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Paid: {item.paidAmount?.toLocaleString()}</span>
            <span>Remaining: {item.remainingAmount?.toLocaleString()}</span>
          </div>
          <Progress value={calculateProgress(item.paidInstallments, item.totalInstallments)} className="h-2" />
          <p className="text-xs text-right mt-1 text-muted-foreground">{calculateProgress(item.paidInstallments, item.totalInstallments).toFixed(0)}% Complete</p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleOpenManageDialog(item)}><Eye className="h-4 w-4 mr-2" /> View / Manage</Button>
          {userProfile?.role === 'admin' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="End Installment Plan" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>End Installment Plan?</AlertDialogTitle><AlertDialogDescription>This will remove the installment plan from "{item.propertyName} {item.plotNumber ? `(Plot #${item.plotNumber})` : ''}".</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleEndInstallmentPlan(item)} className="bg-destructive hover:bg-destructive/90">Yes, End Plan</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Installment Tracking</h2>
          <p className="text-sm text-muted-foreground">Add new plans from the property details page.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : installments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">No properties on installment plans found.</CardContent>
          </Card>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card className="shadow-lg">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property / Plot</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Total Price (PKR)</TableHead>
                        <TableHead>Paid / Remaining</TableHead>
                        <TableHead>Installments</TableHead>
                        <TableHead>Next Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[200px]">Progress</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {installments.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell><Link href={`/properties/${item.propertyId}`} className="font-medium hover:underline">{item.propertyName}</Link><div className="text-xs text-muted-foreground">{item.plotNumber ? `Plot #${item.plotNumber}`: item.address}</div></TableCell>
                            <TableCell>{item.buyerName || "N/A"}</TableCell>
                            <TableCell>{item.totalInstallmentPrice?.toLocaleString()}</TableCell>
                            <TableCell><div className="text-green-600">{item.paidAmount?.toLocaleString()}</div><div className="text-destructive">{item.remainingAmount?.toLocaleString()}</div></TableCell>
                            <TableCell>{item.paidInstallments} / {item.totalInstallments}</TableCell>
                            <TableCell>{item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell><Badge variant={item.status === 'Overdue' ? 'destructive' : (item.status === 'Fully Paid' ? 'secondary' : 'outline')}>{item.status}</Badge></TableCell>
                            <TableCell><div className="flex items-center gap-2"><Progress value={calculateProgress(item.paidInstallments, item.totalInstallments)} className="h-2" /><span className="text-xs text-muted-foreground">{calculateProgress(item.paidInstallments, item.totalInstallments).toFixed(0)}%</span></div></TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="outline" size="sm" onClick={() => handleOpenManageDialog(item)}><Eye className="h-4 w-4 mr-2" /> View / Manage</Button>
                              {userProfile?.role === 'admin' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="End Installment Plan" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>End Installment Plan?</AlertDialogTitle><AlertDialogDescription>This will remove the installment plan from "{item.propertyName} {item.plotNumber ? `(Plot #${item.plotNumber})` : ''}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleEndInstallmentPlan(item)} className="bg-destructive hover:bg-destructive/90">Yes, End Plan</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
             {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {installments.map(item => <InstallmentCard key={item.id} item={item} />)}
            </div>
          </div>
        )}
        <CardDescription className="text-sm text-muted-foreground p-4 border rounded-lg">
          This section tracks properties and plots sold under installment plans. You can view payment progress, remaining balances, and due dates.
          Click 'Manage' to record new installment payments for a plan.
        </CardDescription>
      </div>

      {selectedPlan && (
        <ManageInstallmentDialog
          isOpen={isManageDialogOpen}
          onOpenChange={setIsManageDialogOpen}
          onUpdate={fetchAllData}
          installmentItem={selectedPlan}
        />
      )}
    </>
  );
}
