
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getInstallmentProperties, getProperties, updateProperty } from "@/lib/mock-db"; 
import type { InstallmentDetails, Property } from "@/types";

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
import { InstallmentPlanFormDialog } from "@/components/installments/installment-plan-form-dialog";
import { ManageInstallmentDialog } from "@/components/installments/manage-installment-dialog";
import { Eye, PlusCircle, Loader2, Trash2, Settings } from "lucide-react";

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<InstallmentDetails[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InstallmentDetails | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [installmentsData, propertiesData] = await Promise.all([
        getInstallmentProperties(user.uid),
        getProperties(user.uid),
      ]);
      setInstallments(installmentsData);
      setAllProperties(propertiesData);
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

  const handleOpenPlanForm = () => {
    setIsPlanFormOpen(true);
  };
  
  const handleOpenManageDialog = (plan: InstallmentDetails) => {
    setSelectedPlan(plan);
    setIsManageDialogOpen(true);
  };

  const handleEndInstallmentPlan = async (propertyId: string) => {
    const success = await updateProperty(propertyId, { 
      isSoldOnInstallment: false,
      buyerName: "",
      totalInstallmentPrice: 0,
      downPayment: 0,
      installmentDuration: 0,
      installmentFrequency: undefined,
      purchaseDate: ""
    });
    if (success) {
      toast({ title: "Installment Plan Ended", description: "The property is no longer on an installment plan." });
      fetchAllData();
    } else {
      toast({ title: "Error", description: "Could not end the installment plan.", variant: "destructive" });
    }
  };

  const calculateProgress = (paid?: number, total?: number) => {
    if (paid === undefined || total === undefined || total === 0) return 0;
    return (paid / total) * 100;
  };
  
  const availableProperties = useMemo(() => {
    return allProperties.filter(p => !p.isRented && !p.isSoldOnInstallment);
  }, [allProperties]);


  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Installment Tracking</h2>
          <Button onClick={handleOpenPlanForm}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Installment Plan
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
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
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin inline-block" /></TableCell></TableRow>
                ) : installments.length > 0 ? (
                  installments.map((prop) => (
                    <TableRow key={prop.id}>
                      <TableCell>
                        <Link href={`/properties/${prop.id}`} className="font-medium hover:underline">{prop.name}</Link>
                        <div className="text-xs text-muted-foreground">{prop.address}</div>
                      </TableCell>
                       <TableCell>{prop.buyerName || "N/A"}</TableCell>
                      <TableCell>{prop.totalInstallmentPrice?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="text-green-600">{prop.paidAmount?.toLocaleString()}</div>
                        <div className="text-destructive">{prop.remainingAmount?.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>{prop.paidInstallments} / {prop.totalInstallments}</TableCell>
                      <TableCell>{prop.nextDueDate ? new Date(prop.nextDueDate).toLocaleDateString() : 'N/A'}</TableCell>
                       <TableCell>
                        <Badge variant={prop.status === 'Overdue' ? 'destructive' : (prop.status === 'Fully Paid' ? 'secondary' : 'outline')}>
                          {prop.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <Progress value={calculateProgress(prop.paidInstallments, prop.totalInstallments)} className="h-2" />
                           <span className="text-xs text-muted-foreground">{calculateProgress(prop.paidInstallments, prop.totalInstallments).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                         <Button variant="outline" size="sm" onClick={() => handleOpenManageDialog(prop)}>
                            <Settings className="h-4 w-4 mr-2" /> Manage
                         </Button>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="End Installment Plan" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>End Installment Plan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the installment plan from "{prop.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleEndInstallmentPlan(prop.id)} className="bg-destructive hover:bg-destructive/90">
                                Yes, End Plan
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow><TableCell colSpan={9} className="text-center h-24">No properties on installment plans found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <CardDescription className="text-sm text-muted-foreground p-4 border rounded-lg">
          This section tracks properties sold under installment plans. You can view payment progress, remaining balances, and due dates.
          Click 'Manage' to record new installment payments for a plan.
        </CardDescription>
      </div>

      <InstallmentPlanFormDialog
        isOpen={isPlanFormOpen}
        onOpenChange={setIsPlanFormOpen}
        onUpdate={fetchAllData}
        initialData={null} // This form is only for creation now
        properties={availableProperties}
      />

      {selectedPlan && (
        <ManageInstallmentDialog
          isOpen={isManageDialogOpen}
          onOpenChange={setIsManageDialogOpen}
          onUpdate={fetchAllData}
          installmentPlan={selectedPlan}
        />
      )}
    </>
  );
}
