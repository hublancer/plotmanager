
"use client";

import { PropertyForm } from "@/components/properties/property-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addProperty } from "@/lib/mock-db"; 
import type { Property } from "@/types";

export default function AddPropertyPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => { // data includes PropertyFormValues & imageUrls
    setIsSubmitting(true);
    
    // In a real app, you'd upload each file from data.imageFiles to Firebase Storage
    // and get the URLs. For this version, we'll use the generated data URLs.
    const newPropertyData: Omit<Property, 'id'> = {
        name: data.name,
        address: data.address,
        propertyType: data.propertyType,
        imageUrls: data.imageUrls || [],
        latitude: data.latitude,
        longitude: data.longitude,
        plots: [], // Initialize with empty plots array
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
