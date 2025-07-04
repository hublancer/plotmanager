
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
import { Edit, PlusCircle, Loader2, Search, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function RentalsPage() {
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingRental, setViewingRental] = useState<RentalItem | null>(null);

  const { user } = useAuth();
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
            <div className="flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by property, plot, address, or tenant..."
                  className="pl-8 w-full shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property / Plot</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Rent (PKR)</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin inline-block" /></TableCell></TableRow>
                ) : filteredRentals.length > 0 ? (
                  filteredRentals.map((rental) => (
                    <TableRow key={rental.id}>
                      <TableCell>
                        <div className="font-medium">{rental.propertyName}</div>
                        <div className="text-xs text-muted-foreground">
                          {rental.plotNumber ? `Plot #${rental.plotNumber}` : rental.address}
                        </div>
                      </TableCell>
                      <TableCell>{rental.tenantName || "N/A"}</TableCell>
                      <TableCell>
                        {rental.rentAmount?.toLocaleString() || "N/A"}
                        <span className="text-xs text-muted-foreground capitalize ml-1">/{rental.rentFrequency?.slice(0,2)}</span>
                      </TableCell>
                       <TableCell>
                        <Badge variant={rental.paymentStatus === 'Paid' ? 'secondary' : 'destructive'} className={cn(rental.paymentStatus === 'Paid' && "border-green-500 text-green-600")}>
                            {rental.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" title="View Details" onClick={() => handleOpenDetails(rental)}><Eye className="h-4 w-4" /></Button>
                        <Link href={`/properties/${rental.propertyId}`} passHref>
                          <Button variant="ghost" size="icon" title="Edit Property"><Edit className="h-4 w-4" /></Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="End Rental Agreement" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>End Rental Agreement?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark the property/plot as available and clear tenant data. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleEndRental(rental)} className="bg-destructive hover:bg-destructive/90">
                                Yes, End Agreement
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No rental listings found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
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
