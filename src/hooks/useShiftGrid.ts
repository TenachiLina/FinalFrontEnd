import { useState, useCallback } from "react";
import { useModal } from "@/hooks/useModal";
import { Cell, GridData, POSTS, SHIFTS } from "../components/calendar/types";

export const useShiftGrid = () => {
  // ── Modal (add) ──────────────────────────────────────────────────
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

  // ── Date navigation ──────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const goToToday = () => setCurrentDate(new Date());
  const goPrev = () => setCurrentDate((d) => { const n = new Date(d); n.setDate(d.getDate() - 1); return n; });
  const goNext = () => setCurrentDate((d) => { const n = new Date(d); n.setDate(d.getDate() + 1); return n; });

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  // ── Active cell (add modal) ───────────────────────────────────────
  const [activeCell, setActiveCell] = useState<{ postId: number; shiftId: string } | null>(null);
  const [cellTitle, setCellTitle] = useState("");

  // ── Edit modal ───────────────────────────────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Cell | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // ── List modal ───────────────────────────────────────────────────
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listCell, setListCell] = useState<{ postId: number; shiftId: string } | null>(null);
  const listEmployees = listCell ? grid[listCell.postId][listCell.shiftId] : [];

  // ── Handlers ─────────────────────────────────────────────────────
  const handleCellClick = useCallback((postId: number, shiftId: string) => {
    setActiveCell({ postId, shiftId });
    setCellTitle("");
    openModal();
  }, [openModal]);

  const handleSave = useCallback(() => {
    if (!activeCell || !cellTitle.trim()) return;
    const { postId, shiftId } = activeCell;

    setGrid((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        [shiftId]: [
          ...prev[postId][shiftId],
          { id: crypto.randomUUID(), title: cellTitle.trim() },
        ],
      },
    }));

    closeModal();
    setActiveCell(null);
    setCellTitle("");
  }, [activeCell, cellTitle, closeModal]);

  const handleClose = useCallback(() => {
    closeModal();
    setActiveCell(null);
    setCellTitle("");
  }, [closeModal]);

  const openEditModal = useCallback((emp: Cell, cell: { postId: number; shiftId: string }) => {
    setActiveCell(cell);
    setEditingEmployee(emp);
    setEditTitle(emp.title);
    setIsListModalOpen(false);
    setIsEditModalOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    if (!activeCell || !editingEmployee || !editTitle.trim()) return;
    const { postId, shiftId } = activeCell;

    setGrid((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        [shiftId]: prev[postId][shiftId].map((emp) =>
          emp.id === editingEmployee.id
            ? { ...emp, title: editTitle.trim() }
            : emp
        ),
      },
    }));

    setIsEditModalOpen(false);
    setEditingEmployee(null);
    setEditTitle("");
    setActiveCell(null);
  }, [activeCell, editingEmployee, editTitle]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingEmployee(null);
    setEditTitle("");
    setActiveCell(null);
  }, []);

  const handleDelete = useCallback((employeeId: string, cell?: { postId: number; shiftId: string }) => {
    const target = cell ?? activeCell;
    if (!target) return;
    const { postId, shiftId } = target;

    setGrid((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        [shiftId]: prev[postId][shiftId].filter((emp) => emp.id !== employeeId),
      },
    }));

    closeModal();
    setActiveCell(null);
  }, [activeCell, closeModal]);

  const handleSavePlanning = useCallback(async () => {
    const entries: {
      shiftId: string;
      empId: string;
      taskId: number;
      planDate: string;
    }[] = [];

    POSTS.forEach((post) => {
      SHIFTS.forEach((shift) => {
        grid[post.id][shift.id].forEach((cell) => {
          entries.push({
            shiftId: shift.id,
            empId: cell.id,
            taskId: post.id,
            planDate: currentDate.toISOString(),
          });
        });
      });
    });

    if (entries.length === 0) {
      alert("No employees planned for this day.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/planning/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) throw new Error("Failed to save");
      alert("Planning saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving planning.");
    }
  }, [grid, currentDate]);

  return {
    // grid
    grid,
    // date
    currentDate, setCurrentDate,
    calendarMonth, setCalendarMonth,
    goToToday, goPrev, goNext, formattedDate,
    // add modal
    isOpen, activeCell, cellTitle, setCellTitle,
    handleCellClick, handleSave, handleClose,
    // edit modal
    isEditModalOpen, editingEmployee, editTitle, setEditTitle,
    openEditModal, handleEdit, handleCloseEditModal,
    // list modal
    isListModalOpen, setIsListModalOpen,
    listCell, setListCell, listEmployees,
    // delete & save planning
    handleDelete, handleSavePlanning,
  };
};