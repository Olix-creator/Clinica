export default function PatientDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Patient header */}
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-gray-200 rounded-xl" />
        <div className="space-y-2">
          <div className="h-8 w-56 bg-gray-200 rounded" />
          <div className="h-4 w-80 bg-gray-100 rounded" />
        </div>
      </div>
      {/* Info cards */}
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 h-28" />
        ))}
      </div>
      {/* Tabs */}
      <div className="h-10 w-96 bg-gray-100 rounded" />
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 h-96" />
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6 h-44" />
          <div className="bg-white rounded-xl border border-gray-100 p-6 h-44" />
        </div>
      </div>
    </div>
  );
}
