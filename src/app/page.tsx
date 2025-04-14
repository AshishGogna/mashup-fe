import Image from "next/image";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Welcome to Mashup</h2>
        <p className="mt-2 text-lg text-gray-600">
          Search and discover video content
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Search functionality coming soon...
        </p>
      </div>
    </div>
  );
}
