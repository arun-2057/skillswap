'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Link, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CopyLinkButtonProps {
  /** The URL to copy. Defaults to current page URL. */
  url?: string;
  /** Optional label for the toast message */
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function CopyLinkButton({
  url,
  label = 'Link copied to clipboard',
  variant = 'outline',
  size = 'sm',
  className,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const linkToCopy = url || window.location.href;

    navigator.clipboard.writeText(linkToCopy).then(
      () => {
        setCopied(true);
        toast.success(label, {
          duration: 2000,
        });
        // Reset icon after 2s
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        toast.error('Failed to copy link');
      }
    );
  }, [url, label]);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleCopy}
      aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            className="flex items-center gap-1.5"
            initial={{ scale: 0, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Check className="size-4 text-green-500" />
            <span className="text-xs">Copied</span>
          </motion.span>
        ) : (
          <motion.span
            key="link"
            className="flex items-center gap-1.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <Link className="size-4" />
            <span className="text-xs">Copy Link</span>
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}