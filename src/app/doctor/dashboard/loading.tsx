export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome skeleton */}
      <div className="flex items-center justify-between">
        <div className="border-l-4 border-gray-200 pl-4">
          <div className="h-7 w-64 bg-gray-200 rounded mb-2" />
          <div className="h-5 w-48 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-gray-200 rounded-lg" />
          <div className="h-10 w-40 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 h-32">
            <div className="h-10 w-10 bg-gray-100 rounded-lg mb-4" />
            <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 h-80" />
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 h-80" />
      </div>
    </div>
  );
}
