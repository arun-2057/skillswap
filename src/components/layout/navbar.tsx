'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useAuthStore } from '@/store/auth-store';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SearchBox } from '@/components/search/search-box';
import {
  Bell,
  LogIn,
  UserPlus,
  User,
  BookOpen,
  CalendarDays,
  LogOut,
  ChevronDown,
  Menu,
  MessageSquare,
  Settings,
} from 'lucide-react';
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
import { getInitials } from '@/lib/initials';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signIn, signOut } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const { unreadCount } = useRealtimeNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = getInitials(user?.full_name ?? user?.email ?? null);

  const navItems = [
    { page: 'home' as const, label: 'Home' },
    { page: 'browse' as const, label: 'Browse' },
    { page: 'create-listing' as const, label: 'Create Listing', icon: BookOpen },
    { page: 'messages' as const, label: 'Messages', icon: MessageSquare },
  ];

  function isActive(targetPage: string) {
    const current = pathname?.includes('listing') || pathname?.includes('session')
      ? 'browse'
      : (pathname?.replace('/', '') || 'home');
    return current === targetPage;
  }

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center rounded-full px-2 py-1 transition-all hover:bg-primary/5"
          aria-label="SkillSwap home"
        >
          <img
            src="/logo.svg"
            alt="SkillSwap"
            className="h-7 w-auto"
          />
        </button>

        {isAuthenticated && user ? (
          <>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-4 flex-1 max-w-2xl">
              <SearchBox
                placeholder="Search skills, people, messages..."
                className="w-full"
              />
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.page}
                  variant={isActive(item.page) ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => router.push(`/${item.page}`)}
                  className={isActive(item.page) ? 'font-semibold shadow-sm' : 'rounded-full'}
                >
                  {item.icon && <item.icon className="size-4 mr-1.5" />}
                  {item.label}
                </Button>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
               <Button
                 variant={pathname === '/notifications' ? 'secondary' : 'ghost'}
                 size="icon"
                 className="relative"
                 onClick={() => router.push('/notifications')}
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
                    className="flex items-center gap-2 rounded-full px-2"
                  >
                    <Avatar className="size-7">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.full_name ?? user.email ?? null)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.full_name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground leading-none">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push('/profile/me')}
                  >
                    <User className="size-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      router.push('/browse?mine=true')
                    }
                  >
                    <BookOpen className="size-4" />
                    My Listings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/sessions')}
                  >
                    <CalendarDays className="size-4" />
                    My Sessions
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/messages')}
                  >
                    <MessageSquare className="size-4" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/notifications')}
                  >
                    <Bell className="size-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {unreadCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/')}>
                    <Settings className="size-4" />
                    Settings
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
                      {navItems.map((item) => (
                        <Button
                          key={item.page}
                          variant={isActive(item.page) ? 'secondary' : 'ghost'}
                          className="justify-start"
                          onClick={() => {
                            router.push(`/${item.page}`);
                            setMobileOpen(false);
                          }}
                      >
                        {item.icon && <item.icon className="size-4 mr-2" />}
                        {item.label}
                      </Button>
                    ))}
                    <Separator />
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        router.push('/profile/me');
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
                        router.push('/notifications');
                        setMobileOpen(false);
                      }}
                    >
                      <Bell className="size-4 mr-2" />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        router.push('/');
                        setMobileOpen(false);
                      }}
                    >
                      <Settings className="size-4 mr-2" />
                      Settings
                    </Button>
                    <Separator />
                    <Button
                      variant="ghost"
                      className="justify-start text-destructive"
                      onClick={() => {
                        signOut();
                        setMobileOpen(false);
                      }}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/auth')}
            >
              <LogIn className="size-4 mr-1.5" />
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/auth')}
            >
              <UserPlus className="size-4 mr-1.5" />
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}