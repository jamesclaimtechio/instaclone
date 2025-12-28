import { getUserFromHeaders } from '@/lib/auth';

export default async function TestProtectedPage() {
  const user = await getUserFromHeaders();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Test Protected Route</h1>
      
      {user ? (
        <div className="space-y-2">
          <p className="text-green-600 font-semibold">✅ Authentication Successful</p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p><strong>User ID:</strong> {user.userId}</p>
            <p><strong>Is Admin:</strong> {user.isAdmin ? 'Yes' : 'No'}</p>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            This page should only be accessible when logged in.
            If you see this without logging in, middleware is not working.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-red-600 font-semibold">❌ Not Authenticated</p>
          <p className="text-sm text-gray-600 mt-2">
            You should have been redirected to /login
          </p>
        </div>
      )}
    </div>
  );
}

