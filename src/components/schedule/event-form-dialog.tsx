
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/mock-db";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import type { CalendarEvent, RentalItem, InstallmentItem } from '@/types';
import type { DateSelectArg, EventInput } from '@fullcalendar/core';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CalendarIcon, Trash2, Link as LinkIcon, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import Link from "next/link";


const formSchema = z.object({
  title: z.string().min(2, "Title is required."),
  type: z.enum(['event', 'meeting', 'holiday']),
  allDay: z.boolean(),
  start: z.date({ required_error: "Start date is required." }),
  end: z.date().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
  details: z.string().optional(),
}).superRefine((data, ctx) => {
    if (!data.allDay) {
        if (!data.startTime) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["startTime"],
                message: "Start time is required.",
            });
        }
        if (data.end && !data.endTime) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["endTime"],
                message: "End time is required.",
            });
        }
    }

    if (data.start && data.end && data.startTime && data.endTime && !data.allDay) {
        const combine = (date: Date, time: string) => {
            const newDate = new Date(date);
            const [hours, minutes] = time.split(':').map(Number);
            newDate.setHours(hours, minutes, 0, 0);
            return newDate;
        }

        const startDateTime = combine(data.start, data.startTime);
        const endDateTime = combine(data.end, data.endTime);

        if (startDateTime >= endDateTime) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["endTime"],
                message: "End time must be after start time.",
            });
        }
    }
});


type FormValues = z.infer<typeof formSchema>;

interface EventFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  initialEvent?: CalendarEvent | null;
  dateInfo?: DateSelectArg | null;
  viewingEvent?: EventInput | null;
}

