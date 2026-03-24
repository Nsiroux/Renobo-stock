"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const isPublicRoute = pathname === "/login" || pathname === "/reset-password";

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      if (!hasSupabaseEnv || !supabase) {
        if (!isMounted) {
          return;
        }

        setChecked(true);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!session && !isPublicRoute) {
        router.replace("/login");
      } else if (session && pathname === "/login") {
        router.replace("/");
      } else {
        setChecked(true);
      }
    }

    void checkSession();

    const {
      data: { subscription },
    } = hasSupabaseEnv && supabase
      ? supabase.auth.onAuthStateChange((_event, session) => {
          if (!isMounted) {
            return;
          }

          if (!session && !isPublicRoute) {
            setChecked(false);
            router.replace("/login");
          } else if (session && pathname === "/login") {
            router.replace("/");
          } else {
            setChecked(true);
          }
        })
      : { data: { subscription: { unsubscribe: () => undefined } } };

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isPublicRoute, pathname, router]);

  if (!checked && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-muted">
          Checking session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
