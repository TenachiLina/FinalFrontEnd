"use client";
import React, { useState } from "react";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { BoxIcon } from "@/icons";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
// ─── Config ───────────────────────────────────────────────────────────────────

const POSTS = [
  { id: 1,  label: "Pizzaiolo" },
  { id: 2,  label: "Livreur" },
  { id: 3,  label: "Agent polyvalent" },
  { id: 4,  label: "Prepateur" },
  { id: 5,  label: "Caissier" },
  { id: 6,  label: "Plongeur" },
  { id: 7,  label: "Serveur" },
  { id: 8,  label: "Manageur" },
  { id: 9,  label: "Packaging" },
  { id: 10, label: "Topping" },
  { id: 11, label: "Bar" },
  { id: 12, label: "Pate" },
];

const SHIFTS = [
  { id: "shift-1", label: "6:00 AM - 16:00 PM", sub: "Morning-Afternoon" },
  { id: "shift-2", label: "16:00 PM - 00:00 AM", sub: "Evening" },
];

interface Cell {
  id: string;
  title: string;
}

type GridData = Record<number, Record<string, Cell[]>>;

// ─── Component ────────────────────────────────────────────────────────────────
const ShiftGrid: React.FC = () =>{
  const { isOpen, openModal, closeModal } = useModal();
  // Grid state: post → shift → event
  const [grid, setGrid] = useState<GridData>(() => {
    const initial: GridData = {};
    POSTS.forEach((post) => {
      initial[post.id] = {};
      SHIFTS.forEach((shift) => { initial[post.id][shift.id] = []; });
    });
    return initial;
  });

  // Currently selected cell
  const [activeCell, setActiveCell] = useState<{ postId: number; shiftId: string } | null>(null);
  // Modal form fields
  const [cellTitle, setCellTitle] = useState("");
  //State for cell details modal:
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listCell, setListCell] = useState<{
    postId: number;
    shiftId: string;
  } | null>(null);

  //CellList :
  const listEmployees = listCell ? grid[listCell.postId][listCell.shiftId] : [];
  //States for editing modal:
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Cell | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCellClick = (postId: number, shiftId: string) => {
  const events = grid[postId][shiftId];
  setActiveCell({ postId, shiftId });
  setCellTitle("");
  openModal();
  };

  const handleSave = () => {
  if (!activeCell) return;
  const { postId, shiftId } = activeCell;
  if (!cellTitle.trim()) return;

  setGrid((prev) => {
    const current = prev[postId][shiftId];
    return {
      ...prev,
      [postId]: {
        ...prev[postId],
        [shiftId]: [
          ...current,
          {
            id: crypto.randomUUID(),
            title: cellTitle.trim(),
          },
        ],
      },
    };
  });

  closeModal();
  setActiveCell(null);
  setCellTitle("");
  };

  const handleDelete = (employeeId: string, cell?: { postId: number; shiftId: string }) => {
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
  };

  const handleClose = () => {
      closeModal();
      setActiveCell(null);
      setCellTitle("");
  };

  const openEditModal = (emp: Cell, cell: { postId: number; shiftId: string }) => {
  setActiveCell(cell);
  setEditingEmployee(emp);
  setEditTitle(emp.title);
  setIsListModalOpen(false);
  setIsEditModalOpen(true);
  };

  const handleEdit = () => {
  if (!activeCell || !editingEmployee) return;
  if (!editTitle.trim()) return;

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
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const activeEmployeesCell = activeCell ? grid[activeCell.postId]?.[activeCell.shiftId] : null;
  const activePost  = activeCell ? POSTS.find((p) => p.id === activeCell.postId) : null;

  return (
    <>
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden" style={{ marginBottom: "20px" }}>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {/* Top-left corner cell */}
              <th className="w-32 min-w-[8rem] border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3" />

              {/* Shift column headers */}
              {SHIFTS.map((shift) => (
                <th
                  key={shift.id}
                  className="border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3 text-center last:border-r-0"
                >
                  <span className="block text-sm font-bold text-gray-800 dark:text-white/90">
                    {shift.label}
                  </span>
                  <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {shift.sub}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {POSTS.map((post, rowIdx) => (
              <tr key={post.id} className={rowIdx % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-white/[0.01]"}>
                {/* Row label */}
                <td className="border-b border-r border-gray-200 dark:border-gray-700 p-3 last:border-b-0">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {post.label}
                  </span>
                </td>

                {/* Cells */}
                {SHIFTS.map((shift) => {
                  const events = grid[post.id][shift.id];
                  return (
                    <td
                      key={shift.id}
                      onClick={() => handleCellClick(post.id, shift.id)}
                      className={[
                        "border-b border-r border-gray-200 dark:border-gray-700 p-2 cursor-pointer",
                        "transition-colors duration-150",
                        "last:border-r-0",
                        rowIdx === POSTS.length - 1 ? "border-b-0" : "",
                        "hover:bg-brand-50 dark:hover:bg-brand-900/10",
                      ].join(" ")}
                      style={{ minWidth: "160px", height: "64px" }}
                    >
                      {events.length > 0 ? (
                        <div className="flex flex-col gap-[2px] overflow-hidden">
                          {events.slice(0, 2).map((emp) => (
                            <div
                              key={emp.id}
                              className="text-[11px] px-2 py-[2px] text-gray-800 dark:text-white truncate"
                              title={emp.title}
                              //last change
                              onClick={(e) => {
                                e.stopPropagation();
                                setListCell({ postId: post.id, shiftId: shift.id });
                                setIsListModalOpen(true);
                              }}
                            >
                              {emp.title}
                            </div>
                          ))}

                          {events.length > 2 && (
                            <div
                              className="text-[10px] text-gray-400 px-2 cursor-pointer hover:text-gray-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setListCell({ postId: post.id, shiftId: shift.id });
                                setIsListModalOpen(true);
                              }}
                            >
                              +{events.length - 2}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-xs text-gray-400 dark:text-gray-600">+ Add</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[500px] p-6 lg:p-10">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <h5 className="mb-1 font-semibold text-gray-800 text-theme-xl dark:text-white/90 lg:text-2xl">
              {activeEmployeesCell ? "Edit Assignment" : "Add Assignment"}
            </h5>
            {activeCell && activePost && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activePost.label}{":   "}
                {"  "}{SHIFTS.find((s) => s.id === activeCell.shiftId)?.label}{" "}

              </p>
            )}
          </div>

          {/* Title input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Title
            </label>
            <input
              autoFocus
              type="text"
              value={cellTitle}
              onChange={(e) => setCellTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="ex: John Doe"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:justify-end">
            <button
              onClick={handleClose}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
            >
              "Save"
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        className="max-w-[400px] p-6 relative"
      >
        <div className="flex flex-col gap-4">   
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Employees in Shift
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {listEmployees.length} assigned employee(s)
            </p>
          </div>

          {/* Employee list */}
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">

            {listEmployees.map((emp) => (
              <div
                key={emp.id}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-white flex items-center justify-between"
              >
                <span className="truncate">{emp.title}</span>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <button
                    onClick={() => openEditModal(emp, listCell!)}
                    type="button"
                    className="text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (!listCell) return;
                      handleDelete(emp.id, listCell);
                      if (listEmployees.length <= 1) setIsListModalOpen(false);
                    }}
                    type="button"
                    className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {listEmployees.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-6">
                No employees assigned
              </div>
            )}
          </div>

          {/* Footer */}
          <button
              onClick={() => setIsListModalOpen(false)}
              type="button"
              className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
          >
            Hide details
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEmployee(null);
          setEditTitle("");
          setActiveCell(null);
        }}
        className="max-w-[500px] p-6 lg:p-10"
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <h5 className="mb-1 font-semibold text-gray-800 text-theme-xl dark:text-white/90 lg:text-2xl">
              Edit Assignment
            </h5>
            {activeCell && activePost && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activePost.label}{":   "}
                {SHIFTS.find((s) => s.id === activeCell.shiftId)?.label}
              </p>
            )}
          </div>

          {/* Input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Title
            </label>
            <input
              autoFocus
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              placeholder="ex: John Doe"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:justify-end">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingEmployee(null);
                setEditTitle("");
                setActiveCell(null);
              }}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              type="button"
              className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
            >
              Update
            </button>
          </div>
        </div>
      </Modal>
      </div>
      <div className="flex items-center gap-5">
        <Button size="sm" variant="primary">
          <BookmarkIcon 
           className="w-4 h-4 text-gray-100"
           strokeWidth={3}
          />
          Save Planning
        </Button>
        <Button size="md" variant="primary">
          <ArrowDownTrayIcon 
            className="w-4 h-4 text-gray-100"
            strokeWidth={3}
          />
          Import Planning
        </Button>
        <Button size="md" variant="primary">
          <ArrowTopRightOnSquareIcon
            className="w-4 h-4 text-gray-100"
            strokeWidth={3}
          />
          Export Planning
        </Button>
      </div>
    </>
  );
};

export default ShiftGrid;


