
"use client";

import type { Lead } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { LatLngExpression } from 'leaflet';
import dynamic from 'next/dynamic';

const DynamicPropertyLocationMap = dynamic(() => 
  import('@/components/maps/property-location-map').then(mod => mod.PropertyLocationMap),
  { 
    ssr: false,
    loading: () => <div className="h-[300px] w-full rounded-md border flex items-center justify-center bg-muted"><p>Loading map...</p></div>
  }
);

interface LeadLocationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    lead: Lead | null;
}

export function LeadLocationDialog({ isOpen, onOpenChange, lead }: LeadLocationDialogProps) {
    if (!lead || !lead.latitude || !lead.longitude) {
        return null;
    }

    const position: LatLngExpression = [lead.latitude, lead.longitude];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lead Location: {lead.name}</DialogTitle>
                    <DialogDescription>
                        {lead.notes || `Location pinned for this lead.`}
                    </DialogDescription>
                </DialogHeader>
                <div className="h-[300px] w-full rounded-md overflow-hidden border shadow-sm mt-4">
                    <DynamicPropertyLocationMap
                        key={`${position[0]}-${position[1]}`}
                        position={position}
                        popupText={lead.name}
                        interactive={false}
                        mapHeight="100%"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
