"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/lib/api";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Routes that don't require authentication
const publicRoutes = ["/login", "/register", "/forgot-password"];

// Routes for specific user types
const lenderRoutes = ["/dashboard"];
const developerRoutes = ["/developer"];

function getDashboardPath(userType: string): string {
  return userType === "developer" ? "/developer/dashboard" : "/dashboard";
}

function isCorrectDashboard(pathname: string, userType: string): boolean {
  if (userType === "developer") {
    return pathname.startsWith("/developer");
  }
  // Lender should not access developer routes
  return !pathname.startsWith("/developer");
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
      const isUserAuthenticated = authService.isAuthenticated();
      const user = authService.getUser();

      if (!isPublicRoute && !isUserAuthenticated) {
        // Not authenticated and trying to access protected route
        router.push("/login");
        return;
      }

      if (isPublicRoute && isUserAuthenticated && user) {
        // Already authenticated and trying to access public route (login/register)
        // Redirect to appropriate dashboard based on user type
        router.push(getDashboardPath(user.type));
        return;
      }

      if (isUserAuthenticated && user && !isPublicRoute) {
        // Check if user is accessing the correct dashboard
        if (!isCorrectDashboard(pathname, user.type)) {
          // Redirect to correct dashboard
          router.push(getDashboardPath(user.type));
          return;
        }
      }

      setIsAuthorized(isUserAuthenticated || isPublicRoute);
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
      </div>
    );
  }

  if (!isAuthorized && !publicRoutes.some(route => pathname.startsWith(route))) {
    return null;
  }

  return <>{children}</>;
}
