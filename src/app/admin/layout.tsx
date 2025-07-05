"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useContext, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  LogOut,
  UserCircle
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlotPilotLogo } from "@/components/icons/logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { href: "/admin/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
  { href: "/admin/users", icon: <Users />, label: "Users" },
  { href: "/admin/plans", icon: <FileText />, label: "Plans" },
  { href: "/admin/payments", icon: <Wallet />, label: "Payments" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/admin/login');
    }
  }, [isSuperAdmin, router]);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Logged Out" });
    router.push('/admin/login');
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader className="flex items-center justify-between p-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2 hover:no-underline">
            <PlotPilotLogo className="h-7 w-7 text-primary" />
            <span className="font-semibold text-lg text-foreground group-data-[collapsible=icon]:hidden">
              Admin Panel
            </span>
          </Link>
          <div className="block md:hidden"><SidebarTrigger /></div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.label }}
                  className={cn(
                    "justify-start",
                    pathname.startsWith(item.href) && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-3">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start w-full p-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8"><AvatarFallback>A</AvatarFallback></Avatar>
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Admin</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="md:hidden"><SidebarTrigger /></div>
            <h1 className="text-lg font-semibold md:text-xl">
              {navItems.find(item => pathname.startsWith(item.href))?.label || "Admin"}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
