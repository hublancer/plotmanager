
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { addRental, updateRental } from "@/lib/mock-db";
import type { Rental } from "@/types";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Loader2, LocateFixed } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const propertyTypes = [
  "House",
  "Apartment",
  "Shop",
  "Office",
  "Warehouse",
  "Other",
];

const rentalFormSchema = z.object({
  name: z.string().min(3, "Property name is required."),
  address: z.string().min(5, "Address is required."),
  propertyType: z.string().min(2, "Property type is required."),
  
  tenantName: z.string().min(2, "Tenant name is required."),
  tenantContact: z.string().min(11, "A valid contact number is required (e.g., 03001234567)."),
  tenantIdCard: z.string().optional(),
  
  rentAmount: z.coerce.number().min(1, "Rent amount is required."),
  rentFrequency: z.enum(["monthly", "yearly"]),
  startDate: z.date({ required_error: "Start date is required." }),
  
  notes: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

type RentalFormValues = z.infer<typeof rentalFormSchema>;

interface RentalFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  initialData?: Rental | null;
}

export function RentalFormDialog({ isOpen, onOpenChange, onUpdate, initialData }: RentalFormDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: {
      rentFrequency: "monthly",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          ...initialData,
          startDate: new Date(initialData.startDate),
          latitude: initialData.latitude || null,
          longitude: initialData.longitude || null,
        });
      } else {
        form.reset({
          name: "",
          address: "",
          propertyType: "",
          tenantName: "",
          tenantContact: "",
          tenantIdCard: "",
          rentAmount: undefined,
          rentFrequency: "monthly",
          startDate: new Date(),
          notes: "",
          latitude: null,
          longitude: null,
        });
      }
    }
  }, [initialData, form, isOpen]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                form.setValue('latitude', position.coords.latitude);
                form.setValue('longitude', position.coords.longitude);
                toast({ title: "Location Captured", description: "GPS coordinates have been recorded." });
            },
            (error) => {
                toast({ title: "Location Error", description: error.message, variant: "destructive" });
            }
        );
    } else {
        toast({ title: "Unsupported", description: "Geolocation is not supported by your browser.", variant: "destructive" });
    }
  };

  const onSubmit = async (values: RentalFormValues) => {
    if (!user) {
        toast({ title: "Authentication error", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const rentalData = {
        ...values,
        userId: user.uid,
        startDate: values.startDate.toISOString(),
      };

      if (initialData) {
        await updateRental(initialData.id, rentalData);
        toast({ title: "Rental Updated", description: `Details for ${values.name} have been saved.` });
      } else {
        await addRental(rentalData);
        toast({ title: "Rental Added", description: `${values.name} has been added to your rentals.` });
      }
      
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save rental:", error);
      toast({ title: "Error", description: "Could not save rental details.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Rental" : "Add New Rental"}</DialogTitle>
          <DialogDescription>
            Fill in all the details for this rental property and tenant.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1">
            <h3 className="text-md font-semibold text-primary border-b pb-2">Property Details</h3>
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Property Name</FormLabel><FormControl><Input placeholder="e.g., Askari 11 Apartment" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="e.g., House 123, Street 4, Sector B" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="propertyType" render={({ field }) => (<FormItem><FormLabel>Property Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger></FormControl><SelectContent>{propertyTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            <div>
              <FormLabel>Location (Optional)</FormLabel>
              <div className="flex gap-2 mt-2">
                <FormField control={form.control} name="latitude" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="number" step="any" placeholder="Latitude" {...field} value={field.value ?? ""} disabled /></FormControl></FormItem>)} />
                <FormField control={form.control} name="longitude" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="number" step="any" placeholder="Longitude" {...field} value={field.value ?? ""} disabled /></FormControl></FormItem>)} />
                <Button type="button" variant="outline" onClick={handleGetCurrentLocation}><LocateFixed className="h-4 w-4" /></Button>
              </div>
            </div>

            <h3 className="text-md font-semibold text-primary border-b pb-2 pt-4">Tenant &amp; Rent Details</h3>
            <FormField control={form.control} name="tenantName" render={({ field }) => (<FormItem><FormLabel>Tenant Name</FormLabel><FormControl><Input placeholder="e.g., Ahmed Khan" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="tenantContact" render={({ field }) => (<FormItem><FormLabel>Tenant Contact</FormLabel><FormControl><Input placeholder="03001234567" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="tenantIdCard" render={({ field }) => (<FormItem><FormLabel>Tenant CNIC (Optional)</FormLabel><FormControl><Input placeholder="XXXXX-XXXXXXX-X" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="rentAmount" render={({ field }) => (<FormItem><FormLabel>Rent Amount (PKR)</FormLabel><FormControl><Input type="number" placeholder="25000" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="rentFrequency" render={({ field }) => (<FormItem><FormLabel>Rent Frequency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
             <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Agreement Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional details about the agreement or tenant..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save Changes" : "Add Rental"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
