import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <h1 className="text-xl font-semibold mt-4">Page not found</h1>
        <p className="text-muted-foreground text-sm mt-2">The page you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/dashboard")} className="mt-6">Go to Dashboard</Button>
      </div>
    </div>
  );
}
