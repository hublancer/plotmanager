'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlotPilotLogo } from '@/components/icons/logo';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !db) {
      toast({
        title: "Registration Unavailable",
        description: "Firebase is not configured. See developer console for details.",
        variant: "destructive"
      });
      return;
    }
    if (password.length < 6) {
        toast({
            title: "Password too short",
            description: "Password should be at least 6 characters.",
            variant: "destructive"
        });
        return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        await updateProfile(user, { displayName: name });
        
        // Create a user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          displayName: name,
          email: email,
          createdAt: serverTimestamp(),
          photoURL: user.photoURL || null,
        });
      }

      toast({
        title: 'Account Created',
        description: 'You have been successfully registered.',
      });
      // Redirect is handled by AuthProvider
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    if (!auth || !db) {
      toast({
        title: "Login Unavailable",
        description: "Firebase is not configured. See developer console for details.",
        variant: "destructive",
      });
      return;
    }
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo?.isNewUser) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          createdAt: serverTimestamp(),
          photoURL: user.photoURL || null,
        });
        toast({
          title: "Account Created",
          description: `Welcome, ${user.displayName}!`,
        });
      }
      // Redirect is handled by AuthProvider
    } catch (error: any) {
      console.error("Google Sign-Up Error:", error);
      toast({
        title: "Google Sign-Up Failed",
        description: `Error: ${error.code}. Please ensure popups are enabled and your domain is authorized in Firebase.`,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <PlotPilotLogo className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>
          Sign up with Google or enter your details below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 177.2 56.5L357 151C326.4 124.3 294.6 112 248 112c-88.3 0-160 71.7-160 160s71.7 160 160 160c97.2 0 132.2-66.6 135.2-99.2H248v-65.4h237.2c2.4 12.2 3.8 24.8 3.8 38.2z"></path></svg>
          )}
          Sign up with Google
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or with email
            </span>
          </div>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              required
              disabled={isLoading || isGoogleLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              disabled={isLoading || isGoogleLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
                id="password" 
                type="password" 
                required 
                disabled={isLoading || isGoogleLoading} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-sm">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Log In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
