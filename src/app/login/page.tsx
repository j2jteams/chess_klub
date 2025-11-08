'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserRole } from '@/lib/models';

function LoginContent() {
  const {
    user,
    loading,
    loginWithEmail,
    signUpWithEmail,
    error: authError,
  } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();

  // Simple two-view flow like Gumloop
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justSignedUp, setJustSignedUp] = useState(false);

  // Email sign-in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Email sign-up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');


  // Redirect authenticated users: to redirect param if present, otherwise dashboard (if admin/owner) or home
  useEffect(() => {
    if (!loading && user) {
      // Check if user has admin or owner role
      if (user.role === UserRole.ADMIN || user.role === UserRole.OWNER) {
        const redirectTo = searchParams.get('redirect');
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.replace('/dashboard');
        }
      } else {
        // User has no role (pending approval) - show message
        // Don't redirect, let them see the pending message
      }
    }
  }, [user, loading, router, searchParams]);

  // Email verification removed - not required for admin sign-ups

  useEffect(() => {
    if (authError) setErrorMsg(authError);
  }, [authError]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await loginWithEmail(email, password);
      // onAuthStateChanged will redirect
    } catch (err: any) {
      setErrorMsg('Sign in failed. Check your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await signUpWithEmail(firstName.trim(), lastName.trim(), signUpEmail.trim(), signUpPassword);
      // Account created - owner will review and approve
      setJustSignedUp(true);
      setMode('signin');
      setEmail(signUpEmail);
      setPassword('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Sign up failed. Please check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[90vh] items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Show pending approval message if user has no role
  const showPendingMessage = user && !user.role;

  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8 bg-background border rounded-xl shadow-sm">
        {/* Important notice for admin/owner only */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Admin/Owner Access Only</h2>
          <p className="text-sm text-blue-800 mb-2">
            This login is for <strong>Admins and Owners only</strong>. Regular users can browse and register for events without signing in.
          </p>
          <p className="text-xs text-blue-700">
            Not an admin? You can browse and register for events without signing in.
          </p>
        </div>

        {showPendingMessage && (
          <div className="text-sm p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
            <p className="font-semibold mb-1">Account Pending Approval</p>
            <p>Your account has been created. The owner will review your request and grant admin access. You'll be able to sign in once approved.</p>
          </div>
        )}

        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold">
            {mode === 'signin' ? 'Admin/Owner Sign In' : 'Sign Up to Become an Admin'}
          </h1>
          {mode === 'signin' ? (
            <p className="text-sm text-muted-foreground">Sign in with your email and password.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Sign up to request admin access. The owner will review and approve your request.</p>
          )}
        </div>

        {justSignedUp && mode === 'signin' && (
          <div className="text-sm p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
            Account created successfully! The owner will review your request and grant admin access. You can sign in now, but you'll need to wait for approval to access the dashboard.
          </div>
        )}

        {errorMsg && (
          <div className="text-sm p-3 rounded-md bg-red-50 border border-red-200 text-red-700">
            {errorMsg}
          </div>
        )}

        {mode === 'signin' ? (
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Want to become an admin?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(null); }}
                className="text-primary underline underline-offset-2"
              >
                Sign up to become an Admin
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleEmailSignUp} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <Input
              placeholder="Email"
              type="email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              required
            />
            <Input
              placeholder="Password"
              type="password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Sign Up to Become an Admin'}
            </Button>

            <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-md">
              <p className="mb-1">After signing up:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Verify your email address</li>
                <li>The owner will review your request</li>
                <li>You'll receive access once approved</li>
              </ol>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Have an account already?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(null); }}
                className="text-primary underline underline-offset-2"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <Header
        onSearch={(searchTerm, location) => {
          const params = new URLSearchParams();
          if (searchTerm?.trim()) params.set('search', searchTerm.trim());
          if (location?.trim()) params.set('location', location.trim());
          router.push(`/events${params.toString() ? `?${params.toString()}` : ''}`);
        }}
        onCategorySelect={(categoryId) => {
          if (!categoryId) return;
          const params = new URLSearchParams({ category: categoryId });
          router.push(`/events?${params.toString()}`);
        }}
      />
      <Suspense
        fallback={
          <div className="flex min-h-[90vh] flex-col items-center justify-center">
            <p>Loading...</p>
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
  