
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Edit, Trash2, Loader2, Hourglass, CheckCircle } from "lucide-react";
import type { Employee, Lead, Transaction } from "@/types";
import { getEmployees, deleteEmployee, getLeads, getTransactions } from "@/lib/mock-db";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchAndProcessData = async () => {
      setIsLoading(true);
      const [employeesData, leadsData, transactionsData] = await Promise.all([
        getEmployees(user.uid),
        getLeads(user.uid),
        getTransactions(user.uid),
      ]);

      const salesTransactions = transactionsData.filter(t => t.category.toLowerCase() === 'sale' && t.type === 'income');

      const employeesWithStats = employeesData.map(employee => {
        // employee.authUid is the key to link to createdBy fields
        if (!employee.authUid) {
          return { ...employee, leadsCount: 0, salesCount: 0 };
        }
        
        const leadsCount = leadsData.filter(lead => lead.createdBy === employee.authUid).length;
        const salesCount = salesTransactions.filter(t => t.createdBy === employee.authUid).length;

        return { ...employee, leadsCount, salesCount };
      });

      setEmployees(employeesWithStats);
      setIsLoading(false);
    };
    fetchAndProcessData();
  }, [user]);
  
  const handleDeleteEmployee = async (id: string) => {
    const success = await deleteEmployee(id);
    if (success) {
      setEmployees(prev => prev.filter(e => e.id !== id));
      toast({
        title: "Employee Deleted",
        description: "The employee record has been successfully removed.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete the employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading employees...</span>
      </div>
    );
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
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Leads Added</TableHead>
                  <TableHead className="text-center">Sales Closed</TableHead>
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
                    <TableCell>
                      <Badge variant={employee.role === 'manager' ? 'secondary' : 'outline'} className="capitalize">
                        {employee.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      {employee.status === 'active' ? (
                        <Badge variant="secondary" className="text-green-600 border-green-500">
                           <CheckCircle className="mr-1 h-3 w-3" /> Active
                        </Badge>
                      ) : (
                         <Badge variant="outline">
                           <Hourglass className="mr-1 h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{employee.leadsCount ?? 0}</TableCell>
                    <TableCell className="text-center font-medium">{employee.salesCount ?? 0}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" aria-label="Edit Employee" onClick={() => alert(`Editing is not yet implemented.`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Delete Employee" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the record for {employee.name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Yes, delete employee
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
       <CardDescription className="text-sm text-muted-foreground p-4 border rounded-lg">
        This section allows you to manage your company's employees. An employee becomes 'Active' after they sign up using the email you invited them with. Performance stats for leads and sales are tracked based on the employee who created the record.
      </CardDescription>
    </div>
  );
}
