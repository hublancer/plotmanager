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

// Mock data fetching function
const fetchPropertyById = async (id: string): Promise<Property | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const mockProperties: Property[] = [
    { 
      id: "1", 
      name: "Sunset Villa", 
      address: "123 Sunnyside Ave", 
      imageUrl: "https://placehold.co/800x600.png?text=Sunset+Villa+Layout",
      imageType: 'photo',
      plots: [
        { id: "p1", plotNumber: "101", buyerName: "John Doe", buyerContact: "555-1234", price: 150000, x: 25, y: 30, details: "Corner plot with sea view" },
        { id: "p2", plotNumber: "102", buyerName: "Jane Smith", buyerContact: "555-5678", price: 120000, x: 50, y: 60, details: "Garden facing plot" },
      ] 
    },
    { 
      id: "2", 
      name: "Greenwood Heights", 
      address: "456 Forest Ln", 
      imageUrl: "https://placehold.co/800x600.png?text=Greenwood+Layout", 
      imageType: 'photo',
      plots: [] 
    },
     { 
      id: "pdf-property", 
      name: "PDF Plan Property", 
      address: "789 Document Way", 
      imageUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // Placeholder PDF
      imageType: 'pdf',
      plots: [] 
    },
  ];
  return mockProperties.find(p => p.id === id) || null;
};

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
      fetchPropertyById(propertyId).then(data => {
        setProperty(data);
        setIsLoading(false);
      });
    }
  }, [propertyId]);

  const handlePlotsChange = (updatedPlots: PlotData[]) => {
    if (property) {
      const updatedProperty = { ...property, plots: updatedPlots };
      setProperty(updatedProperty);
      // Here you would typically save the updated property to your backend
      console.log("Updated plots for property:", propertyId, updatedPlots);
      toast({
        title: "Plots Updated",
        description: `Plot information for ${property.name} has been saved.`,
      });
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
