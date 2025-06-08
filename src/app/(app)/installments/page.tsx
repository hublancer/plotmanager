
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Eye, Edit, DollarSign } from "lucide-react";
import type { InstallmentDetails } from "@/types";
import Link from "next/link";
import { getInstallmentProperties } from "@/lib/mock-db"; // Updated import

export default function InstallmentsPage() {
  const [installmentProperties, setInstallmentProperties] = useState<InstallmentDetails[]>([]);

  useEffect(() => {
    // Fetch data from the centralized mock DB
    setInstallmentProperties(getInstallmentProperties());
  }, []);
  
  const calculateProgress = (paid?: number, total?: number) => {
    if (paid === undefined || total === undefined || total === 0) return 0;
    return (paid / total) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Installment Tracking</h2>
        {/* Button to add new installment property or convert existing property could go here */}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead className="w-[200px]">Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installmentProperties.map((prop) => (
                <TableRow key={prop.id}>
                  <TableCell>
                    <div className="font-medium">{prop.name}</div>
                    <div className="text-xs text-muted-foreground">{prop.address}</div>
                  </TableCell>
                  <TableCell>${prop.totalInstallmentPrice?.toLocaleString()}</TableCell>
                  <TableCell>${prop.paidAmount?.toLocaleString()}</TableCell>
                  <TableCell className={prop.remainingAmount === 0 ? "text-green-600 font-semibold" : ""}>
                    ${prop.remainingAmount?.toLocaleString()}
                  </TableCell>
                  <TableCell>{prop.purchaseDate ? new Date(prop.purchaseDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{prop.nextDueDate ? new Date(prop.nextDueDate).toLocaleDateString() : (prop.remainingAmount === 0 ? 'Fully Paid' : 'N/A')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Progress value={calculateProgress(prop.paidAmount, prop.totalInstallmentPrice)} className="h-2" />
                       <span className="text-xs text-muted-foreground">{calculateProgress(prop.paidAmount, prop.totalInstallmentPrice).toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                     <Link href={`/properties/${prop.id}`} passHref>
                        <Button variant="ghost" size="icon" title="View Property Details">
                            <Eye className="h-4 w-4" />
                        </Button>
                     </Link>
                     <Link href={`/payments?propertyId=${prop.id}&type=installment`} passHref>
                        <Button variant="ghost" size="icon" title="View Payments">
                            <DollarSign className="h-4 w-4" />
                        </Button>
                     </Link>
                     {/* Edit installment details could be a modal or separate page */}
                     <Button variant="ghost" size="icon" title="Edit Installment Details" onClick={() => alert(`Edit installment for ${prop.name}`)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {installmentProperties.length === 0 && (
                 <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">No properties on installment plans found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CardDescription className="text-sm text-muted-foreground p-4 border rounded-lg">
        This section tracks properties sold under installment plans. You can view payment progress, remaining balances, and due dates.
        To add a property here, mark it as 'Sold on Installment' in its details and record installment payments through the Payments section.
      </CardDescription>
    </div>
  );
}
