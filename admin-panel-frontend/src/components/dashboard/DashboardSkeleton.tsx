export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex animate-pulse items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800" />
        <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800" />
        <div className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800" />
      </div>
    </div>
  );
}
