
"use client";

import { PropertyForm } from "@/components/properties/property-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addProperty as addPropertyToDb } from "@/lib/mock-db"; // Updated import
import type { Property } from "@/types";

export default function AddPropertyPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => { // data is PropertyFormValues & { imagePreviewUrl?: string }
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newPropertyData: Omit<Property, 'id' | 'plots'> & {imageUrl?: string} = {
        name: data.name,
        address: data.address,
        imageUrl: data.imagePreviewUrl, // Use the preview URL as imageUrl for mock data
        // imageType: 'photo', // Or determine based on file if needed
    };

    addPropertyToDb(newPropertyData); // Add to centralized mock DB
    
    toast({
      title: "Property Added",
      description: `${data.name} has been successfully added.`,
    });
    setIsSubmitting(false);
    router.push("/properties"); // Redirect to properties list
  };

  return (
    <div>
      <PropertyForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
