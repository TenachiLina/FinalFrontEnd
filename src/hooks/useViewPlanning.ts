import { useState, useCallback, useEffect } from "react";
import { useModal } from "@/hooks/useModal";
import { Cell, GridData, POSTS, SHIFTS } from "../components/calendar/types";
import * as XLSX from 'xlsx';

export const useViewPlanning = () => {
  const { isOpen, openModal, closeModal } = useModal();

  // ── Grid state ───────────────────────────────────────────────────
  const [grid, setGrid] = useState<GridData>(() => {
    const initial: GridData = {};
    POSTS.forEach((post) => {
      initial[post.id] = {};
      SHIFTS.forEach((shift) => { initial[post.id][shift.id] = []; });
    });
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Date navigation ──────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const goToToday = () => setCurrentDate(new Date());
  const goPrev = () => setCurrentDate((d) => { const n = new Date(d); n.setDate(d.getDate() - 1); return n; });
  const goNext = () => setCurrentDate((d) => { const n = new Date(d); n.setDate(d.getDate() + 1); return n; });

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  // ── Active cell (details modal) ───────────────────────────────────
  const [activeEmployee, setActiveEmployee] = useState<Cell | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // ── List modal ───────────────────────────────────────────────────
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listCell, setListCell] = useState<{ postId: number; shiftId: string } | null>(null);
  const listEmployees = listCell ? grid[listCell.postId][listCell.shiftId] : [];

  // ── Fetch planning data ───────────────────────────────────────────
  const fetchPlanning = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/planning/getAll");
      if (!response.ok) throw new Error("Failed to fetch planning");

      const data = await response.json();

      // Get current date in YYYY-MM-DD format (UTC)
      const currentDateStr = currentDate.toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });
      //console.log('🌤️ Current Date (UTC):', currentDateStr);

      // Filter by current date
      const filteredData = data.filter((item: any) => {
        const itemDateStr = new Date(item.planDate).toISOString().split('T')[0];
        return itemDateStr === currentDateStr;
      });
      //console.log('📅 Filtered Planning Data:', filteredData);

      // Initialize grid
      const newGrid: GridData = {};
      POSTS.forEach((post) => {
        newGrid[post.id] = {};
        SHIFTS.forEach((shift) => {
          newGrid[post.id][shift.id] = [];
        });
      });

      // Transform data to grid format
      filteredData.forEach((item: any) => {
        const shiftId = item.shiftId;
        //console.log('🔍 Processing Item:', { item, shiftId });
        const empName = item.empId|| "Unknown";
        //console.log('👤 Employee Name:', empName);
        const taskId = item.taskId;
        console.log('📝 Task ID:', taskId);

        if (newGrid[taskId] && newGrid[taskId][shiftId]) {
          newGrid[taskId][shiftId].push({
            id: item._id,        // local key (MongoDB _id or any unique value)
            employeeId: item._id, // ← real DB id used when saving
            title: empName,       // display name only
          });
        }
      });
      //console.log('📊 Transformed Grid Data:', newGrid);

      setGrid(newGrid);
    } catch (err) {
      console.error("Error fetching planning:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // ── Fetch when date changes ──────────────────────────────────────
  useEffect(() => {
    fetchPlanning();
  }, [fetchPlanning]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setActiveEmployee(null);
  }, []);

  const handleListCellClick = useCallback((postId: number, shiftId: string) => {
    setListCell({ postId, shiftId });
    setIsListModalOpen(true);
  }, []);

  //Export employees into excel file
  const handleExport = () => {
  const shiftLabels = SHIFTS.map((s) => s.label);

  const rows = POSTS.map((post) => {
    const row: Record<string, string> = { Task: post.label };
    SHIFTS.forEach((shift) => {
      const employees = grid[post.id]?.[shift.id] ?? [];
      row[shift.label] = employees.map((emp) => emp.title).join('\n');
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: ['Task', ...shiftLabels] });

  // Apply wrapText to all cells
  Object.keys(worksheet).forEach((key) => {
    if (key.startsWith('!')) return;
    if (!worksheet[key].s) worksheet[key].s = {};
    worksheet[key].s = { alignment: { wrapText: true, vertical: 'top' } };
  });

  worksheet['!cols'] = [{ wch: 20 }, ...SHIFTS.map(() => ({ wch: 30 }))];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Planning');
  workbook.Workbook = { Views: [{ RTL: false }] };

  XLSX.writeFile(workbook, `planning_${formattedDate}.xlsx`, { cellStyles: true });
  };

  return {
    // grid
    grid,
    // date
    currentDate, setCurrentDate,
    calendarMonth, setCalendarMonth,
    goToToday, goPrev, goNext, formattedDate,
    // employee details modal
    activeEmployee, isDetailsModalOpen,
    handleCloseDetailsModal,
    // list modal
    isListModalOpen, setIsListModalOpen,
    listCell, setListCell, listEmployees,
    handleListCellClick,
    // loading & error
    loading, error,
    //export
    handleExport
  };
};
