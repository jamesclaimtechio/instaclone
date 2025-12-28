import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerificationBanner() {
  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-900">
              <strong>Verify your email</strong> to unlock all features. Check your inbox for the verification code.
            </p>
          </div>
          <Link href="/verify">
            <Button size="sm" variant="default">
              Verify Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

