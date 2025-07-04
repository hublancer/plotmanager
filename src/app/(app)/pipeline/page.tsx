
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@/types";
import { getLeads, deleteLead, updateLead } from "@/lib/mock-db";
import { LeadCard } from "@/components/pipeline/lead-card";
import { LeadFormDialog } from "@/components/pipeline/lead-form-dialog";
import { LeadLocationDialog } from "@/components/pipeline/lead-location-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const stages: Lead['status'][] = ['New', 'Active', 'Deal', 'Done'];

const stageColors: Record<Lead['status'], string> = {
  New: "bg-blue-500",
  Active: "bg-yellow-500",
  Deal: "bg-purple-500",
  Done: "bg-green-500",
};

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const ownerId = userProfile?.role === 'admin' ? user.uid : userProfile?.adminId;
    if (!ownerId) {
      setIsLoading(false);
      return;
    }
    const leadsData = await getLeads(ownerId);
    setLeads(leadsData);
    setIsLoading(false);
  }, [user, userProfile]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleOpenForm = (lead: Lead | null = null) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };
  
  const handleViewDetails = (lead: Lead) => {
    setViewingLead(lead);
    setIsDetailsDialogOpen(true);
  };

  const handleDelete = async (leadId: string) => {
    const success = await deleteLead(leadId);
    if (success) {
      toast({ title: "Lead Deleted", description: "The lead has been removed from your survey." });
      fetchLeads();
    } else {
      toast({ title: "Error", description: "Failed to delete lead.", variant: "destructive" });
    }
  };
  
  const handleStatusChange = async (lead: Lead, newStatus: Lead['status']) => {
    const originalStatus = lead.status;
    // Optimistically update UI
    setLeads(prev => prev.map(l => l.id === lead.id ? {...l, status: newStatus} : l));
    
    const result = await updateLead(lead.id, { status: newStatus });
    if (!result) {
        toast({ title: "Update Failed", description: `Could not move lead to ${newStatus}.`, variant: "destructive"});
        // Revert UI change
        setLeads(prev => prev.map(l => l.id === lead.id ? {...l, status: originalStatus} : l));
    }
  };

  const groupedLeads = leads.reduce((acc, lead) => {
    (acc[lead.status] = acc[lead.status] || []).push(lead);
    return acc;
  }, {} as Record<Lead['status'], Lead[]>);

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">Lead Survey</h2>
            <p className="text-muted-foreground">Manage your leads through the survey process.</p>
          </div>
          <Button onClick={() => handleOpenForm()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Lead
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {stages.map((stage) => {
              const stageLeads = groupedLeads[stage] || [];
              const totalValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);

              return (
                <Card key={stage} className="flex flex-col h-full bg-secondary/50 shadow-md">
                  <CardHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <span className={cn("h-3 w-3 rounded-full", stageColors[stage])} />
                         <CardTitle className="text-lg">{stage}</CardTitle>
                      </div>
                      <Badge variant="secondary">{stageLeads.length}</Badge>
                    </div>
                     <p className="text-sm font-medium text-muted-foreground mt-1">
                        Total Value: PKR {totalValue.toLocaleString()}
                     </p>
                  </CardHeader>
                  <ScrollArea className="flex-1">
                    <CardContent className="p-2 space-y-2">
                      {stageLeads.length > 0 ? (
                        stageLeads.map((lead) => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            onEdit={() => handleOpenForm(lead)}
                            onDelete={() => handleDelete(lead.id)}
                            onStatusChange={(newStatus) => handleStatusChange(lead, newStatus)}
                            onViewDetails={() => handleViewDetails(lead)}
                            allStages={stages}
                            role={userProfile?.role}
                          />
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No leads in this stage.
                        </div>
                      )}
                    </CardContent>
                  </ScrollArea>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <LeadFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onUpdate={fetchLeads}
        initialData={editingLead}
      />
      
      <LeadLocationDialog
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        lead={viewingLead}
      />
    </>
  );
}
