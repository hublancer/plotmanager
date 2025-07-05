
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
import { useAuth } from "@/context/auth-context";


export default function PropertyDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userProfile } = useAuth();

  const propertyId = typeof id === 'string' ? id : '';

  useEffect(() => {
    if (propertyId && user && userProfile) {
      const fetchProperty = async () => {
        setIsLoading(true);
        const data = await getPropertyById(propertyId); 
        
        // Security Check: Make sure the fetched property belongs to the logged-in user or their admin
        const ownerId = userProfile.role === 'admin' ? user.uid : userProfile.adminId;

        if (data && data.userId === ownerId) {
            setProperty(data);
        } else {
            setProperty(null); // Set to null if not found or not owned
            toast({
                title: "Access Denied",
                description: "You do not have permission to view this property or it does not exist.",
                variant: "destructive"
            });
            router.push('/properties');
        }
        setIsLoading(false);
      };
      fetchProperty();
    } else if (!user && !isLoading) {
        // Handle case where user is not logged in yet
        setIsLoading(true);
    }
  }, [propertyId, user, userProfile, toast, router]);

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
  
  const hasCoordinates = useMemo(() => {
    return !!(property?.latitude && property?.longitude);
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
    return (
        <div className="text-center py-10">
            <h2 className="text-xl font-semibold">Property Not Found</h2>
            <p className="text-muted-foreground mt-2">
                This property may have been deleted or you may not have access to view it.
            </p>
             <Button variant="outline" onClick={() => router.push('/properties')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go to Properties
            </Button>
        </div>
    );
  }
  
  const hasAddress = !!property.address;
  const hasLocationInfo = hasCoordinates || hasAddress;

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
                 {hasCoordinates && (
                    <Badge variant="outline" className="inline-flex items-center gap-1 text-sm border-green-500 text-green-600">
                        <MapPin className="h-4 w-4" />
                        Location Pinned
                    </Badge>
                )}
            </div>
          </div>
          {userProfile?.role !== 'agent' && (
            <Button variant="outline" size="icon" onClick={() => alert('Edit property details modal/page should open here.')} className="flex-shrink-0">
              <Edit className="h-5 w-5" />
              <span className="sr-only">Edit Property Details</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div>
            <h3 className="text-xl font-semibold">Property Location</h3>
             {hasLocationInfo ? (
              <div className="mt-2 flex items-center gap-4 p-4 bg-muted/50 rounded-md border">
                <MapPin className="h-8 w-8 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">{hasCoordinates ? "Location Pinned" : "Address Available"}</p>
                  <p className="text-sm text-muted-foreground">
                    {hasCoordinates ? `Lat: ${property.latitude}, Lng: ${property.longitude}` : property.address}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <a
                    href={hasCoordinates ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Maps
                  </a>
                </Button>
              </div>
            ) : (
              <div className="mt-2 p-4 bg-muted rounded-md text-center border">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
                <p className="text-muted-foreground">No location data provided for this property.</p>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 mt-6">Plot Details & Layout</h3>
            {property.imageUrls && property.imageUrls.length > 0 ? (
              <PlotPinner 
                property={property}
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
    
