"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";

interface PrivateDashboardDialogProps {
  dashboardId: string;
  onSuccess: () => void;
}

export default function PrivateDashboardDialog({
  dashboardId,
  onSuccess,
}: PrivateDashboardDialogProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dashboardRef = doc(db, "dashboards", dashboardId);
      const dashboardDoc = await getDoc(dashboardRef);

      if (!dashboardDoc.exists()) {
        throw new Error("Dashboard not found");
      }

      const dashboardData = dashboardDoc.data();
      const isValid = await bcrypt.compare(password, dashboardData.passwordHash);

      if (isValid) {
        onSuccess();
      } else {
        toast.error("Incorrect password", {
          description: "Please try again",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to verify password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle>Private Dashboard</CardTitle>
            <CardDescription>
              This dashboard is password-protected. Enter the password to view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !password}>
                {isLoading ? "Verifying..." : "Unlock Dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}