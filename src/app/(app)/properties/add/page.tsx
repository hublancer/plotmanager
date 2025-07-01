
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

  const handleSubmit = async (data: any) => { // data includes PropertyFormValues & imagePreviewUrl, imageType
    setIsSubmitting(true);
    
    // In a real app with file uploads, you'd upload the file to Firebase Storage first
    // and get the URL. For this version, we'll continue using the data URL if it's a new image.
    const imageUrl = data.imageFile ? data.imagePreviewUrl : (data.imageUrl || null);


    const newPropertyData: Omit<Property, 'id'> = {
        name: data.name,
        address: data.address,
        propertyType: data.propertyType,
        imageUrl: imageUrl, 
        imageType: data.imageType,
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
