import { useRoute, useLocation } from "wouter";
import { useGetCourse, useListLessons, useListMyEnrollments, useEnrollInCourse, useGetDashboardSummary, getListMyEnrollmentsQueryKey, getGetCourseQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Users, Play, DollarSign, CheckCircle, MessageSquare, ClipboardList, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const [, navigate] = useLocation();
  const id = parseInt(params?.id ?? "0", 10);
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useGetCourse(id, { query: { enabled: !!id } });
  const { data: lessons } = useListLessons(id, { query: { enabled: !!id } });
  const { data: enrollments } = useListMyEnrollments();
  const { data: summary } = useGetDashboardSummary();

  const enrolled = enrollments?.some(e => e.courseId === id);
  const myEnrollment = enrollments?.find(e => e.courseId === id);
  const enroll = useEnrollInCourse();

  const handleEnroll = () => {
    enroll.mutate({ data: { courseId: id } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMyEnrollmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(id) });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-48 bg-card border border-border rounded-xl animate-pulse mb-4" />
      </div>
    );
  }

  if (!course) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted-foreground">Course not found</div>;
  }

  const role = summary?.role ?? "student";
  const isOwner = role === "instructor" && course.instructorId === summary?.role;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-primary/50" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>{course.title}</h1>
              <p className="text-muted-foreground mt-1 text-sm">{course.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{course.lessonCount} lessons</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{course.enrollmentCount} students</span>
                {course.instructorName && <span>by {course.instructorName}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {course.isFree ? (
                <Badge variant="secondary" className="text-sm px-3 py-1">Free</Badge>
              ) : (
                <div className="flex items-center gap-1 text-lg font-bold">
                  <DollarSign className="w-4 h-4" />{course.price}
                </div>
              )}
              {enrolled ? (
                <div className="flex flex-col items-end gap-1">
                  <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Enrolled</Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Progress value={myEnrollment?.progressPercent ?? 0} className="h-1.5 w-24" />
                    {myEnrollment?.progressPercent ?? 0}%
                  </div>
                  <Button size="sm" onClick={() => navigate(`/courses/${id}/learn`)} className="gap-1.5 mt-1">
                    <Play className="w-3.5 h-3.5" /> Continue Learning
                  </Button>
                </div>
              ) : (
                <Button onClick={handleEnroll} disabled={enroll.isPending} className="gap-1.5">
                  <Play className="w-4 h-4" /> {enroll.isPending ? "Enrolling..." : "Enroll Now"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lessons">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="lessons" className="gap-1.5"><Play className="w-3.5 h-3.5" />Lessons</TabsTrigger>
          <TabsTrigger value="quiz" className="gap-1.5"><HelpCircle className="w-3.5 h-3.5" />Quiz</TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1.5"><ClipboardList className="w-3.5 h-3.5" />Assignments</TabsTrigger>
          <TabsTrigger value="discussion" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Discussion</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-2">
          {lessons?.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Play className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No lessons added yet</p>
            </div>
          )}
          {lessons?.map((lesson, idx) => (
            <div
              key={lesson.id}
              onClick={() => enrolled ? navigate(`/courses/${id}/learn?lesson=${lesson.id}`) : undefined}
              className={`bg-card border border-border rounded-xl p-4 flex items-center gap-3 transition-colors ${enrolled ? "cursor-pointer hover:border-primary/40" : "opacity-70"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${lesson.completed ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                {lesson.completed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{lesson.title}</p>
                {lesson.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{lesson.description}</p>}
              </div>
              {!enrolled && <Badge variant="outline" className="text-xs">Enroll to access</Badge>}
            </div>
          ))}
          {enrolled && (
            <Button onClick={() => navigate(`/courses/${id}/learn`)} className="w-full gap-2 mt-2">
              <Play className="w-4 h-4" /> Start Learning
            </Button>
          )}
        </TabsContent>

        <TabsContent value="quiz">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Course Quiz</p>
            <p className="text-sm text-muted-foreground mt-1">Test your knowledge with multiple choice questions</p>
            {enrolled ? (
              <Button onClick={() => navigate(`/courses/${id}/quiz`)} className="mt-4">Take Quiz</Button>
            ) : (
              <p className="text-xs text-muted-foreground mt-3">Enroll to take the quiz</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Assignments</p>
            <p className="text-sm text-muted-foreground mt-1">Submit written answers and projects</p>
            {enrolled ? (
              <Button onClick={() => navigate(`/courses/${id}/assignments`)} className="mt-4">View Assignments</Button>
            ) : (
              <p className="text-xs text-muted-foreground mt-3">Enroll to access assignments</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="discussion">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Course Discussion</p>
            <p className="text-sm text-muted-foreground mt-1">Ask questions and engage with other students</p>
            {enrolled ? (
              <Button onClick={() => navigate(`/courses/${id}`)} className="mt-4" variant="outline">Open Discussion</Button>
            ) : (
              <p className="text-xs text-muted-foreground mt-3">Enroll to join the discussion</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
