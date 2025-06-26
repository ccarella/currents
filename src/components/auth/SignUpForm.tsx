'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { debounce } from '@/lib/utils/debounce';

// Validation schema
const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be no more than 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
  });

  const username = watch('username');

  // Debounced username availability check
  const checkUsernameAvailability = useMemo(
    () =>
      debounce(async (username: string) => {
        if (!username || username.length < 3) {
          setUsernameAvailable(null);
          return;
        }

        setIsCheckingUsername(true);
        clearErrors('username');

        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();

          if (error) {
            console.error('Username check error:', error);
            setUsernameAvailable(null);
            return;
          }

          const isAvailable = !data;
          setUsernameAvailable(isAvailable);

          if (!isAvailable) {
            setError('username', {
              type: 'manual',
              message: 'Username is already taken',
            });
          }
        } catch (error) {
          console.error('Username check error:', error);
          setUsernameAvailable(null);
        } finally {
          setIsCheckingUsername(false);
        }
      }, 500),
    [setError, clearErrors]
  );

  // Check username availability when it changes
  useEffect(() => {
    if (username && !errors.username) {
      checkUsernameAvailability(username);
    } else {
      setUsernameAvailable(null);
    }
  }, [username, errors.username, checkUsernameAvailability]);

  const onSubmit = async (data: SignUpFormData) => {
    if (!usernameAvailable) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const supabase = createClient();

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          },
        },
      });

      if (authError) {
        setServerError(authError.message);
        return;
      }

      if (authData.user) {
        // Profile is created automatically by database trigger
        // Redirect to home page after successful signup
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Signup error:', error);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="you@example.com"
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Username
        </label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            {...register('username')}
            placeholder="johndoe"
            disabled={isSubmitting}
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'username-error' : undefined}
          />
          {isCheckingUsername && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div
                role="status"
                aria-label="Checking username availability"
                className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
              />
            </div>
          )}
          {!isCheckingUsername && usernameAvailable === true && username && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          )}
          {!isCheckingUsername && usernameAvailable === false && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-5 w-5 text-red-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          )}
        </div>
        {errors.username && (
          <p id="username-error" className="mt-1 text-sm text-red-600">
            {errors.username.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder="••••••••"
          disabled={isSubmitting}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Must be at least 8 characters with uppercase, lowercase, and numbers
        </p>
      </div>

      {serverError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{serverError}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || isCheckingUsername || !usernameAvailable}
        className="w-full"
      >
        {isSubmitting ? 'Creating account...' : 'Sign up'}
      </Button>
    </form>
  );
}
