import { useState } from "react";
import { useLocation } from "wouter";
import { useListCourses, useListMyEnrollments } from "@workspace/api-client-react";
import { BookOpen, Search, Users, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Courses() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");

  const { data: courses, isLoading } = useListCourses();
  const { data: enrollments } = useListMyEnrollments();

  const enrolledIds = new Set(enrollments?.map(e => e.courseId) ?? []);

  const filtered = courses?.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "free" && c.isFree) || (filter === "paid" && !c.isFree);
    return matchSearch && matchFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>Course Catalog</h1>
          <p className="text-muted-foreground text-sm mt-1">{courses?.length ?? 0} courses available</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "free", "paid"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl h-56 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered?.length === 0 && (
        <div className="py-16 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium text-foreground">No courses found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered?.map(course => (
          <div
            key={course.id}
            onClick={() => navigate(`/courses/${course.id}`)}
            className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
          >
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-36 object-cover" />
            ) : (
              <div className="w-full h-36 bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary/60" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
                {course.isFree ? (
                  <Badge variant="secondary" className="shrink-0 text-xs">Free</Badge>
                ) : (
                  <Badge className="shrink-0 text-xs bg-amber-100 text-amber-700 border-amber-200">
                    <DollarSign className="w-3 h-3 mr-0.5" />{course.price}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessonCount} lessons</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrollmentCount}</span>
                </div>
                {enrolledIds.has(course.id) && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200">Enrolled</Badge>
                )}
              </div>
              {course.instructorName && (
                <p className="text-xs text-muted-foreground mt-2">by {course.instructorName}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
