
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useContext, useEffect, useMemo, useState, useCallback } from "react";
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
  Filter,
  Calendar,
  Bell,
  DollarSign,
  Loader2,
  PlusCircle,
  Wallet,
  Download,
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
import type { UserProfile, RentalItem, InstallmentItem, CalendarEvent, Property, Payment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getDerivedRentals, getDerivedInstallmentItems, getCalendarEvents, getAllMockProperties, getPayments } from "@/lib/mock-db";
import { addDays, isWithinInterval, format, parseISO, isToday } from "date-fns";
import { LiveClock } from "@/components/layout/live-clock";
import { PropertyFormDialog } from "@/components/properties/property-form-dialog";
import { LeadFormDialog } from "@/components/pipeline/lead-form-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { EventFormDialog } from "@/components/schedule/event-form-dialog";

interface NavItem {
  href: string;
  icon: ReactNode;
  label: string;
  tooltip: string;
  roles: UserProfile['role'][]; // Roles that can see this item
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard", tooltip: "Dashboard", roles: ['admin', 'manager', 'agent'] },
  { href: "/properties", icon: <Building2 />, label: "Properties", tooltip: "Properties", roles: ['admin', 'manager', 'agent'] },
  { href: "/rentals", icon: <Home />, label: "Rentals", tooltip: "Rental Management", roles: ['admin', 'manager'] },
  { href: "/payments", icon: <CreditCard />, label: "Transactions", tooltip: "Financial Transactions", roles: ['admin', 'manager'] },
  { href: "/installments", icon: <CalendarClock />, label: "Installments", tooltip: "Installments", roles: ['admin', 'manager'] },
  { href: "/schedule", icon: <Calendar />, label: "Schedule", tooltip: "Company Schedule", roles: ['admin', 'manager', 'agent'] },
  { href: "/pipeline", icon: <Filter />, label: "Lead Survey", tooltip: "Lead Survey", roles: ['admin', 'manager', 'agent'] },
  { href: "/employees", icon: <Briefcase />, label: "Employees", tooltip: "Employees", roles: ['admin', 'manager'] }, 
  { href: "/ai-assistant", icon: <MessageSquareText />, label: "AI Assistant", tooltip: "AI Assistant", roles: ['admin', 'manager', 'agent'] },
];

const mobileNavItems = [
    { href: "/dashboard", icon: <Home className="h-5 w-5"/>, label: "Home" },
    { href: "/properties", icon: <Building2 className="h-5 w-5"/>, label: "Properties" },
    { href: "/rentals", icon: <Wallet className="h-5 w-5"/>, label: "Rentals" },
    { href: "/pipeline", icon: <Filter className="h-5 w-5"/>, label: "Leads" },
];

interface AppNotification {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  date: Date;
  href: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { start, complete } = useContext(LoadingContext);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  const [financialNotifications, setFinancialNotifications] = useState<AppNotification[]>([]);
  const [calendarNotifications, setCalendarNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);

