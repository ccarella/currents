export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900">Loading...</h2>
        <p className="mt-1 text-sm text-gray-500">
          Checking authentication status
        </p>
      </div>
    </div>
  );
}
