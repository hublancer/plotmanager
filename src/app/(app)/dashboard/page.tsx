
"use client"; 

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, CreditCard, FileText, Users } from "lucide-react";
import Image from "next/image";
import { getProperties } from "@/lib/mock-db";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const [totalProperties, setTotalProperties] = useState<number | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    const fetchProperties = async () => {
      const properties = await getProperties(user.uid);
      setTotalProperties(properties.length);
    };
    fetchProperties();
  }, [user]);

  const summaryStats = [
    { title: "Total Properties", value: totalProperties, icon: <Building2 className="h-6 w-6 text-primary" />, description: "+5 since last month" },
    { title: "Occupancy Rate", value: "85%", icon: <Users className="h-6 w-6 text-primary" />, description: "Target: 90%" },
    { title: "Pending Payments", value: "15", icon: <CreditCard className="h-6 w-6 text-destructive" />, description: "$5,200 overdue" },
    { title: "Generated Reports", value: "28", icon: <FileText className="h-6 w-6 text-primary" />, description: "Last report: Sales Q2" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to PlotPilot</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              {stat.value !== null ? (
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              ) : (
                <Skeleton className="h-8 w-12" />
              )}
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent property updates and payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                <span>Plot #101 (Sunset Villa) marked as SOLD</span>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </li>
              <li className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                <span>Rent payment received for Apt B3 (Greenwood Heights)</span>
                <span className="text-xs text-muted-foreground">5 hours ago</span>
              </li>
              <li className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                <span>New property "Lakeside Estate" added</span>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Featured Property</CardTitle>
            <CardDescription>Highlight of a key property in your portfolio.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Image 
              src="https://placehold.co/600x400.png" 
              alt="Featured Property" 
              width={600} 
              height={400} 
              className="rounded-lg object-cover aspect-[3/2]"
              data-ai-hint="modern house" 
            />
            <h3 className="mt-4 text-xl font-semibold text-foreground">Oceanview Paradise</h3>
            <p className="text-sm text-muted-foreground">Luxury villa with stunning ocean views.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
