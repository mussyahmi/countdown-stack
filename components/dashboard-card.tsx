"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dashboard } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, Clock, Lock, ShieldAlert } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

interface DashboardCardProps {
  dashboard: Dashboard;
}

interface EventPreview {
  title: string;
  date: Date;
  color: string;
}

export default function DashboardCard({ dashboard }: DashboardCardProps) {
  const [nextEvent, setNextEvent] = useState<EventPreview | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Don't load event data for private dashboards
    if (dashboard.isPrivate) {
      setIsLoading(false);
      return;
    }

    async function fetchEventPreview() {
      try {
        const eventsRef = collection(db, "dashboards", dashboard.id, "events");
        const q = query(eventsRef, orderBy("date", "asc"), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const eventData = snapshot.docs[0].data();
          const eventDate = eventData.date.toDate();

          if (eventDate > new Date()) {
            setNextEvent({
              title: eventData.title,
              date: eventDate,
              color: eventData.color,
            });
          }
        }

        const allEventsSnapshot = await getDocs(collection(db, "dashboards", dashboard.id, "events"));
        setEventCount(allEventsSnapshot.size);
      } catch (error) {
        console.error("Error fetching event preview:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEventPreview();
  }, [dashboard.id, dashboard.isPrivate]);

  return (
    <Link href={`/${dashboard.slug}`}>
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
        {/* Color bar - only for public dashboards with events */}
        {!dashboard.isPrivate && nextEvent && (
          <div className="h-2" style={{ backgroundColor: nextEvent.color }} />
        )}

        {/* Gray bar for private dashboards */}
        {dashboard.isPrivate && (
          <div className="h-2 bg-muted" />
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="line-clamp-1">{dashboard.title}</CardTitle>
                {dashboard.isPrivate && (
                  <Badge variant="secondary" className="shrink-0">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>
              {/* Only show description for public dashboards */}
              {!dashboard.isPrivate && dashboard.description && (
                <CardDescription className="line-clamp-2 mt-1">
                  {dashboard.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Private Dashboard - Show Lock Message */}
            {dashboard.isPrivate ? (
              <div className="bg-muted rounded-lg p-4 text-center">
                <ShieldAlert className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm font-medium mb-1">Password Protected</div>
                <div className="text-xs text-muted-foreground">
                  Enter password to view details
                </div>
              </div>
            ) : (
              <>
                {/* Public Dashboard - Show Event Preview */}
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading events...</div>
                ) : nextEvent ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Next Event:</div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="font-medium text-sm mb-1">{nextEvent.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(nextEvent.date, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No upcoming events</div>
                )}

                {/* Stats - Only for public dashboards */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {dashboard.viewCount}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {eventCount} {eventCount === 1 ? "event" : "events"}
                  </div>
                </div>
              </>
            )}

            {/* Created Date - Show for all */}
            <div className="text-xs text-muted-foreground">
              Created {formatDistanceToNow(dashboard.createdAt, { addSuffix: true })}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}