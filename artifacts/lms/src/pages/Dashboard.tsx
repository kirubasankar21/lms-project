import { useLocation } from "wouter";
import { useGetDashboardSummary, useGetRecentActivity, useListMyEnrollments, useListCourses } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { BookOpen, Users, TrendingUp, Award, Clock, PlusCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: activity } = useGetRecentActivity();
  const { data: enrollments } = useListMyEnrollments();

  const role = summary?.role ?? "student";

  const { data: allCourses } = useListCourses(
    { instructorId: user?.id },
    { query: { enabled: role === "instructor" && !!user?.id } }
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1 capitalize">{role} view</p>
        </div>
        {role === "instructor" && (
          <Button onClick={() => navigate("/courses/create")} className="gap-2">
            <PlusCircle className="w-4 h-4" /> New Course
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {role === "student" && (
          <>
            <StatCard icon={BookOpen} label="Enrolled" value={summary?.enrolledCoursesCount ?? 0} color="primary" />
            <StatCard icon={Award} label="Completed" value={summary?.completedCoursesCount ?? 0} color="green" />
            <StatCard icon={TrendingUp} label="Avg Progress" value={`${summary?.averageProgress ?? 0}%`} color="blue" />
            <StatCard icon={BookOpen} label="Total Courses" value={summary?.totalCourses ?? 0} color="muted" />
          </>
        )}
        {role === "instructor" && (
          <>
            <StatCard icon={BookOpen} label="My Courses" value={summary?.myCoursesCount ?? 0} color="primary" />
            <StatCard icon={Users} label="Total Enrollments" value={summary?.totalEnrollments ?? 0} color="blue" />
            <StatCard icon={BookOpen} label="All Courses" value={summary?.totalCourses ?? 0} color="muted" />
            <StatCard icon={Clock} label="Active" value={summary?.myCoursesCount ?? 0} color="green" />
          </>
        )}
        {role === "admin" && (
          <>
            <StatCard icon={Users} label="Total Users" value={summary?.totalUsers ?? 0} color="primary" />
            <StatCard icon={BookOpen} label="Courses" value={summary?.totalCourses ?? 0} color="blue" />
            <StatCard icon={Users} label="Students" value={summary?.totalStudents ?? 0} color="green" />
            <StatCard icon={Users} label="Instructors" value={summary?.totalInstructors ?? 0} color="muted" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {role === "student" && (
            <>
              <h2 className="text-base font-semibold">My Courses</h2>
              {enrollments && enrollments.length === 0 && (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground">No courses yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Browse our catalog to find something to learn</p>
                  <Button onClick={() => navigate("/courses")} className="mt-4" size="sm">Browse Courses</Button>
                </div>
              )}
              {enrollments?.map(e => (
                <div
                  key={e.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/courses/${e.courseId}/learn`)}
                >
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{e.courseTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={e.progressPercent} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground shrink-0">{e.progressPercent}%</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </>
          )}

          {role === "instructor" && (
            <>
              <h2 className="text-base font-semibold">My Courses</h2>
              {allCourses && allCourses.length === 0 && (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <p className="text-muted-foreground text-sm">No courses yet. Create your first one!</p>
                  <Button onClick={() => navigate("/courses/create")} className="mt-3" size="sm">Create Course</Button>
                </div>
              )}
              {allCourses?.map(c => (
                <div
                  key={c.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => navigate(`/courses/${c.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.lessonCount} lessons · {c.enrollmentCount} students</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </>
          )}

          {role === "admin" && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="font-semibold mb-4">Quick Links</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => navigate("/admin")} className="h-auto py-3 flex-col gap-1">
                  <Users className="w-5 h-5" />
                  <span className="text-xs">Manage Users</span>
                </Button>
                <Button variant="outline" onClick={() => navigate("/courses")} className="h-auto py-3 flex-col gap-1">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-xs">All Courses</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Activity sidebar */}
        <div>
          <h2 className="text-base font-semibold mb-4">Recent Activity</h2>
          {activity && activity.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-4 text-center text-sm text-muted-foreground">No activity yet</div>
          )}
          <div className="space-y-2">
            {activity?.slice(0, 8).map(a => (
              <div key={a.id} className="bg-card border border-border rounded-lg p-3">
                <p className="text-sm text-foreground">{a.message}</p>
                {a.courseTitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.courseTitle}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof BookOpen; label: string; value: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${colorMap[color] ?? colorMap.muted}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
