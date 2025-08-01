
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Edit, Trash2, Loader2, Hourglass, CheckCircle, Mail } from "lucide-react";
import type { Employee } from "@/types";
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
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const fetchAndProcessData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const [employeesData, leadsData, transactionsData] = await Promise.all([
      getEmployees(user.uid),
      getLeads(user.uid),
      getTransactions(user.uid),
    ]);

    const salesTransactions = transactionsData.filter(t => t.category.toLowerCase() === 'sale' && t.type === 'income');

    const employeesWithStats = employeesData.map(employee => {
      if (!employee.authUid) {
        return { ...employee, leadsCount: 0, salesCount: 0 };
      }
      
      const leadsCount = leadsData.filter(lead => lead.createdBy === employee.authUid).length;
      const salesCount = salesTransactions.filter(t => t.createdBy === employee.authUid).length;

      return { ...employee, leadsCount, salesCount };
    });

    setEmployees(employeesWithStats);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);
  
  const handleDeleteEmployee = async (id: string) => {
    const success = await deleteEmployee(id);
    if (success) {
      setEmployees(prev => prev.filter(e => e.id !== id));
      toast({
        title: "Employee Deleted",
        description: "The employee record has been removed and their access to your agency has been revoked.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete the employee. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleOpenForm = (employee: Employee | null = null) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const EmployeeCard = ({ employee }: { employee: Employee & { leadsCount?: number, salesCount?: number } }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={employee.avatarUrl || "https://placehold.co/100x100.png"} alt={employee.name} data-ai-hint="employee avatar" />
            <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{employee.name}</h3>
                <p className="text-sm text-muted-foreground">{employee.position}</p>
              </div>
              <Badge variant={employee.role === 'manager' ? 'secondary' : 'outline'} className="capitalize">{employee.role}</Badge>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <span>{employee.email}</span></div>
          <div className="flex items-center gap-2">
            {employee.status === 'active' ? (
              <Badge variant="secondary" className="text-green-600 border-green-500"><CheckCircle className="mr-1 h-3 w-3" /> Active</Badge>
            ) : (
              <Badge variant="outline"><Hourglass className="mr-1 h-3 w-3" /> Pending</Badge>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 text-center">
            <div className="bg-muted/50 p-2 rounded-md">
                <p className="text-xs text-muted-foreground">Leads Added</p>
                <p className="text-lg font-bold">{employee.leadsCount ?? 0}</p>
            </div>
            <div className="bg-muted/50 p-2 rounded-md">
                <p className="text-xs text-muted-foreground">Sales Closed</p>
                <p className="text-lg font-bold">{employee.salesCount ?? 0}</p>
            </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
            {userProfile?.role !== 'agent' && (
                <Button variant="ghost" size="sm" onClick={() => handleOpenForm(employee)}><Edit className="h-4 w-4 mr-1"/> Edit</Button>
            )}
            {userProfile?.role === 'admin' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-1"/> Delete</Button>
                </AlertDialogTrigger>
                 <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the record for {employee.name} and revoke their access.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteEmployee(employee.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading employees...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Employee Management</h2>
          <Button onClick={() => handleOpenForm()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </div>

        {employees.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No employees found. Get started by adding a new employee.</p>
            </CardContent>
          </Card>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
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
                        <TableHead className="text-center">Leads</TableHead>
                        <TableHead className="text-center">Sales</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={employee.avatarUrl || "https://placehold.co/100x100.png"} alt={employee.name} data-ai-hint="employee avatar" />
                              <AvatarFallback>{employee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell><Badge variant={employee.role === 'manager' ? 'secondary' : 'outline'} className="capitalize">{employee.role}</Badge></TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>
                            {employee.status === 'active' ? (<Badge variant="secondary" className="text-green-600 border-green-500"><CheckCircle className="mr-1 h-3 w-3" /> Active</Badge>) : (<Badge variant="outline"><Hourglass className="mr-1 h-3 w-3" /> Pending</Badge>)}
                          </TableCell>
                          <TableCell className="text-center font-medium">{employee.leadsCount ?? 0}</TableCell>
                          <TableCell className="text-center font-medium">{employee.salesCount ?? 0}</TableCell>
                          <TableCell className="text-right space-x-1">
                            {userProfile?.role !== 'agent' && (
                              <Button variant="ghost" size="icon" aria-label="Edit Employee" onClick={() => handleOpenForm(employee)}><Edit className="h-4 w-4" /></Button>
                            )}
                            {userProfile?.role === 'admin' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Delete Employee" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the record for {employee.name} and revoke their access to your agency.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteEmployee(employee.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete employee</AlertDialogAction></AlertDialogFooter>
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
            <div className="md:hidden space-y-4">
              {employees.map(employee => <EmployeeCard key={employee.id} employee={employee} />)}
            </div>
          </div>
        )}
        <CardDescription className="text-sm text-muted-foreground p-4 border rounded-lg">
          This section allows you to manage your company's employees. An employee becomes 'Active' after they sign up using the email you invited them with. Performance stats for leads and sales are tracked based on the employee who created the record.
        </CardDescription>
      </div>

      <EmployeeFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onUpdate={fetchAndProcessData}
        initialData={editingEmployee}
      />
    </>
  );
}
