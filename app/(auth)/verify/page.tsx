import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import OTPInput from '@/components/auth/otp-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Verify Email | Instagram Clone',
  description: 'Enter your verification code',
};

export default async function VerifyPage() {
  // Check if user is authenticated
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/login');
  }

  // Get full user record to check verification status
  const user = await db.query.users.findFirst({
    where: eq(users.id, currentUser.userId),
  });

  if (!user) {
    redirect('/login');
  }

  // If already verified, redirect to feed
  if (user.emailVerified) {
    redirect('/');
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Verify Your Email
        </CardTitle>
        <CardDescription className="text-center">
          We sent a 6-digit code to <strong>{user.email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OTPInput />
      </CardContent>
    </Card>
  );
}

