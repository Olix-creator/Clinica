export default function AppointmentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-gray-200 rounded" />
        <div className="h-10 w-44 bg-gray-200 rounded-lg" />
      </div>
      <div className="flex gap-4">
        <div className="h-10 w-40 bg-gray-100 rounded-lg" />
        <div className="h-10 w-32 bg-gray-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 bg-gray-50 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
