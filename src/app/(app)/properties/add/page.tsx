
"use client";

import { PropertyForm, type PropertyFormValues } from "@/components/properties/property-form";
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
  const { user, userProfile } = useAuth();

  const handleSubmit = async (data: PropertyFormValues & { imageUrls?: string[] }) => {
    if (!user || !userProfile) {
        toast({ title: "Authentication Error", description: "You must be logged in to add a property.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    setIsSubmitting(true);
    
    const ownerId = userProfile.role === 'admin' ? user.uid : userProfile.adminId;
    if (!ownerId) {
        toast({ title: "Error", description: "Could not determine agency owner.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    const newPropertyData: Omit<Property, 'id' | 'createdAt'> = {
        userId: ownerId,
        name: data.name,
        address: data.address,
        propertyType: data.propertyType,
        imageUrls: data.imageUrls || [],
        latitude: data.latitude,
        longitude: data.longitude,
        plots: [],
        isRented: false,
        isSoldOnInstallment: false,
        isSold: false
    };

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
