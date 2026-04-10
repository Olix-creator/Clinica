export default function QueueLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-72 bg-gray-200 rounded mb-2" />
          <div className="h-5 w-96 bg-gray-100 rounded" />
        </div>
        <div className="h-12 w-48 bg-gray-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-200 rounded-2xl h-72" />
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-20" />
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 h-20" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 h-64" />
    </div>
  );
}
