
"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit3, Trash2, Eye, Search, Package, FileText, Loader2 } from "lucide-react";
import type { Property } from "@/types";
import Image from "next/image";
import { getProperties, deleteProperty } from "@/lib/mock-db";

type FilterStatus = "all" | "available" | "installment" | "rented";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      const data = await getProperties();
      setProperties(data);
      setIsLoading(false);
    };
    fetchProperties();
  }, []);

  const handleDeleteProperty = async (id: string) => {
    const success = await deleteProperty(id);
    if (success) {
      setProperties(prev => prev.filter(p => p.id !== id));
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearchTerm = 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.propertyType && property.propertyType.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilterStatus = 
        filterStatus === "all" ||
        (filterStatus === "available" && !property.isSoldOnInstallment && !property.isRented) ||
        (filterStatus === "installment" && property.isSoldOnInstallment) ||
        (filterStatus === "rented" && property.isRented);
      
      return matchesSearchTerm && matchesFilterStatus;
    });
  }, [properties, searchTerm, filterStatus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-semibold">Properties</h2>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search name, address, type..."
              className="pl-8 w-full sm:w-[250px] shadow-sm"
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
              <SelectItem value="installment">Sold (Installment)</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/properties/add" passHref>
            <Button className="w-full sm:w-auto shadow-sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Property
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Image/File</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plots</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin inline-block" />
                    <p className="mt-2">Loading properties...</p>
                  </TableCell>
                </TableRow>
              ) : filteredProperties.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={7} className="text-center h-48">
                      <p className="text-muted-foreground">
                        {properties.length === 0 ? "No properties found. Get started by adding a new property." : "No properties match your current search/filter criteria."}
                      </p>
                    </TableCell>
                  </TableRow>
              ) : (
                filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      {property.imageType === 'pdf' && property.imageUrl ? (
                        <a href={property.imageUrl} target="_blank" rel="noopener noreferrer" title={`View PDF for ${property.name}`} className="flex items-center justify-center h-[75px] w-[100px] bg-muted rounded hover:bg-muted/80">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </a>
                      ) : (
                        <Image 
                          src={property.imageUrl || "https://placehold.co/100x75.png"} 
                          alt={property.name}
                          width={100}
                          height={75}
                          className="rounded object-cover aspect-[4/3]"
                          data-ai-hint="property exterior"
                        />
                      )}
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
                    <TableCell>
                      {property.isSoldOnInstallment ? (
                        <Badge variant="secondary">Installment</Badge>
                      ) : property.isRented ? (
                        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white">Rented</Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-500 text-green-600">Available</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                       <Link href={`/properties/${property.id}`} passHref>
                         <Button variant="ghost" size="icon" aria-label="View Property">
                            <Eye className="h-4 w-4" />
                          </Button>
                       </Link>
                      <Button variant="ghost" size="icon" aria-label="Edit Property" onClick={() => alert(`Edit ${property.name}`)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete Property" className="text-destructive hover:text-destructive" onClick={() => handleDeleteProperty(property.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
