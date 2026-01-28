"use client";

import { useState, useMemo } from "react";
import { Dashboard } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardCard from "@/components/dashboard-card";
import { TrendingUp, Clock, Search, Globe, Lock, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ExploreViewProps {
  initialDashboards: Dashboard[];
}

type PrivacyFilter = "all" | "public" | "private";

export default function ExploreView({ initialDashboards }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>("public");

  // Filter by privacy and search
  const filteredDashboards = useMemo(() => {
    let filtered = initialDashboards;

    // Privacy filter
    if (privacyFilter === "public") {
      filtered = filtered.filter((d) => !d.isPrivate);
    } else if (privacyFilter === "private") {
      filtered = filtered.filter((d) => d.isPrivate);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (dashboard) =>
          dashboard.title.toLowerCase().includes(query) ||
          dashboard.description.toLowerCase().includes(query) ||
          dashboard.slug.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [initialDashboards, searchQuery, privacyFilter]);

  // Sort by trending (view count)
  const trendingDashboards = useMemo(() => {
    return [...filteredDashboards].sort((a, b) => {
      const scoreA = a.trendingScore || 0;
      const scoreB = b.trendingScore || 0;
      return scoreB - scoreA;
    });
  }, [filteredDashboards]);

  // Sort by newest (creation date)
  const newestDashboards = useMemo(() => {
    return [...filteredDashboards].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [filteredDashboards]);

  // Count stats
  const stats = useMemo(() => {
    return {
      total: initialDashboards.length,
      public: initialDashboards.filter((d) => !d.isPrivate).length,
      private: initialDashboards.filter((d) => d.isPrivate).length,
    };
  }, [initialDashboards]);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Explore Dashboards</h1>
        <p className="text-muted-foreground text-lg">
          Discover countdown timers created by the community
        </p>
      </div>

      {/* Privacy Filter Pills */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          variant={privacyFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setPrivacyFilter("all")}
          className="gap-2"
        >
          <LayoutGrid className="h-4 w-4" />
          All ({stats.total})
        </Button>
        <Button
          variant={privacyFilter === "public" ? "default" : "outline"}
          size="sm"
          onClick={() => setPrivacyFilter("public")}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          Public ({stats.public})
        </Button>
        <Button
          variant={privacyFilter === "private" ? "default" : "outline"}
          size="sm"
          onClick={() => setPrivacyFilter("private")}
          className="gap-2"
        >
          <Lock className="h-4 w-4" />
          Private ({stats.private})
        </Button>
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
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try a different search term"
                  : privacyFilter === "private"
                    ? "No private dashboards yet"
                    : "Be the first to create a public dashboard!"}
              </p>
              {privacyFilter !== "all" && (
                <Button variant="outline" onClick={() => setPrivacyFilter("all")}>
                  View All Dashboards
                </Button>
              )}
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
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try a different search term"
                  : privacyFilter === "private"
                    ? "No private dashboards yet"
                    : "Be the first to create a public dashboard!"}
              </p>
              {privacyFilter !== "all" && (
                <Button variant="outline" onClick={() => setPrivacyFilter("all")}>
                  View All Dashboards
                </Button>
              )}
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
          Showing {filteredDashboards.length}{" "}
          {privacyFilter === "all"
            ? ""
            : privacyFilter === "public"
              ? "public"
              : "private"}{" "}
          {filteredDashboards.length === 1 ? "dashboard" : "dashboards"}
        </div>
      )}
    </main>
  );
}