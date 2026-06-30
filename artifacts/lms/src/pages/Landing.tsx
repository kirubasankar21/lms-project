import { useAuth } from "@workspace/replit-auth-web";
import { BookOpen, Users, Award, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-sidebar text-sidebar-foreground px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl" style={{ fontFamily: "'Sora', sans-serif" }}>
          <BookOpen className="w-6 h-6 text-sidebar-primary" />
          LearnFlow
        </div>
        <Button onClick={login} className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-white text-sm px-5">
          Sign in
        </Button>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-sm font-medium px-3 py-1 rounded-full mb-6">
          <Award className="w-4 h-4" />
          Built for serious learners
        </div>
        <h1 className="text-5xl font-bold leading-tight text-foreground mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
          Learn, teach, and grow<br />
          <span className="text-primary">on one platform</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          LearnFlow is a focused learning management system where instructors create structured courses and students track real progress — no noise, no distractions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={login} size="lg" className="gap-2 text-base px-8 py-6">
            Get started <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" className="text-base px-8 py-6" onClick={login}>
            Browse courses
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: "'Sora', sans-serif" }}>Everything you need to learn effectively</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: "Structured Courses", desc: "Instructors create rich courses with video lessons, quizzes, and assignments. Students get a clear path from start to finish." },
              { icon: Award, title: "Track Progress", desc: "Real-time progress tracking shows exactly how far you've come. Completion badges, quiz scores, and assignment feedback." },
              { icon: Users, title: "Community Discussions", desc: "Each course has its own discussion forum. Ask questions, share insights, and learn from your peers." },
            ].map(f => (
              <div key={f.title} className="flex flex-col gap-3">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>Three roles, one platform</h2>
            <div className="flex flex-col gap-3">
              {[
                "Students enroll in courses and track their progress",
                "Instructors create courses with video, quizzes, and assignments",
                "Admins manage users and maintain the platform",
                "Threaded discussions foster real engagement",
                "Quiz scoring and assignment submissions — all in one place",
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
            <Button onClick={login} className="mt-8 gap-2">
              Start learning <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="h-3 w-2/3 bg-primary/20 rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
            <div className="h-24 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm">Video Lesson</div>
            <div className="flex gap-2">
              <div className="flex-1 h-2 bg-primary rounded-full" style={{ width: "60%" }} />
              <div className="flex-1 h-2 bg-muted rounded-full" />
            </div>
            <p className="text-xs text-muted-foreground">60% complete — 3 of 5 lessons done</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>LearnFlow — A focused learning management system</p>
      </footer>
    </div>
  );
}
