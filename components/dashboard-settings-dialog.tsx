"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { Dashboard } from "@/lib/types";
import bcrypt from "bcryptjs";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface DashboardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboard: Dashboard;
}

export default function DashboardSettingsDialog({
  open,
  onOpenChange,
  dashboard,
}: DashboardSettingsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(dashboard.isPrivate);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Change Password
  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    setIsLoading(true);

    try {
      const dashboardRef = doc(db, "dashboards", dashboard.id);

      // Verify current password
      const isValid = await bcrypt.compare(values.currentPassword, dashboard.passwordHash);

      if (!isValid) {
        toast.error("Current password is incorrect");
        setIsLoading(false);
        return;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(values.newPassword, 10);

      // Update password
      await updateDoc(dashboardRef, {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      });

      toast.success("Password changed successfully!");
      form.reset();
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Toggle Private Mode
  async function handlePrivateToggle(checked: boolean) {
    setIsLoading(true);

    try {
      const dashboardRef = doc(db, "dashboards", dashboard.id);
      await updateDoc(dashboardRef, {
        isPrivate: checked,
        updatedAt: new Date(),
      });

      setIsPrivate(checked);
      toast.success(
        checked
          ? "Dashboard is now private"
          : "Dashboard is now public"
      );
    } catch (error) {
      console.error("Error updating privacy:", error);
      toast.error("Failed to update privacy settings");
    } finally {
      setIsLoading(false);
    }
  }

  // Delete Dashboard
  async function handleDeleteDashboard() {
    setIsLoading(true);

    try {
      // Delete all events first
      const eventsRef = collection(db, "dashboards", dashboard.id, "events");
      const eventsSnapshot = await getDocs(eventsRef);

      const deletePromises = eventsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete dashboard
      await deleteDoc(doc(db, "dashboards", dashboard.id));

      toast.success("Dashboard deleted successfully");
      router.push("/");
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      toast.error("Failed to delete dashboard");
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dashboard Settings</DialogTitle>
            <DialogDescription>
              Manage your dashboard preferences and security
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="privacy" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Private Dashboard</Label>
                    <p className="text-sm text-muted-foreground">
                      Require password to view this dashboard
                    </p>
                  </div>
                  <Switch
                    checked={isPrivate}
                    onCheckedChange={handlePrivateToggle}
                    disabled={isLoading}
                  />
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="text-sm font-semibold">Dashboard Info</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Slug: <span className="font-mono">{dashboard.slug}</span></p>
                    <p>Created: {dashboard.createdAt.toLocaleDateString()}</p>
                    <p>Views: {dashboard.viewCount}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          Must be at least 6 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Changing Password..." : "Change Password"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* Danger Zone Tab */}
            <TabsContent value="danger" className="space-y-4">
              <div className="rounded-lg border border-destructive/50 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-destructive">Delete Dashboard</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently delete this dashboard and all its events. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Dashboard
                </Button>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="text-sm font-semibold">⚠️ Auto-Deletion Notice</h4>
                <p className="text-sm text-muted-foreground">
                  Dashboards inactive for 90 days will be automatically deleted.
                  Last activity: {dashboard.lastActivityAt.toLocaleDateString()}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              dashboard and remove all events associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDashboard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete Dashboard"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}