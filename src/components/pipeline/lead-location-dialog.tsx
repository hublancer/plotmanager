
"use client";

import type { Lead } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Building, DollarSign, Info, Tag, ExternalLink } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { LocationMapEmbed } from "@/components/maps/property-location-map";

interface LeadLocationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    lead: Lead | null;
}

export function LeadLocationDialog({ isOpen, onOpenChange, lead }: LeadLocationDialogProps) {
    if (!lead) {
        return null;
    }

    const hasCoordinates = lead.latitude && lead.longitude;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{lead.name}</DialogTitle>
                    <DialogDescription>
                        {lead.company || "Lead Details"}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Value</p>
                            <p className="font-semibold">PKR {lead.value.toLocaleString()}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                        <Tag className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant="secondary">{lead.status}</Badge>
                        </div>
                    </div>
                     {lead.company && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                            <Building className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Company</p>
                                <p className="font-semibold">{lead.company}</p>
                            </div>
                        </div>
                     )}
                     {lead.notes && (
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                            <Info className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-muted-foreground">Notes</p>
                                <p className="font-semibold whitespace-pre-wrap">{lead.notes}</p>
                            </div>
                        </div>
                     )}

                    {lead.contact && (
                        <div className="pt-4 border-t">
                            <h3 className="text-base font-semibold mb-2">Contact Actions</h3>
                            <div className="flex items-center justify-center gap-4">
                                <Button asChild variant="outline" className="flex-1 bg-green-500 text-white hover:bg-green-600 border-green-600">
                                    <a href={`https://wa.me/${lead.contact.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                        <WhatsAppIcon className="h-5 w-5 fill-current mr-2" />
                                        WhatsApp
                                    </a>
                                </Button>
                                <Button asChild variant="outline" className="flex-1">
                                    <a href={`tel:${lead.contact.replace(/\D/g, '')}`} aria-label="Call">
                                        <Phone className="h-5 w-5 mr-2" />
                                        Call
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    {hasCoordinates && (
                         <div className="pt-4 border-t">
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="text-base font-semibold flex items-center gap-2"><MapPin className="h-5 w-5"/> Pinned Location</h3>
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${lead.latitude},${lead.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Open
                                  </a>
                                </Button>
                             </div>
                             <div className="h-[200px] w-full rounded-md overflow-hidden border shadow-sm mt-2">
                                <LocationMapEmbed
                                    coordinates={{ lat: lead.latitude!, lng: lead.longitude! }}
                                />
                            </div>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
}
