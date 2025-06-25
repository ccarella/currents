export default function WritePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Write</h1>
      <p className="text-gray-600">
        This is a protected page. You can only access this if you are
        authenticated.
      </p>
    </div>
  );
}
