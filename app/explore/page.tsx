import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import ExploreView from "@/components/explore-view";
import { Dashboard } from "@/lib/types";

async function getAllDashboards() {
  const dashboardsRef = collection(db, "dashboards");
  const q = query(
    dashboardsRef,
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);

  const dashboards: Dashboard[] = [];
  querySnapshot.forEach((doc) => {
    dashboards.push({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      lastActivityAt: doc.data().lastActivityAt.toDate(),
    } as Dashboard);
  });

  return dashboards;
}

export default async function ExplorePage() {
  const dashboards = await getAllDashboards();

  return <ExploreView initialDashboards={dashboards} />;
}