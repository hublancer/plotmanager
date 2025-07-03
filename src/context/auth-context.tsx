
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingContext } from '@/context/loading-context';
import { getUserProfileByUID } from '@/lib/mock-db';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const pageLoader = useContext(LoadingContext);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const profile = await getUserProfileByUID(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const isAuthPage = pathname.startsWith('/auth');
    const isPlansPage = pathname.startsWith('/plans');
    
    if (authLoading) {
      if (!isAuthPage) {
        pageLoader.start();
      }
    } else {
      pageLoader.complete();
    }

    if (authLoading) return;

    // Not logged in: redirect to login unless on an auth page
    if (!user && !isAuthPage) {
      router.push('/auth/login');
      return;
    }
    
    // Logged in:
    if (user) {
      // If on an auth page, redirect away
      if (isAuthPage) {
        // If they have a plan, go to dashboard. If not, go to plans.
        if (userProfile?.activePlan) {
          router.push('/dashboard');
        } else {
          router.push('/plans');
        }
        return;
      }
      
      // If NO active plan, force user to the plans page
      if (userProfile && !userProfile.activePlan && !isPlansPage) {
        router.push('/plans');
        return;
      }
    }
  }, [user, userProfile, authLoading, pathname, router, pageLoader]);

  // Prevent flashing content
  const isAuthPage = pathname.startsWith('/auth');
  const isPlansPage = pathname.startsWith('/plans');

  if (authLoading || (!user && !isAuthPage) || (user && userProfile && !userProfile.activePlan && !isPlansPage && !isAuthPage)) {
    return null; // PageLoader is handled by its context provider
  }


  return (
    <AuthContext.Provider value={{ user, userProfile, loading: authLoading }}>
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
