
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { addLead, updateLead } from "@/lib/mock-db";
import type { Lead } from "@/types";
import type { LatLngExpression } from 'leaflet';
import dynamic from 'next/dynamic';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, LocateFixed } from "lucide-react";

const DynamicPropertyLocationMap = dynamic(() => 
  import('@/components/maps/property-location-map').then(mod => mod.PropertyLocationMap),
  { 
    ssr: false,
    loading: () => <div className="h-[200px] w-full rounded-md border flex items-center justify-center bg-muted"><p>Loading map...</p></div>
  }
);


const leadFormSchema = z.object({
  name: z.string().min(2, "Name is required."),
  company: z.string().optional(),
  value: z.coerce.number().min(0, "Value must be a positive number."),
  status: z.enum(['New', 'Active', 'Deal', 'Done']),
  notes: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  initialData?: Lead | null;
}

export function LeadFormDialog({ isOpen, onOpenChange, onUpdate, initialData }: LeadFormDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapPosition, setMapPosition] = useState<LatLngExpression | null>(null);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      status: "New",
      value: 0
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          company: initialData.company || "",
          value: initialData.value,
          status: initialData.status,
          notes: initialData.notes || "",
          latitude: initialData.latitude,
          longitude: initialData.longitude,
        });
        if (initialData.latitude && initialData.longitude) {
          setMapPosition([initialData.latitude, initialData.longitude]);
        } else {
          setMapPosition(null);
        }
      } else {
        form.reset({
          name: "",
          company: "",
          value: 0,
          status: "New",
          notes: "",
          latitude: null,
          longitude: null,
        });
        setMapPosition(null);
      }
    }
  }, [initialData, form, isOpen]);
  
  const handleMapPositionChange = useCallback((newPosition: { lat: number; lng: number }) => {
    setMapPosition([newPosition.lat, newPosition.lng]);
    form.setValue('latitude', newPosition.lat, { shouldValidate: true });
    form.setValue('longitude', newPosition.lng, { shouldValidate: true });
  }, [form]);
  
  const handleGetCurrentLocation = () => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
              const { latitude, longitude } = position.coords;
              handleMapPositionChange({ lat: latitude, lng: longitude });
          }, (error) => {
              toast({ title: "Location Error", description: `Could not get location: ${error.message}`, variant: "destructive"});
          });
      } else {
          toast({ title: "Unsupported", description: "Geolocation is not supported by this browser.", variant: "destructive"});
      }
  };

  const onSubmit = async (values: LeadFormValues) => {
    if (!user) {
        toast({title: "Authentication Error", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    try {
        if (initialData) {
            await updateLead(initialData.id, { ...values, userId: user.uid });
        } else {
            await addLead({ ...values, userId: user.uid, lastUpdate: new Date().toISOString() });
        }
        toast({ title: initialData ? "Lead Updated" : "Lead Added", description: `"${values.name}" has been saved.` });
        onUpdate();
        onOpenChange(false);
    } catch (error) {
        toast({ title: "Error", description: "Could not save the lead.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          <DialogDescription>
            Fill out the details for this lead. Click on the map to pin a location.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1">
             <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Lead Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="company" render={({ field }) => (<FormItem><FormLabel>Company (Optional)</FormLabel><FormControl><Input placeholder="e.g., Acme Inc." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="value" render={({ field }) => (<FormItem><FormLabel>Value (PKR)</FormLabel><FormControl><Input type="number" placeholder="50000" {...field} /></FormControl><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="New">New</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Deal">Deal</SelectItem><SelectItem value="Done">Done</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
             <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Add any relevant notes about this lead..." {...field} /></FormControl><FormMessage /></FormItem>)} />
             
             <div>
                <div className="flex justify-between items-center mb-2">
                    <FormLabel>Location (Optional)</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={handleGetCurrentLocation}>
                        <LocateFixed className="h-4 w-4 mr-2"/>
                        Use Current Location
                    </Button>
                </div>
                <div className="h-[200px] w-full rounded-md overflow-hidden border shadow-sm">
                    <DynamicPropertyLocationMap
                        key={mapPosition ? `${(mapPosition as number[])[0]}-${(mapPosition as number[])[1]}` : 'map-key-lead-form'}
                        position={mapPosition}
                        onPositionChange={handleMapPositionChange}
                        mapHeight="100%"
                        interactive={true}
                    />
                </div>
             </div>

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Lead
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
