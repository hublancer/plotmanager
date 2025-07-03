
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Building2, ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { getProperties, getTransactions, getRecentTransactions } from "@/lib/mock-db";
import type { Property, Transaction } from "@/types";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, getMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const PIE_CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];
const STATUS_COLORS = {
  available: "hsl(var(--chart-2))", // Green
  rented: "hsl(var(--chart-1))",    // Blue
  installment: "hsl(var(--chart-4))", // Purple
};

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setIsLoading(true);
      const [props, trans, recentTrans] = await Promise.all([
        getProperties(user.uid),
        getTransactions(user.uid),
        getRecentTransactions(user.uid, 5)
      ]);
      setProperties(props);
      setTransactions(trans);
      setRecentTransactions(recentTrans);
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const relevantTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= monthStart && tDate <= monthEnd;
    });

    const totalRevenue = relevantTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = relevantTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    };
  }, [transactions]);
  
  const propertyStatusData = useMemo(() => {
    const counts = { available: 0, rented: 0, installment: 0 };
    properties.forEach(p => {
      if (p.isRented) counts.rented++;
      else if (p.isSoldOnInstallment) counts.installment++;
      else counts.available++;
    });
    return [
        { name: 'Available', value: counts.available, fill: STATUS_COLORS.available },
        { name: 'Rented', value: counts.rented, fill: STATUS_COLORS.rented },
        { name: 'On Installment', value: counts.installment, fill: STATUS_COLORS.installment },
    ].filter(item => item.value > 0);
  }, [properties]);
  
  const incomeByCategoryData = useMemo(() => {
      const categoryMap = new Map<string, number>();
      transactions
        .filter(t => t.type === 'income')
        .forEach(t => {
            const category = t.category || 'Uncategorized';
            categoryMap.set(category, (categoryMap.get(category) || 0) + t.amount);
        });
      
      return Array.from(categoryMap.entries()).map(([name, value], index) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          fill: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
      })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const incomeExpenseChartData = useMemo(() => {
    const dataByMonth: { name: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const targetMonth = subMonths(new Date(), i);
        const monthStart = startOfMonth(targetMonth);
        const monthEnd = endOfMonth(targetMonth);

        const monthlyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= monthStart && tDate <= monthEnd;
        });

        const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        dataByMonth.push({
            name: format(targetMonth, 'MMM'),
            income,
            expense,
        });
    }
    return dataByMonth;
  }, [transactions]);


  if (isLoading) {
    return (
      <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
          </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue (Month)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">PKR {monthlyStats.totalRevenue.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Expenses (Month)</CardTitle><ArrowDownLeft className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">PKR {monthlyStats.totalExpenses.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Net Income (Month)</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">PKR {monthlyStats.netProfit.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Properties</CardTitle><Building2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{properties.length}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Income vs. Expenses</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer>
              <BarChart data={incomeExpenseChartData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `PKR ${Number(value)/1000}k`}/>
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}}/>
                <Legend />
                <Bar dataKey="income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Property Status</CardTitle>
                <CardDescription>Current state of all properties in your portfolio.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                 <ResponsiveContainer>
                    <PieChart>
                        <Pie data={propertyStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {propertyStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income by Category</CardTitle>
            <CardDescription>Breakdown of all revenue sources.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full">
             <ResponsiveContainer>
                <PieChart>
                    <Pie data={incomeByCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return (percent as number) > 0.05 ? (<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>{(percent * 100).toFixed(0)}%</text>) : null;
                    }}>
                        {incomeByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your last 5 recorded financial activities.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {recentTransactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium capitalize">{t.category}</div>
                      <div className="text-sm text-muted-foreground">{t.contactName}</div>
                    </TableCell>
                    <TableCell>{format(new Date(t.date), "dd MMM, yyyy")}</TableCell>
                    <TableCell className={cn("text-right font-semibold", t.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                      {t.type === 'income' ? '+' : '-'} PKR {t.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
