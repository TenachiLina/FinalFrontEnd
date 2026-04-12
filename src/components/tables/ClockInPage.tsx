"use client";
import React, { useState, useEffect, useMemo } from "react";
import Badge from "../ui/badge/Badge";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShiftStatus = "present" | "absent" | "pending";

interface Shift {
  shift_id: number;
  start_time: string;
  end_time: string;
}

interface Employee {
  num: number;
  empNumber: string;
  FirstName: string;
  shift?: number;
  clockIn?: string;
  clockOut?: string;
  absent?: boolean;
  absentComment?: string;
}

interface EmployeeTimeEntry {
  clockIn: string;
  clockOut: string;
  absent: boolean;
  absentComment: string;
  consomation: number | string;
  penalty: number | string;
  workTimeId: number | null;
  _lastUpdate?: number;
}

interface ManualInputState {
  employee: number | null;
  type: "clockIn" | "clockOut" | null;
  value: string;
}

// ─── Mock data (replace with your real props/API calls) ───────────────────────

const MOCK_SHIFTS: Shift[] = [
  { shift_id: 1, start_time: "08:00:00", end_time: "16:00:00" },
  { shift_id: 2, start_time: "16:00:00", end_time: "00:00:00" },
];

const MOCK_EMPLOYEES: Employee[] = [
  { num: 101, empNumber: "EMP-101", FirstName: "Lindsey Curtis", shift: 1 },
  { num: 102, empNumber: "EMP-102", FirstName: "Kaiya George", shift: 1 },
  { num: 103, empNumber: "EMP-103", FirstName: "Zain Geidt", shift: 2 },
  { num: 104, empNumber: "EMP-104", FirstName: "Abram Schleifer", shift: 2 },
  { num: 105, empNumber: "EMP-105", FirstName: "Carla George", shift: 1 },
];

const MOCK_SELECTED_SHIFTS: Record<number, number[]> = {
  101: [1],
  102: [1],
  103: [2],
  104: [2],
  105: [1],
};

// ─── Small Icons ──────────────────────────────────────────────────────────────

const ClockInIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const formatMinutes = (total: number) => {
  if (total <= 0) return "00:00";
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
};

const calcHours = (clockIn: string, clockOut: string) => {
  if (clockIn === "00:00" || clockOut === "00:00") return "00:00";
  let diff = toMinutes(clockOut) - toMinutes(clockIn);
  if (diff < 0) diff += 24 * 60;
  return formatMinutes(diff);
};

const calcLate = (clockIn: string, shiftStart: string) => {
  if (clockIn === "00:00" || !shiftStart) return 0;
  const late = toMinutes(clockIn) - toMinutes(shiftStart.slice(0, 5));
  return late > 0 ? late : 0;
};

const calcOvertime = (clockOut: string, shiftEnd: string) => {
  if (clockOut === "00:00" || !shiftEnd) return 0;
  let endM = toMinutes(shiftEnd.slice(0, 5));
  let outM = toMinutes(clockOut);
  if (endM === 0) endM = 24 * 60;
  if (endM === 24 * 60 && outM < 12 * 60) outM += 24 * 60;
  const ot = outM - endM;
  return ot > 0 ? ot : 0;
};

const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
};

const getShiftStatus = (entry: EmployeeTimeEntry): ShiftStatus => {
  if (entry.absent) return "absent";
  if (entry.clockIn !== "00:00") return "present";
  return "pending";
};

const statusBadge = (status: ShiftStatus) => {
  if (status === "present") return "success";
  if (status === "absent") return "error";
  return "warning";
};

