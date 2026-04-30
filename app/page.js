"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated) {
      router.replace("/dashboard");
    } else {
      router.replace("/sign-in");
    }
  }, [isAuthenticated, loading, router]);

  return null;
}