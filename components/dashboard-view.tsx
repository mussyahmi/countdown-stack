"use client";

import { useState, useEffect } from "react";
import { Dashboard, Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock, Plus, Settings, Share2, Calendar, Eye, MoreVertical, Pencil, Trash2, TrendingUp } from "lucide-react";
import CountdownTimer from "@/components/countdown-timer";
import AddEventDialog from "@/components/add-event-dialog";
import PasswordDialog from "@/components/password-dialog";
import DashboardSettingsDialog from "@/components/dashboard-settings-dialog";
import PrivateDashboardDialog from "@/components/private-dashboard-dialog";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, increment } from "firebase/firestore";
import { logView, shouldCountView } from "@/lib/trending";

interface DashboardViewProps {
  dashboard: Dashboard;
  initialEvents: Event[];
}

export default function DashboardView({ dashboard, initialEvents }: DashboardViewProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showPrivateDialog, setShowPrivateDialog] = useState(dashboard.isPrivate && !isAuthenticated);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Track view with trending score
  useEffect(() => {
    const trackView = async () => {
      if (shouldCountView(dashboard.id)) {
        try {
          // Log view and update trending score
          await logView(dashboard.id);

          // Also increment total view count
          await updateDoc(doc(db, "dashboards", dashboard.id), {
            viewCount: increment(1),
          });
        } catch (error) {
          console.error("Error tracking view:", error);
        }
      }
    };

    trackView();
  }, [dashboard.id]);

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
    setShowPasswordDialog(false);
    setShowPrivateDialog(false);
    toast.success("Access granted");
  };

  const handleAddEvent = () => {
    if (!isAuthenticated) {
      setShowPasswordDialog(true);
      return;
    }
    setEditingEvent(null);
    setShowAddEventDialog(true);
  };

  const handleEditEvent = (event: Event) => {
    if (!isAuthenticated) {
      setShowPasswordDialog(true);
      return;
    }
    setEditingEvent(event);
    setShowAddEventDialog(true);
  };

  const handleDeleteEvent = (event: Event) => {
    if (!isAuthenticated) {
      setShowPasswordDialog(true);
      return;
    }
    setDeletingEvent(event);
  };

  const confirmDeleteEvent = async () => {
    if (!deletingEvent) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "dashboards", dashboard.id, "events", deletingEvent.id));

      await updateDoc(doc(db, "dashboards", dashboard.id), {
        lastActivityAt: new Date(),
      });

      setEvents(events.filter(e => e.id !== deletingEvent.id));
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    } finally {
      setIsDeleting(false);
      setDeletingEvent(null);
    }
  };

  const handleSettings = () => {
    if (!isAuthenticated) {
      setShowPasswordDialog(true);
      return;
    }
    setShowSettingsDialog(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const exportToGoogleCalendar = (event: Event) => {
    const startDate = event.date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(event.date.getTime() + 60 * 60 * 1000)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
      event.description || ""
    )}`;

    window.open(url, "_blank");
  };

  const exportToAppleCalendar = (event: Event) => {
    const startDate = event.date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(event.date.getTime() + 60 * 60 * 1000)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ""}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (showPrivateDialog) {
    return (
      <PrivateDashboardDialog
        dashboardId={dashboard.id}
        onSuccess={handlePasswordSuccess}
      />
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{dashboard.title}</h1>
              {dashboard.isPrivate && (
                <Badge variant="secondary">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
            {dashboard.description && (
              <p className="text-muted-foreground">{dashboard.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleSettings}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {dashboard.viewCount} views
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            {dashboard.trendingScore || 0} trending score
          </div>
          <div>
            {events.length} {events.length === 1 ? "event" : "events"}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first countdown event
            </p>
            <Button onClick={handleAddEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: event.color }}
              />
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate pr-2">{event.title}</span>

                  {isAuthenticated && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteEvent(event)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardTitle>
                {event.description && (
                  <CardDescription>{event.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <CountdownTimer targetDate={event.date} />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => exportToGoogleCalendar(event)}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => exportToAppleCalendar(event)}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Apple
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        dashboardId={dashboard.id}
        onSuccess={handlePasswordSuccess}
      />

      <AddEventDialog
        open={showAddEventDialog}
        onOpenChange={setShowAddEventDialog}
        dashboardId={dashboard.id}
        editEvent={editingEvent}
        onEventAdded={(newEvent) => {
          if (editingEvent) {
            setEvents(events.map(e => e.id === newEvent.id ? newEvent : e)
              .sort((a, b) => a.date.getTime() - b.date.getTime()));
          } else {
            setEvents([...events, newEvent].sort((a, b) =>
              a.date.getTime() - b.date.getTime()
            ));
          }
          setEditingEvent(null);
        }}
      />

      <DashboardSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        dashboard={dashboard}
      />

      <AlertDialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEvent}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}