import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  updateDoc
} from "firebase/firestore";

/**
 * Calculate trending score based on recent views
 * Formula: (views_last_24h * 10) + (views_last_7d * 3) + (views_last_30d * 1)
 */
export async function calculateTrendingScore(dashboardId: string): Promise<number> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const viewLogsRef = collection(db, "viewLogs");

  // Get views in last 24 hours
  const last24hQuery = query(
    viewLogsRef,
    where("dashboardId", "==", dashboardId),
    where("viewedAt", ">=", Timestamp.fromDate(oneDayAgo))
  );
  const last24hSnapshot = await getDocs(last24hQuery);
  const views24h = last24hSnapshot.size;

  // Get views in last 7 days
  const last7dQuery = query(
    viewLogsRef,
    where("dashboardId", "==", dashboardId),
    where("viewedAt", ">=", Timestamp.fromDate(sevenDaysAgo))
  );
  const last7dSnapshot = await getDocs(last7dQuery);
  const views7d = last7dSnapshot.size;

  // Get views in last 30 days
  const last30dQuery = query(
    viewLogsRef,
    where("dashboardId", "==", dashboardId),
    where("viewedAt", ">=", Timestamp.fromDate(thirtyDaysAgo))
  );
  const last30dSnapshot = await getDocs(last30dQuery);
  const views30d = last30dSnapshot.size;

  // Calculate trending score
  // Recent views are weighted more heavily
  const trendingScore = (views24h * 10) + (views7d * 3) + (views30d * 1);

  return trendingScore;
}

/**
 * Log a view and update trending score
 */
export async function logView(dashboardId: string): Promise<void> {
  try {
    // Add view log
    await addDoc(collection(db, "viewLogs"), {
      dashboardId,
      viewedAt: Timestamp.fromDate(new Date()),
    });

    // Calculate and update trending score
    const trendingScore = await calculateTrendingScore(dashboardId);

    await updateDoc(doc(db, "dashboards", dashboardId), {
      trendingScore,
      lastActivityAt: new Date(),
    });
  } catch (error) {
    console.error("Error logging view:", error);
  }
}

/**
 * Check if view should be counted (prevent spam)
 */
export function shouldCountView(dashboardId: string): boolean {
  const viewKey = `viewed_${dashboardId}`;
  const lastViewed = sessionStorage.getItem(viewKey);
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;

  if (!lastViewed || now - parseInt(lastViewed) > thirtyMinutes) {
    sessionStorage.setItem(viewKey, now.toString());
    return true;
  }

  return false;
}