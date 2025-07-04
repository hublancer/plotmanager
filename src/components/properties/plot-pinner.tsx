
"use client";

import type { PlotData } from "@/types";
import Image from "next/image";
import { useState, useRef, MouseEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit2, Trash2, MapPin, Scaling, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  imageUrls: string[];
  initialPlots?: PlotData[];
  onPlotsChange: (plots: PlotData[]) => void;
}

export function PlotPinner({ imageUrls, initialPlots = [], onPlotsChange }: PlotPinnerProps) {
  const [plots, setPlots] = useState<PlotData[]>(initialPlots);
  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [tempPin, setTempPin] = useState<{ x: number; y: number } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // New state for zoom and pan
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom/pan when image changes
  useEffect(() => {
    handleReset();
  }, [currentIndex]);
  
  const handleImageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || isDragging) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const unscaledX = (clickX - position.x) / scale;
    const unscaledY = (clickY - position.y) / scale;
    
    // Check if clicking on an existing pin
    for (const plot of plots.filter(p => p.imageIndex === currentIndex)) {
      const plotContainerX = plot.x / 100 * rect.width;
      const plotContainerY = plot.y / 100 * rect.height;
      const distance = Math.sqrt(Math.pow(plotContainerX - unscaledX, 2) + Math.pow(plotContainerY - unscaledY, 2));

      if (distance < 12) { // Clickable radius of 12px on unscaled image
        setSelectedPlot(plot);
        setIsEditing(true);
        setShowDialog(true);
        setTempPin(null);
        return;
      }
    }
    
    if (scale > 1) {
      toast({ title: "Zoom Out to Pin", description: "Please reset zoom to add a new plot." });
      return;
    }

    const xPercent = (unscaledX / rect.width) * 100;
    const yPercent = (unscaledY / rect.height) * 100;
    
    setTempPin({ x: xPercent, y: yPercent });
    setSelectedPlot(null);
    setIsEditing(false);
    setShowDialog(true);
  };

  const handleSavePlot = (formData: Omit<PlotData, 'id' | 'x' | 'y' | 'imageIndex' | 'color'>) => {
    let newPlots;
    if (isEditing && selectedPlot) {
      newPlots = plots.map(p => p.id === selectedPlot.id ? { ...selectedPlot, ...formData } : p);
    } else if (tempPin) {
      const randomColor = pinColors[plots.length % pinColors.length];
      const newPlot: PlotData = { 
        ...formData, 
        id: Date.now().toString(), 
        x: tempPin.x, 
        y: tempPin.y,
        imageIndex: currentIndex,
        color: randomColor,
      };
      newPlots = [...plots, newPlot];
    } else {
      return; 
    }
    setPlots(newPlots);
    onPlotsChange(newPlots);
    setShowDialog(false);
    setSelectedPlot(null);
    setTempPin(null);
    toast({ title: "Plot Saved", description: `Plot ${formData.plotNumber} has been ${isEditing ? 'updated' : 'added'}.`});
  };
  
  const handleDeletePlot = (plotId: string) => {
    const newPlots = plots.filter(p => p.id !== plotId);
    setPlots(newPlots);
    onPlotsChange(newPlots);
    setShowDialog(false);
    setSelectedPlot(null);
    toast({ title: "Plot Deleted", description: "The plot has been removed.", variant: "destructive" });
  };
  
  const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 5));
  const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 1));
  const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const handleMouseDown = (e: MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setTimeout(() => setIsDragging(false), 50);
  };
  
  const goToPrevious = () => setCurrentIndex(prev => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  const goToNext = () => setCurrentIndex(prev => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  
  const currentImagePlots = plots.filter(p => p.imageIndex === currentIndex);

  return (
    <div className="space-y-2">
      <div
        ref={imageContainerRef}
        className={cn(
          "relative w-full aspect-[16/9] border rounded-lg overflow-hidden bg-muted/30 shadow-inner",
          scale > 1 ? "cursor-grab" : "cursor-crosshair",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
      >
        <div
          className="w-full h-full"
          style={{ transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}
        >
          <Image 
            key={currentIndex}
            src={imageUrls[currentIndex]} 
            alt={`Property layout ${currentIndex + 1}`}
            layout="fill" 
            objectFit="contain" 
            data-ai-hint="property aerial map site plan"
            draggable="false"
            priority
          />
        </div>
        
        {currentImagePlots.map(plot => {
          const rect = imageContainerRef.current?.getBoundingClientRect();
          if (!rect) return null;
          const transformedX = (plot.x / 100 * rect.width) * scale + position.x;
          const transformedY = (plot.y / 100 * rect.height) * scale + position.y;
          return (
            <div
              key={plot.id}
              className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer transform transition-all duration-150 ease-out hover:scale-125"
              style={{ 
                left: `${transformedX}px`, 
                top: `${transformedY}px`,
                transform: `scale(${1 / scale})`, // Counter-scale the pin itself
                backgroundColor: plot.color || 'rgba(59, 130, 246, 0.8)',
                border: `${2 / scale}px solid hsl(var(--primary-foreground, 0 0% 100%))`
              }}
              onClick={(e) => { e.stopPropagation(); setSelectedPlot(plot); setIsEditing(true); setShowDialog(true); }}
              title={`Plot ${plot.plotNumber} (${plot.size || 'N/A'})`}
            >
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
          );
        })}

        {tempPin && !showDialog && (
          <div
            className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/70 border-2 border-primary-foreground flex items-center justify-center"
            style={{ left: `${tempPin.x}%`, top: `${tempPin.y}%` }}
          >
            <PlusCircle className="w-4 h-4 text-primary-foreground"/>
          </div>
        )}
      </div>

      <div className="bg-card border rounded-lg p-2 space-y-2">
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={scale <= 1} aria-label="Zoom Out"><ZoomOut className="h-5 w-5"/></Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={scale >= 5} aria-label="Zoom In"><ZoomIn className="h-5 w-5"/></Button>
            <Button variant="outline" size="icon" onClick={handleReset} disabled={scale === 1 && position.x === 0 && position.y === 0} aria-label="Reset View"><RefreshCw className="h-5 w-5"/></Button>
          </div>
          
          {imageUrls.length > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrevious} aria-label="Previous Image"><ChevronLeft className="h-5 w-5"/></Button>
              <span className="text-sm font-medium text-muted-foreground tabular-nums">{currentIndex + 1} / {imageUrls.length}</span>
              <Button variant="outline" size="icon" onClick={goToNext} aria-label="Next Image"><ChevronRight className="h-5 w-5"/></Button>
            </div>
          )}
        </div>

        {imageUrls.length > 1 && (
          <div className="relative w-full">
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-2">
                {imageUrls.map((url, index) => (
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
          onOpenChange={setShowDialog}
          plotData={isEditing ? selectedPlot : null}
          onSave={handleSavePlot}
          onDelete={selectedPlot ? () => handleDeletePlot(selectedPlot.id) : undefined}
        />
      )}
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Pinned Plots ({currentImagePlots.length} on this image, {plots.length} total)</h3>
        {plots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plots pinned yet. Click on the image above to add a plot.</p>
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
                    <p className="text-xs text-muted-foreground truncate">Buyer: {plot.buyerName || "N/A"} - Price: PKR {plot.price?.toLocaleString() || "N/A"}</p>
                  </div>
                </div>
                <div className="space-x-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedPlot(plot); setIsEditing(true); setShowDialog(true); }}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeletePlot(plot.id)}>
                    <Trash2 className="h-4 w-4" />
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

interface PlotDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  plotData: PlotData | null;
  onSave: (data: Omit<PlotData, 'id' | 'x' | 'y' | 'imageIndex' | 'color'>) => void;
  onDelete?: () => void;
}

function PlotDialog({ isOpen, onOpenChange, plotData, onSave, onDelete }: PlotDialogProps) {
  const [plotNumber, setPlotNumber] = useState(plotData?.plotNumber || "");
  const [buyerName, setBuyerName] = useState(plotData?.buyerName || "");
  const [buyerContact, setBuyerContact] = useState(plotData?.buyerContact || "");
  const [price, setPrice] = useState<number | string>(plotData?.price || "");
  const [size, setSize] = useState(plotData?.size || "");
  const [details, setDetails] = useState(plotData?.details || "");

  useEffect(() => {
    if (isOpen) {
        if (plotData) {
            setPlotNumber(plotData.plotNumber);
            setBuyerName(plotData.buyerName || "");
            setBuyerContact(plotData.buyerContact || "");
            setPrice(plotData.price || "");
            setSize(plotData.size || "");
            setDetails(plotData.details || "");
        } else {
            setPlotNumber("");
            setBuyerName("");
            setBuyerContact("");
            setPrice("");
            setSize("");
            setDetails("");
        }
    }
  }, [plotData, isOpen]);

  const handleSubmit = () => {
    onSave({ 
      plotNumber, 
      buyerName, 
      buyerContact, 
      price: Number(price) || 0,
      size,
      details
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{plotData ? "Edit Plot Information" : "Add Plot Information"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="plotNumber" className="text-right">Plot Number</Label>
            <Input id="plotNumber" value={plotNumber} onChange={(e) => setPlotNumber(e.target.value)} className="col-span-3" placeholder="e.g. 123-A"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="size" className="text-right flex items-center justify-end">
              <Scaling className="h-3 w-3 mr-1 inline"/> Size
            </Label>
            <Input id="size" value={size} onChange={(e) => setSize(e.target.value)} className="col-span-3" placeholder="e.g., 5 Marla, 1 Kanal"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buyerName" className="text-right">Buyer Name</Label>
            <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="col-span-3" placeholder="Enter buyer's name (optional)"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buyerContact" className="text-right">Buyer Contact</Label>
            <Input id="buyerContact" value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)} className="col-span-3" placeholder="Buyer's phone/email (optional)"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Price (PKR)</Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="col-span-3" placeholder="Enter agreed price (optional)"/>
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="details" className="text-right pt-2">Details</Label>
            <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} className="col-span-3 min-h-[60px]" placeholder="e.g., Facing park, corner plot, leased (optional)"/>
          </div>
        </div>
        <DialogFooter className="justify-between sm:justify-between flex-wrap gap-2">
          <div>
            {plotData && onDelete && (
              <Button variant="destructive" onClick={onDelete} size="sm">Delete Plot</Button>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} size="sm">Save Plot</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