  // State for PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // State for global dialogs
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  // State for properties list needed by transaction dialog
  const [properties, setProperties] = useState<Pick<Property, 'id' | 'name'>[]>([]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      // Check if the app is already in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return;
      }
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('Service worker registration failed:', err);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({ title: 'Installation Complete!', description: 'PlotPilot has been added to your home screen.' });
    }
    setInstallPrompt(null);
  };

  const visibleNavItems = useMemo(() => {
    const userRole = userProfile?.role || 'agent'; // Default to least privileged
    return navItems.filter(item => item.roles.includes(userRole));
  }, [userProfile]);
  
  const generateNotifications = useCallback(async () => {
    if (!user || !userProfile) return;
    
    setIsNotificationsLoading(true);

    // Super Admin gets payment notifications
    if (userProfile.role === 'super_admin') {
        const pendingPayments = await getPayments('pending');
        const paymentNotifications = pendingPayments.map(p => ({
            id: `payment-${p.id}`,
            icon: <Wallet className="h-4 w-4 text-orange-500" />,
            title: `Payment from ${p.userEmail}`,
            description: `PKR ${p.amount.toLocaleString()} for ${p.planName} plan is pending.`,
            date: new Date(p.createdAt),
            href: '/admin/payments',
        }));
        setFinancialNotifications(paymentNotifications);
        setCalendarNotifications([]); // Admins don't need user calendar notifications
        setIsNotificationsLoading(false);
        return;
    }

    // Regular User Notifications
    const ownerId = userProfile.role === 'admin' ? user.uid : userProfile.adminId;
    const userRole = userProfile.role || 'agent';

    if (!ownerId) {
        setIsNotificationsLoading(false);
        return;
    }

    const calendarEventsPromise = getCalendarEvents(ownerId);
    const rentalsPromise = userRole !== 'agent' ? getDerivedRentals(ownerId) : Promise.resolve([] as RentalItem[]);
    const installmentsPromise = userRole !== 'agent' ? getDerivedInstallmentItems(ownerId) : Promise.resolve([] as InstallmentItem[]);

    const [calendarEvents, rentals, installments] = await Promise.all([
        calendarEventsPromise,
        rentalsPromise,
        installmentsPromise,
    ]);
    
    const upcomingFinancial: AppNotification[] = [];
    const upcomingCalendar: AppNotification[] = [];
    const today = new Date();
    const notificationEndDate = addDays(today, 7);

    rentals.forEach(r => {
        if (r.nextDueDate) {
            const dueDate = parseISO(r.nextDueDate);
            if (isWithinInterval(dueDate, { start: today, end: notificationEndDate })) {
                upcomingFinancial.push({
                    id: `rental-${r.id}`,
                    icon: <DollarSign className="h-4 w-4 text-green-500" />,
                    title: `Rent Due: ${r.tenantName}`,
                    description: `Due on ${format(dueDate, 'PPP')}: PKR ${r.rentAmount.toLocaleString()} for ${r.propertyName}`,
                    date: dueDate,
                    href: '/rentals',
                });
            }
        }
    });

    installments.forEach(i => {
         if (i.nextDueDate && i.status === 'Active') {
            const dueDate = parseISO(i.nextDueDate);
            if (isWithinInterval(dueDate, { start: today, end: notificationEndDate })) {
                upcomingFinancial.push({
                    id: `installment-${i.id}`,
                    icon: <DollarSign className="h-4 w-4 text-blue-500" />,
                    title: `Installment Due: ${i.buyerName}`,
                    description: `Due on ${format(dueDate, 'PPP')}: PKR ${i.installmentAmount.toLocaleString()} for ${i.propertyName}`,
                    date: dueDate,
                    href: '/installments',
                });
            }
        }
    });

    calendarEvents.forEach(e => {
        const startDate = parseISO(e.start);
        if (isToday(startDate) || isWithinInterval(startDate, { start: today, end: notificationEndDate })) {
             const description = e.allDay 
                ? `On ${format(startDate, 'PPP')}` 
                : `At ${format(startDate, 'p')} on ${format(startDate, 'PPP')}`;
             upcomingCalendar.push({
                id: `event-${e.id}`,
                icon: <Calendar className="h-4 w-4 text-purple-500" />,
                title: `${e.type.charAt(0).toUpperCase() + e.type.slice(1)}: ${e.title}`,
                description,
                date: startDate,
                href: '/schedule',
            });
        }
    });

    upcomingFinancial.sort((a, b) => a.date.getTime() - b.date.getTime());
    upcomingCalendar.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    setFinancialNotifications(upcomingFinancial);
    setCalendarNotifications(upcomingCalendar);
    setIsNotificationsLoading(false);
  }, [user, userProfile]);


  useEffect(() => {
    if (user && userProfile) {
        generateNotifications();
        const ownerId = userProfile.role === 'admin' ? user.uid : userProfile.adminId;
        if (ownerId) {
            getAllMockProperties(ownerId).then(setProperties);
        }
    }
  }, [user, userProfile, generateNotifications]);

  useEffect(() => {
    complete();
  }, [pathname, complete]);
  
  const handleDialogUpdate = () => {
    // This is a simplified way to refetch data for multiple pages.
    // In a larger app, you might use a more granular state management solution.
    if (pathname.includes('/properties')) router.refresh();
    if (pathname.includes('/pipeline')) router.refresh();
    if (pathname.includes('/payments')) router.refresh();
    if (pathname.includes('/schedule')) router.refresh();
    generateNotifications(); // Re-fetch notifications after an update
  };

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
  
  const QuickAddDropdown = ({ isMobile = false }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            {isMobile ? (
                 <Button variant="default" size="icon" className="relative -top-8 h-16 w-16 rounded-full shadow-lg">
                    <PlusCircle className="h-8 w-8" />
                    <span className="sr-only">Quick Actions</span>
                </Button>
            ) : (
                <Button variant="outline" size="icon">
                  <PlusCircle className="h-5 w-5" />
                  <span className="sr-only">Quick Actions</span>
                </Button>
            )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isMobile ? "center" : "end"} side={isMobile ? "top" : "bottom"} className={cn(isMobile && "mb-2")}>
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setIsPropertyDialogOpen(true)}>Add Property</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsTransactionDialogOpen(true)}>Add Transaction</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsLeadDialogOpen(true)}>Add Lead</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsEventDialogOpen(true)}>Add Event</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
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
            {visibleNavItems.map((item) => (
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
              <Link href="/plans" passHref>
                <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Upgrade Plan</span>
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
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 md:px-6">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <h1 className="text-lg font-semibold md:text-xl">
              {visibleNavItems.find(item => pathname.startsWith(item.href))?.label || "PlotPilot"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <LiveClock />
             {installPrompt && (
              <Button variant="outline" size="sm" onClick={handleInstallClick}>
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
            )}
            <div className="hidden md:block">
              <QuickAddDropdown />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Calendar className="h-5 w-5" />
                  {calendarNotifications.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">{calendarNotifications.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 md:w-96">
                <DropdownMenuLabel>Upcoming Events</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isNotificationsLoading ? (
                  <DropdownMenuItem disabled className="justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </DropdownMenuItem>
                ) : calendarNotifications.length > 0 ? (
                  <ScrollArea className="h-auto max-h-[400px]">
                    {calendarNotifications.map(n => (
                      <Link href={n.href} key={n.id} passHref>
                        <DropdownMenuItem className="flex items-start gap-3 whitespace-normal cursor-pointer p-3" onClick={() => handleNavigation(n.href)}>
                          <div className="mt-1">{n.icon}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{n.title}</p>
                            <p className="text-xs text-muted-foreground">{n.description}</p>
                          </div>
                        </DropdownMenuItem>
                      </Link>
                    ))}
                  </ScrollArea>
                ) : (
                  <div className="text-sm text-center text-muted-foreground p-4">
                    No upcoming events.
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {financialNotifications.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">{financialNotifications.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 md:w-96">
                <DropdownMenuLabel>Financial Alerts</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isNotificationsLoading ? (
                  <DropdownMenuItem disabled className="justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </DropdownMenuItem>
                ) : financialNotifications.length > 0 ? (
                  <ScrollArea className="h-auto max-h-[400px]">
                    {financialNotifications.map(n => (
                      <Link href={n.href} key={n.id} passHref>
                        <DropdownMenuItem className="flex items-start gap-3 whitespace-normal cursor-pointer p-3" onClick={() => handleNavigation(n.href)}>
                          <div className="mt-1">{n.icon}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{n.title}</p>
                            <p className="text-xs text-muted-foreground">{n.description}</p>
                          </div>
                        </DropdownMenuItem>
                      </Link>
                    ))}
                  </ScrollArea>
                ) : (
                  <div className="text-sm text-center text-muted-foreground p-4">
                    No upcoming financial alerts.
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 pb-20 md:pb-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>

    {/* Mobile Bottom Navigation */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 h-16 bg-background/95 backdrop-blur-sm border-t">
        <nav className="flex items-center justify-around h-full">
            {mobileNavItems.slice(0, 2).map(item => (
                <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 w-full h-full", pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground")}>
                    {item.icon}
                    <span className="text-xs">{item.label}</span>
                </Link>
            ))}
            <div className="w-full flex justify-center">
                 <QuickAddDropdown isMobile={true} />
            </div>
            {mobileNavItems.slice(2).map(item => (
                <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 w-full h-full", pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground")}>
                    {item.icon}
                    <span className="text-xs">{item.label}</span>
                </Link>
            ))}
        </nav>
    </div>

    <PropertyFormDialog
      isOpen={isPropertyDialogOpen}
      onOpenChange={setIsPropertyDialogOpen}
      onUpdate={handleDialogUpdate}
      initialData={null}
    />
    <LeadFormDialog
      isOpen={isLeadDialogOpen}
      onOpenChange={setIsLeadDialogOpen}
      onUpdate={handleDialogUpdate}
      initialData={null}
    />
    <TransactionFormDialog
      isOpen={isTransactionDialogOpen}
      onOpenChange={setIsTransactionDialogOpen}
      onUpdate={handleDialogUpdate}
      initialData={null}
      properties={properties}
    />
    <EventFormDialog
      isOpen={isEventDialogOpen}
      onOpenChange={setIsEventDialogOpen}
      onUpdate={handleDialogUpdate}
      initialEvent={null}
      dateInfo={{ start: new Date(), end: new Date(), allDay: true, startStr:'', endStr:'' }}
      viewingEvent={null}
    />
  </>
  );
}
