import { Users } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface SocialProofProps {
  registrationCount: number;
}

/**
 * Social Proof
 * Display registration count to create urgency/trust
 */
export function SocialProof({ registrationCount }: SocialProofProps) {
  if (registrationCount === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
      <Users className="h-4 w-4" />
      <span>
        <strong className="text-gray-900">{formatNumber(registrationCount)}</strong>
        {' '}
        {registrationCount === 1 ? 'person has' : 'people have'} already signed up
      </span>
    </div>
  );
}
