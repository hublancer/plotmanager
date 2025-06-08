
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit3, Trash2, Eye } from "lucide-react";
import type { Property } from "@/types";
import Image from "next/image";
import { getProperties, deleteProperty as deletePropertyFromDb } from "@/lib/mock-db"; // Updated import

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setProperties(getProperties()); // Use centralized mock data
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  const handleDeleteProperty = (id: string) => {
    if (deletePropertyFromDb(id)) { // Use centralized delete
      setProperties(prev => prev.filter(p => p.id !== id));
      // In a real app, you'd show a toast notification
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading properties...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Properties</h2>
        <Link href="/properties/add" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Property
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No properties found. Get started by adding a new property.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
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
                {properties.map((property) => (
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
                    <TableCell className="text-right space-x-2">
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
