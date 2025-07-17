
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from 'next/link';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getDerivedRentals, endRental } from "@/lib/mock-db";
import type { RentalItem } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RentalDetailsDialog } from "@/components/rentals/rental-details-dialog";
import { Edit, PlusCircle, Loader2, Search, Trash2, Eye, User, Home, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function RentalsPage() {
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingRental, setViewingRental] = useState<RentalItem | null>(null);

  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const fetchRentals = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const rentalsData = await getDerivedRentals(user.uid);
      setRentals(rentalsData);
    } catch (error) {
      console.error("Failed to fetch rentals:", error);
      toast({ title: "Error", description: "Could not fetch rental data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  const handleOpenDetails = (rental: RentalItem) => {
    setViewingRental(rental);
    setIsDetailsOpen(true);
  }

  const handleEndRental = async (rental: RentalItem) => {
    const success = await endRental(rental.propertyId, rental.source === 'plot' ? rental.id : undefined);
    if (success) {
      toast({ title: "Rental Ended", description: "The property/plot is now marked as available." });
      fetchRentals();
    } else {
      toast({ title: "Error", description: "Could not end the rental agreement.", variant: "destructive" });
    }
  };

  const filteredRentals = useMemo(() => {
    return rentals.filter(r => 
      r.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.plotNumber && r.plotNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [rentals, searchTerm]);

  const RentalCard = ({ rental }: { rental: RentalItem }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-bold">{rental.propertyName}</p>
            <p className="text-sm text-muted-foreground">{rental.plotNumber ? `Plot #${rental.plotNumber}` : rental.address}</p>
          </div>
          <Badge variant={rental.paymentStatus === 'Paid' ? 'secondary' : 'destructive'} className={cn(rental.paymentStatus === 'Paid' && "border-green-500 text-green-600")}>
            {rental.paymentStatus}
          </Badge>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> <span>{rental.tenantName || "N/A"}</span></div>
          <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /> <span>PKR {rental.rentAmount?.toLocaleString() || "N/A"} /{rental.rentFrequency?.slice(0,2)}</span></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => handleOpenDetails(rental)}><Eye className="h-4 w-4 mr-2" /> View</Button>
          {userProfile?.role !== 'agent' && (
            <Link href={`/properties/${rental.propertyId}`} passHref>
              <Button variant="ghost" size="icon" title="Edit Property"><Edit className="h-4 w-4" /></Button>
            </Link>
          )}
          {userProfile?.role === 'admin' && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="End Rental" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>End Rental Agreement?</AlertDialogTitle><AlertDialogDescription>This will mark the property/plot as available and clear tenant data. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleEndRental(rental)} className="bg-destructive hover:bg-destructive/90">Yes, End Agreement</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );


  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold">Rental Management</h2>
            <p className="text-muted-foreground">Overview of all rented properties and plots.</p>
          </div>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search by property, plot, address, or tenant..." className="pl-8 w-full shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
             {isLoading ? (
               <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
             ) : filteredRentals.length === 0 ? (
               <div className="p-6 text-center text-muted-foreground">No rental listings found.</div>
             ) : (
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader><TableRow><TableHead>Property / Plot</TableHead><TableHead>Tenant</TableHead><TableHead>Rent (PKR)</TableHead><TableHead>Payment Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filteredRentals.map((rental) => (
                          <TableRow key={rental.id}>
                            <TableCell><div className="font-medium">{rental.propertyName}</div><div className="text-xs text-muted-foreground">{rental.plotNumber ? `Plot #${rental.plotNumber}` : rental.address}</div></TableCell>
                            <TableCell>{rental.tenantName || "N/A"}</TableCell>
                            <TableCell>{rental.rentAmount?.toLocaleString() || "N/A"}<span className="text-xs text-muted-foreground capitalize ml-1">/{rental.rentFrequency?.slice(0,2)}</span></TableCell>
                            <TableCell><Badge variant={rental.paymentStatus === 'Paid' ? 'secondary' : 'destructive'} className={cn(rental.paymentStatus === 'Paid' && "border-green-500 text-green-600")}>{rental.paymentStatus}</Badge></TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="outline" size="sm" onClick={() => handleOpenDetails(rental)}><Eye className="h-4 w-4 mr-2" /> View Details</Button>
                              {userProfile?.role !== 'agent' && (<Link href={`/properties/${rental.propertyId}`} passHref><Button variant="ghost" size="icon" title="Edit Property"><Edit className="h-4 w-4" /></Button></Link>)}
                              {userProfile?.role === 'admin' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="End Rental Agreement" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>End Rental Agreement?</AlertDialogTitle><AlertDialogDescription>This will mark the property/plot as available and clear tenant data. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleEndRental(rental)} className="bg-destructive hover:bg-destructive/90">Yes, End Agreement</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                   {/* Mobile Card View */}
                  <div className="md:hidden space-y-4 p-4">
                    {filteredRentals.map((rental) => <RentalCard key={rental.id} rental={rental} />)}
                  </div>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
      <RentalDetailsDialog
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        rental={viewingRental}
        onUpdate={fetchRentals}
      />
    </>
  );
}
