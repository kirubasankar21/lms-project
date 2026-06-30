import { useLocation } from "wouter";
import { useCreateCourse, getListCoursesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function CreateCourse() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createCourse = useCreateCourse();

  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    price: "",
    isFree: true,
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: "Required fields missing", variant: "destructive" });
      return;
    }
    createCourse.mutate({
      data: {
        title: form.title,
        description: form.description,
        thumbnailUrl: form.thumbnailUrl || undefined,
        price: form.isFree ? undefined : (form.price ? parseFloat(form.price) : undefined),
        isFree: form.isFree,
      },
    }, {
      onSuccess: course => {
        queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        toast({ title: "Course created!" });
        navigate(`/courses/${course.id}`);
      },
      onError: () => toast({ title: "Failed to create course", variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/courses")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>Create Course</h1>
        <p className="text-muted-foreground text-sm mt-1">Fill in the details for your new course</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Course Title <span className="text-destructive">*</span></Label>
          <Input id="title" value={form.title} onChange={set("title")} placeholder="e.g. Introduction to Python" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={set("description")}
            placeholder="What will students learn in this course?"
            className="min-h-28 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="thumbnail">Thumbnail URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input id="thumbnail" value={form.thumbnailUrl} onChange={set("thumbnailUrl")} placeholder="https://..." />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Free Course</p>
            <p className="text-xs text-muted-foreground">Toggle off to set a price</p>
          </div>
          <Switch
            checked={form.isFree}
            onCheckedChange={v => setForm(prev => ({ ...prev, isFree: v }))}
          />
        </div>

        {!form.isFree && (
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input id="price" value={form.price} onChange={set("price")} className="pl-6" placeholder="29.99" type="number" min="0" step="0.01" />
            </div>
          </div>
        )}

        <Button type="submit" disabled={createCourse.isPending} className="w-full gap-2">
          <BookOpen className="w-4 h-4" />
          {createCourse.isPending ? "Creating..." : "Create Course"}
        </Button>
      </form>
    </div>
  );
}
