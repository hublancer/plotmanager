
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PaymentDialog } from "@/components/plans/payment-dialog";
import { useAuth } from "@/context/auth-context";
import { getPlans } from "@/lib/mock-db";
import type { Plan } from "@/types";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { userProfile } = useAuth();
  
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      const activePlans = await getPlans();
      setPlans(activePlans.filter(p => p.isActive));
      setIsLoading(false);
    };
    fetchPlans();
  }, []);

  const handleChoosePlan = (plan: Plan) => {
    setSelectedPlan(plan);
  };
  
  const getPlanPriceSuffix = (durationInDays: number) => {
      if (durationInDays <= 31) return "/ month";
      if (durationInDays <= 366) return "/ year";
      return "one-time";
  }

  if (isLoading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-full p-4 space-y-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading available plans...</p>
        </div>
    )
  }
  
  const subStatus = userProfile?.subscription?.status;
  if (subStatus === 'active') {
      return (
          <div className="flex flex-col items-center justify-center min-h-full p-4 space-y-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h1 className="text-3xl font-bold">You Have an Active Plan!</h1>
              <p className="text-muted-foreground">Thank you for being a subscriber.</p>
              <p className="text-sm">Your plan: {userProfile?.subscription?.planName}</p>
              <p className="text-sm">Expires on: {new Date(userProfile?.subscription?.endDate || '').toLocaleDateString()}</p>
              <Link href="/dashboard" passHref>
                  <Button>Go to Dashboard</Button>
              </Link>
          </div>
      )
  }
  
  if (subStatus === 'pending_payment') {
      return (
          <div className="flex flex-col items-center justify-center min-h-full p-4 space-y-4 text-center">
              <CheckCircle className="h-16 w-16 text-yellow-500" />
              <h1 className="text-3xl font-bold">Payment Submitted!</h1>
              <p className="text-muted-foreground">Your payment for the {userProfile?.subscription?.planName} plan is being reviewed.</p>
              <p className="text-sm">Your account will be activated upon approval. Please check back later.</p>
          </div>
      )
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-full p-4 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Choose Your Plan</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Unlock the full potential of PlotPilot. Select a plan to continue.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl w-full">
          {plans.map((plan, index) => (
            <Card
              key={plan.id}
              className={cn(
                "flex flex-col shadow-lg transition-transform duration-300 hover:scale-105",
                index === 1 && "border-primary border-2 shadow-primary/20" // Highlight middle plan
              )}
            >
              {index === 1 && (
                <div className="absolute top-0 right-4 -mt-4 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full shadow-md flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="mb-6">
                  <p className="text-5xl font-bold text-center">
                    <span className="text-3xl font-normal text-muted-foreground">PKR</span> {plan.price.toLocaleString()}
                  </p>
                  <p className="text-center text-muted-foreground">{getPlanPriceSuffix(plan.durationInDays)}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleChoosePlan(plan)}
                  variant={index === 1 ? "default" : "outline"}
                >
                  Choose {plan.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      {selectedPlan && (
        <PaymentDialog
          plan={selectedPlan}
          isOpen={!!selectedPlan}
          onOpenChange={() => setSelectedPlan(null)}
        />
      )}
    </>
  );
}
