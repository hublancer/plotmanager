
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, DollarSign, Edit } from "lucide-react"; // Assuming Edit might be used later
import type { RentedPropertyDetails } from "@/types";
import Link from "next/link";
import { getRentedProperties } from "@/lib/mock-db";

export default function RentalsPage() {
  const [rentedProperties, setRentedProperties] = useState<RentedPropertyDetails[]>([]);

  useEffect(() => {
    setRentedProperties(getRentedProperties());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Rental Property Management</h2>
        {/* Button to add new rental agreement or mark property as rented could go here */}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Rent Amount</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead>Last Payment Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentedProperties.map((prop) => (
                <TableRow key={prop.id}>
                  <TableCell>
                    <div className="font-medium">{prop.name}</div>
                    <div className="text-xs text-muted-foreground">{prop.address}</div>
                  </TableCell>
                  <TableCell>{prop.tenantName || "N/A"}</TableCell>
                  <TableCell>${prop.rentAmount?.toLocaleString() || "N/A"}</TableCell>
                  <TableCell>
                    {prop.nextRentDueDate ? new Date(prop.nextRentDueDate).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    {prop.lastRentPaymentDate ? new Date(prop.lastRentPaymentDate).toLocaleDateString() : "No payments yet"}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                     <Link href={`/properties/${prop.id}`} passHref>
                        <Button variant="ghost" size="icon" title="View Property Details">
                            <Eye className="h-4 w-4" />
                        </Button>
                     </Link>
                     <Link href={`/payments?propertyId=${prop.id}&type=rent`} passHref>
                        <Button variant="ghost" size="icon" title="View Payments">
                            <DollarSign className="h-4 w-4" />
                        </Button>
                     </Link>
                     {/* Future: Edit rental agreement details */}
                     <Button variant="ghost" size="icon" title="Edit Rental Details" onClick={() => alert(`Edit rental for ${prop.name}`)} disabled>
                        <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rentedProperties.length === 0 && (
                 <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">No rented properties found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CardDescription className="text-sm text-muted-foreground p-4 border rounded-lg">
        This section tracks your rental properties. You can view tenant details, rent amounts, and payment history.
        To mark a property as rented or update rental details, you would typically do this via the property's main details page or a dedicated rental agreement form (features for future implementation).
      </CardDescription>
    </div>
  );
}
