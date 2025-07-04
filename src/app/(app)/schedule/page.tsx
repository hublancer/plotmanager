
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventInput, EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';

import './calendar.css';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getDerivedRentals, getDerivedInstallmentItems } from '@/lib/mock-db';
import type { CalendarEvent } from '@/types';
import { EventFormDialog } from '@/components/schedule/event-form-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function SchedulePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [events, setEvents] = useState<EventInput[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedDateInfo, setSelectedDateInfo] = useState<DateSelectArg | null>(null);
    const [viewingEvent, setViewingEvent] = useState<EventInput | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        const [userEvents, rentals, installments] = await Promise.all([
            getCalendarEvents(user.uid),
            getDerivedRentals(user.uid),
            getDerivedInstallmentItems(user.uid),
        ]);

        const formattedUserEvents: EventInput[] = userEvents.map(e => ({
            id: e.id,
            title: e.title,
            start: e.start,
            end: e.end,
            allDay: e.allDay,
            className: `event-${e.type}`,
            extendedProps: { ...e, isCustom: true },
        }));

        const rentalEvents: EventInput[] = rentals
            .filter(r => r.nextDueDate)
            .map(r => ({
                id: `rental-${r.id}`,
                title: `Rent Due: ${r.tenantName}`,
                start: r.nextDueDate,
                allDay: true,
                className: 'event-rental-due',
                extendedProps: { type: 'rental-due', ...r },
                editable: false,
            }));

        const installmentEvents: EventInput[] = installments
            .filter(i => i.nextDueDate && i.status !== 'Fully Paid')
            .map(i => ({
                id: `installment-${i.id}`,
                title: `Installment Due: ${i.buyerName}`,
                start: i.nextDueDate,
                allDay: true,
                className: 'event-installment-due',
                extendedProps: { type: 'installment-due', ...i },
                editable: false,
            }));

        setEvents([...formattedUserEvents, ...rentalEvents, ...installmentEvents]);
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDateSelect = (selectInfo: DateSelectArg) => {
        setSelectedEvent(null);
        setSelectedDateInfo(selectInfo);
        setViewingEvent(null);
        setIsDialogOpen(true);
    };

    const handleEventClick = (clickInfo: EventClickArg) => {
        const props = clickInfo.event.extendedProps;
        if (props.isCustom) {
            setSelectedEvent(props as CalendarEvent);
            setViewingEvent(null);
        } else {
            setViewingEvent(clickInfo.event);
            setSelectedEvent(null);
        }
        setSelectedDateInfo(null);
        setIsDialogOpen(true);
    };

    const handleEventDrop = async (dropInfo: EventDropArg) => {
        const { event } = dropInfo;
        if (!event.extendedProps.isCustom) {
            toast({ title: 'Cannot move derived events', variant: 'destructive' });
            dropInfo.revert();
            return;
        }

        const success = await updateCalendarEvent(event.id, {
            start: event.startStr,
            end: event.endStr,
            allDay: event.allDay,
        });

        if (success) {
            toast({ title: 'Event Updated', description: 'The event has been rescheduled.' });
            fetchData();
        } else {
            toast({ title: 'Error', description: 'Failed to update the event.', variant: 'destructive' });
            dropInfo.revert();
        }
    };
    
    const calendarHeight = useMemo(() => {
        if (typeof window !== 'undefined') {
            return window.innerHeight - 200; // Adjust based on header/footer height
        }
        return 'auto';
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading schedule...</span>
            </div>
        );
    }

    return (
        <>
            <Card className="shadow-lg">
                <CardContent className="p-2 sm:p-4">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                        }}
                        initialView="dayGridMonth"
                        weekends={true}
                        events={events}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        editable={true}
                        droppable={true}
                        select={handleDateSelect}
                        eventClick={handleEventClick}
                        eventDrop={handleEventDrop}
                        height={calendarHeight}
                    />
                </CardContent>
            </Card>

            <EventFormDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onUpdate={fetchData}
                initialEvent={selectedEvent}
                dateInfo={selectedDateInfo}
                viewingEvent={viewingEvent}
            />
        </>
    );
}
