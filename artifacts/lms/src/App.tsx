import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Learn from "@/pages/Learn";
import QuizPage from "@/pages/QuizPage";
import AssignmentsPage from "@/pages/AssignmentsPage";
import CreateCourse from "@/pages/CreateCourse";
import AdminPanel from "@/pages/AdminPanel";
import RoleSelect from "@/pages/RoleSelect";
import Navbar from "@/components/Navbar";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route><Redirect to="/" /></Route>
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/role-select" component={RoleSelect} />
          <Route path="/courses" component={Courses} />
          <Route path="/courses/create" component={CreateCourse} />
          <Route path="/courses/:id/learn" component={Learn} />
          <Route path="/courses/:id/quiz" component={QuizPage} />
          <Route path="/courses/:id/assignments" component={AssignmentsPage} />
          <Route path="/courses/:id" component={CourseDetail} />
          <Route path="/admin" component={AdminPanel} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
