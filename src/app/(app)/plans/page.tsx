
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PaymentDialog } from "@/components/plans/payment-dialog";
import { useAuth } from "@/context/auth-context";

const plans = [
  {
    name: "Monthly",
    price: 999,
    priceSuffix: "/ month",
    description: "Perfect for getting started and exploring all features.",
    features: [
      "Manage up to 50 properties",
      "Full AI Assistant access",
      "Standard reporting",
      "Email support",
    ],
    isPopular: false,
  },
  {
    name: "Yearly",
    price: 4999,
    priceSuffix: "/ year",
    description: "Best value for dedicated agents and small teams.",
    features: [
      "Manage unlimited properties",
      "Full AI Assistant access",
      "Advanced reporting & analytics",
      "Priority email & chat support",
      "Early access to new features",
    ],
    isPopular: true,
  },
  {
    name: "Lifetime",
    price: 50000,
    priceSuffix: " one-time",
    description: "One payment, full access forever. The ultimate investment.",
    features: [
      "Everything in Yearly, forever",
      "Dedicated account manager",
      "Lifetime updates included",
      "Exclusive partner benefits",
    ],
    isPopular: false,
  },
];

export default function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { userProfile } = useAuth();

  const handleChoosePlan = (planName: string) => {
    setSelectedPlan(planName);
  };
  
  if (userProfile?.activePlan) {
      return (
          <div className="flex flex-col items-center justify-center min-h-full p-4 space-y-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h1 className="text-3xl font-bold">You Have an Active Plan!</h1>
              <p className="text-muted-foreground">Thank you for being a subscriber.</p>
              <Link href="/dashboard" passHref>
                  <Button>Go to Dashboard</Button>
              </Link>
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
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "flex flex-col shadow-lg transition-transform duration-300 hover:scale-105",
                plan.isPopular && "border-primary border-2 shadow-primary/20"
              )}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-4 -mt-4 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full shadow-md flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="mb-6">
                  <p className="text-5xl font-bold text-center">
                    <span className="text-3xl font-normal text-muted-foreground">PKR</span> {plan.price.toLocaleString()}
                  </p>
                  <p className="text-center text-muted-foreground">{plan.priceSuffix}</p>
                </div>
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleChoosePlan(plan.name)}
                  variant={plan.isPopular ? "default" : "outline"}
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
          planName={selectedPlan}
          isOpen={!!selectedPlan}
          onOpenChange={() => setSelectedPlan(null)}
        />
      )}
    </>
  );
}
