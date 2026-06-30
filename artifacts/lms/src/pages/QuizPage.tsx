import { useRoute, useLocation } from "wouter";
import { useListQuizzes, useSubmitQuiz, useGetCourse } from "@workspace/api-client-react";
import { useState } from "react";
import { HelpCircle, CheckCircle, XCircle, ChevronLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function QuizPage() {
  const [, params] = useRoute("/courses/:id/quiz");
  const [, navigate] = useLocation();
  const id = parseInt(params?.id ?? "0", 10);

  const { data: course } = useGetCourse(id, { query: { enabled: !!id } });
  const { data: quizzes, isLoading } = useListQuizzes(id, { query: { enabled: !!id } });
  const submitQuiz = useSubmitQuiz();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; percentage: number } | null>(null);

  const quiz = quizzes?.[current];
  const total = quizzes?.length ?? 0;
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  const handleAnswer = (opt: string) => {
    if (!quiz) return;
    setAnswers(prev => ({ ...prev, [quiz.id]: opt }));
  };

  const handleSubmit = () => {
    const payload = Object.entries(answers).map(([quizId, answer]) => ({ quizId: parseInt(quizId), answer }));
    submitQuiz.mutate({ courseId: id, data: { answers: payload } }, {
      onSuccess: data => setResult(data),
    });
  };

  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );

  if (!quizzes || quizzes.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <p className="font-medium">No quiz questions yet</p>
      <p className="text-sm text-muted-foreground mt-1">The instructor hasn't added any questions</p>
      <Button variant="outline" onClick={() => navigate(`/courses/${id}`)} className="mt-4 gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</Button>
    </div>
  );

  if (result) {
    const pass = result.percentage >= 70;
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${pass ? "bg-green-100" : "bg-red-100"}`}>
          {pass ? <Trophy className="w-10 h-10 text-green-600" /> : <XCircle className="w-10 h-10 text-red-600" />}
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>{result.percentage}%</h1>
          <p className="text-muted-foreground mt-1">{result.score} of {result.total} correct</p>
          <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-sm font-medium ${pass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {pass ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {pass ? "Passed" : "Not passed — try again"}
          </div>
        </div>
        <Progress value={result.percentage} className="h-3" />
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(`/courses/${id}`)}>Back to Course</Button>
          <Button onClick={() => { setResult(null); setCurrent(0); setAnswers({}); }}>Retry Quiz</Button>
        </div>
      </div>
    );
  }

  const opts = [
    { key: "A", label: quiz!.optionA },
    { key: "B", label: quiz!.optionB },
    { key: "C", label: quiz!.optionC },
    { key: "D", label: quiz!.optionD },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/courses/${id}`)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> {course?.title ?? "Course"}
        </button>
        <span className="text-sm text-muted-foreground">Question {current + 1} of {total}</span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4 text-primary" />
          </div>
          <p className="font-medium text-foreground leading-snug">{quiz!.question}</p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {opts.map(opt => {
            const selected = answers[quiz!.id] === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleAnswer(opt.key)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                  selected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background hover:border-primary/40 text-foreground"
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                  selected ? "border-primary bg-primary text-white" : "border-muted-foreground text-muted-foreground"
                }`}>
                  {opt.key}
                </div>
                <span className="text-sm">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        {current > 0 && (
          <Button variant="outline" onClick={() => setCurrent(i => i - 1)}>Previous</Button>
        )}
        {current < total - 1 ? (
          <Button className="ml-auto" onClick={() => setCurrent(i => i + 1)} disabled={!answers[quiz!.id]}>
            Next
          </Button>
        ) : (
          <Button
            className="ml-auto"
            onClick={handleSubmit}
            disabled={submitQuiz.isPending || Object.keys(answers).length < total}
          >
            {submitQuiz.isPending ? "Submitting..." : `Submit Quiz (${Object.keys(answers).length}/${total})`}
          </Button>
        )}
      </div>
    </div>
  );
}
