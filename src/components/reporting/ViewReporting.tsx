"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import Button from "../ui/button/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../ui/table"; // ⚠️ adjust path if your Table export lives elsewhere
import { useReporting } from "@/hooks/useReporting";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const TABLE_HEADERS = ["Date", "Hours", "Late (min)", "Overtime", "Penalty", "Consommation", "Absent"];

const ViewReporting: React.FC = () => {
  const {
    employees,
    employeeSearch,
    setEmployeeSearch,
    selectedEmployeeId,
    setSelectedEmployeeId,
    isGlobalView,

    filterMode,
    setFilterMode,
    selectedDate,
    setSelectedDate,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    appliedRange,
    fetchReport,

    rows,
    isDayView,
    loading,
    error,

    periodSummary,
    globalSummary,
    employeeBreakdown,
    salaryForDay,
    chartData,

    advanceGiven,
    isLoadingAdvance,
    handleAdvanceChange,
  } = useReporting();

  const isShortRange =
    new Date(appliedRange.end).getTime() - new Date(appliedRange.start).getTime() < 7 * 24 * 60 * 60 * 1000;

  // ── Chart options ──────────────────────────────────────────────────
  const hoursChartOptions: ApexOptions = {
    colors: ["#465fff"],
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", height: 220, toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: "45%", borderRadius: 5, borderRadiusApplication: "end" } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: { categories: chartData.categories, axisBorder: { show: false }, axisTicks: { show: false } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { y: { formatter: (val: number) => `${val} h` } },
  };

  const salaryChartOptions: ApexOptions = {
    legend: { show: false },
    colors: ["#9cb9ff"],
    chart: { fontFamily: "Outfit, sans-serif", type: "line", height: 220, toolbar: { show: false } },
    stroke: { curve: "straight", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.45, opacityTo: 0 } },
    markers: { size: 0, hover: { size: 5 } },
    dataLabels: { enabled: false },
    xaxis: { categories: chartData.categories, axisBorder: { show: false }, axisTicks: { show: false } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    tooltip: { y: { formatter: (val: number) => `${val} DA` } },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Top filter bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Range</label>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as typeof filterMode)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {filterMode === "custom" ? (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Start</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">End</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Start Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            />
          </div>
        )}

        <Button size="md" variant="primary" onClick={fetchReport}>
          Apply
        </Button>

        <div className="ml-auto flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Employee</label>
          <div className="flex items-center gap-2">
            <input
              placeholder="Search employee..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            />
            <select
              value={selectedEmployeeId ?? ""}
              onChange={(e) => setSelectedEmployeeId(e.target.value === "" ? null : e.target.value)}
              className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">All Employees</option>
              {employees
                .filter((e) => e._visible !== false)
                .map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.FirstName} {emp.LastName}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
      {loading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading report…</div>}

      {/* ── GLOBAL VIEW ────────────────────────────────────────────── */}
      {isGlobalView ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white shadow-theme-xs">
            <div className="text-xl font-bold">Global Statistics — All Employees</div>
            <div className="mt-1 text-sm text-white/80">
              {appliedRange.start} → {appliedRange.end}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Total Net Salary" value={`${globalSummary?.netSalary ?? 0} DA`} />
            <SummaryCard label="Total Advances" value={`${globalSummary?.totalAdvances ?? 0} DA`} />
            <SummaryCard label="Total Consommation" value={`${globalSummary?.totalConsommation ?? 0} DA`} />
            <SummaryCard label="Total Penalties" value={`${globalSummary?.totalPenalties ?? 0} DA`} />
            <SummaryCard label="Total Employees" value={`${globalSummary?.employeeCount ?? 0}`} />
            <SummaryCard label="Total Hours Worked" value={`${globalSummary?.totalHours ?? 0} h`} />
            <SummaryCard label="Total Base Salary" value={`${globalSummary?.totalBaseSalary ?? 0} DA`} />
            <SummaryCard label="Total Late Minutes" value={`${globalSummary?.totalLate ?? 0} min`} />
            <SummaryCard label="Total Absences" value={`${globalSummary?.totalAbsences ?? 0}`} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Hours per Employee">
              <ReactApexChart options={hoursChartOptions} series={[{ name: "Hours", data: chartData.hoursSeries }]} type="bar" height={220} />
            </ChartCard>
            <ChartCard title="Brut Salary per Employee">
              <ReactApexChart options={salaryChartOptions} series={[{ name: "Salary", data: chartData.salarySeries }]} type="line" height={220} />
            </ChartCard>
          </div>

          {/* Per-employee breakdown */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">Individual Employee Details</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {employeeBreakdown.map((e) => (
                <div
                  key={e.empId}
                  className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <div className="mb-3 text-base font-semibold text-gray-800 dark:text-white">
                    {e.employee ? `${e.employee.FirstName} ${e.employee.LastName}` : `Employee #${e.empId}`}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <DetailCell label="Base Salary" value={`${e.baseSalary.toFixed(2)} DA`} />
                    <DetailCell label="Hours" value={`${e.hours.toFixed(2)} h`} />
                    <DetailCell label="Brut Salary" value={`${e.brutSalary.toFixed(2)} DA`} />
                    <DetailCell label="Net Salary" value={`${e.netSalary.toFixed(2)} DA`} />
                    <DetailCell label="Advance" value={`${e.advance.toFixed(2)} DA`} />
                    <DetailCell label="Consommation" value={`${e.consommation.toFixed(2)} DA`} />
                    <DetailCell label="Penalties" value={`${e.penalties.toFixed(2)} DA`} />
                    <DetailCell label="Absences" value={`${e.absences}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : isDayView ? (
        /* ── DAY VIEW ──────────────────────────────────────────────── */
        <div className="flex flex-col gap-3">
          {rows.map((r, idx) => {
            const { salary } = salaryForDay(r);
            return (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex flex-wrap gap-6 text-sm text-gray-700 dark:text-gray-300">
                  <div><strong>Worked Hours:</strong> {r.work_hours ?? "—"} h</div>
                  <div><strong>Late Minutes:</strong> {r.late_minutes} min</div>
                  <div><strong>Overtime:</strong> {r.overtime_minutes} min</div>
                  <div><strong>Penalty:</strong> {r.penalty} DA</div>
                  <div><strong>Consommation:</strong> {r.consommation} DA</div>
                  <div><strong>Absent:</strong> {r.absent ? "Yes" : "No"}</div>
                  {r.absent_comment && <div><strong>Comment:</strong> {r.absent_comment}</div>}
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-800 dark:text-white">
                  Salary for Day: {salary} DA
                </div>
              </div>
            );
          })}
          {rows.length === 0 && <div className="text-center text-sm text-gray-400 py-6">No data available</div>}
        </div>
      ) : (
        /* ── WEEK / MONTH VIEW ────────────────────────────────────────── */
        <div className="flex flex-col gap-5">
          {/* Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Brut Salary" value={`${periodSummary.brutSalary} DA`} sub={`${periodSummary.hourlyRate} DA / hour`} />
            <SummaryCard label="Net Salary" value={`${periodSummary.netSalary} DA`} />
            <SummaryCard label="Total Hours" value={`${periodSummary.totalHours} h`} />
            <SummaryCard label="Total Late Minutes" value={`${periodSummary.totalLate} min`} />
            <SummaryCard label="Total Consommation" value={`${periodSummary.totalConsommation} DA`} />
            <SummaryCard label="Total Penalties" value={`${periodSummary.totalPenalties} DA`} />
            <SummaryCard label="Total Absences" value={`${periodSummary.totalAbsences}`} />
            {isShortRange && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="text-xs text-gray-500 dark:text-gray-400">Advance</div>
                <div className="mt-1 text-xl font-bold text-gray-800 dark:text-white">{periodSummary.advance} DA</div>
                <label className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={advanceGiven}
                    disabled={isLoadingAdvance}
                    onChange={(e) => handleAdvanceChange(e.target.checked)}
                  />
                  Advance Given {isLoadingAdvance && "(loading…)"}
                </label>
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Hours per Day">
              <ReactApexChart options={hoursChartOptions} series={[{ name: "Hours", data: chartData.hoursSeries }]} type="bar" height={220} />
            </ChartCard>
            <ChartCard title="Daily Salary Trend">
              <ReactApexChart options={salaryChartOptions} series={[{ name: "Salary", data: chartData.salarySeries }]} type="line" height={220} />
            </ChartCard>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            <Table className="min-w-full">
              <TableHeader className="bg-gray-50 dark:bg-gray-800/60">
                <TableRow>
                  {TABLE_HEADERS.map((h) => (
                    <TableCell
                      key={h}
                      isHeader
                      className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map((r, idx) => {
                    const dateObj = new Date(`${r.work_date}T00:00:00`);
                    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                    return (
                      <TableRow
                        key={idx}
                        className={r.is_empty ? "bg-gray-50/60 dark:bg-white/[0.01]" : ""}
                      >
                        <TableCell className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {weekday}, {r.work_date}
                        </TableCell>
                        <TableCell className="p-3 text-center text-sm text-gray-600 dark:text-gray-400">
                          {r.work_hours ? `${r.work_hours}h` : "—"}
                        </TableCell>
                        <TableCell className="p-3 text-center text-sm text-gray-600 dark:text-gray-400">
                          {r.late_minutes}
                        </TableCell>
                        <TableCell className="p-3 text-center text-sm text-gray-600 dark:text-gray-400">
                          {r.overtime_minutes}
                        </TableCell>
                        <TableCell className="p-3 text-center text-sm text-gray-600 dark:text-gray-400">
                          {r.penalty}
                        </TableCell>
                        <TableCell className="p-3 text-center text-sm text-gray-600 dark:text-gray-400">
                          {r.consommation}
                        </TableCell>
                        <TableCell
                          className={`p-3 text-center text-sm font-medium ${
                            r.absent ? "text-red-500" : "text-gray-400"
                          }`}
                        >
                          {r.absent ? "Yes" : ""}
                          {r.absent && r.absent_comment && (
                            <div className="mt-0.5 text-xs italic text-gray-400">{r.absent_comment}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell className="p-6 text-center text-sm text-gray-400">No data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Small presentational helpers ────────────────────────────────────────

const SummaryCard: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    <div className="mt-1 text-xl font-bold text-gray-800 dark:text-white">{value}</div>
    {sub && <div className="mt-0.5 text-xs text-gray-400">{sub}</div>}
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</div>
    {children}
  </div>
);

const DetailCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-900/40">
    <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    <div className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-white">{value}</div>
  </div>
);

export default ViewReporting;