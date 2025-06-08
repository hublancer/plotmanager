
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddEmployeePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Employees
      </Button>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Add New Employee</CardTitle>
          <CardDescription>
            Fill in the details below to add a new employee to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center bg-muted/30 rounded-lg">
            <p className="text-lg font-semibold text-foreground">Employee Form Coming Soon!</p>
            <p className="text-muted-foreground">
              The form to add employee details will be implemented here.
            </p>
             <Link href="/employees" passHref className="mt-6 inline-block">
                <Button variant="outline">
                     Go Back to Employee List
                </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
