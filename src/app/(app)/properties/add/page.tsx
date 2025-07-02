
"use client";

import { PropertyForm } from "@/components/properties/property-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addProperty } from "@/lib/mock-db"; 
import type { Property } from "@/types";
import { useAuth } from "@/context/auth-context";

export default function AddPropertyPage() {
  const { toast } = useToast();
  const router = useRouter();
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
    router.push("/properties"); 
  };

  return (
    <div>
      <PropertyForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
