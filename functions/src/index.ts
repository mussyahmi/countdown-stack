import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * Clean up view logs older than 30 days
 * Runs daily at midnight UTC
 */
export const cleanupOldViewLogs = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "UTC",
    region: "asia-east1",
    memory: "256MiB",
  },
  async (event) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(`Starting cleanup for view logs older than ${thirtyDaysAgo.toISOString()}`);

    try {
      const viewLogsRef = db.collection("viewLogs");
      const oldLogsQuery = viewLogsRef.where(
        "viewedAt",
        "<",
        admin.firestore.Timestamp.fromDate(thirtyDaysAgo)
      );

      const snapshot = await oldLogsQuery.get();

      if (snapshot.empty) {
        console.log("No old view logs to delete");
        return;
      }

      const batchSize = 500;
      let deletedCount = 0;

      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const batchDocs = snapshot.docs.slice(i, i + batchSize);

        batchDocs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += batchDocs.length;

        console.log(`Deleted batch of ${batchDocs.length} documents`);
      }

      console.log(`Successfully deleted ${deletedCount} old view logs`);
      return;
    } catch (error) {
      console.error("Error cleaning up view logs:", error);
      return;
    }
  }
);

/**
 * Update trending scores
 * Runs every 6 hours
 */
export const updateTrendingScores = onSchedule(
  {
    schedule: "every 6 hours",
    timeZone: "UTC",
    region: "asia-east1",
    memory: "512MiB",
  },
  async (event) => {
    console.log("Starting trending score update");

    try {
      const dashboardsRef = db.collection("dashboards");
      const dashboardsSnapshot = await dashboardsRef.get();

      if (dashboardsSnapshot.empty) {
        console.log("No dashboards to update");
        return;
      }

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      for (const dashboardDoc of dashboardsSnapshot.docs) {
        const dashboardId = dashboardDoc.id;
        const viewLogsRef = db.collection("viewLogs");

        const [last24h, last7d, last30d] = await Promise.all([
          viewLogsRef
            .where("dashboardId", "==", dashboardId)
            .where("viewedAt", ">=", admin.firestore.Timestamp.fromDate(oneDayAgo))
            .get(),
          viewLogsRef
            .where("dashboardId", "==", dashboardId)
            .where("viewedAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
            .get(),
          viewLogsRef
            .where("dashboardId", "==", dashboardId)
            .where("viewedAt", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
            .get(),
        ]);

        const views24h = last24h.size;
        const views7d = last7d.size;
        const views30d = last30d.size;

        const trendingScore = views24h * 10 + views7d * 3 + views30d * 1;

        await dashboardDoc.ref.update({ trendingScore });
        console.log(`Updated ${dashboardId}: score=${trendingScore}`);
      }

      console.log(`Successfully updated ${dashboardsSnapshot.size} dashboards`);
      return;
    } catch (error) {
      console.error("Error updating trending scores:", error);
      return;
    }
  }
);

/**
 * Delete inactive dashboards (90+ days)
 * Runs daily
 */
export const deleteInactiveDashboards = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "UTC",
    region: "asia-east1",
    memory: "256MiB",
  },
  async (event) => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    console.log(`Starting cleanup for dashboards inactive since ${ninetyDaysAgo.toISOString()}`);

    try {
      const dashboardsRef = db.collection("dashboards");
      const inactiveQuery = dashboardsRef.where(
        "lastActivityAt",
        "<",
        admin.firestore.Timestamp.fromDate(ninetyDaysAgo)
      );

      const snapshot = await inactiveQuery.get();

      if (snapshot.empty) {
        console.log("No inactive dashboards to delete");
        return;
      }

      let deletedCount = 0;

      for (const doc of snapshot.docs) {
        const eventsRef = db.collection("dashboards").doc(doc.id).collection("events");
        const eventsSnapshot = await eventsRef.get();

        const batch = db.batch();
        eventsSnapshot.docs.forEach((eventDoc) => {
          batch.delete(eventDoc.ref);
        });

        batch.delete(doc.ref);
        await batch.commit();
        deletedCount++;

        console.log(`Deleted dashboard ${doc.id} and ${eventsSnapshot.size} events`);
      }

      console.log(`Successfully deleted ${deletedCount} inactive dashboards`);
      return;
    } catch (error) {
      console.error("Error deleting inactive dashboards:", error);
      return;
    }
  }
);