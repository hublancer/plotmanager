
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Property } from "@/types";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { UploadCloud, FileText, MapPin, Loader2 } from "lucide-react";
import type { LatLngExpression } from 'leaflet';
import dynamic from 'next/dynamic';
import { useToast } from "@/hooks/use-toast";

const DynamicPropertyLocationMap = dynamic(() => 
  import('@/components/maps/property-location-map').then(mod => mod.PropertyLocationMap),
  { 
    ssr: false,
    loading: () => <div className="h-[350px] w-full rounded-md border flex items-center justify-center bg-muted"><p>Loading map...</p></div>
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
  imageFile: z.any().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
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
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState<LatLngExpression | null>(
    initialData?.latitude && initialData?.longitude
      ? [initialData.latitude, initialData.longitude]
      : null
  );
  const { toast } = useToast();

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      propertyType: initialData?.propertyType || "",
      imageFile: undefined,
      latitude: initialData?.latitude || null,
      longitude: initialData?.longitude || null,
    },
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.imageUrl) {
        setImagePreviewUrl(initialData.imageUrl);
        // Since we now convert PDFs, all existing imageUrls should be treated as photos for rendering.
        setImagePreviewType('image');
      }
      if (initialData.latitude && initialData.longitude) {
        const pos: LatLngExpression = [initialData.latitude, initialData.longitude];
        setMapPosition(pos);
        form.setValue('latitude', initialData.latitude);
        form.setValue('longitude', initialData.longitude);
      }
    }
  }, [initialData, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("imageFile", file);

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviewUrl(reader.result as string);
          setImagePreviewType("image");
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        setIsRenderingPdf(true);
        setImagePreviewType("pdf");
        setImagePreviewUrl(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const pdfData = e.target?.result;
            if (pdfData instanceof ArrayBuffer) {
                try {
                    const pdfjs = await import('pdfjs-dist/build/pdf');
                    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

                    const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
                    const page = await pdf.getPage(1);
                    const viewport = page.getViewport({ scale: 2.0 });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    if (!context) throw new Error("Could not get canvas context");
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport }).promise;
                    setImagePreviewUrl(canvas.toDataURL('image/png'));
                    setImagePreviewType("image"); // Treat the converted PDF as an image for preview
                } catch (err) {
                    console.error("Error rendering PDF preview:", err);
                    toast({ title: "PDF Error", description: "Could not render PDF preview.", variant: "destructive" });
                    setImagePreviewUrl(null);
                } finally {
                    setIsRenderingPdf(false);
                }
            }
        };
        reader.readAsArrayBuffer(file);
      }
    } else {
      form.setValue("imageFile", undefined);
      if (initialData?.imageUrl) {
        setImagePreviewUrl(initialData.imageUrl);
        setImagePreviewType('image');
      } else {
        setImagePreviewUrl(null);
        setImagePreviewType(null);
      }
    }
  };

  const handleMapPositionChange = useCallback((newPosition: { lat: number; lng: number }) => {
    setMapPosition([newPosition.lat, newPosition.lng]);
    form.setValue('latitude', newPosition.lat);
    form.setValue('longitude', newPosition.lng);
  }, [form]);

  const handleSubmit = (values: PropertyFormValues) => {
    onSubmit({ 
        ...values, 
        imagePreviewUrl: imagePreviewUrl || undefined, 
        // After conversion, all files are treated as 'photo' type for storage and display
        imageType: imagePreviewUrl ? 'photo' : undefined 
    });
  };
  
  useEffect(() => {
    const lat = form.getValues('latitude');
    const lng = form.getValues('longitude');
    if (lat && lng) {
        if (!mapPosition || (Array.isArray(mapPosition) && (mapPosition[0] !== lat || mapPosition[1] !== lng))) {
            setMapPosition([lat, lng]);
        }
    } else {
        if (mapPosition !== null) {
            setMapPosition(null);
        }
    }
  }, [form.watch('latitude'), form.watch('longitude'), form, mapPosition]);


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
             <div className="space-y-2">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowMap(!showMap)}
                    className="w-full sm:w-auto"
                >
                    <MapPin className="mr-2 h-4 w-4" />
                    {showMap ? "Hide Map" : "Pin Location on Map"}
                </Button>
                <FormDescription>
                    {showMap 
                        ? "Click on the map to set the precise location. The address field above is for reference." 
                        : "Optionally, pin the exact location on a map for better record-keeping."}
                </FormDescription>
            </div>

            {/* Hidden latitude and longitude fields, managed by map interaction */}
             <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem className="hidden">
                   <FormLabel className="sr-only">Latitude</FormLabel>
                   <FormControl>
                      <Input type="number" step="any" {...field} value={field.value ?? ""} />
                   </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="longitude" 
              render={({ field }) => (
                <FormItem className="hidden">
                   <FormLabel className="sr-only">Longitude</FormLabel>
                   <FormControl>
                      <Input type="number" step="any" {...field} value={field.value ?? ""} />
                   </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />

            {showMap && (
                <div className="h-[350px] w-full rounded-md overflow-hidden border shadow-sm">
                    <DynamicPropertyLocationMap
                        key={mapPosition ? `${mapPosition[0]}-${mapPosition[1]}` : 'map-key-form'} 
                        position={mapPosition}
                        onPositionChange={handleMapPositionChange}
                        mapHeight="100%"
                        interactive={true}
                        popupText={form.getValues('name') || "Property Location"}
                    />
                </div>
            )}

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

            <FormField
              control={form.control}
              name="imageFile"
              render={() => (
                <FormItem>
                  <FormLabel>Property Image (Layout, Map, or Photo)</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center space-y-2">
                       <label htmlFor="imageUpload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        {isRenderingPdf ? (
                           <div className="flex flex-col items-center justify-center text-center p-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground mt-2">Converting PDF to image...</p>
                          </div>
                        ) : imagePreviewUrl && imagePreviewType === 'image' ? (
                          <Image src={imagePreviewUrl} alt="Preview" width={200} height={150} className="object-contain max-h-40 rounded-md" data-ai-hint="property image" />
                        ) : imagePreviewType === 'pdf' ? ( // This is a transient state before rendering starts
                           <div className="flex flex-col items-center justify-center text-center p-4">
                            <FileText className="w-16 h-16 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">PDF Selected</p>
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
                  <FormDescription>Upload an image or society map. PDFs will be converted to an image for pinning.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting || isRenderingPdf}>
              {isSubmitting ? "Submitting..." : (isRenderingPdf ? "Processing PDF..." : (initialData ? "Save Changes" : "Add Property"))}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
