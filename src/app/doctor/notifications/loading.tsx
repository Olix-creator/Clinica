export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-gray-200 rounded-lg" />
          <div className="h-4 w-56 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
          <div className="h-10 w-48 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-64 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Compose */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-6 w-32 bg-gray-200 rounded-lg mb-4" />
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded-lg" />
          <div className="h-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
