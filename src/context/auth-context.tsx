
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingContext } from '@/context/loading-context';
import { getUserProfileByUID, SUPER_ADMIN_EMAIL } from '@/lib/mock-db';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  refetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isSuperAdmin: false,
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
      let profile = await getUserProfileByUID(userToFetch.uid);
      if (profile && userToFetch.email === SUPER_ADMIN_EMAIL && profile.role !== 'super_admin') {
          profile.role = 'super_admin';
      }
      setUserProfile(profile);
      return profile;
    } else {
      setUserProfile(null);
      return null;
    }
  }, []);

  const refetchUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);
  
  const isSuperAdmin = userProfile?.role === 'super_admin';

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


  useEffect(() => {
    const isAuthPage = pathname.startsWith('/auth');
    const isAdminLoginPage = pathname === '/admin/login';
    const isAdminPage = pathname.startsWith('/admin') && !isAdminLoginPage;
    const isPlansPage = pathname.startsWith('/plans');
    
    // Show loader on page transitions
    if (authLoading) {
      if (!isAuthPage && !isAdminLoginPage) {
        pageLoader.start();
      }
    } else {
      pageLoader.complete();
    }

    if (authLoading) return;
    
    // Handle non-logged-in users
    if (!user) {
      if (isAdminPage) {
        router.push('/admin/login'); // Trying to access admin area while logged out
      } else if (!isAuthPage && !isAdminLoginPage) {
        router.push('/auth/login'); // Trying to access regular app while logged out
      }
      return;
    }

    // Handle logged-in users
    if (isSuperAdmin) {
      if (!isAdminPage && !isAdminLoginPage) { // If super admin is not in admin area
        router.push('/admin/dashboard');
      }
    } else { // Regular user/agency
      if (isAdminPage || isAdminLoginPage) { // If regular user tries to access any admin page
        router.push('/dashboard'); 
        return;
      }

      if (isAuthPage) { // If logged-in user is on an auth page
        router.push('/dashboard');
        return;
      }
      
      const sub = userProfile?.subscription;
      const isSubscribed = sub?.status === 'active' && sub.endDate && new Date(sub.endDate) > new Date();
      
      if (!isSubscribed && !isPlansPage) {
        router.push('/plans');
      }
    }

  }, [user, userProfile, isSuperAdmin, authLoading, pathname, router, pageLoader]);

  // This logic determines what to render. It acts as a gatekeeper.
  const renderChildren = () => {
    if (authLoading) return null;

    const isAuthPage = pathname.startsWith('/auth');
    const isAdminLoginPage = pathname === '/admin/login';
    const isPlansPage = pathname.startsWith('/plans');
    const isAdminPage = pathname.startsWith('/admin') && !isAdminLoginPage;

    if (!user) {
        // If not logged in, only allow auth pages and admin login page.
        return isAuthPage || isAdminLoginPage ? children : null;
    }
    
    if (isSuperAdmin) {
        // Super admin can access admin routes and its login page
        return isAdminPage || isAdminLoginPage ? children : null;
    }
    
    // Regular user logic
    const sub = userProfile?.subscription;
    const isSubscribed = sub?.status === 'active' && sub.endDate && new Date(sub.endDate) > new Date();
    
    if (isSubscribed) {
        // A subscribed user should not see admin pages or auth pages.
        return !isAdminPage && !isAdminLoginPage && !isAuthPage ? children : null;
    } else {
        // Not subscribed, only allow plans page or auth pages (which would redirect anyway)
        return isPlansPage || isAuthPage ? children : null;
    }
  }


  return (
    <AuthContext.Provider value={{ user, userProfile, loading: authLoading, isSuperAdmin, refetchUserProfile }}>
      {renderChildren()}
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
