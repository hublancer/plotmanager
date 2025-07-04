
"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { addProperty } from "@/lib/mock-db";
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
import { Textarea } from "../ui/textarea";

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

const planFormSchema = z.object({
  name: z.string().min(2, "Property name is required."),
  address: z.string().min(5, "Address is required."),
  propertyType: z.string().optional(),
  buyerName: z.string().min(2, "Buyer name is required."),
  totalInstallmentPrice: z.coerce.number().min(1, "Total price must be greater than 0."),
  downPayment: z.coerce.number().min(0).optional(),
  purchaseDate: z.date({ required_error: "Purchase date is required." }),
  installmentFrequency: z.enum(["monthly", "yearly"]),
  installmentDuration: z.coerce.number().int().min(1, "Duration must be at least 1."),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

interface InstallmentPlanFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function InstallmentPlanFormDialog({ isOpen, onOpenChange, onUpdate }: InstallmentPlanFormDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      installmentFrequency: "monthly",
      purchaseDate: new Date(),
    },
  });
  
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        address: "",
        propertyType: "",
        buyerName: "",
        totalInstallmentPrice: undefined,
        downPayment: undefined,
        purchaseDate: new Date(),
        installmentFrequency: "monthly",
        installmentDuration: undefined,
      });
    }
  }, [form, isOpen]);

  const watchedValues = useWatch({ control: form.control });

  const calculatedInstallment = () => {
    const { totalInstallmentPrice, downPayment, installmentDuration } = watchedValues;
    if (!totalInstallmentPrice || !installmentDuration || installmentDuration <= 0) return 0;
    const remaining = totalInstallmentPrice - (downPayment || 0);
    return remaining / installmentDuration;
  };

  const onSubmit = async (values: PlanFormValues) => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const newPropertyData: Omit<Property, 'id'> = {
        userId: user.uid,
        name: values.name,
        address: values.address,
        propertyType: values.propertyType,
        plots: [],
        isSoldOnInstallment: true,
        isRented: false,
        buyerName: values.buyerName,
        totalInstallmentPrice: values.totalInstallmentPrice,
        downPayment: values.downPayment,
        purchaseDate: values.purchaseDate.toISOString(),
        installmentFrequency: values.installmentFrequency,
        installmentDuration: values.installmentDuration,
      };
      
      const newProperty = await addProperty(newPropertyData);

      if (newProperty) {
        toast({
          title: "Installment Plan Created",
          description: `Plan for ${newProperty.name} has been successfully created.`,
        });
        onUpdate();
        onOpenChange(false);
      } else {
        throw new Error("Failed to create property in the database.");
      }
    } catch (error) {
      console.error("Failed to save installment plan:", error);
      toast({
        title: "Error",
        description: "Could not save the plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Installment Plan</DialogTitle>
          <DialogDescription>
            Fill out the details to create a new property with an installment plan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1">
            <h3 className="text-md font-semibold text-primary border-b pb-1">Property Details</h3>
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Property Name</FormLabel><FormControl><Input placeholder="e.g., Green Valley Plot" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="e.g., Plot 123, Sector C, Bahria Town" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="propertyType" render={({ field }) => (<FormItem><FormLabel>Property Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a property type" /></SelectTrigger></FormControl><SelectContent>{propertyTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            
            <h3 className="text-md font-semibold text-primary border-b pb-1 pt-4">Buyer &amp; Plan Details</h3>
            <FormField control={form.control} name="buyerName" render={({ field }) => (<FormItem><FormLabel>Buyer Name</FormLabel><FormControl><Input placeholder="e.g., Ali Khan" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="totalInstallmentPrice" render={({ field }) => (<FormItem><FormLabel>Total Price (PKR)</FormLabel><FormControl><Input type="number" placeholder="5000000" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="downPayment" render={({ field }) => (<FormItem><FormLabel>Down Payment (PKR)</FormLabel><FormControl><Input type="number" placeholder="1000000" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="purchaseDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Purchase Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="installmentFrequency" render={({ field }) => (<FormItem><FormLabel>Frequency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="installmentDuration" render={({ field }) => (<FormItem><FormLabel>Duration</FormLabel><FormControl><Input type="number" placeholder={watchedValues.installmentFrequency === 'monthly' ? 'e.g., 24' : 'e.g., 5'} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            {calculatedInstallment() > 0 && (
                <div className="p-3 bg-muted rounded-md border text-center">
                    <p className="text-sm text-muted-foreground">Calculated Installment Amount</p>
                    <p className="text-lg font-bold">PKR {calculatedInstallment().toLocaleString(undefined, { maximumFractionDigits: 0 })} / {watchedValues.installmentFrequency?.slice(0, -2)}</p>
                </div>
            )}
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Plan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
