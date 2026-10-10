import ViewReporting from "@/components/reporting/ViewReporting";

export default function ReportingPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Reporting</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Worktime, salary, and attendance overview.
        </p>
      </div>
      <ViewReporting />
    </div>
  );
}