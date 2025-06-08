
"use client";

import { PropertyForm } from "@/components/properties/property-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addProperty as addPropertyToDb } from "@/lib/mock-db"; 
import type { Property } from "@/types";

export default function AddPropertyPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => { // data includes PropertyFormValues & imagePreviewUrl, imageType
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    const newPropertyData: Omit<Property, 'id' | 'plots'> = {
        name: data.name,
        address: data.address,
        propertyType: data.propertyType,
        imageUrl: data.imagePreviewUrl, 
        imageType: data.imageType,
    };

    addPropertyToDb(newPropertyData); 
    
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
