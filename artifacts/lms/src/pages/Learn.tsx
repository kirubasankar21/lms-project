import { useRoute, useLocation } from "wouter";
import { useListLessons, useCompleteLesson, useGetCourseProgress, useGetCourse, getGetCourseProgressQueryKey, getListLessonsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Circle, BookOpen, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DiscussionSection from "@/components/DiscussionSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.*\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return match?.[1] ?? null;
}

export default function Learn() {
  const [, params] = useRoute("/courses/:id/learn");
  const [, navigate] = useLocation();
  const id = parseInt(params?.id ?? "0", 10);
  const queryClient = useQueryClient();

  const { data: course } = useGetCourse(id, { query: { enabled: !!id } });
  const { data: lessons } = useListLessons(id, { query: { enabled: !!id } });
  const { data: progress } = useGetCourseProgress(id, { query: { enabled: !!id } });
  const completeLesson = useCompleteLesson();

  const [activeIdx, setActiveIdx] = useState(0);
  const lesson = lessons?.[activeIdx];

  const videoId = lesson ? getYouTubeId(lesson.videoUrl) : null;

  const handleComplete = () => {
    if (!lesson) return;
    completeLesson.mutate({ id: lesson.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetCourseProgressQueryKey(id) });
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/courses/${id}`)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to course
        </button>
        <div className="flex items-center gap-2 text-sm">
          <Progress value={progress?.progressPercent ?? 0} className="w-24 h-1.5" />
          <span className="text-muted-foreground">{progress?.completedLessons ?? 0}/{progress?.totalLessons ?? 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Video area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {videoId ? (
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={lesson?.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : lesson?.videoUrl ? (
              <div className="aspect-video bg-black flex items-center justify-center">
                <video src={lesson.videoUrl} controls className="w-full h-full" />
              </div>
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-lg">{lesson?.title}</h2>
                  {lesson?.description && <p className="text-muted-foreground text-sm mt-1">{lesson.description}</p>}
                </div>
                {lesson && !lesson.completed && (
                  <Button onClick={handleComplete} disabled={completeLesson.isPending} size="sm" variant="outline" className="gap-1.5 shrink-0">
                    <CheckCircle className="w-4 h-4" /> Mark Complete
                  </Button>
                )}
                {lesson?.completed && (
                  <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Completed
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1.5" disabled={activeIdx === 0} onClick={() => setActiveIdx(i => i - 1)}>
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <Button variant="outline" className="gap-1.5 ml-auto" disabled={activeIdx === (lessons?.length ?? 1) - 1} onClick={() => setActiveIdx(i => i + 1)}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Discussion */}
          <Tabs defaultValue="discussion">
            <TabsList>
              <TabsTrigger value="discussion" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Discussion</TabsTrigger>
            </TabsList>
            <TabsContent value="discussion">
              <DiscussionSection courseId={id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Lesson list */}
        <div className="bg-card border border-border rounded-xl p-3 h-fit">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Lessons</p>
          <div className="space-y-1">
            {lessons?.map((l, idx) => (
              <button
                key={l.id}
                onClick={() => setActiveIdx(idx)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition-colors ${
                  idx === activeIdx ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                }`}
              >
                {l.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{l.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
