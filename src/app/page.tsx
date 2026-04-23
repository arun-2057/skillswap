'use client';

import { useEffect } from 'react';
import { useRouterStore } from '@/store/router-store';
import { useAuthStore } from '@/store/auth-store';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthPage } from '@/pages/auth-page';
import { OnboardingPage } from '@/pages/onboarding-page';
import { HomePage } from '@/pages/home-page';
import { BrowsePage } from '@/pages/browse-page';
import { ListingDetailPage } from '@/pages/listing-detail-page';
import { CreateListingPage } from '@/pages/create-listing-page';
import { ProfilePage } from '@/pages/profile-page';
import { SessionsPage } from '@/pages/sessions-page';
import { SessionDetailPage } from '@/pages/session-detail-page';
import { TransactionsPage } from '@/pages/transactions-page';
import { NotificationsPage } from '@/pages/notifications-page';

export default function AppEntry() {
  const { route } = useRouterStore();
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    async function checkSession() {
      setLoading(true);
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setUser(json.data);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [setUser, setLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding redirect
  if (isAuthenticated && user && !user.isOnboarded && route.page !== 'onboarding') {
    const { navigate } = useRouterStore.getState();
    navigate({ page: 'onboarding' });
  }

  // Not authenticated - show auth page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <AuthPage />
        </main>
        <Footer />
      </div>
    );
  }

  // Onboarding
  if (route.page === 'onboarding') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <OnboardingPage />
        </main>
        <Footer />
      </div>
    );
  }

  // Main app pages
  function renderPage() {
    switch (route.page) {
      case 'home':
        return <HomePage />;
      case 'browse':
        return <BrowsePage />;
      case 'listing':
        return <ListingDetailPage />;
      case 'create-listing':
        return <CreateListingPage />;
      case 'profile':
      case 'edit-profile':
        return <ProfilePage />;
      case 'sessions':
        return <SessionsPage />;
      case 'session':
        return <SessionDetailPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'notifications':
        return <NotificationsPage />;
      default:
        return <HomePage />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}
