'use client';

import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <button
              onClick={() => router.push('/')}
              className="flex items-center rounded-full px-2 py-1 transition-opacity hover:opacity-80"
              aria-label="SkillSwap home"
            >
              <img src="/logo.svg" alt="SkillSwap" className="h-6 w-auto" />
            </button>
            <p className="text-sm text-muted-foreground">
              Trade skills, not money.
            </p>
          </div>

          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <button
              onClick={() => router.push('/browse')}
              className="hover:text-foreground transition-colors"
            >
              Browse Skills
            </button>
            <Separator orientation="vertical" className="h-4" />
            <button
              onClick={() => router.push('/')}
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
