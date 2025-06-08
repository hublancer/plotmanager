
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
import { useState } from "react";
import Image from "next/image";
import { UploadCloud } from "lucide-react";

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
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyFormProps {
  initialData?: Property | null;
  onSubmit: (data: PropertyFormValues & { imagePreviewUrl?: string }) => void;
  isSubmitting?: boolean;
}

export function PropertyForm({ initialData, onSubmit, isSubmitting }: PropertyFormProps) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialData?.imageUrl || null);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      propertyType: initialData?.propertyType || "",
      imageFile: undefined,
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("imageFile", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue("imageFile", undefined);
      setImagePreviewUrl(initialData?.imageUrl || null); 
    }
  };

  const handleSubmit = (values: PropertyFormValues) => {
    onSubmit({ ...values, imagePreviewUrl: imagePreviewUrl || undefined });
  };


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Property" : "Add New Property"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
            <FormField
              control={form.control}
              name="imageFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Image (Layout, Map, or Photo)</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center space-y-2">
                       <label htmlFor="imageUpload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        {imagePreviewUrl ? (
                          <Image src={imagePreviewUrl} alt="Preview" width={200} height={150} className="object-contain max-h-40 rounded-md" data-ai-hint="property plan" />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, PDF (MAX. 800x400px)</p>
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
