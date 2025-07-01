
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingContext } from '@/context/loading-context';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const pageLoader = useContext(LoadingContext);

  useEffect(() => {
    // If firebase is not configured, auth will be null.
    // We'll set authLoading to false, and user will remain null,
    // which will trigger the redirect logic in the other useEffect.
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const isAuthPage = pathname.startsWith('/auth');
    
    if (authLoading) {
      // While we are checking for a user, show the loader on main app pages.
      if (!isAuthPage) {
        pageLoader.start();
      }
    } else {
      pageLoader.complete();
    }

    // Don't run redirect logic until auth state is confirmed
    if (authLoading) return;

    // If we are done loading, and there's no user, redirect to login unless we're already on an auth page.
    if (!user && !isAuthPage) {
      router.push('/auth/login');
    }
    
    // If we are done loading, and there IS a user, redirect to the plans page if they try to access an auth page.
    // This will act as the landing page after login/registration.
    // A more advanced implementation would check if the user already has a plan.
    if (user && isAuthPage) {
      router.push('/plans');
    }
  }, [user, authLoading, pathname, router, pageLoader]);

  // While checking auth, show the loader. For auth pages, render them immediately.
  if (authLoading && !pathname.startsWith('/auth')) {
    return null; // PageLoader is handled by its context provider
  }

  // Prevent flashing the app shell for a moment before redirecting
  if (!user && !pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading: authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
