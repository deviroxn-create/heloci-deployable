import { useEffect, useState } from "react";
import type { AuthUser } from "@/types/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser({ id: "guest", name: "Guest", email: "guest@example.com", role: "APPLICANT" });
  }, []);

  return { user };
}
