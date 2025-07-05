
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addEmployee, updateEmployee } from "@/lib/mock-db";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from '@/types';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";

const employeeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  position: z.string().min(2, "Position is required."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
  department: z.string().optional(),
  hireDate: z.date({
    required_error: "A hire date is required.",
  }),
  role: z.enum(["manager", "agent"], { required_error: "Role is required."}),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  initialData?: Employee | null;
}

export function EmployeeFormDialog({ isOpen, onOpenChange, onUpdate, initialData }: EmployeeFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      position: "",
      email: "",
      phone: "",
      department: "",
      role: "agent",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        hireDate: new Date(initialData.hireDate),
      });
    } else {
      form.reset({
        name: "",
        position: "",
        email: "",
        phone: "",
        department: "",
        role: "agent",
        hireDate: new Date(),
      });
    }
  }, [initialData, form, isOpen]);


  const onSubmit = async (values: EmployeeFormValues) => {
    if (!user) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to manage employees.",
            variant: "destructive"
        });
        return;
    }
    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateEmployee(initialData.id, {
          ...values,
          hireDate: values.hireDate.toISOString(),
        });
        toast({
          title: "Employee Updated",
          description: `${values.name}'s profile has been updated.`,
        });
      } else {
        await addEmployee({
          ...values,
          userId: user.uid,
          hireDate: values.hireDate.toISOString(),
        });
        toast({
          title: "Employee Invitation Ready",
          description: `${values.name}'s profile is ready. They can now register with the email ${values.email} to activate their account.`,
        });
      }
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save employee:", error);
      toast({
        title: "Error",
        description: "Failed to save the employee. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Employee" : "Create Employee Invitation"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update the employee's details below." : "Fill in the details to create an account invitation. The employee will then need to register using this email to set their own password and activate their account."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="position" render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g., Sales Manager" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField 
                control={form.control} 
                name="email" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Employee's Login Email</FormLabel>
                        <FormControl>
                            <Input 
                                type="email" 
                                placeholder="name@example.com" 
                                {...field} 
                                disabled={initialData?.status === 'active'}
                            />
                        </FormControl>
                        {initialData?.status === 'active' && (
                            <FormDescription>
                                The email cannot be changed for an active employee.
                            </FormDescription>
                        )}
                        <FormMessage />
                    </FormItem>
                )} 
              />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input placeholder="e.g., +92 300 1234567" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Department (Optional)</FormLabel><FormControl><Input placeholder="e.g., Sales, HR" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="hireDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Hire Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Assign Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent><SelectItem value="agent">Agent (Salesperson)</SelectItem><SelectItem value="manager">Manager</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? "Saving..." : "Save Employee"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
