
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import type { Property, PlotData } from "@/types";
import { PlotPinner } from "@/components/properties/plot-pinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, MapPin, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { getPropertyById, updateProperty } from "@/lib/mock-db"; 
import { LocationMapEmbed } from "@/components/maps/property-location-map";


export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const propertyId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (propertyId) {
      const fetchProperty = async () => {
        setIsLoading(true);
        const data = await getPropertyById(propertyId); 
        setProperty(data || null);
        setIsLoading(false);
      };
      fetchProperty();
    }
  }, [propertyId]);

  const handlePlotsChange = async (updatedPlots: PlotData[]) => {
    if (property) {
      const result = await updateProperty(property.id, { plots: updatedPlots }); 
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
  
  const hasLocation = useMemo(() => {
    return !!(property?.latitude && property?.longitude) || !!property?.address;
  }, [property]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading property details...</span>
      </div>
    );
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
                 {property.latitude && property.longitude && (
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
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">Property Location</h3>
                {property.latitude && property.longitude && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Maps
                    </a>
                  </Button>
                )}
            </div>
            {hasLocation ? (
              <div className="h-[300px] w-full rounded-md overflow-hidden border shadow-sm">
                <LocationMapEmbed
                  coordinates={property.latitude && property.longitude ? { lat: property.latitude, lng: property.longitude } : null}
                  address={property.address}
                />
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-md text-center">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
                <p className="text-muted-foreground">No location data provided for this property.</p>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 mt-6">Plot Details & Layout</h3>
            {property.imageUrls && property.imageUrls.length > 0 ? (
              <PlotPinner 
                imageUrls={property.imageUrls}
                initialPlots={property.plots}
                onPlotsChange={handlePlotsChange}
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
