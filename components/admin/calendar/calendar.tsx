"use client";
import "temporal-polyfill/global";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { differenceInCalendarDays, endOfMonth, format, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, XIcon } from "lucide-react";
import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countEventsInRange, eventsForFilter, type CalendarBooking, type CalendarFilter } from "@/lib/admin/calendar-events";

const views = [
  { value: "dayGridMonth", label: "Month" },
  { value: "timeGridWeek", label: "Week" },
  { value: "timeGridDay", label: "Day" },
];
const filters: { value: CalendarFilter; label: string }[] = [
  { value: "all", label: "All rentals" },
  { value: "pickups", label: "Pickups" },
  { value: "dropoffs", label: "Drop-offs" },
  { value: "active", label: "Confirmed / active" },
  { value: "unpaid", label: "Unpaid" },
  { value: "cancelled", label: "Cancelled" },
];
const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin];

export function Calendar({ bookings }: { bookings: CalendarBooking[] }) {
  const router = useRouter();
  const controller = useCalendarController();
  const [eventCount, setEventCount] = React.useState(0);
  const [filter, setFilter] = React.useState<CalendarFilter>("all");
  const [viewType, setViewType] = React.useState(views[0].value);
  const [dateInfo, setDateInfo] = React.useState(() => {
    const now = new Date();
    return {
      title: format(now, "MMMM yyyy"),
      days: differenceInCalendarDays(endOfMonth(now), startOfMonth(now)) + 1,
      rangeStart: startOfMonth(now),
      rangeEnd: new Date(endOfMonth(now).getTime() + 86400000),
    };
  });
  const events = React.useMemo(() => eventsForFilter(bookings, filter), [bookings, filter]);
  React.useEffect(() => {
    setEventCount(countEventsInRange(events, dateInfo.rangeStart, dateInfo.rangeEnd));
  }, [events, dateInfo.rangeStart, dateInfo.rangeEnd]);

  return (
    <div className="flex flex-col overflow-hidden rounded-md border">
      <div className="bg-sidebar text-sidebar-foreground flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 shrink-0 flex-col gap-1">
          <div className="text-lg leading-none font-medium">{dateInfo.title}</div>
          <p className="text-muted-foreground text-sm">
            {dateInfo.days} days · {eventCount} event{eventCount === 1 ? "" : "s"}
            {bookings.length === 0 ? " · no bookings loaded" : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filter} onValueChange={(v) => v && setFilter(v as CalendarFilter)}>
            <SelectTrigger className="w-full sm:w-48"><CalendarIcon /><SelectValue /></SelectTrigger>
            <SelectContent align="start" position="popper">
              <SelectGroup>
                {filters.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <ButtonGroup>
            <Button size="icon" variant="outline" type="button" onClick={() => controller.prev()}><ChevronLeft /></Button>
            <Button variant="outline" type="button" onClick={() => controller.today()}>Today</Button>
            <Button size="icon" variant="outline" type="button" onClick={() => controller.next()}><ChevronRight /></Button>
          </ButtonGroup>
          <Select value={viewType} onValueChange={(v) => { if (!v) return; setViewType(v); controller.changeView(v); }}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent align="start" position="popper">
              <SelectGroup>
                {views.map((v) => (<SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => router.push("/admin/bookings")}><Plus />Bookings</Button>
        </div>
      </div>
      <EventCalendarViews
        controller={controller}
        initialView={views[0].value}
        plugins={[...plugins]}
        popoverCloseContent={() => <XIcon className="text-muted-foreground group-hover:text-foreground size-5" />}
        events={events}
        nowIndicator
        eventClick={(info) => {
          const bookingId = info.event.extendedProps?.bookingId as string | undefined;
          if (bookingId) {
            info.jsEvent.preventDefault();
            router.push(`/admin/bookings?booking=${encodeURIComponent(bookingId)}`);
          }
        }}
        datesSet={(info) => {
          setDateInfo({
            title: info.view.title,
            days: differenceInCalendarDays(info.view.currentEnd, info.view.currentStart),
            rangeStart: info.start,
            rangeEnd: info.end,
          });
          setViewType(info.view.type);
        }}
      />
    </div>
  );
}
