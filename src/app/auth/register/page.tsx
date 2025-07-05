
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
  getAdditionalUserInfo,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getEmployeeByEmail, updateEmployee } from '@/lib/mock-db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const { toast } = useToast();

  const createUserProfile = async (user: User, displayName?: string | null) => {
    if (!db) return;

    let finalRole = 'admin';
    let adminId: string | undefined = undefined;

    // Invited employees must sign up with email to be linked to the agency
    if (user.email) {
      const invitedEmployee = await getEmployeeByEmail(user.email);
      if (invitedEmployee && invitedEmployee.status === 'pending') {
        finalRole = invitedEmployee.role;
        adminId = invitedEmployee.userId;
        await updateEmployee(invitedEmployee.id, { status: 'active', authUid: user.uid });
        toast({
          title: "Welcome aboard!",
          description: `Your account has been activated with the ${finalRole} role.`
        });
      }
    }

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      displayName: displayName || user.displayName || user.phoneNumber,
      email: user.email,
      phoneNumber: user.phoneNumber,
      createdAt: serverTimestamp(),
      photoURL: user.photoURL || null,
      activePlan: !!adminId,
      role: finalRole,
      adminId: adminId || null,
    });
  };

  const handleRegisterWithEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !db) {
      toast({ title: "Registration Unavailable", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password should be at least 6 characters.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      await createUserProfile(user, name);

      toast({ title: 'Account Created', description: 'You have been successfully registered.' });
    } catch (error: any) {
      toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const setupRecaptcha = () => {
    if (!auth) return;
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {},
    });
  };

  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !db) return;
    setIsPhoneLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "Check your phone for the verification code." });
    } catch (error: any) {
      console.error("Phone Sign-Up Error:", error);
      toast({ title: "Failed to Send OTP", description: `Please check phone number format. Error: ${error.code}`, variant: "destructive" });
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmationResult) return;
    setIsPhoneLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);
      if (additionalInfo?.isNewUser) {
        await createUserProfile(user);
        toast({ title: "Account Created", description: `Welcome!` });
      }
      // Redirect handled by AuthProvider
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      toast({ title: "OTP Verification Failed", description: "The code is invalid or has expired.", variant: "destructive" });
    } finally {
      setIsPhoneLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    if (!auth || !db) {
      toast({ title: "Login Unavailable", variant: "destructive" });
      return;
    }
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo?.isNewUser) {
        await createUserProfile(user, user.displayName);
        if (!user.email || !(await getEmployeeByEmail(user.email))) {
            toast({ title: "Account Created", description: `Welcome, ${user.displayName}!` });
        }
      }
    } catch (error: any) {
      console.error("Google Sign-Up Error:", error);
      toast({ title: "Google Sign-Up Failed", description: `Error: ${error.code}`, variant: "destructive" });
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
          Sign up with Google or choose your preferred method below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading || isPhoneLoading}
        >
          {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 177.2 56.5L357 151C326.4 124.3 294.6 112 248 112c-88.3 0-160 71.7-160 160s71.7 160 160 160c97.2 0 132.2-66.6 135.2-99.2H248v-65.4h237.2c2.4 12.2 3.8 24.8 3.8 38.2z"></path></svg>}
          Sign up with Google
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or with</span></div>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <form onSubmit={handleRegisterWithEmail} className="space-y-4 pt-4">
              <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" type="text" placeholder="John Doe" required disabled={isLoading || isGoogleLoading || isPhoneLoading} value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="name@example.com" required disabled={isLoading || isGoogleLoading || isPhoneLoading} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" required disabled={isLoading || isGoogleLoading || isPhoneLoading} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || isPhoneLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="phone">
            <div id="recaptcha-container"></div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4 pt-4">
                <div className="space-y-2"><Label htmlFor="phone">Phone Number</Label><Input id="phone" type="tel" placeholder="+1 123 456 7890" required disabled={isLoading || isGoogleLoading || isPhoneLoading} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || isPhoneLoading}>
                  {isPhoneLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-4">
                <div className="space-y-2"><Label htmlFor="otp">Verification Code</Label><Input id="otp" type="text" placeholder="Enter 6-digit OTP" required disabled={isPhoneLoading} value={otp} onChange={(e) => setOtp(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={isPhoneLoading}>
                  {isPhoneLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Sign Up
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>

      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-sm">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Log In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
