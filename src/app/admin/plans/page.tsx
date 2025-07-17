
"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getPlans } from "@/lib/mock-db";
import type { Plan } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Loader2 } from "lucide-react";
import { PlanFormDialog } from "@/components/admin/plan-form-dialog";

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    const data = await getPlans();
    setPlans(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);
  
  const handleOpenDialog = (plan: Plan | null) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  }

  const PlanCard = ({ plan }: { plan: Plan }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg">{plan.name}</h3>
            <Badge variant={plan.isActive ? "secondary" : "outline"}>
                {plan.isActive ? "Active" : "Inactive"}
            </Badge>
        </div>
        <div className="mt-4 space-y-2 text-sm">
            <p><span className="font-semibold">Price:</span> PKR {plan.price.toLocaleString()}</p>
            <p><span className="font-semibold">Duration:</span> {plan.durationInDays} days</p>
        </div>
        <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(plan)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-2xl font-semibold">Manage Subscription Plans</h2>
              <p className="text-muted-foreground">Create and edit the subscription plans available to users.</p>
            </div>
            <Button onClick={() => handleOpenDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Plan
            </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin mx-auto h-8 w-8" /></div>
        ) : plans.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No plans created yet.</CardContent></Card>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Plan Name</TableHead><TableHead>Price (PKR)</TableHead><TableHead>Duration (Days)</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {plans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-medium">{plan.name}</TableCell>
                                <TableCell>{plan.price.toLocaleString()}</TableCell>
                                <TableCell>{plan.durationInDays}</TableCell>
                                <TableCell><Badge variant={plan.isActive ? "secondary" : "outline"}>{plan.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}><Edit className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
             {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
            </div>
          </div>
        )}
      </div>
      <PlanFormDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUpdate={fetchPlans}
        initialData={editingPlan}
      />
    </>
  );
}
