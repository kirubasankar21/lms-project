import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { BookOpen, LayoutDashboard, PlusCircle, Shield, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: summary } = useGetDashboardSummary();

  const role = summary?.role ?? "student";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, always: true },
    { href: "/courses", label: "Courses", icon: BookOpen, always: true },
    { href: "/courses/create", label: "Create Course", icon: PlusCircle, roles: ["instructor", "admin"] },
    { href: "/admin", label: "Admin", icon: Shield, roles: ["admin"] },
  ].filter(l => l.always || (l.roles && l.roles.includes(role)));

  const roleBadgeColor = role === "admin" ? "destructive" : role === "instructor" ? "default" : "secondary";

  return (
    <header className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0" style={{ fontFamily: "'Sora', sans-serif" }}>
          <BookOpen className="w-5 h-5 text-sidebar-primary" />
          <span>LearnFlow</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}>
              <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location === l.href || (l.href !== "/" && location.startsWith(l.href))
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}>
                <l.icon className="w-4 h-4" />
                {l.label}
              </button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Badge variant={roleBadgeColor} className="hidden sm:flex capitalize text-xs">{role}</Badge>
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarImage src={user?.profileImageUrl ?? undefined} />
              <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-sidebar-foreground/90">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="hidden md:flex text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 gap-1.5 px-2">
            <LogOut className="w-4 h-4" />
            <span className="text-xs">Sign out</span>
          </Button>
          <button className="md:hidden p-1" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-sidebar border-t border-sidebar-border px-4 py-2 flex flex-col gap-1">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              <button className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-left transition-colors ${
                location === l.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              }`}>
                <l.icon className="w-4 h-4" />
                {l.label}
              </button>
            </Link>
          ))}
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </header>
  );
}
