
"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Eye, Search, Package, Loader2 } from "lucide-react";
import type { Property } from "@/types";
import Image from "next/image";
import { getProperties, deleteProperty } from "@/lib/mock-db";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
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
import { PropertyFormDialog } from "@/components/properties/property-form-dialog";

type FilterStatus = "all" | "available" | "installment" | "rented" | "sold";

const getStatusBadge = (property: Property) => {
  if (property.isSold) {
    return <Badge variant="destructive">Sold</Badge>;
  }
  if (property.isSoldOnInstallment) {
    return <Badge variant="secondary">Installment</Badge>;
  }
  if (property.isRented) {
    return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white">Rented</Badge>;
  }
  return <Badge variant="outline" className="border-green-500 text-green-600">Available</Badge>;
};


export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const fetchProperties = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const ownerId = userProfile?.role === 'admin' ? user.uid : userProfile?.adminId;
    if (!ownerId) {
      setIsLoading(false);
      return;
    }
    const data = await getProperties(ownerId);
    setProperties(data);
    setIsLoading(false);
  }, [user, userProfile]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDeleteProperty = async (id: string) => {
    const success = await deleteProperty(id);
    if (success) {
      setProperties(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Property Deleted",
        description: "The property has been successfully removed.",
      });
    } else {
       toast({
        title: "Error",
        description: "Failed to delete the property. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleOpenForm = (property: Property | null = null) => {
    setEditingProperty(property);
    setIsDialogOpen(true);
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearchTerm = 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.propertyType && property.propertyType.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilterStatus = 
        filterStatus === "all" ||
        (filterStatus === "available" && !property.isSoldOnInstallment && !property.isRented && !property.isSold) ||
        (filterStatus === "installment" && property.isSoldOnInstallment) ||
        (filterStatus === "rented" && property.isRented) ||
        (filterStatus === "sold" && property.isSold);
      
      return matchesSearchTerm && matchesFilterStatus;
    });
  }, [properties, searchTerm, filterStatus]);

  const PropertyCard = ({ property }: { property: Property }) => (
    <Card className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative">
          <Image 
            src={property.imageUrls?.[0] || "https://placehold.co/300x200.png"} 
            alt={property.name}
            width={300}
            height={200}
            className="rounded-t-lg object-cover w-full aspect-video"
            data-ai-hint="property exterior"
          />
          <div className="absolute top-2 right-2">
            {getStatusBadge(property)}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg">{property.name}</h3>
          <p className="text-sm text-muted-foreground">{property.address}</p>
          <div className="flex justify-between items-center mt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {property.propertyType || "N/A"}
              </Badge>
              <p className="text-sm text-muted-foreground">Plots: {property.plots?.length || 0}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-2 border-t mt-auto">
        <div className="flex justify-end w-full space-x-1">
          <Link href={`/properties/${property.id}`} passHref>
            <Button variant="ghost" size="sm" aria-label="View Property">
              <Eye className="h-4 w-4 mr-1" /> View
            </Button>
          </Link>
          {userProfile?.role !== 'agent' && (
            <Button variant="ghost" size="sm" aria-label="Edit Property" onClick={() => handleOpenForm(property)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          )}
          {userProfile?.role === 'admin' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Delete Property" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{property.name}" and all its data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteProperty(property.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Yes, delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-semibold">Properties</h2>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <div className="relative w-full flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search properties..."
                className="pl-8 w-full shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="w-full sm:w-[180px] shadow-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="installment">On Installment</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full sm:w-auto shadow-sm" onClick={() => handleOpenForm()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Property
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading properties...</span>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-10 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              {properties.length === 0 ? "No properties found. Get started by adding a new property." : "No properties match your current search/filter criteria."}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card className="shadow-lg">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Plots</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProperties.map((property) => (
                          <TableRow key={property.id}>
                            <TableCell>
                              <Image 
                                src={property.imageUrls?.[0] || "https://placehold.co/100x75.png"} 
                                alt={property.name}
                                width={100}
                                height={75}
                                className="rounded object-cover aspect-[4/3]"
                                data-ai-hint="property exterior"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{property.name}</TableCell>
                            <TableCell>{property.address}</TableCell>
                            <TableCell>
                                {property.propertyType ? (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Package className="h-3 w-3" />
                                        {property.propertyType}
                                    </Badge>
                                ) : "N/A"}
                            </TableCell>
                            <TableCell>{property.plots?.length || 0}</TableCell>
                            <TableCell>{getStatusBadge(property)}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Link href={`/properties/${property.id}`} passHref>
                                <Button variant="ghost" size="icon" aria-label="View Property">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                              </Link>
                              {userProfile?.role !== 'agent' && (
                                <Button variant="ghost" size="icon" aria-label="Edit Property" onClick={() => handleOpenForm(property)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {userProfile?.role === 'admin' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Delete Property" className="text-destructive hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete "{property.name}" and all of its associated data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteProperty(property.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Yes, delete property
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            {/* Mobile Card View */}
            <div className="grid md:hidden grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        )}
      </div>
      <PropertyFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUpdate={fetchProperties}
        initialData={editingProperty}
      />
    </>
  );
}
