
"use client";

import type { PlotData, Property } from "@/types";
import Image from "next/image";
import { useState, useRef, MouseEvent, TouchEvent, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Edit2, Trash2, MapPin, Scaling, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RefreshCw, Wallet, CalendarClock, Home, CircleDollarSign, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { addTransaction, updateProperty } from "@/lib/mock-db";
import { useAuth } from "@/context/auth-context";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


// Define a palette of colors for the pins
const pinColors = [
  "rgba(59, 130, 246, 0.8)",  // Blue
  "rgba(239, 68, 68, 0.8)",    // Red
  "rgba(34, 197, 94, 0.8)",    // Green
  "rgba(168, 85, 247, 0.8)",   // Purple
  "rgba(249, 115, 22, 0.8)",   // Orange
  "rgba(236, 72, 153, 0.8)",   // Pink
  "rgba(20, 184, 166, 0.8)",   // Teal
  "rgba(245, 158, 11, 0.8)",   // Amber
];

interface PlotPinnerProps {
  property: Property; // Pass the whole property object
  onPlotsChange: (plots: PlotData[]) => void;
}

export function PlotPinner({ property, onPlotsChange }: PlotPinnerProps) {
  // Add a guard clause to prevent rendering if the property is not yet available.
  // This robustly handles race conditions during data fetching.
  if (!property) {
    return null;
  }

  const [plots, setPlots] = useState<PlotData[]>(property.plots || []);
  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [tempPin, setTempPin] = useState<{ x: number; y: number } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();


  // New state for zoom, pan, and pinning mode
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
  const isPannable = useMemo(() => !isPinningMode && scale > 1, [isPinningMode, scale]);


  // Reset zoom/pan and image dimensions when image changes
  useEffect(() => {
    handleReset();
    setImageDimensions(null);
  }, [currentIndex]);
  
  const handleImageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    if (!imageContainerRef.current || !imageDimensions) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    
    // Calculate the 'contain' dimensions of the image
    const containerRatio = rect.width / rect.height;
    const imageRatio = imageDimensions.width / imageDimensions.height;
    let containedWidth: number, containedHeight: number;
    if (containerRatio > imageRatio) {
        containedHeight = rect.height;
        containedWidth = containedHeight * imageRatio;
    } else {
        containedWidth = rect.width;
        containedHeight = containedWidth / imageRatio;
    }
    const horizontalPadding = (rect.width - containedWidth) / 2;
    const verticalPadding = (rect.height - containedHeight) / 2;
    
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // De-transform the click coordinates to find where on the unscaled container we clicked
    const unscaledContainerX = (clickX - position.x) / scale;
    const unscaledContainerY = (clickY - position.y) / scale;
    
    // Account for the 'contain' padding to get click position relative to the image
    const imageRelativeX = unscaledContainerX - horizontalPadding;
    const imageRelativeY = unscaledContainerY - verticalPadding;

    // Check if clicking on an existing plot first
    for (const plot of plots.filter(p => p.imageIndex === currentIndex)) {
      const plotPixelX = (plot.x / 100) * containedWidth;
      const plotPixelY = (plot.y / 100) * containedHeight;
      const distance = Math.sqrt(Math.pow(plotPixelX - imageRelativeX, 2) + Math.pow(plotPixelY - imageRelativeY, 2));
      
      const clickableRadius = 12 / scale;
      if (distance < clickableRadius) {
        setSelectedPlot(plot);
        setIsEditing(true);
        setShowDialog(true);
        setTempPin(null);
        setIsPinningMode(false);
        return;
      }
    }

    if (!isPinningMode) return;

    // Check if click is within the image bounds (not on the padding)
    if (imageRelativeX < 0 || imageRelativeX > containedWidth || imageRelativeY < 0 || imageRelativeY > containedHeight) {
      return;
    }

    const xPercent = (imageRelativeX / containedWidth) * 100;
    const yPercent = (imageRelativeY / containedHeight) * 100;
    
    setTempPin({ x: xPercent, y: yPercent });
    setSelectedPlot(null);
    setIsEditing(false);
    setShowDialog(true);
    setIsPinningMode(false);
  };

  const handleSavePlot = useCallback(async (newPlotData: PlotData) => {
    let finalPlots;
    if (isEditing) {
      finalPlots = plots.map(p => p.id === newPlotData.id ? newPlotData : p);
    } else {
      finalPlots = [...plots, newPlotData];
    }
    setPlots(finalPlots);
    onPlotsChange(finalPlots); // Let parent know about the change

    // Handle side-effects like creating transactions
    if (newPlotData.status === 'sold' && newPlotData.saleDetails && user) {
        await addTransaction({
            userId: user.uid,
            createdBy: user.uid,
            type: 'income',
            category: 'sale',
            amount: newPlotData.saleDetails.price,
            date: newPlotData.saleDetails.date,
            contactName: newPlotData.saleDetails.buyerName,
            propertyId: property.id,
            propertyName: property.name,
            plotNumber: newPlotData.plotNumber,
            notes: `Sale of Plot #${newPlotData.plotNumber} in ${property.name}`
        });
        toast({ title: "Transaction Logged", description: `Sale for Plot #${newPlotData.plotNumber} has been recorded.`})
    }
    
    setShowDialog(false);
    setSelectedPlot(null);
    setTempPin(null);
    setIsPinningMode(false); // Ensure pin mode is off
    toast({ title: "Plot Saved", description: `Plot ${newPlotData.plotNumber} has been ${isEditing ? 'updated' : 'added'}.`});

  }, [isEditing, plots, onPlotsChange, toast, user, property.id, property.name]);

  
  const handleDeletePlot = (plotId: string) => {
    const newPlots = plots.filter(p => p.id !== plotId);
    setPlots(newPlots);
    onPlotsChange(newPlots);
    setShowDialog(false);
    setSelectedPlot(null);
    toast({ title: "Plot Deleted", description: "The plot has been removed.", variant: "destructive" });
  };
  
  const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 5));
  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.2, 1);
    if (newScale <= 1.01) {
        handleReset();
    } else {
        setScale(newScale);
    }
  };
  const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const pan = (clientX: number, clientY: number) => {
    if (!isDragging || !isPannable || !imageDimensions || !imageContainerRef.current) return;
    
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const containerRatio = containerRect.width / containerRect.height;
    const imageRatio = imageDimensions.width / imageDimensions.height;
    
    let containedWidth, containedHeight;
    if (containerRatio > imageRatio) {
        containedHeight = containerRect.height;
        containedWidth = containedHeight * imageRatio;
    } else {
        containedWidth = containerRect.width;
        containedHeight = containedWidth / imageRatio;
    }
    
    const horizontalPadding = (containerRect.width - containedWidth) / 2;
    const verticalPadding = (containerRect.height - containedHeight) / 2;
    
    const scaledHorizontalPadding = horizontalPadding * scale;
    const scaledVerticalPadding = verticalPadding * scale;
    
    let newX = clientX - dragStart.x;
    let newY = clientY - dragStart.y;
    
    const maxX = horizontalPadding - scaledHorizontalPadding;
    const minX = (horizontalPadding + containedWidth) - (scaledHorizontalPadding + (containedWidth * scale));
    const maxY = verticalPadding - scaledVerticalPadding;
    const minY = (verticalPadding + containedHeight) - (scaledVerticalPadding + (containedHeight * scale));
    
    setPosition({ x: Math.max(minX, Math.min(newX, maxX)), y: Math.max(minY, Math.min(newY, maxY)) });
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (!isPannable) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  const handleMouseMove = (e: MouseEvent) => pan(e.clientX, e.clientY);
  const handleMouseUp = () => setTimeout(() => setIsDragging(false), 50);

  const handleTouchStart = (e: TouchEvent) => {
    if (!isPannable) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };
  const handleTouchMove = (e: TouchEvent) => pan(e.touches[0].clientX, e.touches[0].clientY);
  const handleTouchEnd = () => setIsDragging(false);
  
  
  const goToPrevious = () => setCurrentIndex(prev => (prev === 0 ? (property.imageUrls?.length ?? 1) - 1 : prev - 1));
  const goToNext = () => setCurrentIndex(prev => (prev === (property.imageUrls?.length ?? 1) - 1 ? 0 : prev + 1));
  
  const memoizedImageParams = useMemo(() => {
    if (!imageContainerRef.current || !imageDimensions) {
      return { width: 0, height: 0, left: 0, top: 0 };
    }
    const rect = imageContainerRef.current.getBoundingClientRect();
    const containerRatio = rect.width / rect.height;
    const imageRatio = imageDimensions.width / imageDimensions.height;
    let containedWidth, containedHeight;

    if (containerRatio > imageRatio) {
      containedHeight = rect.height;
      containedWidth = containedHeight * imageRatio;
    } else {
      containedWidth = rect.width;
      containedHeight = containedWidth / imageRatio;
    }

    return {
      width: containedWidth,
      height: containedHeight,
      left: (rect.width - containedWidth) / 2,
      top: (rect.height - containedHeight) / 2
    };
  }, [imageDimensions]);
  
  const currentImagePlots = plots.filter(p => p.imageIndex === currentIndex);

  return (
    <div className="space-y-2">
      <div
        ref={imageContainerRef}
        className={cn(
          "relative w-full aspect-[16/9] border rounded-lg overflow-hidden bg-muted/30 shadow-inner",
          isPannable ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default",
          isPinningMode && "cursor-crosshair"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
      >
        <div
          className="relative h-full w-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "top left",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          {property.imageUrls?.[currentIndex] && (
              <Image 
                key={currentIndex}
                src={property.imageUrls[currentIndex]} 
                alt={`Property layout ${currentIndex + 1}`}
                layout="fill" 
                objectFit="contain" 
                data-ai-hint="property aerial map site plan"
                draggable="false"
                priority
                className="pointer-events-none transition-opacity duration-300"
                onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                }}
                style={{ opacity: imageDimensions ? 1 : 0 }}
              />
          )}
          {imageDimensions && currentImagePlots.map(plot => {
            const pinStyle: React.CSSProperties = {
                left: `${memoizedImageParams.left + (plot.x / 100 * memoizedImageParams.width)}px`,
                top: `${memoizedImageParams.top + (plot.y / 100 * memoizedImageParams.height)}px`,
                width: `${24 / scale}px`,
                height: `${24 / scale}px`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: plot.color || 'rgba(59, 130, 246, 0.8)',
                border: `${2 / scale}px solid hsl(var(--primary-foreground, 0 0% 100%))`
            };
            return (
                <div
                key={plot.id}
                className="absolute flex items-center justify-center rounded-full"
                style={pinStyle}
                title={`Plot ${plot.plotNumber} (${plot.size || 'N/A'}) - ${plot.status}`}
                >
                <MapPin style={{ height: `${16 / scale}px`, width: `${16 / scale}px` }} className="text-primary-foreground" />
                </div>
            )
          })}

          {imageDimensions && tempPin && (
            <div
              className="pointer-events-none absolute flex items-center justify-center rounded-full border-primary-foreground bg-primary/70"
              style={{ 
                left: `${memoizedImageParams.left + (tempPin.x / 100 * memoizedImageParams.width)}px`,
                top: `${memoizedImageParams.top + (tempPin.y / 100 * memoizedImageParams.height)}px`,
                width: `${24 / scale}px`,
                height: `${24 / scale}px`,
                borderWidth: `${2 / scale}px`,
                transform: `translate(-50%, -50%)`
              }}
            >
              <PlusCircle style={{ height: `${16 / scale}px`, width: `${16 / scale}px` }} className="text-primary-foreground"/>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-lg p-2 space-y-2">
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={scale >= 5} aria-label="Zoom In"><ZoomIn className="h-5 w-5"/></Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={scale <= 1} aria-label="Zoom Out"><ZoomOut className="h-5 w-5"/></Button>
            <Button variant="outline" size="icon" onClick={handleReset} disabled={scale === 1 && position.x === 0 && position.y === 0} aria-label="Reset View"><RefreshCw className="h-5 w-5"/></Button>
             <Button 
                variant={!isPinningMode && scale > 1 ? "secondary" : "outline"} 
                size="icon" 
                onClick={() => { setIsPinningMode(false); if(scale === 1) setScale(1.5); }} 
                aria-label={!isPinningMode && scale > 1 ? "Pan mode active" : "Enable Pan mode"}
                title="Pan/Move Mode"
                disabled={scale <= 1}
            >
                <Move className="h-5 w-5"/>
            </Button>
            <Button 
                variant={isPinningMode ? "secondary" : "outline"} 
                size="icon" 
                onClick={() => setIsPinningMode(prev => !prev)} 
                aria-label={isPinningMode ? "Disable Pinning" : "Enable Pinning"}
                title="Pin Mode"
            >
                <MapPin className="h-5 w-5"/>
            </Button>
          </div>
          
          {(property.imageUrls?.length ?? 0) > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrevious} aria-label="Previous Image"><ChevronLeft className="h-5 w-5"/></Button>
              <span className="text-sm font-medium text-muted-foreground tabular-nums">{currentIndex + 1} / {property.imageUrls?.length}</span>
              <Button variant="outline" size="icon" onClick={goToNext} aria-label="Next Image"><ChevronRight className="h-5 w-5"/></Button>
            </div>
          )}
        </div>

        {(property.imageUrls?.length ?? 0) > 1 && (
          <div className="relative w-full">
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-2">
                {property.imageUrls?.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "relative flex-shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      currentIndex === index ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  >
                    <Image src={url} alt={`Thumbnail ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint="property plan thumbnail" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showDialog && (
        <PlotDialog
          isOpen={showDialog}
          onOpenChange={(isOpen) => {
            setShowDialog(isOpen);
            if (!isOpen) {
              setTempPin(null);
            }
          }}
          plotData={selectedPlot}
          onSave={handleSavePlot}
          onDelete={selectedPlot ? () => handleDeletePlot(selectedPlot.id) : undefined}
          isEditing={isEditing}
          tempPin={tempPin}
          imageIndex={currentIndex}
          existingPlotsCount={plots.length}
        />
      )}
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Pinned Plots ({currentImagePlots.length} on this image, {plots.length} total)</h3>
        {plots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plots pinned yet. Click the pin icon then click on the image to add a plot.</p>
        ) : currentImagePlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plots pinned on this image. Navigate to other images or add a new one.</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {currentImagePlots.map(plot => (
              <li key={plot.id} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: plot.color || 'hsl(var(--primary))' }} />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">Plot #{plot.plotNumber} {plot.size && <span className="text-xs text-muted-foreground">({plot.size})</span>}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">{plot.status}</p>
                  </div>
                </div>
                <div className="space-x-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedPlot(plot); setIsEditing(true); setShowDialog(true); }}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


// Form Schemas
const baseSchema = z.object({
    plotNumber: z.string().min(1, "Plot number is required."),
    size: z.string().optional(),
    details: z.string().optional(),
});

const soldSchema = baseSchema.extend({
    status: z.literal('sold'),
    saleDetails: z.object({
        buyerName: z.string().min(2, "Buyer name is required."),
        buyerContact: z.string().optional(),
        price: z.coerce.number().min(1, "Sale price is required."),
        date: z.date({ required_error: "Sale date is required." }),
    })
});

const rentedSchema = baseSchema.extend({
    status: z.literal('rented'),
    rentalDetails: z.object({
        tenantName: z.string().min(2, "Tenant name is required."),
        tenantContact: z.string().optional(),
        rentAmount: z.coerce.number().min(1, "Rent amount is required."),
        rentFrequency: z.enum(['monthly', 'yearly']),
        startDate: z.date({ required_error: "Start date is required." }),
    })
});

const installmentSchema = baseSchema.extend({
    status: z.literal('installment'),
    installmentDetails: z.object({
        buyerName: z.string().min(2, "Buyer name is required."),
        buyerContact: z.string().optional(),
        totalPrice: z.coerce.number().min(1, "Total price is required."),
        downPayment: z.coerce.number().min(0),
        duration: z.coerce.number().int().min(1, "Duration is required."),
        frequency: z.enum(['monthly', 'yearly']),
        purchaseDate: z.date({ required_error: "Purchase date is required." }),
    })
});

const availableSchema = baseSchema.extend({
    status: z.literal('available'),
});

const formSchema = z.discriminatedUnion("status", [soldSchema, rentedSchema, installmentSchema, availableSchema]);
type FormValues = z.infer<typeof formSchema>;


interface PlotDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  plotData: PlotData | null;
  onSave: (data: PlotData) => void;
  onDelete?: () => void;
  isEditing: boolean;
  tempPin: { x: number; y: number } | null;
  imageIndex: number;
  existingPlotsCount: number;
}

function PlotDialog({ isOpen, onOpenChange, plotData, onSave, onDelete, isEditing, tempPin, imageIndex, existingPlotsCount }: PlotDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: plotData ? {
        ...plotData,
        saleDetails: plotData.saleDetails ? { ...plotData.saleDetails, date: new Date(plotData.saleDetails.date), buyerContact: plotData.saleDetails.buyerContact || '' } : undefined,
        rentalDetails: plotData.rentalDetails ? { ...plotData.rentalDetails, startDate: new Date(plotData.rentalDetails.startDate), tenantContact: plotData.rentalDetails.tenantContact || '' } : undefined,
        installmentDetails: plotData.installmentDetails ? { ...plotData.installmentDetails, purchaseDate: new Date(plotData.installmentDetails.purchaseDate), buyerContact: plotData.installmentDetails.buyerContact || '' } : undefined,
    } : {
        status: 'available',
        plotNumber: '',
        size: '',
        details: '',
    },
  });

  const status = form.watch("status");

  useEffect(() => {
    if (plotData) {
        form.reset({
            ...plotData,
            saleDetails: plotData.saleDetails ? { ...plotData.saleDetails, date: new Date(plotData.saleDetails.date), buyerContact: plotData.saleDetails.buyerContact || '' } : undefined,
            rentalDetails: plotData.rentalDetails ? { ...plotData.rentalDetails, startDate: new Date(plotData.rentalDetails.startDate), tenantContact: plotData.rentalDetails.tenantContact || '' } : undefined,
            installmentDetails: plotData.installmentDetails ? { ...plotData.installmentDetails, purchaseDate: new Date(plotData.installmentDetails.purchaseDate), buyerContact: plotData.installmentDetails.buyerContact || '' } : undefined,
        });
    } else {
        form.reset({
            status: 'available',
            plotNumber: '',
            size: '',
            details: '',
        });
    }
  }, [plotData, form]);

  const handleSubmit = (values: FormValues) => {
    const newPlotData: PlotData = {
      id: plotData?.id || Date.now().toString(),
      x: plotData?.x ?? tempPin?.x ?? 0,
      y: plotData?.y ?? tempPin?.y ?? 0,
      imageIndex: plotData?.imageIndex ?? imageIndex,
      color: plotData?.color || pinColors[existingPlotsCount % pinColors.length],
      plotNumber: values.plotNumber,
      size: values.size,
      details: values.details,
      status: values.status,
    };
  
    if (values.status === 'sold') {
      newPlotData.saleDetails = { ...values.saleDetails, date: values.saleDetails.date.toISOString() };
    }
    if (values.status === 'rented') {
      newPlotData.rentalDetails = { ...values.rentalDetails, startDate: values.rentalDetails.startDate.toISOString() };
    }
    if (values.status === 'installment') {
      newPlotData.installmentDetails = { ...values.installmentDetails, purchaseDate: values.installmentDetails.purchaseDate.toISOString() };
    }
  
    onSave(newPlotData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit Plot #${plotData?.plotNumber}` : "Add New Plot"}</DialogTitle>
          <DialogDescription>
            Enter general information and set the plot's current status.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-2">
                    {/* Base Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="plotNumber" render={({ field }) => (<FormItem><FormLabel>Plot Number</FormLabel><FormControl><Input placeholder="e.g. 123-A" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="size" render={({ field }) => (<FormItem><FormLabel>Size (e.g., 5 Marla)</FormLabel><FormControl><Input placeholder="e.g. 5 Marla, 1 Kanal" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="details" render={({ field }) => (<FormItem><FormLabel>Additional Details</FormLabel><FormControl><Textarea placeholder="e.g., Corner plot, facing park" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    
                    {/* Status Selector */}
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem className="space-y-3 border-t pt-4">
                            <FormLabel>Plot Status</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <FormItem><FormControl><RadioGroupItem value="available" id="s-available" className="sr-only peer" /></FormControl><Label htmlFor="s-available" className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"><Wallet className="h-5 w-5"/>Available</Label></FormItem>
                                    <FormItem><FormControl><RadioGroupItem value="sold" id="s-sold" className="sr-only peer" /></FormControl><Label htmlFor="s-sold" className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"><CircleDollarSign className="h-5 w-5"/>Sold</Label></FormItem>
                                    <FormItem><FormControl><RadioGroupItem value="rented" id="s-rented" className="sr-only peer" /></FormControl><Label htmlFor="s-rented" className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"><Home className="h-5 w-5"/>Rented</Label></FormItem>
                                    <FormItem><FormControl><RadioGroupItem value="installment" id="s-installment" className="sr-only peer" /></FormControl><Label htmlFor="s-installment" className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"><CalendarClock className="h-5 w-5"/>Installment</Label></FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {/* Conditional Forms */}
                    {status === 'sold' && (
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold text-foreground">Sale Details</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="saleDetails.buyerName" render={({ field }) => (<FormItem><FormLabel>Buyer Name</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="saleDetails.buyerContact" render={({ field }) => (<FormItem><FormLabel>Buyer Contact</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="saleDetails.price" render={({ field }) => (<FormItem><FormLabel>Sale Price (PKR)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="saleDetails.date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Sale Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn(!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                            </div>
                        </div>
                    )}
                    {status === 'rented' && (
                         <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold text-foreground">Rental Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="rentalDetails.tenantName" render={({ field }) => (<FormItem><FormLabel>Tenant Name</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="rentalDetails.tenantContact" render={({ field }) => (<FormItem><FormLabel>Tenant Contact</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="rentalDetails.rentAmount" render={({ field }) => (<FormItem><FormLabel>Rent Amount (PKR)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="rentalDetails.rentFrequency" render={({ field }) => (<FormItem><FormLabel>Frequency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="rentalDetails.startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn(!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                        </div>
                    )}
                    {status === 'installment' && (
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold text-foreground">Installment Plan Details</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="installmentDetails.buyerName" render={({ field }) => (<FormItem><FormLabel>Buyer Name</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="installmentDetails.buyerContact" render={({ field }) => (<FormItem><FormLabel>Buyer Contact</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                             </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="installmentDetails.totalPrice" render={({ field }) => (<FormItem><FormLabel>Total Price (PKR)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="installmentDetails.downPayment" render={({ field }) => (<FormItem><FormLabel>Down Payment (PKR)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="installmentDetails.duration" render={({ field }) => (<FormItem><FormLabel>Duration</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="installmentDetails.frequency" render={({ field }) => (<FormItem><FormLabel>Frequency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            </div>
                             <FormField control={form.control} name="installmentDetails.purchaseDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Purchase Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn(!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                        </div>
                    )}

                </div>
                <DialogFooter className="justify-between sm:justify-between flex-wrap gap-2 pt-4 border-t">
                    <div>
                        {isEditing && onDelete && (
                        <Button variant="destructive" onClick={onDelete} size="sm" type="button">Delete Plot</Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <DialogClose asChild>
                        <Button variant="outline" size="sm" type="button">Cancel</Button>
                        </DialogClose>
                        <Button size="sm" type="submit">Save Plot</Button>
                    </div>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
    

    
