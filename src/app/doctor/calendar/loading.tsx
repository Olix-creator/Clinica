export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-gray-200 rounded-lg" />
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
          <div className="h-10 w-40 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 bg-gray-200 rounded-lg" />
          <div className="h-6 w-40 bg-gray-200 rounded-lg" />
          <div className="h-10 w-10 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded" />
            ))}
          </div>
          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="h-6 w-32 bg-gray-200 rounded-lg mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
