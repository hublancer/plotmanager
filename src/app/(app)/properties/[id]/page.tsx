
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Property, PlotData } from "@/types";
import { PlotPinner } from "@/components/properties/plot-pinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { getPropertyById, updateProperty } from "@/lib/mock-db"; // Updated imports

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const propertyId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (propertyId) {
      setIsLoading(true);
      // Simulate API delay for fetching
      setTimeout(() => {
        const data = getPropertyById(propertyId); // Use centralized mock data
        setProperty(data || null);
        setIsLoading(false);
      }, 500);
    }
  }, [propertyId]);

  const handlePlotsChange = (updatedPlots: PlotData[]) => {
    if (property) {
      const updatedPropertyData = { ...property, plots: updatedPlots };
      const result = updateProperty(property.id, { plots: updatedPlots }); // Update centralized mock data
      if (result) {
        setProperty(result);
        toast({
          title: "Plots Updated",
          description: `Plot information for ${property.name} has been saved.`,
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to update plots for ${property.name}.`,
          variant: "destructive"
        });
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading property details...</div>;
  }

  if (!property) {
    return <div className="text-center py-10">Property not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
      </Button>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold">{property.name}</CardTitle>
            <CardDescription className="text-lg">{property.address}</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => alert('Edit property details modal/page should open here.')}>
            <Edit className="h-5 w-5" />
            <span className="sr-only">Edit Property Details</span>
          </Button>
        </CardHeader>
        <CardContent>
          {property.imageUrl ? (
            <PlotPinner 
              imageUrl={property.imageUrl} 
              initialPlots={property.plots}
              onPlotsChange={handlePlotsChange}
              imageType={property.imageType}
            />
          ) : (
            <div className="text-center py-10 bg-muted rounded-lg">
              <Image src="https://placehold.co/300x200.png?text=No+Image" alt="No image available" width={300} height={200} className="mx-auto rounded-md" data-ai-hint="placeholder missing image"/>
              <p className="mt-4 text-muted-foreground">No image uploaded for this property.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
