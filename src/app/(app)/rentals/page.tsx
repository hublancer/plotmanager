
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getRentedProperties, getProperties, updateProperty } from "@/lib/mock-db";
import type { RentedPropertyDetails, Property } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Eye, Edit, PlusCircle, Loader2, Search, Trash2, FileUp, FileDown } from "lucide-react";

export default function RentalsPage() {
  const [rentals, setRentals] = useState<RentedPropertyDetails[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<RentedPropertyDetails | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [rentalsData, propertiesData] = await Promise.all([
        getRentedProperties(user.uid),
        getProperties(user.uid),
      ]);
      setRentals(rentalsData.sort((a, b) => (a.status === 'Overdue' ? -1 : 1))); // Sort overdues to top
      setAllProperties(propertiesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ title: "Error", description: "Could not fetch rental data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleOpenForm = (rental: RentedPropertyDetails | null = null) => {
    setEditingRental(rental);
    setIsFormOpen(true);
  };
  
  const handleEndRental = async (propertyId: string) => {
    const success = await updateProperty(propertyId, { 
      isRented: false,
      tenantName: "",
      rentAmount: 0,
      rentFrequency: "monthly",
      rentStartDate: ""
    });
    if (success) {
      toast({ title: "Rental Ended", description: "The property is now marked as available." });
      fetchAllData();
    } else {
      toast({ title: "Error", description: "Could not end the rental agreement.", variant: "destructive" });
    }
  };

  const filteredRentals = useMemo(() => {
    return rentals.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.tenantName && r.tenantName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [rentals, searchTerm]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold">Rental Management</h2>
            <p className="text-muted-foreground">Track your active and overdue rental properties.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Rental
            </Button>
            <Button variant="outline" disabled className="w-full sm:w-auto">
                <FileUp className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button variant="outline" disabled className="w-full sm:w-auto">
                <FileDown className="mr-2 h-4 w-4" /> Export
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
                  <TableHead>Next Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin inline-block" /></TableCell></TableRow>
                ) : filteredRentals.length > 0 ? (
                  filteredRentals.map((prop) => (
                    <TableRow key={prop.id}>
                      <TableCell>
                        <div className="font-medium">{prop.name}</div>
                        <div className="text-xs text-muted-foreground">{prop.address}</div>
                      </TableCell>
                      <TableCell>{prop.tenantName || "N/A"}</TableCell>
                      <TableCell>
                        {prop.rentAmount?.toLocaleString() || "N/A"}
                        <span className="text-xs text-muted-foreground capitalize ml-1">/{prop.rentFrequency?.slice(0,2)}</span>
                      </TableCell>
                      <TableCell>{prop.nextRentDueDate ? new Date(prop.nextRentDueDate).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>
                        {prop.status === 'Overdue' ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-green-600">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Link href={`/properties/${prop.id}`} passHref>
                            <Button variant="ghost" size="icon" title="View Property Details"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" title="Edit Rental Details" onClick={() => handleOpenForm(prop)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="End Rental" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>End Rental Agreement?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark the property "{prop.name}" as available and clear the current tenant details. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleEndRental(prop.id)} className="bg-destructive hover:bg-destructive/90">
                                Yes, End Rental
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">No rented properties found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RentalFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onRentalUpdate={fetchAllData}
        initialData={editingRental}
        properties={allProperties}
      />
    </>
  );
}
