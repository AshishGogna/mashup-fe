export default function AgeRestricted() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-1/2 mx-4 text-center">
        <h1 className="text-2xl  text-red-600 mb-4">access denied</h1>
        <p className="text-gray-700 mb-6">
          you must be 18 years of age or older to access this content.
        </p>
        <p className="text-gray-500 text-sm">
          this content is restricted to adults only.
        </p>
      </div>
    </div>
  );
} 