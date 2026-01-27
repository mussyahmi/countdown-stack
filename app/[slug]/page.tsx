import { notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import DashboardView from "@/components/dashboard-view";
import { Dashboard, Event } from "@/lib/types";

async function getDashboard(slug: string) {
  const dashboardsRef = collection(db, "dashboards");
  const querySnapshot = await getDocs(dashboardsRef);

  let dashboardData = null;
  let dashboardId = null;

  querySnapshot.forEach((doc) => {
    if (doc.data().slug === slug) {
      dashboardData = { id: doc.id, ...doc.data() };
      dashboardId = doc.id;
    }
  });

  if (!dashboardData || !dashboardId) {
    return null;
  }

  // Get events
  const eventsRef = collection(db, "dashboards", dashboardId, "events");
  const eventsSnapshot = await getDocs(eventsRef);

  const events: Event[] = [];
  eventsSnapshot.forEach((doc) => {
    events.push({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    } as Event);
  });

  // Sort events by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    dashboard: {
      ...(dashboardData as any),
      createdAt: (dashboardData as any).createdAt.toDate(),
      updatedAt: (dashboardData as any).updatedAt.toDate(),
      lastActivityAt: (dashboardData as any).lastActivityAt.toDate(),
    } as Dashboard,
    events,
  };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await getDashboard(slug);

  if (!data) {
    notFound();
  }

  return (
    <DashboardView
      dashboard={data.dashboard}
      initialEvents={data.events}
    />
  );
}
