
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
import { UploadCloud, FileText, MapPin, Loader2, Trash2 } from "lucide-react";
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
  imageFiles: z.any().optional(), // Changed to imageFiles
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyFormProps {
  initialData?: Property | null;
  onSubmit: (data: PropertyFormValues & { imageUrls?: string[] }) => void;
  isSubmitting?: boolean;
}

export function PropertyForm({ initialData, onSubmit, isSubmitting }: PropertyFormProps) {
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>(initialData?.imageUrls || []);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
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
      imageFiles: undefined,
      latitude: initialData?.latitude || null,
      longitude: initialData?.longitude || null,
    },
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.imageUrls) {
        setImagePreviewUrls(initialData.imageUrls);
      }
      if (initialData.latitude && initialData.longitude) {
        const pos: LatLngExpression = [initialData.latitude, initialData.longitude];
        setMapPosition(pos);
        form.setValue('latitude', initialData.latitude);
        form.setValue('longitude', initialData.longitude);
      }
    }
  }, [initialData, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    form.setValue("imageFiles", files);

    const newUrls: string[] = [];

    const fileProcessingPromises = Array.from(files).map(file => {
      return new Promise<string[]>((resolve, reject) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => resolve([reader.result as string]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        } else if (file.type === "application/pdf") {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const pdfData = e.target?.result;
            if (pdfData instanceof ArrayBuffer) {
              try {
                const pdfjs = await import('pdfjs-dist/build/pdf');
                pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

                const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
                const pagePromises = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                  pagePromises.push(pdf.getPage(i).then(async (page) => {
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    if (!context) throw new Error("Could not get canvas context");
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: context, viewport }).promise;
                    return canvas.toDataURL('image/png');
                  }));
                }
                resolve(await Promise.all(pagePromises));
              } catch (err) {
                console.error("Error rendering PDF:", err);
                toast({ title: "PDF Error", description: "Could not render a page from the PDF.", variant: "destructive" });
                reject(err);
              }
            }
          };
          reader.readAsArrayBuffer(file);
        } else {
            resolve([]); // Ignore unsupported file types
        }
      });
    });

    try {
        const results = await Promise.all(fileProcessingPromises);
        const flattenedUrls = results.flat();
        setImagePreviewUrls(prev => [...prev, ...flattenedUrls]);
    } catch(err) {
        console.error("Error processing files:", err)
    } finally {
        setIsProcessingFiles(false);
    }
  };

  const removeImage = (index: number) => {
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    // Note: This simplified version doesn't remove the file from the FileList in the form state.
    // A more complex implementation would be needed to manage the FileList state accurately.
  }

  const handleMapPositionChange = useCallback((newPosition: { lat: number; lng: number }) => {
    setMapPosition([newPosition.lat, newPosition.lng]);
    form.setValue('latitude', newPosition.lat);
    form.setValue('longitude', newPosition.lng);
  }, [form]);

  const handleSubmit = (values: PropertyFormValues) => {
    onSubmit({ 
        ...values, 
        imageUrls: imagePreviewUrls || [],
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

            <FormField control={form.control} name="latitude" render={({ field }) => (<FormItem className="hidden"><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="longitude" render={({ field }) => (<FormItem className="hidden"><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />

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
              name="imageFiles"
              render={() => (
                <FormItem>
                  <FormLabel>Property Images (Layout, Map, Photos)</FormLabel>
                   <FormControl>
                      <div className="flex flex-col items-center space-y-4">
                        <label htmlFor="imageUpload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-muted-foreground">PNG, JPG, or PDF files</p>
                            </div>
                          <Input id="imageUpload" type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*,.pdf" disabled={isProcessingFiles} />
                        </label>
                      </div>
                    </FormControl>
                  <FormDescription>Upload one or more images or PDF files. Each page of a PDF will be converted to an image.</FormDescription>
                   {isProcessingFiles && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing files, please wait...
                        </div>
                   )}
                  {imagePreviewUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                           <Image src={url} alt={`Preview ${index + 1}`} width={150} height={112} className="object-cover w-full aspect-[4/3] rounded-md border" data-ai-hint="property image" />
                           <Button 
                             type="button"
                             variant="destructive"
                             size="icon"
                             className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                             onClick={() => removeImage(index)}
                             aria-label={`Remove image ${index + 1}`}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting || isProcessingFiles}>
              {isSubmitting ? "Submitting..." : (isProcessingFiles ? "Processing Files..." : (initialData ? "Save Changes" : "Add Property"))}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
