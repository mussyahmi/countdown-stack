"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  isPrivate: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function CreateDashboardForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      slug: "",
      password: "",
      confirmPassword: "",
      isPrivate: false,
    },
  });

  // Get base URL on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Auto-generate slug from title
  function handleGenerateSlug() {
    const title = form.getValues("title");
    if (title) {
      const newSlug = slugify(title, { lower: true, strict: true });
      form.setValue("slug", newSlug);

      // Trigger validation for the slug field
      form.trigger("slug");
    } else {
      toast.error("Please enter a title first");
    }
  }

  // Auto-generate slug when title changes (optional)
  function handleTitleChange(value: string) {
    form.setValue("title", value);

    const newSlug = slugify(value, { lower: true, strict: true });
    form.setValue("slug", newSlug);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      // Check if slug exists
      const slugQuery = query(
        collection(db, "dashboards"),
        where("slug", "==", values.slug)
      );
      const slugSnapshot = await getDocs(slugQuery);

      if (!slugSnapshot.empty) {
        toast.error("This slug is already taken. Please choose another one.");
        setIsLoading(false);
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(values.password, 10);

      // Create dashboard
      await addDoc(collection(db, "dashboards"), {
        slug: values.slug,
        title: values.title,
        description: values.description || "",
        passwordHash,
        isPrivate: values.isPrivate,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        viewCount: 0,
        trendingScore: 0,
      });

      toast.success("Dashboard created!");
      router.push(`/${values.slug}`);
    } catch (error) {
      console.error("Error creating dashboard:", error);
      toast.error("Failed to create dashboard. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dashboard Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`My Events ${new Date().getFullYear()}`}
                      {...field}
                      onChange={(e) => handleTitleChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dashboard Slug (URL)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder={`my-events-${new Date().getFullYear()}`}
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateSlug}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <FormDescription>
                    {baseUrl && field.value ? (
                      <>Your dashboard will be available at: {baseUrl}/{field.value}</>
                    ) : (
                      <>Your dashboard URL will appear here</>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A collection of important dates..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormDescription>
                    Required to edit or delete events
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
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Private Dashboard</FormLabel>
                    <FormDescription>
                      Require password to view this dashboard
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Dashboard"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}