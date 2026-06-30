import { useRoute, useLocation } from "wouter";
import { useListAssignments, useSubmitAssignment, useGetCourse, getListAssignmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardList, ChevronLeft, Send, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function AssignmentsPage() {
  const [, params] = useRoute("/courses/:id/assignments");
  const [, navigate] = useLocation();
  const id = parseInt(params?.id ?? "0", 10);
  const queryClient = useQueryClient();

  const { data: course } = useGetCourse(id, { query: { enabled: !!id } });
  const { data: assignments, isLoading } = useListAssignments(id, { query: { enabled: !!id } });
  const submitAssignment = useSubmitAssignment();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Set<number>>(new Set());

  const handleSubmit = (assignmentId: number) => {
    const answer = answers[assignmentId];
    if (!answer?.trim()) return;
    submitAssignment.mutate({ id: assignmentId, data: { answer } }, {
      onSuccess: () => {
        setSubmitted(prev => new Set([...prev, assignmentId]));
        queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey(id) });
      },
    });
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/courses/${id}`)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> {course?.title ?? "Course"}
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>Assignments</h1>
        <p className="text-muted-foreground text-sm mt-1">{assignments?.length ?? 0} assignments</p>
      </div>

      {assignments?.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No assignments yet</p>
          <p className="text-sm text-muted-foreground mt-1">The instructor hasn't added any assignments</p>
        </div>
      )}

      <div className="space-y-4">
        {assignments?.map(a => {
          const isSubmitted = submitted.has(a.id);
          return (
            <div key={a.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                </div>
                {isSubmitted && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0">
                    <CheckCircle className="w-3 h-3 mr-1" /> Submitted
                  </Badge>
                )}
              </div>

              {a.dueDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  Due: {new Date(a.dueDate).toLocaleDateString()}
                </div>
              )}

              {!isSubmitted && (
                <div className="space-y-2">
                  <Textarea
                    value={answers[a.id] ?? ""}
                    onChange={e => setAnswers(prev => ({ ...prev, [a.id]: e.target.value }))}
                    placeholder="Write your answer here..."
                    className="min-h-28 resize-none text-sm"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSubmit(a.id)}
                      disabled={submitAssignment.isPending || !answers[a.id]?.trim()}
                      size="sm"
                      className="gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit
                    </Button>
                  </div>
                </div>
              )}

              {isSubmitted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  Your answer has been submitted successfully.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
