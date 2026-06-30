import { useLocation } from "wouter";
import { useUpdateMyRole } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { BookOpen, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RoleSelect() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const updateRole = useUpdateMyRole();

  const select = (role: "student" | "instructor") => {
    updateRole.mutate({ data: { role } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        navigate("/dashboard");
      },
    });
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-background px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Welcome to LearnFlow</h1>
          <p className="text-muted-foreground">How will you use LearnFlow?</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { role: "student" as const, icon: BookOpen, title: "I'm a Student", desc: "Browse courses, track progress, and learn at your own pace." },
            { role: "instructor" as const, icon: Briefcase, title: "I'm an Instructor", desc: "Create courses, add lessons, and teach your students." },
          ].map(opt => (
            <button
              key={opt.role}
              onClick={() => select(opt.role)}
              disabled={updateRole.isPending}
              className="flex flex-col items-center gap-3 p-6 bg-card border-2 border-border rounded-xl text-center hover:border-primary transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <opt.icon className="w-6 h-6 text-accent-foreground group-hover:text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{opt.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {updateRole.isPending && (
          <p className="text-center text-sm text-muted-foreground mt-4">Saving...</p>
        )}
      </div>
    </div>
  );
}