export function EventFormDialog({ isOpen, onOpenChange, onUpdate, initialEvent, dateInfo, viewingEvent }: EventFormDialogProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "event",
      allDay: true,
      details: "",
    },
  });
  
  const isReadOnly = !!viewingEvent;

  useEffect(() => {
    if (isOpen) {
        if (initialEvent) { // Editing an existing custom event
            const startDate = parseISO(initialEvent.start);
            const endDate = initialEvent.end ? parseISO(initialEvent.end) : undefined;
            form.reset({
                title: initialEvent.title,
                type: initialEvent.type,
                allDay: initialEvent.allDay,
                start: startDate,
                end: endDate,
                startTime: !initialEvent.allDay ? format(startDate, 'HH:mm') : undefined,
                endTime: !initialEvent.allDay && endDate ? format(endDate, 'HH:mm') : undefined,
                details: initialEvent.details || "",
            });
        } else if (dateInfo) { // Creating a new event from date click
            form.reset({
                title: "",
                type: "event",
                allDay: dateInfo.allDay,
                start: dateInfo.start,
                end: dateInfo.allDay ? undefined : dateInfo.end,
                startTime: !dateInfo.allDay ? format(dateInfo.start, 'HH:mm') : undefined,
                endTime: !dateInfo.allDay ? format(dateInfo.end, 'HH:mm') : undefined,
                details: "",
            });
        } else if (viewingEvent) { // Viewing a derived event
            form.reset(); // Clear form for read-only view
        }
    }
  }, [isOpen, initialEvent, dateInfo, viewingEvent, form]);


  const onSubmit = async (values: FormValues) => {
    if (!user || !userProfile) {
        toast({ title: "Authentication Error", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    
    const ownerId = userProfile.role === 'admin' ? user.uid : userProfile.adminId;
    if (!ownerId) {
        toast({ title: "Error", description: "Could not determine agency owner.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
        const combineDateTime = (date: Date, time?: string): Date => {
            if (!time) return date;
            const newDate = new Date(date);
            const [hours, minutes] = time.split(':').map(Number);
            newDate.setHours(hours, minutes, 0, 0);
            return newDate;
        };

        const finalStartDate = values.allDay ? values.start : combineDateTime(values.start, values.startTime);
        
        let finalEndDate: Date | undefined;
        if (values.end) {
            finalEndDate = values.allDay ? values.end : combineDateTime(values.end, values.endTime);
        }

        const dataToSave = {
            userId: ownerId,
            createdBy: user.uid,
            title: values.title,
            type: values.type,
            allDay: values.allDay,
            start: finalStartDate.toISOString(),
            ...(finalEndDate && { end: finalEndDate.toISOString() }),
            ...(values.details && { details: values.details }),
        };

        if (initialEvent) {
            await updateCalendarEvent(initialEvent.id, dataToSave);
            toast({ title: "Event Updated" });
        } else {
            await addCalendarEvent(dataToSave as Omit<CalendarEvent, 'id' | 'createdAt'>);
            toast({ title: "Event Created" });
        }
        onUpdate();
        onOpenChange(false);
    } catch (error) {
        console.error("Failed to save event:", error);
        toast({ title: "Error", description: "Failed to save the event.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialEvent) return;
    setIsSubmitting(true);
    try {
        await deleteCalendarEvent(initialEvent.id);
        toast({ title: "Event Deleted", variant: "destructive" });
        onUpdate();
        onOpenChange(false);
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete event.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const allDay = form.watch("allDay");

  const renderReadOnlyView = () => {
    if (!viewingEvent) return null;
    const props = viewingEvent.extendedProps;
    const type = props.type;

    let title = "Event Details";
    let details: React.ReactNode[] = [];
    let linkUrl = `/properties/${props.propertyId}`;

    if (type === 'rental-due') {
        const item = props as RentalItem;
        title = `Rent Due: ${item.tenantName}`;
        details.push(<p key="prop">Property: {item.propertyName} {item.plotNumber ? `(Plot #${item.plotNumber})` : ''}</p>);
        details.push(<p key="rent">Rent: PKR {item.rentAmount.toLocaleString()} / {item.rentFrequency}</p>);
        linkUrl = `/rentals`;
    } else if (type === 'installment-due') {
        const item = props as InstallmentItem;
        title = `Installment Due: ${item.buyerName}`;
        details.push(<p key="prop">Property: {item.propertyName} {item.plotNumber ? `(Plot #${item.plotNumber})` : ''}</p>);
        details.push(<p key="amt">Amount: PKR {item.installmentAmount.toLocaleString()}</p>);
        details.push(<p key="status">Status: {item.status}</p>);
        linkUrl = `/installments`;
    }

    return (
        <div>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    Due on {format(new Date(viewingEvent.start as string), 'PPP')}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2 text-sm">
                {details}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
                <Link href={linkUrl} passHref>
                    <Button onClick={() => onOpenChange(false)}>
                        <LinkIcon className="mr-2 h-4 w-4" /> Go to Details
                    </Button>
                </Link>
            </DialogFooter>
        </div>
    );
  };
  
  if (isReadOnly) {
      return (
         <Dialog open={isOpen} onOpenChange={onOpenChange}>
             <DialogContent className="sm:max-w-md">
                {renderReadOnlyView()}
             </DialogContent>
         </Dialog>
      )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Meeting with client" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="event">Event</SelectItem><SelectItem value="meeting">Meeting</SelectItem><SelectItem value="holiday">Holiday</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="allDay" render={({ field }) => (<FormItem className="flex flex-col pt-2"><FormLabel>All-day event</FormLabel><FormControl><div className="flex items-center space-x-2 h-10"><Switch checked={field.value} onCheckedChange={field.onChange} /><Label htmlFor={field.name}>{field.value ? 'Yes' : 'No'}</Label></div></FormControl></FormItem>)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <FormField control={form.control} name="start" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )} />
                    {!allDay && <FormField control={form.control} name="startTime" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl><Input type="time" {...field} value={field.value ?? ""} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />}
                </div>
                <div className="space-y-2">
                    <FormField control={form.control} name="end" render={({ field }) => (
                        <FormItem>
                            <FormLabel>End Date</FormLabel>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )} />
                     {!allDay && <FormField control={form.control} name="endTime" render={({ field }) => (
                        <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl><Input type="time" {...field} value={field.value ?? ""} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />}
                </div>
            </div>

            <FormField control={form.control} name="details" render={({ field }) => (<FormItem><FormLabel>Details (optional)</FormLabel><FormControl><Textarea placeholder="Add notes, location, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
            
            <DialogFooter className="pt-4 border-t">
              <div className="flex justify-between w-full">
                <div>
                {initialEvent && (
                    <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>} Delete
                    </Button>
                )}
                </div>
                <div className="flex gap-2">
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        {isSubmitting ? "Saving..." : "Save Event"}
                    </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
