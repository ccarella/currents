import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" label="Loading authentication page..." />
    </div>
  );
}
