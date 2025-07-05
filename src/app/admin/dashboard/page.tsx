
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, FileText, Wallet, DollarSign, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getUsers, getPayments, getPlans } from "@/lib/mock-db";
import type { UserProfile, Payment, Plan } from "@/types";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const PIE_CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [usersData, paymentsData, plansData] = await Promise.all([
        getUsers(),
        getPayments(),
        getPlans(),
      ]);
      setUsers(usersData.filter(u => u.role !== 'super_admin')); // Exclude super admin from user stats
      setPayments(paymentsData);
      setPlans(plansData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalRevenue = payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);
    const activePlans = plans.filter(p => p.isActive).length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;

    return { totalUsers, totalRevenue, activePlans, pendingPayments };
  }, [users, payments, plans]);

  const userSignupsData = useMemo(() => {
    const dataByMonth: { name: string; users: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const targetMonth = subMonths(new Date(), i);
        const monthStart = startOfMonth(targetMonth);
        const monthEnd = endOfMonth(targetMonth);

        const monthlySignups = users.filter(u => {
            if (!u.createdAt) return false;
            const tDate = new Date(u.createdAt);
            return tDate >= monthStart && tDate <= monthEnd;
        }).length;
        
        dataByMonth.push({
            name: format(targetMonth, 'MMM'),
            users: monthlySignups,
        });
    }
    return dataByMonth;
  }, [users]);

  const revenueByPlanData = useMemo(() => {
      const planRevenue = new Map<string, number>();
      payments
        .filter(p => p.status === 'approved')
        .forEach(p => {
            planRevenue.set(p.planName, (planRevenue.get(p.planName) || 0) + p.amount);
        });
      
      return Array.from(planRevenue.entries()).map(([name, value], index) => ({
          name,
          value,
          fill: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
      })).sort((a, b) => b.value - a.value);
  }, [payments]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to the PlotPilot Super Admin Panel. Here you can manage users, plans, and payments for the entire platform.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total registered agencies/users.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all approved payments.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePlans}</div>
            <p className="text-xs text-muted-foreground">Subscription plans available to users.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Payments awaiting approval.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Signups</CardTitle>
              <CardDescription>New users in the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              <ResponsiveContainer>
                <BarChart data={userSignupsData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}}/>
                  <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Plan</CardTitle>
              <CardDescription>Breakdown of revenue from different plans.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full flex items-center justify-center">
                {revenueByPlanData.length > 0 ? (
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={revenueByPlanData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {revenueByPlanData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-muted-foreground">
                        <CheckCircle className="h-10 w-10 mx-auto mb-2" />
                        <p>No revenue data yet.</p>
                    </div>
                )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
