
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlotPilotLogo } from "@/components/icons/logo";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    // In a real app, you'd handle authentication here
    console.log("Login attempt");
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // For demo: redirect to dashboard or show error
      // router.push('/dashboard'); 
      alert("Login functionality is not implemented in this prototype.");
    }, 1500);
  };

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <PlotPilotLogo className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Enter your credentials to access your PlotPilot account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="#"
                className="text-sm text-primary hover:underline"
                onClick={(e) => { e.preventDefault(); alert("Forgot password link clicked (not implemented).")}}
              >
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" required disabled={isLoading} />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-sm">
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="#"
            className="font-medium text-primary hover:underline"
            onClick={(e) => { e.preventDefault(); alert("Sign up link clicked (not implemented).")}}
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
