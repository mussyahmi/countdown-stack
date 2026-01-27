import CreateDashboardForm from "@/components/create-dashboard-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Create Your Event Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Build beautiful countdown timers for your important events
          </p>
        </div>

        {/* Warnings */}
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> If you forget your password, it cannot be recovered.
              Please save it securely.
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Dashboards inactive for 90 days will be automatically deleted.
            </AlertDescription>
          </Alert>
        </div>

        <CreateDashboardForm />
      </div>
    </main>
  );
}