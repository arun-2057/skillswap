'use client';

import { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import {
  Search,
  Bell,
  Coins,
  LogIn,
  UserPlus,
  User,
  BookOpen,
  CalendarDays,
  Receipt,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useRouterStore } from '@/store/router-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export function Navbar() {
  const { data: session } = useSession();
  const { navigate, route } = useRouterStore();
  const { user, isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchUnreadCount() {
      try {
        const res = await fetch('/api/notifications?limit=50');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const count = json.data.filter(
              (n: { isRead: boolean }) => !n.isRead
            ).length;
            setUnreadCount(count);
          }
        }
      } catch {
        // Silently fail
      }
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => navigate({ page: 'home' })}
          className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
        >
          <Coins className="size-5 text-primary" />
          <span className="hidden sm:inline">SkillSwap</span>
        </button>

        {isAuthenticated && session ? (
          <>
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ page: 'browse' })}
              >
                <Search className="size-4 mr-1.5" />
                Browse
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ page: 'create-listing' })}
              >
                <BookOpen className="size-4 mr-1.5" />
                Create Listing
              </Button>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Credit balance */}
              <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                <Coins className="size-4" />
                {user?.creditBalance ?? 0}
              </div>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate({ page: 'notifications' })}
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="size-7">
                      <AvatarImage src={user?.avatar ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground leading-none">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate({ page: 'profile' })}
                  >
                    <User className="size-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate({ page: 'browse', params: { mine: 'true' } })
                    }
                  >
                    <BookOpen className="size-4" />
                    My Listings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ page: 'sessions' })}
                  >
                    <CalendarDays className="size-4" />
                    My Sessions
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ page: 'transactions' })}
                  >
                    <Receipt className="size-4" />
                    Transactions
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ page: 'notifications' })}
                  >
                    <Bell className="size-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {unreadCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => signOut()}
                  >
                    <LogOut className="size-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <nav className="flex flex-col gap-2 mt-8">
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate({ page: 'browse' });
                        setMobileOpen(false);
                      }}
                    >
                      <Search className="size-4 mr-2" />
                      Browse Skills
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate({ page: 'create-listing' });
                        setMobileOpen(false);
                      }}
                    >
                      <BookOpen className="size-4 mr-2" />
                      Create Listing
                    </Button>
                    <Separator />
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Coins className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {user?.creditBalance ?? 0} credits
                      </span>
                    </div>
                    <Separator />
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate({ page: 'profile' });
                        setMobileOpen(false);
                      }}
                    >
                      <User className="size-4 mr-2" />
                      My Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate({ page: 'sessions' });
                        setMobileOpen(false);
                      }}
                    >
                      <CalendarDays className="size-4 mr-2" />
                      My Sessions
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate({ page: 'transactions' });
                        setMobileOpen(false);
                      }}
                    >
                      <Receipt className="size-4 mr-2" />
                      Transactions
                    </Button>
                    <Separator />
                    <Button
                      variant="ghost"
                      className="justify-start text-destructive"
                      onClick={() => signOut()}
                    >
                      <LogOut className="size-4 mr-2" />
                      Sign Out
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </>
        ) : (
          /* Unauthenticated */
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => signIn()}>
              <LogIn className="size-4 mr-1.5" />
              Sign In
            </Button>
            <Button size="sm" onClick={() => signIn()}>
              <UserPlus className="size-4 mr-1.5" />
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
