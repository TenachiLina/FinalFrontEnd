import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Employee,
  WorktimeRow,
  WorktimeRowRaw,
  DateRange,
  FilterMode,
  PeriodSummary,
  GlobalSummary,
  EmployeeBreakdown,
} from "@/components/reporting/types";

// ⚠️ Adjust to match your real API base / env var if different.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

// ─────────────────────────────────────────────────────────────────────────
// Helpers (ported from old ReportingContent.jsx)
// ─────────────────────────────────────────────────────────────────────────

/** Convert "HH:MM:SS" | "HH:MM" | decimal string | number -> decimal hours. */
function timeToDecimalHours(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;

  const str = String(value).trim();
  if (str === "" || str === "00:00" || str === "00:00:00") return 0;

  if (!str.includes(":")) {
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  const parts = str.split(":");
  if (parts.length === 3) {
    const [h, m, s] = parts.map((p) => parseInt(p, 10));
    if (isNaN(h) || isNaN(m) || isNaN(s)) return 0;
    return h + m / 60 + s / 3600;
  }
  if (parts.length === 2) {
    const [h, m] = parts.map((p) => parseInt(p, 10));
    if (isNaN(h) || isNaN(m)) return 0;
    return h + m / 60;
  }
  return 0;
}

/** Normalize a raw API row into the clean WorktimeRow shape.
 *  ⚠️ THIS is the single place to edit once the real Mongo field names
 *  are confirmed — everything else consumes WorktimeRow only.
 */
function normalizeRow(raw: WorktimeRowRaw): WorktimeRow {
  const empId = raw.emp_id ?? raw.empId ?? "";
  const workDateRaw = raw.work_date ?? raw.workDate ?? "";
  const workDate = workDateRaw ? String(workDateRaw).split("T")[0] : "";
  const consommation = raw.consommation ?? raw.consomation ?? 0;

  return {
    emp_id: empId as number | string,
    work_date: workDate,
    work_hours: (raw.work_hours as string | number | null) ?? null,
    late_minutes: Number(raw.late_minutes || 0),
    overtime_minutes: Number(raw.overtime_minutes || 0),
    penalty: Number(raw.penalty || 0),
    consommation: Number(consommation || 0),
    absent: raw.absent ? 1 : 0,
    absent_comment: raw.absent_comment || "",
    is_empty: false,
  };
}

/** Generate every "YYYY-MM-DD" date string between start and end (inclusive). */
function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Fill missing days in the range with empty placeholder rows (single-employee view only). */
function fillMissingDates(rows: WorktimeRow[], range: DateRange): WorktimeRow[] {
  if (!range.start || !range.end) return [];
  const allDates = generateDateRange(range.start, range.end);

  return allDates.map((d) => {
    const existing = rows.find((r) => r.work_date === d);
    if (existing) return existing;
    return {
      emp_id: "",
      work_date: d,
      work_hours: null,
      late_minutes: 0,
      overtime_minutes: 0,
      penalty: 0,
      consommation: 0,
      absent: 0,
      absent_comment: "",
      is_empty: true,
    };
  });
}

/** Returns the last Thursday -> following Wednesday range (old default week). */
function getLastWeekRange(): DateRange {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday ... 4 = Thursday
  const daysToLastThursday = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;

  const lastThursday = new Date(today);
  lastThursday.setDate(today.getDate() - daysToLastThursday);

  const endOfWeek = new Date(lastThursday);
  endOfWeek.setDate(lastThursday.getDate() + 6);

  return {
    start: lastThursday.toISOString().split("T")[0],
    end: endOfWeek.toISOString().split("T")[0],
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────

export function useReporting() {
  const lastWeek = getLastWeekRange();

  // ── Employees ────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | string | null>(null);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch(`${API_BASE_URL}/employees`);
        if (!res.ok) throw new Error("Failed to fetch employees");
        const data = await res.json();
        setEmployees((data as Employee[]).map((e) => ({ ...e, _visible: true })));
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    }
    fetchEmployees();
  }, []);

  const visibleEmployees = useMemo(() => {
    const q = employeeSearch.toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) => {
      const fullName = `${emp.FirstName || ""} ${emp.LastName || ""}`.toLowerCase();
      return fullName.includes(q);
    });
  }, [employees, employeeSearch]);

  // ── Date range / filter mode ─────────────────────────────────────────
  const [filterMode, setFilterMode] = useState<FilterMode>("week");
  const [selectedDate, setSelectedDate] = useState(lastWeek.start);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const computeRange = useCallback((): DateRange => {
    const ref = new Date(selectedDate);

    if (filterMode === "day") return { start: selectedDate, end: selectedDate };

    if (filterMode === "week") {
      const start = new Date(ref);
      const end = new Date(ref);
      end.setDate(start.getDate() + 6);
      return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
    }

    if (filterMode === "month") {
      const start = new Date(ref);
      const end = new Date(ref);
      end.setDate(start.getDate() + 29);
      return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
    }

    return { start: customStart, end: customEnd };
  }, [filterMode, selectedDate, customStart, customEnd]);

  const [appliedRange, setAppliedRange] = useState<DateRange>(lastWeek);

  // ── Worktime fetch ───────────────────────────────────────────────────
  const [rawRows, setRawRows] = useState<WorktimeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isGlobalView = selectedEmployeeId === null;

  const fetchReport = useCallback(async () => {
    const range = computeRange();
    if (!range.start || !range.end) {
      setError("Please provide a valid date range.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ start: range.start, end: range.end });
      if (selectedEmployeeId !== null) {
        params.set("empId", String(selectedEmployeeId));
      }

      const res = await fetch(`${API_BASE_URL}/worktime?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report.");

      const data = await res.json();
      // ⚠️ ASSUMPTION: findAll() returns an array of raw rows directly.
      // If it returns { rows: [...] } or a paginated shape, adjust this line.
      const list: WorktimeRowRaw[] = Array.isArray(data) ? data : data.rows || [];

      setRawRows(list.map(normalizeRow));
      setAppliedRange(range);
    } catch (err) {
      console.error(err);
      setError("Failed to load report.");
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  }, [computeRange, selectedEmployeeId]);

  // Auto-fetch on mount (mirrors old behavior)
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Rows shown in the table (gap-filled for single-employee view) ────
  const displayedRows = useMemo(() => {
    if (isGlobalView) return rawRows;
    return fillMissingDates(rawRows, appliedRange);
  }, [rawRows, appliedRange, isGlobalView]);

  const isDayView = appliedRange.start === appliedRange.end;

  // ── Salary helpers ────────────────────────────────────────────────────
  const hourlyRateFor = useCallback(
    (empId: number | string | null) => {
      if (empId === null) return 0;
      const employee = employees.find((e) => String(e.emp_id) === String(empId));
      const baseSalary = Number(employee?.Base_salary || 0);
      return baseSalary / 8 / 26;
    },
    [employees]
  );

  const salaryForDay = useCallback(
    (row: WorktimeRow) => {
      const employee = employees.find((e) => String(e.emp_id) === String(row.emp_id));
      const baseSalary = Number(employee?.Base_salary || 0);
      const workHours = timeToDecimalHours(row.work_hours);
      if (!baseSalary || workHours === 0) return { salary: "0.00", baseSalary };
      const hourlyRate = baseSalary / 8 / 26;
      return { salary: (workHours * hourlyRate).toFixed(2), baseSalary };
    },
    [employees]
  );

  // ── Period summary (single employee, week/month) ─────────────────────
  const periodSummary: PeriodSummary = useMemo(() => {
    const empty: PeriodSummary = {
      totalHours: "0.00",
      brutSalary: "0.00",
      netSalary: "0.00",
      advance: "0.00",
      hourlyRate: "0.00",
      totalLate: 0,
      totalConsommation: 0,
      totalPenalties: 0,
      totalAbsences: 0,
    };
    if (isGlobalView || !displayedRows.length) return empty;

    const hourlyRate = hourlyRateFor(selectedEmployeeId);
    const totalHours = displayedRows.reduce((sum, r) => sum + timeToDecimalHours(r.work_hours), 0);
    const totalConsommation = displayedRows.reduce((sum, r) => sum + (r.consommation || 0), 0);
    const totalLate = displayedRows.reduce((sum, r) => sum + (r.late_minutes || 0), 0);
    const totalPenalties = displayedRows.reduce((sum, r) => sum + (r.penalty || 0), 0);
    const totalAbsences = displayedRows.reduce((sum, r) => sum + (r.absent ? 1 : 0), 0);

    const brutSalary = totalHours * hourlyRate;
    const netSalary = brutSalary - totalConsommation - totalPenalties;
    const advance = netSalary / 2;

    return {
      totalHours: totalHours.toFixed(2),
      brutSalary: brutSalary.toFixed(2),
      netSalary: netSalary.toFixed(2),
      advance: advance.toFixed(2),
      hourlyRate: hourlyRate.toFixed(2),
      totalLate,
      totalConsommation,
      totalPenalties,
      totalAbsences,
    };
  }, [displayedRows, isGlobalView, hourlyRateFor, selectedEmployeeId]);

  // ── Global summary (all employees) ────────────────────────────────────
  const globalSummary: GlobalSummary | null = useMemo(() => {
    if (!isGlobalView || !displayedRows.length) return null;

    const groups: Record<string, WorktimeRow[]> = {};
    displayedRows.forEach((row) => {
      const key = String(row.emp_id);
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    let totalHours = 0;
    let totalBrutSalary = 0;
    let totalConsommation = 0;
    let totalLate = 0;
    let totalPenalties = 0;
    let totalBaseSalary = 0;
    let totalAdvances = 0;
    let totalAbsences = 0;

    Object.keys(groups).forEach((empId) => {
      const empRows = groups[empId];
      const employee = employees.find((e) => String(e.emp_id) === empId);
      const baseSalary = Number(employee?.Base_salary || 0);
      const hourlyRate = baseSalary / 8 / 26;

      const empHours = empRows.reduce((sum, r) => sum + timeToDecimalHours(r.work_hours), 0);
      const empConsommation = empRows.reduce((sum, r) => sum + (r.consommation || 0), 0);
      const empLate = empRows.reduce((sum, r) => sum + (r.late_minutes || 0), 0);
      const empPenalties = empRows.reduce((sum, r) => sum + (r.penalty || 0), 0);
      const empAbsences = empRows.reduce((sum, r) => sum + (r.absent ? 1 : 0), 0);
      const empBrutSalary = empHours * hourlyRate;
      const empNetSalary = empBrutSalary - empConsommation - empPenalties;
      const empAdvance = empNetSalary / 2;

      totalHours += empHours;
      totalBrutSalary += empBrutSalary;
      totalConsommation += empConsommation;
      totalLate += empLate;
      totalPenalties += empPenalties;
      totalBaseSalary += baseSalary;
      totalAdvances += empAdvance;
      totalAbsences += empAbsences;
    });

    const netSalary = totalBrutSalary - totalConsommation - totalPenalties;

    return {
      totalHours: totalHours.toFixed(2),
      brutSalary: totalBrutSalary.toFixed(2),
      netSalary: netSalary.toFixed(2),
      totalLate: totalLate.toFixed(0),
      totalConsommation: totalConsommation.toFixed(2),
      totalPenalties: totalPenalties.toFixed(2),
      totalBaseSalary: totalBaseSalary.toFixed(2),
      totalAdvances: totalAdvances.toFixed(2),
      totalAbsences,
      employeeCount: Object.keys(groups).length,
    };
  }, [displayedRows, employees, isGlobalView]);

  // ── Per-employee breakdown (global view detail cards) ────────────────
  const employeeBreakdown: EmployeeBreakdown[] = useMemo(() => {
    if (!isGlobalView || !displayedRows.length) return [];

    const groups: Record<string, WorktimeRow[]> = {};
    displayedRows.forEach((row) => {
      const key = String(row.emp_id);
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    return Object.keys(groups).map((empId) => {
      const empRows = groups[empId];
      const employee = employees.find((e) => String(e.emp_id) === empId);
      const baseSalary = Number(employee?.Base_salary || 0);
      const hourlyRate = baseSalary / 8 / 26;

      const hours = empRows.reduce((sum, r) => sum + timeToDecimalHours(r.work_hours), 0);
      const consommation = empRows.reduce((sum, r) => sum + (r.consommation || 0), 0);
      const penalties = empRows.reduce((sum, r) => sum + (r.penalty || 0), 0);
      const absences = empRows.reduce((sum, r) => sum + (r.absent ? 1 : 0), 0);
      const brutSalary = hours * hourlyRate;
      const netSalary = brutSalary - consommation - penalties;
      const advance = netSalary / 2;

      return {
        empId,
        employee,
        baseSalary,
        hours,
        brutSalary,
        netSalary,
        advance,
        consommation,
        penalties,
        absences,
      };
    });
  }, [displayedRows, employees, isGlobalView]);

  // ── Chart series (hours + net salary per day, single-employee views) ─
  const chartData = useMemo(() => {
    if (isGlobalView) {
      // One bar per employee: brut salary
      return {
        categories: employeeBreakdown.map(
          (e) => `${e.employee?.FirstName || ""} ${e.employee?.LastName || ""}`.trim() || `#${e.empId}`
        ),
        hoursSeries: employeeBreakdown.map((e) => Number(e.hours.toFixed(2))),
        salarySeries: employeeBreakdown.map((e) => Number(e.brutSalary.toFixed(2))),
      };
    }
    // One point per day in range
    return {
      categories: displayedRows.map((r) => r.work_date),
      hoursSeries: displayedRows.map((r) => Number(timeToDecimalHours(r.work_hours).toFixed(2))),
      salarySeries: displayedRows.map((r) => Number(salaryForDay(r).salary)),
    };
  }, [isGlobalView, employeeBreakdown, displayedRows, salaryForDay]);

  // ── Advance given (DB-backed checkbox, single-employee only) ─────────
  const [advanceGiven, setAdvanceGiven] = useState(false);
  const [isLoadingAdvance, setIsLoadingAdvance] = useState(false);

  useEffect(() => {
    async function fetchAdvance() {
      if (isGlobalView || !selectedEmployeeId || !appliedRange.start || !appliedRange.end) {
        setAdvanceGiven(false);
        return;
      }
      setIsLoadingAdvance(true);
      try {
        const url = `${API_BASE_URL}/advances/${selectedEmployeeId}?start=${appliedRange.start}&end=${appliedRange.end}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const hasAdvance = Boolean(data && (data.exists || (Array.isArray(data) && data.length > 0)));
          setAdvanceGiven(hasAdvance);
        } else {
          setAdvanceGiven(false);
        }
      } catch (err) {
        console.error("Error fetching advance:", err);
        setAdvanceGiven(false);
      } finally {
        setIsLoadingAdvance(false);
      }
    }
    fetchAdvance();
  }, [isGlobalView, selectedEmployeeId, appliedRange.start, appliedRange.end]);

  const handleAdvanceChange = useCallback(
    async (checked: boolean) => {
      if (!selectedEmployeeId || !appliedRange.start || !appliedRange.end) return;

      setAdvanceGiven(checked);
      try {
        if (checked) {
          const res = await fetch(`${API_BASE_URL}/advances`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emp_id: selectedEmployeeId,
              amount: parseFloat(periodSummary.advance),
              date: appliedRange.start,
              reason: `Weekly advance (${appliedRange.start} to ${appliedRange.end})`,
            }),
          });
          if (!res.ok) throw new Error("Failed to create advance");
        } else {
          const res = await fetch(`${API_BASE_URL}/advances/${selectedEmployeeId}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to delete advance");
        }
      } catch (err) {
        console.error("Error updating advance:", err);
        setAdvanceGiven(!checked);
      }
    },
    [selectedEmployeeId, appliedRange, periodSummary.advance]
  );

  return {
    // employees
    employees: visibleEmployees,
    employeeSearch,
    setEmployeeSearch,
    selectedEmployeeId,
    setSelectedEmployeeId,
    isGlobalView,

    // date / filters
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

    // rows / view mode
    rows: displayedRows,
    isDayView,
    loading,
    error,

    // summaries
    periodSummary,
    globalSummary,
    employeeBreakdown,
    salaryForDay,
    chartData,

    // advance
    advanceGiven,
    isLoadingAdvance,
    handleAdvanceChange,
  };
}