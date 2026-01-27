"use client";

import { useState, useMemo } from "react";
import { Dashboard } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardCard from "@/components/dashboard-card";
import { TrendingUp, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ExploreViewProps {
  initialDashboards: Dashboard[];
}

export default function ExploreView({ initialDashboards }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter dashboards by search query
  const filteredDashboards = useMemo(() => {
    if (!searchQuery.trim()) return initialDashboards;

    const query = searchQuery.toLowerCase();
    return initialDashboards.filter(
      (dashboard) =>
        dashboard.title.toLowerCase().includes(query) ||
        dashboard.description.toLowerCase().includes(query) ||
        dashboard.slug.toLowerCase().includes(query)
    );
  }, [initialDashboards, searchQuery]);

  // Sort by trending (view count)
  const trendingDashboards = useMemo(() => {
    return [...filteredDashboards].sort((a, b) => b.viewCount - a.viewCount);
  }, [filteredDashboards]);

  // Sort by newest (creation date)
  const newestDashboards = useMemo(() => {
    return [...filteredDashboards].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [filteredDashboards]);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Explore Dashboards</h1>
        <p className="text-muted-foreground text-lg">
          Discover countdown timers created by the community
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search dashboards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="newest" className="gap-2">
            <Clock className="h-4 w-4" />
            Newest
          </TabsTrigger>
        </TabsList>

        {/* Trending Tab */}
        <TabsContent value="trending">
          {trendingDashboards.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No dashboards found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try a different search term" : "Be the first to create a public dashboard!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingDashboards.map((dashboard) => (
                <DashboardCard key={dashboard.id} dashboard={dashboard} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Newest Tab */}
        <TabsContent value="newest">
          {newestDashboards.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No dashboards found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try a different search term" : "Be the first to create a public dashboard!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newestDashboards.map((dashboard) => (
                <DashboardCard key={dashboard.id} dashboard={dashboard} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stats */}
      {filteredDashboards.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {filteredDashboards.length} public {filteredDashboards.length === 1 ? "dashboard" : "dashboards"}
        </div>
      )}
    </main>
  );
}