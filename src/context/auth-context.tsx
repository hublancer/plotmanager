
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
    // If firebase is not configured, we are not loading and there is no user.
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
    // If firebase is not configured, we don't redirect and just let the user browse.
    if (!auth) {
      if(pageLoader.isLoading) pageLoader.complete();
      return;
    }
    
    const isAuthPage = pathname.startsWith('/auth');
    
    if (authLoading) {
      pageLoader.start();
    } else {
      pageLoader.complete();
    }

    // If auth is still loading, don't do any redirects yet
    if (authLoading) return;

    // If not logged in and not on an auth page, redirect to login
    if (!user && !isAuthPage) {
      router.push('/auth/login');
    }

    // If logged in and on an auth page, redirect to dashboard
    if (user && isAuthPage) {
      router.push('/dashboard');
    }
  }, [user, authLoading, pathname, router, pageLoader, pageLoader.isLoading, pageLoader.complete, pageLoader.start]);

  // While checking auth, show the loader. For auth pages, render them immediately.
  if (auth && authLoading && !pathname.startsWith('/auth')) {
    return null; // PageLoader is handled by its context provider
  }

  // Prevent flashing the app shell for a moment before redirecting
  if (auth && !user && !pathname.startsWith('/auth')) {
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
