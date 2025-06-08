
"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit3, Trash2, Eye, Search } from "lucide-react";
import type { Property } from "@/types";
import Image from "next/image";
import { getProperties, deleteProperty as deletePropertyFromDb } from "@/lib/mock-db";

type FilterStatus = "all" | "available" | "installment";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setProperties(getProperties());
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  const handleDeleteProperty = (id: string) => {
    if (deletePropertyFromDb(id)) {
      setProperties(prev => prev.filter(p => p.id !== id));
      // Consider adding a toast notification here
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearchTerm = 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilterStatus = 
        filterStatus === "all" ||
        (filterStatus === "available" && !property.isSoldOnInstallment) ||
        (filterStatus === "installment" && property.isSoldOnInstallment);
      
      return matchesSearchTerm && matchesFilterStatus;
    });
  }, [properties, searchTerm, filterStatus]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading properties...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-semibold">Properties</h2>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search name or address..."
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
            </SelectContent>
          </Select>
          <Link href="/properties/add" passHref>
            <Button className="w-full sm:w-auto shadow-sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Property
            </Button>
          </Link>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {properties.length === 0 ? "No properties found. Get started by adding a new property." : "No properties match your current search/filter criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
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
                        src={property.imageUrl || "https://placehold.co/100x75.png"} 
                        alt={property.name}
                        width={100}
                        height={75}
                        className="rounded object-cover aspect-[4/3]"
                        data-ai-hint="property exterior"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>{property.address}</TableCell>
                    <TableCell>{property.plots.length}</TableCell>
                    <TableCell>
                      {property.isSoldOnInstallment ? (
                        <Badge variant="secondary">Installment</Badge>
                      ) : (
                        <Badge variant="outline">Available</Badge>
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
