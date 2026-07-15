import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

export function VerificationBadge({
  verified,
}: {
  verified: boolean;
}) {
  if (!verified) return null;

  return (
    <Badge
      variant="secondary"
      className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
    >
      <ShieldCheck className="size-3.5" />
      Verified Mentor
    </Badge>
  );
}
