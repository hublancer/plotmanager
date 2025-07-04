
"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addProperty, updateProperty } from "@/lib/mock-db";
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
  initialData?: Property | null;
}

export function PropertyFormDialog({ isOpen, onOpenChange, onUpdate, initialData }: PropertyFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (data: any) => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to manage properties.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    setIsSubmitting(true);
    
    try {
      if (initialData) {
        // Update existing property
        const propertyData: Partial<Property> = {
          name: data.name,
          address: data.address,
          propertyType: data.propertyType,
          imageUrls: data.imageUrls || [],
          latitude: data.latitude,
          longitude: data.longitude,
        };
        await updateProperty(initialData.id, propertyData);
        toast({ title: "Property Updated", description: `${data.name} has been successfully updated.` });

      } else {
        // Add new property
        const newPropertyData: Omit<Property, 'id' | 'createdAt'> = {
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
            isSold: false,
        };
        await addProperty(newPropertyData); 
        toast({ title: "Property Added", description: `${data.name} has been successfully added.` });
      }

      setIsSubmitting(false);
      onUpdate();
      onOpenChange(false);

    } catch (error) {
        console.error("Failed to save property:", error);
        toast({ title: "Error", description: "Could not save the property.", variant: "destructive" });
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Property' : 'Add New Property'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details for the property below.' : 'Enter the details for the new property. Status can be changed later.'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[75vh] overflow-y-auto p-1">
          <PropertyForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            initialData={initialData} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
