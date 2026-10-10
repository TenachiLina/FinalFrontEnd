// ─────────────────────────────────────────────────────────────────────────
// Reporting types
//
// ⚠️ ASSUMPTION: the shape of `WorktimeRowRaw` mirrors the OLD MySQL/Express
// contract (emp_id, work_hours, consommation, etc.) because we have not yet
// seen `worktime.service.ts -> findAll()`'s real Mongo output.
//
// Once you confirm the real field names returned by `GET /worktime`, the
// ONLY place that needs to change is `normalizeRow()` in `useReporting.ts`
// — everything downstream (UI, summaries) consumes `WorktimeRow`, not the
// raw shape.
// ─────────────────────────────────────────────────────────────────────────

export type FilterMode = "day" | "week" | "month" | "custom";

export interface Employee {
  emp_id: number | string;
  FirstName: string;
  LastName: string;
  Base_salary: number;
  _visible?: boolean; // local UI-only flag for the search/filter list
}

/**
 * Raw row as (assumed) returned by GET /worktime?start=&end=&empId=
 * This is intentionally permissive (loose field names, optional fields)
 * since we haven't confirmed the real Mongo document shape yet.
 */
export interface WorktimeRowRaw {
  _id?: string;
  worktime_id?: string | number;
  emp_id?: number | string;
  empId?: number | string; // possible Mongo naming variant
  work_date?: string;
  workDate?: string; // possible Mongo naming variant
  work_hours?: string | number; // "HH:MM:SS" | "HH:MM" | decimal
  late_minutes?: string | number;
  overtime_minutes?: string | number;
  penalty?: string | number;
  consommation?: string | number;
  consomation?: string | number; // old DB had this misspelling too
  absent?: boolean | number;
  absent_comment?: string;
  [key: string]: unknown;
}

/**
 * Normalized row used everywhere in the UI/hook after `normalizeRow()`.
 * Field names match the OLD frontend's conventions so the ported
 * calculation logic (salaryForDay, summaries, etc.) needs minimal changes.
 */
export interface WorktimeRow {
  emp_id: number | string;
  work_date: string; // "YYYY-MM-DD"
  work_hours: string | number | null; // raw value, converted via timeToDecimalHours()
  late_minutes: number;
  overtime_minutes: number;
  penalty: number;
  consommation: number;
  absent: number; // 0 | 1
  absent_comment: string;
  is_empty: boolean; // true for client-generated "missing day" placeholder rows
}

export interface DateRange {
  start: string; // "YYYY-MM-DD"
  end: string; // "YYYY-MM-DD"
}

/** Per-period (week/month/day) summary for a SINGLE selected employee. */
export interface PeriodSummary {
  totalHours: string; // toFixed(2)
  brutSalary: string;
  netSalary: string;
  advance: string;
  hourlyRate: string;
  totalLate: number;
  totalConsommation: number;
  totalPenalties: number;
  totalAbsences: number;
}

/** Aggregate summary across ALL employees (the "global view"). */
export interface GlobalSummary {
  totalHours: string;
  brutSalary: string;
  netSalary: string;
  totalLate: string;
  totalConsommation: string;
  totalPenalties: string;
  totalBaseSalary: string;
  totalAdvances: string;
  totalAbsences: number;
  employeeCount: number;
}

/** Per-employee breakdown card shown in the global view. */
export interface EmployeeBreakdown {
  empId: number | string;
  employee: Employee | undefined;
  baseSalary: number;
  hours: number;
  brutSalary: number;
  netSalary: number;
  advance: number;
  consommation: number;
  penalties: number;
  absences: number;
}