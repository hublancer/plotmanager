
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
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
  refetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refetchUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const pageLoader = useContext(LoadingContext);

  const fetchUserProfile = useCallback(async (userToFetch: User | null) => {
    if (userToFetch) {
      const profile = await getUserProfileByUID(userToFetch.uid);
      if (profile && typeof profile.role === 'undefined') {
        profile.role = 'admin';
      }
      setUserProfile(profile);
    } else {
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      await fetchUserProfile(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserProfile]);

  const refetchUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

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

    if (!user && !isAuthPage) {
      router.push('/auth/login');
      return;
    }
    
    if (user) {
      if (isAuthPage) {
        if (userProfile?.activePlan) {
          router.push('/dashboard');
        } else {
          router.push('/plans');
        }
        return;
      }
      
      if (userProfile && !userProfile.activePlan && !isPlansPage) {
        router.push('/plans');
        return;
      }
    }
  }, [user, userProfile, authLoading, pathname, router, pageLoader]);

  const isAuthPage = pathname.startsWith('/auth');
  const isPlansPage = pathname.startsWith('/plans');

  if (authLoading || (!user && !isAuthPage) || (user && userProfile && !userProfile.activePlan && !isPlansPage && !isAuthPage)) {
    return null;
  }


  return (
    <AuthContext.Provider value={{ user, userProfile, loading: authLoading, refetchUserProfile }}>
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
