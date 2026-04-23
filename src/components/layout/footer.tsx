'use client';

import { useRouterStore } from '@/store/router-store';
import { Coins } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const { navigate } = useRouterStore();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <button
              onClick={() => navigate({ page: 'home' })}
              className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
            >
              <Coins className="size-4" />
              SkillSwap
            </button>
            <p className="text-sm text-muted-foreground">
              Trade skills, not money.
            </p>
          </div>

          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <button
              onClick={() => navigate({ page: 'browse' })}
              className="hover:text-foreground transition-colors"
            >
              Browse Skills
            </button>
            <Separator orientation="vertical" className="h-4" />
            <button
              onClick={() => navigate({ page: 'home' })}
              className="hover:text-foreground transition-colors"
            >
              About
            </button>
          </nav>
        </div>

        <Separator className="my-4" />

        <p className="text-center text-xs text-muted-foreground">
          &copy; {currentYear} SkillSwap. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
