
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import type { Employee } from "@/types";
import Image from "next/image"; // Import next/image
import { getEmployees } from "@/lib/mock-db"; // Updated import

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setEmployees(getEmployees()); // Use centralized mock data
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  const handleDeleteEmployee = (id: string) => {
    // In a real app, you'd call an API to delete the employee
    // For now, this just filters the local state. It won't persist if mock-db isn't updated.
    // To make delete work with mock-db, we'd need a deleteEmployee function there.
    setEmployees(prev => prev.filter(e => e.id !== id));
    alert(`Employee with ID: ${id} would be deleted. (Local state only for now)`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading employees...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Employee Management</h2>
        <Link href="/employees/add" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </Link>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No employees found. Get started by adding a new employee.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={employee.avatarUrl || "https://placehold.co/100x100.png"} 
                          alt={employee.name} 
                          data-ai-hint="employee avatar"
                        />
                        <AvatarFallback>{employee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department || "N/A"}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{new Date(employee.hireDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" aria-label="Edit Employee" onClick={() => alert(`Edit employee: ${employee.name}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete Employee" className="text-destructive hover:text-destructive" onClick={() => handleDeleteEmployee(employee.id)}>
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
       <CardDescription className="text-sm text-muted-foreground p-4 border rounded-lg">
        This section allows you to manage your company's employees. You can add new employees, view their details, and perform other HR-related tasks.
      </CardDescription>
    </div>
  );
}
