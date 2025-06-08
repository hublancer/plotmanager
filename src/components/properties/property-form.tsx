
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Property } from "@/types";
import { useState, useEffect } from "react";
import Image from "next/image";
import { UploadCloud, FileText, MapPin } from "lucide-react";
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import { cn } from "@/lib/utils";

const PropertyLocationMap = dynamic(
  () => import('@/components/maps/property-location-map').then(mod => mod.PropertyLocationMap),
  {
    ssr: false,
    loading: () => <div className="h-[300px] w-full rounded-md bg-muted flex items-center justify-center"><p>Loading map...</p></div>
  }
);

const propertyTypes = [
  "Residential Plot",
  "Commercial Plot",
  "House",
  "Apartment",
  "Shop",
  "File",
  "Agricultural Land",
  "Other",
];

const propertyFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  propertyType: z.string().min(1, "Property type is required"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  imageFile: z.any().optional(),
}).refine(data => (data.latitude === undefined && data.longitude === undefined) || (data.latitude !== undefined && data.longitude !== undefined), {
  message: "Both latitude and longitude must be provided, or neither.",
  path: ["latitude"], // Show error near latitude, or choose a general path
});


type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyFormProps {
  initialData?: Property | null;
  onSubmit: (data: PropertyFormValues & { imagePreviewUrl?: string, imageType?: 'photo' | 'pdf' }) => void;
  isSubmitting?: boolean;
}

export function PropertyForm({ initialData, onSubmit, isSubmitting }: PropertyFormProps) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [imagePreviewType, setImagePreviewType] = useState<'image' | 'pdf' | null>(null);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      propertyType: initialData?.propertyType || "",
      latitude: initialData?.latitude,
      longitude: initialData?.longitude,
      imageFile: undefined,
    },
  });

  const watchedLatitude = form.watch("latitude");
  const watchedLongitude = form.watch("longitude");
  const [mapPosition, setMapPosition] = useState<LatLngExpression | null>(null);

  useEffect(() => {
    if (initialData?.imageUrl) {
      setImagePreviewUrl(initialData.imageUrl);
      if (initialData.imageType === 'pdf') {
        setImagePreviewType('pdf');
      } else if (initialData.imageType === 'photo') {
        setImagePreviewType('image');
      } else {
        setImagePreviewType('image');
      }
    }
    if (initialData?.latitude && initialData?.longitude) {
      setMapPosition([initialData.latitude, initialData.longitude]);
    }
  }, [initialData]);

  useEffect(() => {
    if (typeof watchedLatitude === 'number' && typeof watchedLongitude === 'number') {
      setMapPosition([watchedLatitude, watchedLongitude]);
    } else {
      setMapPosition(null);
    }
  }, [watchedLatitude, watchedLongitude]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("imageFile", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
        if (file.type === "application/pdf") {
          setImagePreviewType("pdf");
        } else if (file.type.startsWith("image/")) {
          setImagePreviewType("image");
        } else {
          setImagePreviewType(null);
        }
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue("imageFile", undefined);
      if (initialData?.imageUrl) {
        setImagePreviewUrl(initialData.imageUrl);
        setImagePreviewType(initialData.imageType === 'pdf' ? 'pdf' : (initialData.imageUrl && initialData.imageType !== 'pdf' ? 'image' : null));
      } else {
        setImagePreviewUrl(null);
        setImagePreviewType(null);
      }
    }
  };

  const handleSubmit = (values: PropertyFormValues) => {
    onSubmit({ ...values, imagePreviewUrl: imagePreviewUrl || undefined, imageType: imagePreviewType || undefined });
  };

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    form.setValue("latitude", parseFloat(latlng.lat.toFixed(6)));
    form.setValue("longitude", parseFloat(latlng.lng.toFixed(6)));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Property" : "Add New Property"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Executive Block Plot or Green Valley House" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address / Location</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Plot #123, Block B, Sector C, Society Name, City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {propertyTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card className="p-4 pt-2 bg-secondary/30">
              <FormLabel className="text-base font-semibold flex items-center gap-2 mb-3"><MapPin className="h-5 w-5 text-primary" /> Location on Map</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="e.g., 31.5204" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="e.g., 74.3587" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription className="mt-2 text-xs">
                Enter coordinates manually or click on the map to set the location. Geocoding from address is a future enhancement.
              </FormDescription>
              <div className="mt-4">
                <PropertyLocationMap
                  key={mapPosition ? `map-lat-${mapPosition[0]}-lng-${mapPosition[1]}` : 'map-no-position'}
                  position={mapPosition}
                  popupText={form.getValues("name") || "Property Location"}
                  onPositionChange={handleMapClick}
                />
              </div>
            </Card>

            <FormField
              control={form.control}
              name="imageFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Image (Layout, Map, or Photo)</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center space-y-2">
                       <label htmlFor="imageUpload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        {imagePreviewUrl && imagePreviewType === 'image' ? (
                          <Image src={imagePreviewUrl} alt="Preview" width={200} height={150} className="object-contain max-h-40 rounded-md" data-ai-hint="property image" />
                        ) : imagePreviewUrl && imagePreviewType === 'pdf' ? (
                          <div className="flex flex-col items-center justify-center text-center p-4">
                            <FileText className="w-16 h-16 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">PDF Selected</p>
                            {form.getValues("imageFile") && (
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{(form.getValues("imageFile") as File).name}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, PDF</p>
                          </div>
                        )}
                        <Input id="imageUpload" type="file" className="hidden" onChange={handleImageChange} accept="image/*,.pdf" />
                      </label>
                    </div>
                  </FormControl>
                  <FormDescription>Upload an image, society map, or PDF of the property. PDF pinning is limited.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : (initialData ? "Save Changes" : "Add Property")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
