
"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addProperty } from "@/lib/mock-db";
import type { Property } from "@/types";
import { useAuth } from "@/context/auth-context";
import { PropertyForm } from "@/components/properties/property-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PropertyFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function PropertyFormDialog({ isOpen, onOpenChange, onUpdate }: PropertyFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (data: any) => { // data includes PropertyFormValues & imageUrls & conditional fields
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to add a property.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    setIsSubmitting(true);
    
    const newPropertyData: Omit<Property, 'id'> = {
        userId: user.uid,
        name: data.name,
        address: data.address,
        propertyType: data.propertyType,
        imageUrls: data.imageUrls || [],
        latitude: data.latitude,
        longitude: data.longitude,
        plots: [],
        isRented: false,
        isSoldOnInstallment: false,
    };

    if (data.status === 'rented' && data.rentStartDate) {
        newPropertyData.isRented = true;
        newPropertyData.tenantName = data.tenantName;
        newPropertyData.rentAmount = data.rentAmount;
        newPropertyData.rentFrequency = data.rentFrequency;
        newPropertyData.rentStartDate = data.rentStartDate.toISOString();
    } else if (data.status === 'installment' && data.purchaseDate) {
        newPropertyData.isSoldOnInstallment = true;
        newPropertyData.buyerName = data.buyerName;
        newPropertyData.totalInstallmentPrice = data.totalInstallmentPrice;
        newPropertyData.downPayment = data.downPayment;
        newPropertyData.purchaseDate = data.purchaseDate.toISOString();
        newPropertyData.installmentFrequency = data.installmentFrequency;
        newPropertyData.installmentDuration = data.installmentDuration;
    }

    await addProperty(newPropertyData); 
    
    toast({
      title: "Property Added",
      description: `${data.name} has been successfully added.`,
    });
    setIsSubmitting(false);
    onUpdate();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Enter the details for the property below. You can specify if it's available, rented, or sold on installment.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[75vh] overflow-y-auto p-1">
          <PropertyForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
