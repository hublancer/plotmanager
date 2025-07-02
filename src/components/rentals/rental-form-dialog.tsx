
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { updateProperty } from "@/lib/mock-db";
import type { Property } from "@/types";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const rentalFormSchema = z.object({
  propertyId: z.string().min(1, "You must select a property."),
  tenantName: z.string().min(2, "Tenant name is required."),
  rentAmount: z.coerce.number().min(1, "Rent amount must be greater than 0."),
  rentFrequency: z.enum(["monthly", "yearly"]),
  rentStartDate: z.date({ required_error: "Rent start date is required." }),
});

type RentalFormValues = z.infer<typeof rentalFormSchema>;

interface RentalFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRentalUpdate: () => void; // To trigger a refresh
  initialData?: Property | null;
  properties: Pick<Property, 'id' | 'name' | 'isRented' | 'isSoldOnInstallment'>[];
}

export function RentalFormDialog({ isOpen, onOpenChange, onRentalUpdate, initialData, properties }: RentalFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableProperties = properties.filter(p => !p.isRented && !p.isSoldOnInstallment);

  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: {
      propertyId: initialData?.id || "",
      tenantName: initialData?.tenantName || "",
      rentAmount: initialData?.rentAmount || 0,
      rentFrequency: initialData?.rentFrequency || "monthly",
      rentStartDate: initialData?.rentStartDate ? new Date(initialData.rentStartDate) : new Date(),
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          propertyId: initialData.id,
          tenantName: initialData.tenantName || "",
          rentAmount: initialData.rentAmount || 0,
          rentFrequency: initialData.rentFrequency || "monthly",
          rentStartDate: new Date(initialData.rentStartDate || Date.now()),
        });
      } else {
        form.reset({
          propertyId: "",
          tenantName: "",
          rentAmount: 0,
          rentFrequency: "monthly",
          rentStartDate: new Date(),
        });
      }
    }
  }, [initialData, form, isOpen]);

  const onSubmit = async (values: RentalFormValues) => {
    setIsSubmitting(true);
    try {
      const propertyUpdates: Partial<Property> = {
        isRented: true,
        tenantName: values.tenantName,
        rentAmount: values.rentAmount,
        rentFrequency: values.rentFrequency,
        rentStartDate: values.rentStartDate.toISOString(),
      };
      
      const result = await updateProperty(values.propertyId, propertyUpdates);

      if (result) {
        toast({
          title: initialData ? "Rental Updated" : "Rental Added",
          description: `Details for ${result.name} have been saved.`,
        });
        onRentalUpdate(); // Callback to refresh the parent component's data
        onOpenChange(false); // Close dialog
      } else {
        throw new Error("Failed to update property in the database.");
      }
    } catch (error) {
      console.error("Failed to save rental:", error);
      toast({
        title: "Error",
        description: "Could not save rental details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Rental Details" : "Add New Rental"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update the rental information for this property." : "Select a property to mark it as rented."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an available property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {initialData && <SelectItem value={initialData.id}>{initialData.name}</SelectItem>}
                      {availableProperties.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tenantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Ahmed Raza" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rent Amount (PKR)</FormLabel>
                  <FormControl><Input type="number" placeholder="25000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rentFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rent Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="rentStartDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Rent Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Rental
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
