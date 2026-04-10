export default function HistoryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-40 bg-gray-200 rounded" />
      <div className="flex gap-4">
        <div className="h-10 w-48 bg-gray-100 rounded-lg" />
        <div className="h-10 w-36 bg-gray-100 rounded-lg" />
        <div className="h-10 w-36 bg-gray-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-50 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
