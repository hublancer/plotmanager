
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getRentals, deleteRental } from "@/lib/mock-db";
import type { Rental } from "@/types";

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
import { RentalFormDialog } from "@/components/rentals/rental-form-dialog";
import { RentalDetailsDialog } from "@/components/rentals/rental-details-dialog";
import { Edit, PlusCircle, Loader2, Search, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingRental, setViewingRental] = useState<Rental | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRentals = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const rentalsData = await getRentals(user.uid);
      setRentals(rentalsData.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
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

  const handleOpenForm = (rental: Rental | null = null) => {
    setEditingRental(rental);
    setIsFormOpen(true);
  };
  
  const handleOpenDetails = (rental: Rental) => {
    setViewingRental(rental);
    setIsDetailsOpen(true);
  }

  const handleDeleteRental = async (rentalId: string) => {
    const success = await deleteRental(rentalId);
    if (success) {
      toast({ title: "Rental Deleted", description: "The rental listing has been removed." });
      fetchRentals();
    } else {
      toast({ title: "Error", description: "Could not delete the rental listing.", variant: "destructive" });
    }
  };

  const filteredRentals = useMemo(() => {
    return rentals.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tenantName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rentals, searchTerm]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold">Rental Management</h2>
            <p className="text-muted-foreground">Manage your standalone rental properties.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Rental
            </Button>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by property, address, or tenant..."
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
                  <TableHead>Property</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Rent (PKR)</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin inline-block" /></TableCell></TableRow>
                ) : filteredRentals.length > 0 ? (
                  filteredRentals.map((rental) => (
                    <TableRow key={rental.id} className="cursor-pointer" onClick={() => handleOpenDetails(rental)}>
                      <TableCell>
                        <div className="font-medium">{rental.name}</div>
                        <div className="text-xs text-muted-foreground">{rental.address}</div>
                      </TableCell>
                      <TableCell>{rental.tenantName || "N/A"}</TableCell>
                      <TableCell>
                        {rental.rentAmount?.toLocaleString() || "N/A"}
                        <span className="text-xs text-muted-foreground capitalize ml-1">/{rental.rentFrequency?.slice(0,2)}</span>
                      </TableCell>
                      <TableCell>{format(new Date(rental.startDate), "dd MMM, yyyy")}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" title="View Details" onClick={(e) => { e.stopPropagation(); handleOpenDetails(rental); }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Edit Rental Details" onClick={(e) => { e.stopPropagation(); handleOpenForm(rental); }}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog onOpenChange={(e) => e.stopPropagation()}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Delete Rental" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the rental record for "{rental.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteRental(rental.id)} className="bg-destructive hover:bg-destructive/90">
                                Yes, Delete Rental
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

      <RentalFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onUpdate={fetchRentals}
        initialData={editingRental}
      />

      <RentalDetailsDialog
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        rental={viewingRental}
      />
    </>
  );
}
