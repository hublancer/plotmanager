
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import type { Property, PlotData } from "@/types";
import { PlotPinner } from "@/components/properties/plot-pinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { getPropertyById, updateProperty } from "@/lib/mock-db"; 
// import { PropertyLocationMap } from "@/components/maps/property-location-map"; // Static import removed
import type { LatLngExpression } from 'leaflet';
import dynamic from 'next/dynamic';

const DynamicPropertyLocationMap = dynamic(() => 
  import('@/components/maps/property-location-map').then(mod => mod.PropertyLocationMap),
  { 
    ssr: false,
    loading: () => <div className="h-[300px] w-full rounded-md border flex items-center justify-center bg-muted"><p>Loading map...</p></div>
  }
);


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
      setTimeout(() => {
        const data = getPropertyById(propertyId); 
        setProperty(data || null);
        setIsLoading(false);
      }, 500);
    }
  }, [propertyId]);

  const handlePlotsChange = (updatedPlots: PlotData[]) => {
    if (property) {
      const result = updateProperty(property.id, { plots: updatedPlots }); 
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
  
  const mapPosition = useMemo(() => {
    if (property?.latitude && property?.longitude) {
      return [property.latitude, property.longitude] as LatLngExpression;
    }
    return null;
  }, [property]);


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
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="text-3xl font-bold">{property.name}</CardTitle>
            <CardDescription className="text-lg">{property.address}</CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
                {property.propertyType && (
                     <Badge variant="secondary" className="inline-flex items-center gap-1 text-sm">
                        <Package className="h-4 w-4" />
                        {property.propertyType}
                    </Badge>
                )}
                 {mapPosition && (
                    <Badge variant="outline" className="inline-flex items-center gap-1 text-sm border-green-500 text-green-600">
                        <MapPin className="h-4 w-4" />
                        Location Pinned
                    </Badge>
                )}
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => alert('Edit property details modal/page should open here.')} className="flex-shrink-0">
            <Edit className="h-5 w-5" />
            <span className="sr-only">Edit Property Details</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Property Location</h3>
            {mapPosition ? (
              <div className="h-[300px] w-full rounded-md overflow-hidden border shadow-sm">
                <DynamicPropertyLocationMap
                  key={`${mapPosition[0]}-${mapPosition[1]}-details`}
                  position={mapPosition}
                  popupText={property.name}
                  interactive={false} 
                  mapHeight="100%"
                />
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-md text-center">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
                <p className="text-muted-foreground">No map location pinned for this property.</p>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 mt-6">Plot Details & Layout</h3>
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
                <p className="mt-4 text-muted-foreground">No image or layout plan uploaded for this property.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    