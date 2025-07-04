
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Property } from "@/types";
import { useState, useEffect } from "react";
import Image from "next/image";
import { UploadCloud, LocateFixed, Loader2, Trash2, CalendarIcon, Wallet, Home, GanttChartSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

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
  imageFiles: z.any().optional(),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  status: z.enum(["available", "rented", "installment"], {
    required_error: "You must select a property status.",
  }),
  // Rental fields
  tenantName: z.string().optional(),
  rentAmount: z.coerce.number().optional(),
  rentFrequency: z.enum(["monthly", "yearly"]).optional(),
  rentStartDate: z.date().optional(),
  // Installment fields
  buyerName: z.string().optional(),
  totalInstallmentPrice: z.coerce.number().optional(),
  downPayment: z.coerce.number().optional(),
  purchaseDate: z.date().optional(),
  installmentFrequency: z.enum(["monthly", "yearly"]).optional(),
  installmentDuration: z.coerce.number().int().optional(),
}).superRefine((data, ctx) => {
    if (data.status === 'rented') {
        if (!data.tenantName || data.tenantName.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tenant name is required.", path: ['tenantName'] });
        }
        if (!data.rentAmount || data.rentAmount <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Rent amount must be greater than 0.", path: ['rentAmount'] });
        }
        if (!data.rentStartDate) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Rent start date is required.", path: ['rentStartDate'] });
        }
        if (!data.rentFrequency) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Rent frequency is required.", path: ['rentFrequency'] });
        }
    }
    if (data.status === 'installment') {
        if (!data.buyerName || data.buyerName.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Buyer name is required.", path: ['buyerName'] });
        }
        if (!data.totalInstallmentPrice || data.totalInstallmentPrice <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Total price is required.", path: ['totalInstallmentPrice'] });
        }
        if (!data.purchaseDate) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Purchase date is required.", path: ['purchaseDate'] });
        }
        if (!data.installmentDuration || data.installmentDuration < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Installment duration is required.", path: ['installmentDuration'] });
        }
        if (!data.installmentFrequency) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Installment frequency is required.", path: ['installmentFrequency'] });
        }
    }
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
      status: initialData?.isRented ? "rented" : initialData?.isSoldOnInstallment ? "installment" : "available",
      // Rental fields
      tenantName: initialData?.tenantName || "",
      rentAmount: initialData?.rentAmount || undefined,
      rentFrequency: initialData?.rentFrequency || "monthly",
      rentStartDate: initialData?.rentStartDate ? new Date(initialData.rentStartDate) : undefined,
      // Installment fields
      buyerName: initialData?.buyerName || "",
      totalInstallmentPrice: initialData?.totalInstallmentPrice || undefined,
      downPayment: initialData?.downPayment || undefined,
      purchaseDate: initialData?.purchaseDate ? new Date(initialData.purchaseDate) : undefined,
      installmentFrequency: initialData?.installmentFrequency || "monthly",
      installmentDuration: initialData?.installmentDuration || undefined,
    },
  });

  const status = form.watch("status");

  useEffect(() => {
    if (initialData?.imageUrls) {
      setImagePreviewUrls(initialData.imageUrls);
    }
  }, [initialData]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    form.setValue("imageFiles", files);

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
  }
  
  const handleGetCurrentLocation = () => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
              const { latitude, longitude } = position.coords;
              form.setValue('latitude', latitude, { shouldValidate: true });
              form.setValue('longitude', longitude, { shouldValidate: true });
              toast({ title: "Location Captured", description: "GPS coordinates have been recorded."});
          }, (error) => {
              toast({ title: "Location Error", description: `Could not get location: ${error.message}`, variant: "destructive"});
          });
      } else {
          toast({ title: "Unsupported", description: "Geolocation is not supported by this browser.", variant: "destructive"});
      }
  };


  const handleSubmit = (values: PropertyFormValues) => {
    onSubmit({ 
        ...values, 
        imageUrls: imagePreviewUrls || [],
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Property Name</FormLabel><FormControl><Input placeholder="e.g., Executive Block Plot or Green Valley House" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address / Location</FormLabel><FormControl><Textarea placeholder="e.g., Plot #123, Block B, Sector C, Society Name, City" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="propertyType" render={({ field }) => (<FormItem><FormLabel>Property Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger></FormControl><SelectContent>{propertyTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
        
        <div>
            <FormLabel>Location Coordinates (Optional)</FormLabel>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <FormField control={form.control} name="latitude" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="number" step="any" placeholder="Latitude" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="longitude" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="number" step="any" placeholder="Longitude" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="button" variant="outline" onClick={handleGetCurrentLocation} className="w-full sm:w-auto"><LocateFixed className="mr-2 h-4 w-4" />Get Current</Button>
            </div>
              <FormDescription className="mt-2">
                Enter coordinates manually or use the button to get your current location. This is used to display the property on a map.
            </FormDescription>
        </div>
          
          <FormField control={form.control} name="imageFiles" render={() => ( <FormItem> <FormLabel>Property Images (Layout, Map, Photos)</FormLabel> <FormControl> <div className="flex flex-col items-center space-y-4"> <label htmlFor="imageUpload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 transition-colors"> <div className="flex flex-col items-center justify-center pt-5 pb-6"> <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" /> <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p> <p className="text-xs text-muted-foreground">PNG, JPG, or PDF files</p> </div> <Input id="imageUpload" type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*,.pdf" disabled={isProcessingFiles} /> </label> </div> </FormControl> <FormDescription>Upload one or more images or PDF files. Each page of a PDF will be converted to an image.</FormDescription> {isProcessingFiles && ( <div className="flex items-center text-sm text-muted-foreground"> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing files, please wait... </div> )} {imagePreviewUrls.length > 0 && ( <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4"> {imagePreviewUrls.map((url, index) => ( <div key={index} className="relative group"> <Image src={url} alt={`Preview ${index + 1}`} width={150} height={112} className="object-cover w-full aspect-[4/3] rounded-md border" data-ai-hint="property image" /> <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(index)} aria-label={`Remove image ${index + 1}`} > <Trash2 className="h-4 w-4" /> </Button> </div> ))} </div> )} <FormMessage /> </FormItem> )} />

        <Separator />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Initial Property Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem value="available" id="status-available" className="peer sr-only" />
                    <Label htmlFor="status-available" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer">
                      <Wallet className="mb-3 h-6 w-6" /> Available
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="rented" id="status-rented" className="peer sr-only" />
                    <Label htmlFor="status-rented" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer">
                      <Home className="mb-3 h-6 w-6" /> Rented
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="installment" id="status-installment" className="peer sr-only" />
                    <Label htmlFor="status-installment" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer">
                      <GanttChartSquare className="mb-3 h-6 w-6" /> Installment
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {status === "rented" && (
            <Card className="bg-secondary/50 border-dashed">
                <CardHeader><CardTitle>Rental Details</CardTitle><CardDescription>Enter the rental agreement information.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="tenantName" render={({ field }) => (<FormItem><FormLabel>Tenant Name</FormLabel><FormControl><Input placeholder="e.g., Ahmed Raza" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="rentAmount" render={({ field }) => (<FormItem><FormLabel>Rent Amount (PKR)</FormLabel><FormControl><Input type="number" placeholder="25000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="rentFrequency" render={({ field }) => (<FormItem><FormLabel>Rent Frequency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="rentStartDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Rent Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                    </div>
                </CardContent>
            </Card>
        )}

        {status === "installment" && (
            <Card className="bg-secondary/50 border-dashed">
                <CardHeader><CardTitle>Installment Plan Details</CardTitle><CardDescription>Enter the installment sale information.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="buyerName" render={({ field }) => (<FormItem><FormLabel>Buyer Name</FormLabel><FormControl><Input placeholder="e.g., Ali Khan" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="totalInstallmentPrice" render={({ field }) => (<FormItem><FormLabel>Total Price (PKR)</FormLabel><FormControl><Input type="number" placeholder="5000000" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="downPayment" render={({ field }) => (<FormItem><FormLabel>Down Payment (PKR, Optional)</FormLabel><FormControl><Input type="number" placeholder="1000000" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="installmentFrequency" render={({ field }) => (<FormItem><FormLabel>Frequency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="installmentDuration" render={({ field }) => (<FormItem><FormLabel>Duration</FormLabel><FormControl><Input type="number" placeholder={form.watch('installmentFrequency') === 'monthly' ? 'e.g., 24' : 'e.g., 5'} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="purchaseDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Purchase Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                </CardContent>
            </Card>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting || isProcessingFiles}>
          {isSubmitting ? "Submitting..." : (isProcessingFiles ? "Processing Files..." : (initialData ? "Save Changes" : "Add Property"))}
        </Button>
      </form>
    </Form>
  );
}
