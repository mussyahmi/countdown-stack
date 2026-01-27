"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { Event } from "@/lib/types";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.date({
    message: "Date is required",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
});

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardId: string;
  onEventAdded: (event: Event) => void;
  editEvent?: Event | null;
}

const COLOR_PRESETS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6366f1", // indigo
];

export default function AddEventDialog({
  open,
  onOpenChange,
  dashboardId,
  onEventAdded,
  editEvent = null,
}: AddEventDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      time: "12:00",
      color: COLOR_PRESETS[0],
    },
  });

  // Update form when editEvent changes
  useEffect(() => {
    if (editEvent) {
      form.reset({
        title: editEvent.title,
        description: editEvent.description || "",
        date: editEvent.date,
        time: format(editEvent.date, "HH:mm"),
        color: editEvent.color,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        date: new Date(),
        time: "12:00",
        color: COLOR_PRESETS[0],
      });
    }
  }, [editEvent, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset({
        title: "",
        description: "",
        date: new Date(),
        time: "12:00",
        color: COLOR_PRESETS[0],
      });
    }
  }, [open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      // Combine date and time
      const [hours, minutes] = values.time.split(":").map(Number);
      const eventDate = new Date(values.date);
      eventDate.setHours(hours, minutes, 0, 0);

      if (editEvent) {
        // Update existing event
        const eventRef = doc(db, "dashboards", dashboardId, "events", editEvent.id);
        await updateDoc(eventRef, {
          title: values.title,
          description: values.description || "",
          date: eventDate,
          color: values.color,
        });

        const updatedEvent: Event = {
          ...editEvent,
          title: values.title,
          description: values.description || "",
          date: eventDate,
          color: values.color,
        };

        onEventAdded(updatedEvent);
        toast.success("Event updated successfully!");
      } else {
        // Create new event
        const eventsRef = collection(db, "dashboards", dashboardId, "events");
        const docRef = await addDoc(eventsRef, {
          title: values.title,
          description: values.description || "",
          date: eventDate,
          color: values.color,
          createdAt: new Date(),
        });

        // Update dashboard lastActivityAt
        await updateDoc(doc(db, "dashboards", dashboardId), {
          lastActivityAt: new Date(),
        });

        const newEvent: Event = {
          id: docRef.id,
          title: values.title,
          description: values.description || "",
          date: eventDate,
          color: values.color,
          createdAt: new Date(),
        };

        onEventAdded(newEvent);
        toast.success("Event added successfully!");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
          <DialogDescription>
            {editEvent
              ? "Update your event details below"
              : "Create a countdown timer for your upcoming event"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="My Birthday Party" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more details about your event..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Theme</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="grid grid-cols-5 gap-2">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => field.onChange(color)}
                            className={cn(
                              "h-10 w-full rounded-md border-2 transition-all",
                              field.value === color
                                ? "border-foreground scale-110"
                                : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-10 w-20"
                        />
                        <Input
                          type="text"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? editEvent
                    ? "Updating..."
                    : "Adding..."
                  : editEvent
                    ? "Update Event"
                    : "Add Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}