const statusLabel = (status: ShiftStatus) => {
  if (status === "present") return "Present";
  if (status === "absent") return "Absent";
  return "Pending";
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface AttendancePageProps {
  employees?: Employee[];
  selectedShifts?: Record<number, number[]>;
  selectedShiftsForDate?: Shift[];
  setSelectedShifts?: React.Dispatch<React.SetStateAction<Record<number, number[]>>>;
  currentDate?: string;
}

export default function AttendancePage({
  employees = MOCK_EMPLOYEES,
  selectedShifts = MOCK_SELECTED_SHIFTS,
  selectedShiftsForDate = MOCK_SHIFTS,
  setSelectedShifts,
  currentDate = new Date().toISOString().slice(0, 10),
}: AttendancePageProps) {

  const [shifts, setShifts] = useState<Shift[]>(selectedShiftsForDate);
  const [currentTab, setCurrentTab] = useState<number | null>(
    selectedShiftsForDate[0]?.shift_id ?? null
  );
  const [employeeTimes, setEmployeeTimes] = useState<Record<string, EmployeeTimeEntry>>({});
  const [manualInput, setManualInput] = useState<ManualInputState>({ employee: null, type: null, value: "" });
  const [search, setSearch] = useState("");

  // Init entries
  useEffect(() => {
    if (!employees.length) return;
    setEmployeeTimes((prev) => {
      const next: Record<string, EmployeeTimeEntry> = {};
      employees.forEach((emp) => {
        const shiftId = emp.shift ?? currentTab;
        if (!shiftId) return;
        const key = `${emp.num}-${shiftId}`;
        const existing = prev[key];
        const fresh = Date.now() - (existing?._lastUpdate ?? 0) < 2000;
        next[key] = {
          clockIn: (fresh ? existing?.clockIn : emp.clockIn) ?? "00:00",
          clockOut: (fresh ? existing?.clockOut : emp.clockOut) ?? "00:00",
          absent: (fresh ? existing?.absent : emp.absent) ?? false,
          absentComment: (fresh ? existing?.absentComment : emp.absentComment) ?? "",
          consomation: existing?.consomation ?? 0,
          penalty: existing?.penalty ?? 0,
          workTimeId: existing?.workTimeId ?? null,
          _lastUpdate: existing?._lastUpdate,
        };
      });
      return next;
    });
  }, [employees, currentTab]);

  useEffect(() => {
    if (selectedShiftsForDate?.length) {
      setShifts(selectedShiftsForDate);
      if (!currentTab) setCurrentTab(selectedShiftsForDate[0].shift_id);
    }
  }, [selectedShiftsForDate]);

  const getKey = (empNum: number, shiftId = currentTab) => `${empNum}-${shiftId}`;

  const getEntry = (empNum: number): EmployeeTimeEntry =>
    employeeTimes[getKey(empNum)] ?? {
      clockIn: "00:00", clockOut: "00:00",
      absent: false, absentComment: "",
      consomation: 0, penalty: 0, workTimeId: null,
    };

  const getCurrentShift = () => shifts.find((s) => s.shift_id === currentTab) ?? null;

  const filteredEmployees = useMemo(() => {
    if (!currentTab) return [];
    const q = search.toLowerCase();
    return employees.filter((emp) => {
      const assigned = selectedShifts[emp.num];
      const inShift = Array.isArray(assigned)
        ? assigned.map(String).includes(String(currentTab))
        : String(assigned) === String(currentTab);
      if (!inShift) return false;
      return (
        emp.FirstName.toLowerCase().includes(q) ||
        emp.empNumber.toLowerCase().includes(q)
      );
    });
  }, [currentTab, employees, selectedShifts, search]);

  const handleClockIn = (empNum: number) => {
    const time = getCurrentTime();
    const key = getKey(empNum);
    setEmployeeTimes((prev) => ({
      ...prev,
      [key]: { ...prev[key], clockIn: time, _lastUpdate: Date.now() },
    }));
  };

  const handleClockOut = (empNum: number) => {
    const time = getCurrentTime();
    const key = getKey(empNum);
    setEmployeeTimes((prev) => ({
      ...prev,
      [key]: { ...prev[key], clockOut: time, _lastUpdate: Date.now() },
    }));
  };

  const openManualInput = (empNum: number, type: "clockIn" | "clockOut") => {
    const existing = getEntry(empNum)[type];
    setManualInput({ employee: empNum, type, value: existing });
  };

  const saveManualTime = () => {
    const { employee, type, value } = manualInput;
    if (!employee || !type) return;
    if (!value.match(/^\d{2}:\d{2}$/)) {
      alert("Invalid time format. Use HH:MM");
      return;
    }
    const key = getKey(employee);
    setEmployeeTimes((prev) => ({
      ...prev,
      [key]: { ...prev[key], [type]: value, _lastUpdate: Date.now() },
    }));
    setManualInput({ employee: null, type: null, value: "" });
  };

  const toggleAbsent = (empNum: number, absent: boolean) => {
    const key = getKey(empNum);
    setEmployeeTimes((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        absent,
        clockIn: absent ? "00:00" : prev[key]?.clockIn ?? "00:00",
        clockOut: absent ? "00:00" : prev[key]?.clockOut ?? "00:00",
        _lastUpdate: Date.now(),
      },
    }));
  };

  const clearAllData = () => {
    if (!window.confirm("Reset all clock-in/out data for today?")) return;
    setEmployeeTimes((prev) => {
      const reset: Record<string, EmployeeTimeEntry> = {};
      Object.keys(prev).forEach((k) => {
        reset[k] = { ...prev[k], clockIn: "00:00", clockOut: "00:00", absent: false, absentComment: "", consomation: 0, penalty: 0 };
      });
      return reset;
    });
  };

  const shift = getCurrentShift();

  // Summary stats
  const stats = useMemo(() => {
    const total = filteredEmployees.length;
    let present = 0, absent = 0, pending = 0;
    filteredEmployees.forEach((emp) => {
      const e = getEntry(emp.num);
      const s = getShiftStatus(e);
      if (s === "present") present++;
      else if (s === "absent") absent++;
      else pending++;
    });
    return { total, present, absent, pending };
  }, [filteredEmployees, employeeTimes]);

  if (!currentTab || !shifts.length) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
        Waiting for shift data…
      </div>
    );
  }

  return (
    <>
      {/* ── Manual Time Edit Modal ────────────────────────────────────────── */}
      {manualInput.employee !== null && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setManualInput({ employee: null, type: null, value: "" })}
          />
          <div
            className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/[0.1] shadow-xl p-6 w-72"
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-800 dark:text-white">
                Edit {manualInput.type === "clockIn" ? "Clock-In" : "Clock-Out"} Time
              </h3>
              <button
                onClick={() => setManualInput({ employee: null, type: null, value: "" })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <CloseIcon />
              </button>
            </div>
            <input
              type="time"
              value={manualInput.value}
              onChange={(e) => setManualInput((prev) => ({ ...prev, value: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={saveManualTime}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setManualInput({ employee: null, type: null, value: "" })}
                className="flex-1 rounded-lg border border-gray-200 dark:border-white/[0.1] px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Header / Shift Tabs ───────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-800 dark:text-white">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{currentDate}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mr-1">Shift:</span>
          {shifts.map((s) => (
            <button
              key={s.shift_id}
              onClick={() => setCurrentTab(s.shift_id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                currentTab === s.shift_id
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
              }`}
            >
              {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
            </button>
          ))}
          <button
            onClick={clearAllData}
            className="ml-2 flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/50 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <TrashIcon />
            Reset
          </button>
        </div>
      </div>

      {/* ── Summary Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: stats.total, color: "text-gray-800 dark:text-white" },
          { label: "Present", value: stats.present, color: "text-green-700 dark:text-green-400" },
          { label: "Absent", value: stats.absent, color: "text-red-600 dark:text-red-400" },
          { label: "Pending", value: stats.pending, color: "text-amber-600 dark:text-amber-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-4 py-3"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-medium ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Table Card ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 gap-4 flex-wrap border-b border-gray-100 dark:border-white/[0.05]">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">
            {shift ? `${shift.start_time.slice(0, 5)} – ${shift.end_time.slice(0, 5)} shift` : "Attendance"}
          </h2>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search employee…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/60 dark:bg-white/[0.02]">
                {["Employee", "Status", "Clock In", "Clock Out", "Hours", "Delay", "Overtime", "Consumption", "Penalty", "Absent", "Reason"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center text-sm text-gray-400">
                    No employees in this shift.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const entry = getEntry(emp.num);
                  const status = getShiftStatus(entry);
                  const lateMin = calcLate(entry.clockIn, shift?.start_time ?? "");
                  const otMin = calcOvertime(entry.clockOut, shift?.end_time ?? "");
                  const hours = calcHours(entry.clockIn, entry.clockOut);

                  return (
                    <tr
                      key={`${emp.num}-${currentTab}`}
                      className={`transition-colors ${
                        entry.absent
                          ? "bg-red-50/40 dark:bg-red-900/10"
                          : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Employee */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">{emp.FirstName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{emp.empNumber}</p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge size="sm" color={statusBadge(status)}>{statusLabel(status)}</Badge>
                      </td>

                      {/* Clock In */}
                      <td className="px-4 py-3">
                        {!entry.absent ? (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleClockIn(emp.num)}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                entry.clockIn !== "00:00"
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "border border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                              }`}
                            >
                              <ClockInIcon />
                              {entry.clockIn !== "00:00" ? entry.clockIn : "Clock In"}
                            </button>
                            <button
                              onClick={() => openManualInput(emp.num, "clockIn")}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            >
                              <EditIcon /> Edit
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">—</span>
                        )}
                      </td>

                      {/* Clock Out */}
                      <td className="px-4 py-3">
                        {!entry.absent ? (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleClockOut(emp.num)}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                entry.clockOut !== "00:00"
                                  ? "bg-red-500 text-white hover:bg-red-600"
                                  : "border border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                              }`}
                            >
                              <ClockInIcon />
                              {entry.clockOut !== "00:00" ? entry.clockOut : "Clock Out"}
                            </button>
                            <button
                              onClick={() => openManualInput(emp.num, "clockOut")}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            >
                              <EditIcon /> Edit
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">—</span>
                        )}
                      </td>

                      {/* Hours */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{hours}</span>
                      </td>

                      {/* Delay */}
                      <td className="px-4 py-3">
                        <span className={`text-sm font-mono ${lateMin > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}`}>
                          {formatMinutes(lateMin)}
                        </span>
                      </td>

                      {/* Overtime */}
                      <td className="px-4 py-3">
                        <span className={`text-sm font-mono ${otMin > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}>
                          {formatMinutes(otMin)}
                        </span>
                      </td>

                      {/* Consumption */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={entry.consomation || ""}
                          placeholder="0"
                          onChange={(e) =>
                            setEmployeeTimes((prev) => ({
                              ...prev,
                              [getKey(emp.num)]: { ...prev[getKey(emp.num)], consomation: e.target.value },
                            }))
                          }
                          className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-800 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </td>

                      {/* Penalty */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={entry.penalty || ""}
                          placeholder="0"
                          onChange={(e) =>
                            setEmployeeTimes((prev) => ({
                              ...prev,
                              [getKey(emp.num)]: { ...prev[getKey(emp.num)], penalty: e.target.value },
                            }))
                          }
                          className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-800 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </td>

                      {/* Absent toggle */}
                      <td className="px-4 py-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={entry.absent}
                            onChange={(e) => toggleAbsent(emp.num, e.target.checked)}
                          />
                          <div className="w-9 h-5 bg-gray-200 dark:bg-white/[0.1] peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:bg-red-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                        </label>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          disabled={!entry.absent}
                          placeholder={entry.absent ? "Enter reason…" : "—"}
                          value={entry.absentComment || ""}
                          onChange={(e) =>
                            setEmployeeTimes((prev) => ({
                              ...prev,
                              [getKey(emp.num)]: { ...prev[getKey(emp.num)], absentComment: e.target.value },
                            }))
                          }
                          className="w-32 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-800 placeholder-gray-300 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-white/[0.05] text-xs text-gray-400 dark:text-gray-500">
          {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""} in this shift
        </div>
      </div>
    </>
  );
}
