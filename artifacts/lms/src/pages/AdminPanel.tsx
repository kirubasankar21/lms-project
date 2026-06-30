import { useListUsers, useDeleteUser, useUpdateUserRole, useListCourses, useDeleteCourse, getListUsersQueryKey, getListCoursesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, BookOpen, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: courses, isLoading: coursesLoading } = useListCourses();
  const deleteUser = useDeleteUser();
  const updateUserRole = useUpdateUserRole();
  const deleteCourse = useDeleteCourse();

  const handleDeleteUser = (id: string) => {
    if (!confirm("Delete this user?")) return;
    deleteUser.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast({ title: "User deleted" }); },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  const handleRoleChange = (id: string, role: string) => {
    updateUserRole.mutate({ id, data: { role } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast({ title: "Role updated" }); },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  const handleDeleteCourse = (id: number) => {
    if (!confirm("Delete this course?")) return;
    deleteCourse.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() }); toast({ title: "Course deleted" }); },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { admin: "destructive", instructor: "default", student: "secondary" };
    return map[role] ?? "secondary";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage users and courses</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold">{users?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Users</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold">{courses?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Courses</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold">{users?.filter(u => u.role === "instructor").length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Instructors</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold">{users?.filter(u => u.role === "student").length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Students</p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5"><Users className="w-3.5 h-3.5" />Users</TabsTrigger>
          <TabsTrigger value="courses" className="gap-1.5"><BookOpen className="w-3.5 h-3.5" />Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {usersLoading && <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>}
          <div className="space-y-2">
            {users?.map(u => (
              <div key={u.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={u.profileImageUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{u.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Select defaultValue={u.role} onValueChange={v => handleRoleChange(u.replitId, v)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(u.replitId)}
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {!usersLoading && users?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No users found</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="courses">
          {coursesLoading && <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>}
          <div className="space-y-2">
            {courses?.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span>{c.lessonCount} lessons</span>
                    <span>{c.enrollmentCount} students</span>
                    {c.instructorName && <span>by {c.instructorName}</span>}
                  </div>
                </div>
                <Badge variant={c.isFree ? "secondary" : "outline"} className="text-xs shrink-0">
                  {c.isFree ? "Free" : `$${c.price}`}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCourse(c.id)}
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {!coursesLoading && courses?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No courses found</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
