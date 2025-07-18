
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
import { getCalendarEvents, updateCalendarEvent } from '@/lib/mock-db';
import type { CalendarEvent } from '@/types';
import { EventFormDialog } from '@/components/schedule/event-form-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function SchedulePage() {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [events, setEvents] = useState<EventInput[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedDateInfo, setSelectedDateInfo] = useState<DateSelectArg | null>(null);
    const [viewingEvent, setViewingEvent] = useState<EventInput | null>(null);
    const isMobile = useIsMobile();

    const fetchData = useCallback(async () => {
        if (!user || !userProfile) return;
        setIsLoading(true);

        const ownerId = userProfile.role === 'admin' ? user.uid : userProfile.adminId;
        if (!ownerId) {
            setIsLoading(false);
            toast({ title: "Error", description: "Could not determine the agency account.", variant: "destructive"});
            return;
        }

        const userEvents = await getCalendarEvents(ownerId);

        const formattedUserEvents: EventInput[] = userEvents.map(e => ({
            id: e.id,
            title: e.title,
            start: e.start,
            end: e.end,
            allDay: e.allDay,
            className: `event-${e.type}`,
            extendedProps: { ...e, isCustom: true },
        }));

        setEvents(formattedUserEvents);
        setIsLoading(false);
    }, [user, userProfile, toast]);

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
            return isMobile ? window.innerHeight - 180 : window.innerHeight - 200;
        }
        return 'auto';
    }, [isMobile]);

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
                        headerToolbar={
                            isMobile ? {
                                left: 'prev,next',
                                center: 'title',
                                right: 'listWeek,dayGridMonth',
                            } : {
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                            }
                        }
                        initialView={isMobile ? "listWeek" : "dayGridMonth"}
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
