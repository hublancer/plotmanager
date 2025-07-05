"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlotPilotLogo } from "@/components/icons/logo";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { SUPER_ADMIN_EMAIL } from "@/lib/mock-db";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) {
      toast({
        title: "Login Unavailable",
        description: "Firebase is not configured.",
        variant: "destructive",
      });
      return;
    }

    if (email !== SUPER_ADMIN_EMAIL) {
        toast({
            title: "Access Denied",
            description: "This login is for administrators only.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect is handled by AuthProvider
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: "Please check your email and password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <PlotPilotLogo className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Admin Panel</CardTitle>
        <CardDescription>
          Sign in to access the administrator dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="admin@example.com" required disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log In
          </Button>
        </form>
      </CardContent>
      <CardContent className="text-center text-sm text-muted-foreground">
        <p>First time admin? <Link href="/auth/register" className="underline">Register here</Link> with the admin email.</p>
      </CardContent>
    </Card>
  );
}
