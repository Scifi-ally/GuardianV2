import { MagicNavbar } from "@/components/MagicNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { currentUser } = useAuth();

  // Only show navbar for authenticated users on main app pages
  const showNavbar = currentUser;

  return (
    <div className="min-h-screen bg-background">
      {/* Page Content */}
      <main className={cn("min-h-screen", showNavbar ? "pb-24" : "")}>
        {children}
      </main>

      {/* Persistent Navbar - only for authenticated users */}
      {showNavbar && <MagicNavbar />}
    </div>
  );
}
