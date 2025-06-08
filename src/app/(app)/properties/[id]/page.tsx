
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Property, PlotData } from "@/types";
import { PlotPinner } from "@/components/properties/plot-pinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, MapPin, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { getPropertyById, updateProperty } from "@/lib/mock-db"; 
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';

const PropertyLocationMap = dynamic(
  () => import('@/components/maps/property-location-map').then(mod => mod.PropertyLocationMap),
  { 
    ssr: false,
    loading: () => <div className="h-[250px] w-full rounded-md bg-muted flex items-center justify-center"><p>Loading map...</p></div>
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading property details...</div>;
  }

  if (!property) {
    return <div className="text-center py-10">Property not found.</div>;
  }
  
  const mapPosition = (property.latitude && property.longitude) 
    ? [property.latitude, property.longitude] as LatLngExpression 
    : null;

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
                     <Badge variant="outline" className="inline-flex items-center gap-1 text-sm border-blue-500 text-blue-600">
                        <MapPin className="h-4 w-4" />
                        Location Set
                    </Badge>
                )}
                 {!mapPosition && (
                     <Badge variant="outline" className="inline-flex items-center gap-1 text-sm border-orange-500 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        Map Location Not Set
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
          {mapPosition ? (
            <div>
              <h3 className="text-xl font-semibold mb-2">Property Location</h3>
              <PropertyLocationMap position={mapPosition} popupText={property.name} />
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-md text-center">
              <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
              <p className="text-muted-foreground">Map location has not been set for this property.</p>
            </div>
          )}
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Plot Details & Layout</h3>
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
