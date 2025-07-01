
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  getAdditionalUserInfo
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { PlotPilotLogo } from "@/components/icons/logo";

export default function VerifyEmailLinkPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const completeSignIn = async (emailForSignIn: string) => {
      if (!auth || !db) {
        setError("Firebase is not configured correctly.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await signInWithEmailLink(auth, emailForSignIn, window.location.href);
        window.localStorage.removeItem('emailForSignIn');

        const additionalInfo = getAdditionalUserInfo(result);
        if (additionalInfo?.isNewUser) {
          await setDoc(doc(db, "users", result.user.uid), {
            uid: result.user.uid,
            displayName: result.user.displayName || emailForSignIn.split('@')[0],
            email: result.user.email,
            createdAt: serverTimestamp(),
            photoURL: result.user.photoURL || null,
          });
        }
        toast({ title: "Success!", description: "You are now signed in." });
        // Redirect is handled by AuthProvider, but we can push to be safe
        router.push('/dashboard');
      } catch (e) {
        console.error(e);
        setError("The sign-in link is invalid or has expired. Please request a new one.");
        toast({ title: "Sign-in Failed", description: "Invalid or expired link.", variant: "destructive" });
        setLoading(false);
      }
    };
    
    if (!auth || !isSignInWithEmailLink(auth, window.location.href)) {
      setError("This is not a valid sign-in link. Please return to the login page.");
      setLoading(false);
      return;
    }

    const emailFromStorage = window.localStorage.getItem('emailForSignIn');
    if (emailFromStorage) {
      completeSignIn(emailFromStorage);
    } else {
      setShowEmailPrompt(true);
      setLoading(false);
    }
  }, [toast, router]);

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      const completeSignIn = async (emailForSignIn: string) => {
         setLoading(true);
         setError(null);
         try {
           const result = await signInWithEmailLink(auth, emailForSignIn, window.location.href);
           // We don't need to remove from storage as it wasn't there
            const additionalInfo = getAdditionalUserInfo(result);
            if (additionalInfo?.isNewUser) {
              await setDoc(doc(db, "users", result.user.uid), {
                uid: result.user.uid,
                displayName: result.user.displayName || emailForSignIn.split('@')[0],
                email: result.user.email,
                createdAt: serverTimestamp(),
                photoURL: result.user.photoURL || null,
              });
            }
           toast({ title: "Success!", description: "You are now signed in." });
           router.push('/dashboard');
         } catch (err) {
           setError("The sign-in link is invalid, expired, or does not match this email.");
           toast({ title: "Sign-in Failed", description: "Please check the email and try again.", variant: "destructive" });
           setLoading(false);
         }
      };
      completeSignIn(email);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Verifying your link...</p>
        </div>
      );
    }
    if (error) {
      return (
         <div className="text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="link" asChild className="mt-4"><Link href="/auth/login">Go to Login</Link></Button>
        </div>
      );
    }
    if (showEmailPrompt) {
      return (
        <form onSubmit={onEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-confirm">Confirm Email</Label>
            <Input
              id="email-confirm"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Confirm and Sign In
          </Button>
        </form>
      );
    }
    return null;
  };

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <PlotPilotLogo className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Complete Sign In</CardTitle>
        <CardDescription>
          {showEmailPrompt ? "Please provide your email to complete the sign-in process." : "Finalizing your secure sign-in."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
