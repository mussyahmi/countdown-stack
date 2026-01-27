"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import DashboardView from "@/components/dashboard-view";
import { Dashboard, Event } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const params = useParams();
  const slug = params?.slug; // ✅ safe access

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      // If slug is not yet available, do nothing
      return;
    }

    async function fetchDashboard() {
      try {
        // Fetch dashboard by slug
        const dashboardsRef = collection(db, "dashboards");
        const q = query(dashboardsRef, where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        const dashboardDoc = querySnapshot.docs[0];
        const dashboardData: Dashboard = {
          ...(dashboardDoc.data() as Dashboard),
          id: dashboardDoc.id,
          createdAt: dashboardDoc.data().createdAt.toDate(),
          updatedAt: dashboardDoc.data().updatedAt.toDate(),
          lastActivityAt: dashboardDoc.data().lastActivityAt.toDate(),
        };

        setDashboard(dashboardData);

        // Fetch events
        const eventsRef = collection(db, "dashboards", dashboardDoc.id, "events");
        const eventsSnapshot = await getDocs(eventsRef);

        const eventsData: Event[] = [];
        eventsSnapshot.forEach((doc) => {
          eventsData.push({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
            createdAt: doc.data().createdAt.toDate(),
          } as Event);
        });

        eventsData.sort((a, b) => a.date.getTime() - b.date.getTime());
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, [slug]);

  if (!slug || isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !dashboard) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-xl mb-4">Dashboard Not Found</h2>
        <p className="text-muted-foreground">
          The dashboard you're looking for doesn't exist or has been deleted.
        </p>
      </div>
    );
  }

  return <DashboardView dashboard={dashboard} initialEvents={events} />;
}
