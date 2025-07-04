
"use client";

import type { Rental } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { MapPin, Phone, Building, DollarSign, Info, Tag, User, Calendar, FileText, BadgeInfo, LocateFixed } from "lucide-react";
import { format } from "date-fns";

interface RentalDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    rental: Rental | null;
}

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md text-sm">
            <div className="text-primary mt-1">{icon}</div>
            <div>
                <p className="text-muted-foreground">{label}</p>
                <p className="font-semibold">{typeof value === 'number' ? `PKR ${value.toLocaleString()}` : value}</p>
            </div>
        </div>
    );
};

export function RentalDetailsDialog({ isOpen, onOpenChange, rental }: RentalDetailsDialogProps) {
    if (!rental) return null;

    const hasCoordinates = rental.latitude && rental.longitude;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{rental.name}</DialogTitle>
                    <DialogDescription>{rental.address}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                    {/* Tenant Details */}
                    <h3 className="font-semibold text-md text-primary border-b pb-1">Tenant Information</h3>
                    <DetailRow icon={<User className="h-5 w-5"/>} label="Tenant Name" value={rental.tenantName} />
                    <DetailRow icon={<Phone className="h-5 w-5"/>} label="Tenant Contact" value={rental.tenantContact} />
                    <DetailRow icon={<BadgeInfo className="h-5 w-5"/>} label="Tenant CNIC" value={rental.tenantIdCard} />
                    
                    {/* Rental Details */}
                    <h3 className="font-semibold text-md text-primary border-b pb-1 pt-2">Rental & Property Details</h3>
                    <DetailRow icon={<Building className="h-5 w-5"/>} label="Property Type" value={rental.propertyType} />
                    <DetailRow icon={<DollarSign className="h-5 w-5"/>} label={`Rent Amount (${rental.rentFrequency})`} value={rental.rentAmount} />
                    <DetailRow icon={<Calendar className="h-5 w-5"/>} label="Agreement Start Date" value={format(new Date(rental.startDate), 'PPP')} />
                    <DetailRow icon={<FileText className="h-5 w-5"/>} label="Notes" value={rental.notes} />
                    
                    {hasCoordinates && (
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md text-sm">
                            <div className="text-primary mt-1"><LocateFixed className="h-5 w-5"/></div>
                            <div>
                                <p className="text-muted-foreground">Pinned Location</p>
                                <p className="font-semibold">{`Lat: ${rental.latitude}, Lng: ${rental.longitude}`}</p>
                            </div>
                        </div>
                    )}
                </div>
                 <DialogFooter className="sm:justify-between items-center pt-4 border-t gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                       {rental.tenantContact && (
                        <>
                            <Button asChild variant="outline" className="flex-1 bg-green-500 text-white hover:bg-green-600 border-green-600">
                                <a href={`https://wa.me/${rental.tenantContact.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                    <WhatsAppIcon className="h-5 w-5 fill-current mr-2" />
                                    WhatsApp
                                </a>
                            </Button>
                            <Button asChild variant="outline" className="flex-1">
                                <a href={`tel:${rental.tenantContact.replace(/\D/g, '')}`} aria-label="Call">
                                    <Phone className="h-5 w-5 mr-2" />
                                    Call
                                </a>
                            </Button>
                        </>
                       )}
                    </div>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
