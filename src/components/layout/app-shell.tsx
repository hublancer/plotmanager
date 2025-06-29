
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useContext, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  CalendarClock,
  FileText,
  Settings,
  UserCircle,
  Briefcase, 
  MessageSquareText,
  Home,
  LogOut,
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
import { LoadingContext } from "@/context/loading-context";
import { useAuth } from "@/context/auth-context";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  href: string;
  icon: ReactNode;
  label: string;
  tooltip: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard", tooltip: "Dashboard" },
  { href: "/properties", icon: <Building2 />, label: "Properties", tooltip: "Properties" },
  { href: "/rentals", icon: <Home />, label: "Rentals", tooltip: "Rental Management" },
  { href: "/payments", icon: <CreditCard />, label: "Payments", tooltip: "Payments" },
  { href: "/installments", icon: <CalendarClock />, label: "Installments", tooltip: "Installments" },
  { href: "/employees", icon: <Briefcase />, label: "Employees", tooltip: "Employees" }, 
  { href: "/reports", icon: <FileText />, label: "Reports", tooltip: "Reports" },
  { href: "/ai-assistant", icon: <MessageSquareText />, label: "AI Assistant", tooltip: "AI Assistant" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { start, complete } = useContext(LoadingContext);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    complete();
  }, [pathname, complete]);

  const handleNavigation = (href: string) => {
    if (!pathname.startsWith(href)) {
      start();
    }
  };

  const handleLogout = async () => {
    if (!auth) {
      toast({
        title: "Logout Unavailable",
        description: "Firebase is not configured. Please check your setup.",
        variant: "destructive",
      });
      return;
    }
    start();
    await signOut(auth);
    // The AuthProvider will handle the redirect to the login page.
  };

  return (
    <SidebarProvider defaultOpen={true} >
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader className="flex items-center justify-between p-3">
          <Link href="/dashboard" className="flex items-center gap-2 hover:no-underline" onClick={() => handleNavigation('/dashboard')}>
            <PlotPilotLogo className="h-7 w-7 text-primary" />
            <span className="font-semibold text-lg text-foreground group-data-[collapsible=icon]:hidden">
              PlotPilot
            </span>
          </Link>
          <div className="block md:hidden">
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.tooltip, className:"bg-popover text-popover-foreground border shadow-md" }}
                  className={cn(
                    "justify-start",
                    pathname.startsWith(item.href) && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  <Link href={item.href} onClick={() => handleNavigation(item.href)}>
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
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} data-ai-hint="user avatar" />
                  <AvatarFallback>{user?.displayName?.substring(0,2).toUpperCase() || "PP"}</AvatarFallback>
                </Avatar>
                <span className="ml-2 group-data-[collapsible=icon]:hidden">{user?.displayName || "User"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>{user?.email || "My Account"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile" passHref>
                <DropdownMenuItem>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/settings" passHref>
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
              </Link>
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
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <h1 className="text-lg font-semibold md:text-xl">
            {navItems.find(item => pathname.startsWith(item.href))?.label || "PlotPilot"}
          </h1>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
