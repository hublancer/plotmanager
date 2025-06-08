
"use client";

import type { PlotData } from "@/types";
import Image from "next/image";
import { useState, useRef, MouseEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit2, Trash2, MapPin, Scaling } from "lucide-react"; // Added Scaling icon
import { useToast } from "@/hooks/use-toast";

interface PlotPinnerProps {
  imageUrl: string;
  initialPlots?: PlotData[];
  onPlotsChange: (plots: PlotData[]) => void;
  imageType?: 'photo' | 'pdf';
}

export function PlotPinner({ imageUrl, initialPlots = [], onPlotsChange, imageType }: PlotPinnerProps) {
  const [plots, setPlots] = useState<PlotData[]>(initialPlots);
  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [tempPin, setTempPin] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setPlots(initialPlots);
  }, [initialPlots]);
  
  const handleImageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    for (const plot of plots) {
      const distance = Math.sqrt(Math.pow(plot.x - x, 2) + Math.pow(plot.y - y, 2));
      if (distance < 3) { 
        setSelectedPlot(plot);
        setIsEditing(true);
        setShowDialog(true);
        setTempPin(null);
        return;
      }
    }

    setTempPin({ x, y });
    setSelectedPlot(null);
    setIsEditing(false);
    setShowDialog(true);
  };

  const handleSavePlot = (formData: Omit<PlotData, 'id' | 'x' | 'y'>) => {
    let newPlots;
    if (isEditing && selectedPlot) {
      newPlots = plots.map(p => p.id === selectedPlot.id ? { ...selectedPlot, ...formData } : p);
    } else if (tempPin) {
      const newPlot: PlotData = { 
        ...formData, 
        id: Date.now().toString(), 
        x: tempPin.x, 
        y: tempPin.y 
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


  if (imageType === 'pdf') {
    return (
      <div className="p-4 border rounded-lg bg-muted text-muted-foreground text-center">
        <p className="font-semibold">PDF Pinning Not Available</p>
        <p className="text-sm">Plot pinning on PDF files is an advanced feature and is not supported in this demo. Please upload an image (PNG, JPG) for pinning.</p>
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
          <Button variant="link">View PDF</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={imageContainerRef}
        className="relative w-full aspect-[16/9] border rounded-lg overflow-hidden cursor-crosshair bg-muted/30 shadow-inner"
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
        aria-label="Property image area, click to add a plot pin"
      >
        <Image src={imageUrl} alt="Property to pin plots on" layout="fill" objectFit="contain" data-ai-hint="property aerial map" />
        {plots.map(plot => (
          <div
            key={plot.id}
            className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer transform transition-all duration-150 ease-out hover:scale-125"
            style={{ left: `${plot.x}%`, top: `${plot.y}%`, backgroundColor: 'rgba(var(--color-accent-hsl), 0.7)', border: '2px solid hsl(var(--accent-foreground))' }}
            onClick={(e) => { e.stopPropagation(); setSelectedPlot(plot); setIsEditing(true); setShowDialog(true); }}
            title={`Plot ${plot.plotNumber} (${plot.size || 'N/A'})`}
          >
            <MapPin className="w-4 h-4 text-accent-foreground" />
          </div>
        ))}
        {tempPin && !showDialog && ( 
            <div
              className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/70 border-2 border-primary-foreground flex items-center justify-center"
              style={{ left: `${tempPin.x}%`, top: `${tempPin.y}%` }}
            >
              <PlusCircle className="w-4 h-4 text-primary-foreground"/>
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
        <h3 className="text-lg font-semibold mb-2">Pinned Plots ({plots.length})</h3>
        {plots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plots pinned yet. Click on the image above to add a plot.</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {plots.map(plot => (
              <li key={plot.id} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-secondary/50 transition-colors">
                <div>
                  <p className="font-medium text-foreground">Plot #{plot.plotNumber} {plot.size && <span className="text-xs text-muted-foreground">({plot.size})</span>}</p>
                  <p className="text-xs text-muted-foreground">Buyer: {plot.buyerName || "N/A"} - Price: PKR {plot.price?.toLocaleString() || "N/A"}</p>
                </div>
                <div className="space-x-1">
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
  onSave: (data: Omit<PlotData, 'id' | 'x' | 'y'>) => void;
  onDelete?: () => void;
}

function PlotDialog({ isOpen, onOpenChange, plotData, onSave, onDelete }: PlotDialogProps) {
  const [plotNumber, setPlotNumber] = useState(plotData?.plotNumber || "");
  const [buyerName, setBuyerName] = useState(plotData?.buyerName || "");
  const [buyerContact, setBuyerContact] = useState(plotData?.buyerContact || "");
  const [price, setPrice] = useState<number | string>(plotData?.price || "");
  const [size, setSize] = useState(plotData?.size || ""); // New state for plot size
  const [details, setDetails] = useState(plotData?.details || "");

  useEffect(() => {
    if (plotData) {
      setPlotNumber(plotData.plotNumber);
      setBuyerName(plotData.buyerName);
      setBuyerContact(plotData.buyerContact);
      setPrice(plotData.price);
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
  }, [plotData, isOpen]);

  const handleSubmit = () => {
    onSave({ 
      plotNumber, 
      buyerName, 
      buyerContact, 
      price: Number(price),
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
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="plotNumber" className="text-right">Plot Number</Label>
            <Input id="plotNumber" value={plotNumber} onChange={(e) => setPlotNumber(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="size" className="text-right flex items-center">
              <Scaling className="h-3 w-3 mr-1 inline"/> Size
            </Label>
            <Input id="size" value={size} onChange={(e) => setSize(e.target.value)} className="col-span-3" placeholder="e.g., 5 Marla, 1 Kanal"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buyerName" className="text-right">Buyer Name</Label>
            <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buyerContact" className="text-right">Buyer Contact</Label>
            <Input id="buyerContact" value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Price (PKR)</Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="details" className="text-right">Details</Label>
            <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} className="col-span-3" placeholder="e.g., Facing park, corner plot"/>
          </div>
        </div>
        <DialogFooter className="justify-between">
          {plotData && onDelete && (
            <Button variant="destructive" onClick={onDelete}>Delete</Button>
          )}
          <div className="space-x-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit}>Save Plot</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
