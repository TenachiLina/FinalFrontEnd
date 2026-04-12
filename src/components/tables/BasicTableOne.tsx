"use client";
import React, { useState, useMemo } from "react";
import Image from "next/image";
import Badge from "../ui/badge/Badge";
import { Employee } from "@/types/employee";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "emp_number" | "name" | "position" | "Base_salary" | "address" | "phone_number" | "status";
type SortDir = "asc" | "desc";

// ─── Seed data (mirrors Emp_Management field names) ───────────────────────────

const tableData: Employee[] = [
  {
    id: 1,
    emp_number: 1001,
    user: { image: "/images/user/user-17.jpg", name: "Lindsey Curtis", PhoneNumber: "0777 895 432" },
    FirstName: "Lindsey",
    LastName: "Curtis",
    position: "Sales Assistant",
    Base_salary: 89500,
    address: "Constantine, Algeria",
    phone_number: "0777 895 432",
    status: "Vacation",
  },
  {
    id: 2,
    emp_number: 1002,
    user: { image: "/images/user/user-18.jpg", name: "Kaiya George", PhoneNumber: "0661 234 567" },
    FirstName: "Kaiya",
    LastName: "George",
    position: "Chief Executive Officer",
    Base_salary: 105000,
    address: "Algiers, Algeria",
    phone_number: "0661 234 567",
    status: "In Progress",
  },
  {
    id: 3,
    emp_number: 1003,
    user: { image: "/images/user/user-17.jpg", name: "Zain Geidt", PhoneNumber: "0550 987 654" },
    FirstName: "Zain",
    LastName: "Geidt",
    position: "Junior Technical Author",
    Base_salary: 120000,
    address: "Oran, Algeria",
    phone_number: "0550 987 654",
    status: "In Progress",
  },
  {
    id: 4,
    emp_number: 1004,
    user: { image: "/images/user/user-20.jpg", name: "Abram Schleifer", PhoneNumber: "0770 111 222" },
    FirstName: "Abram",
    LastName: "Schleifer",
    position: "Software Engineer",
    Base_salary: 95000,
    address: "Annaba, Algeria",
    phone_number: "0770 111 222",
    status: "In Progress",
  },
  {
    id: 5,
    emp_number: 1005,
    user: { image: "/images/user/user-21.jpg", name: "Carla George", PhoneNumber: "0560 333 444" },
    FirstName: "Carla",
    LastName: "George",
    position: "Front-end Developer",
    Base_salary: 78000,
    address: "Blida, Algeria",
    phone_number: "0560 333 444",
    status: "In Progress",
  },
];

// ─── Small Icons ──────────────────────────────────────────────────────────────

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const EditIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
  <svg className={`inline ml-1 w-3 h-3 transition-colors ${active ? "text-blue-500" : "text-gray-300 dark:text-gray-600"}`} viewBox="0 0 10 14" fill="none">
    <path d={dir === "asc" && active ? "M5 1v12M1 5l4-4 4 4" : "M5 1v12M1 9l4 4 4-4"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Empty form state ─────────────────────────────────────────────────────────

const emptyForm = () => ({
  emp_number: "",
  personal_image: null as File | null,
  FirstName: "",
  LastName: "",
  position: "",
  Base_salary: "",
  address: "",
  phone_number: "",
  status: "In Progress" as Employee["status"],
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BasicTableOne() {
  const [data, setData] = useState<Employee[]>(tableData);
  const [search, setSearch] = useState("");
  const [showEntries, setShowEntries] = useState(5);
  const [sortKey, setSortKey] = useState<SortKey>("emp_number");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Drawer state
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());

  // ── Sorting ────────────────────────────────────────────────────────────────

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ── Filter + sort + paginate ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((e) =>
      e.FirstName.toLowerCase().includes(q) ||
      e.LastName.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q) ||
      e.address.toLowerCase().includes(q) ||
      e.phone_number.toLowerCase().includes(q) ||
      String(e.emp_number).includes(q) ||
      e.status.toLowerCase().includes(q)
    );
  }, [search, data]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: any, bv: any;
      if (sortKey === "name") { av = `${a.FirstName} ${a.LastName}`; bv = `${b.FirstName} ${b.LastName}`; }
      else { av = (a as any)[sortKey]; bv = (b as any)[sortKey]; }
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / showEntries));
  const paginated = sorted.slice((currentPage - 1) * showEntries, currentPage * showEntries);

  // ── Form handlers ──────────────────────────────────────────────────────────

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const files = (e.target as HTMLInputElement).files;
    setForm((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  }

  function openAdd() {
    setForm(emptyForm());
    setIsEditing(false);
    setEditingId(null);
    setShowForm(true);
  }

  function handleEdit(emp: Employee) {
    setForm({
      emp_number: String(emp.emp_number),
      personal_image: null,
      FirstName: emp.FirstName,
      LastName: emp.LastName,
      position: emp.position,
      Base_salary: String(emp.Base_salary),
      address: emp.address,
      phone_number: emp.phone_number,
      status: emp.status,
    });
    setIsEditing(true);
    setEditingId(emp.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.FirstName.trim() || !form.LastName.trim() || !form.phone_number.trim()) {
      alert("⚠️ First name, last name, and phone are required.");
      return;
    }

    if (isEditing && editingId !== null) {
      setData((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                emp_number: Number(form.emp_number),
                FirstName: form.FirstName,
                LastName: form.LastName,
                user: { ...e.user, name: `${form.FirstName} ${form.LastName}`, PhoneNumber: form.phone_number },
                position: form.position,
                Base_salary: Number(form.Base_salary),
                address: form.address,
                phone_number: form.phone_number,
                status: form.status,
              }
            : e
        )
      );
    } else {
      // Duplicate checks (mirrors Emp_Management)
      const dupEmpNum = data.some((e) => e.emp_number === Number(form.emp_number));
      const dupNamePhone = data.some(
        (e) =>
          e.FirstName.trim().toLowerCase() === form.FirstName.trim().toLowerCase() &&
          e.LastName.trim().toLowerCase() === form.LastName.trim().toLowerCase() &&
          e.phone_number.trim() === form.phone_number.trim()
      );
      const dupes = [];
      if (dupEmpNum) dupes.push("Employee Number");
      if (dupNamePhone) dupes.push("Full Name & Phone");
      if (dupes.length > 0) { alert(`⚠️ Duplicate found in: ${dupes.join(", ")}`); return; }

      const newEmp: Employee = {
        id: data.length ? Math.max(...data.map((e) => e.id)) + 1 : 1,
        emp_number: Number(form.emp_number),
        user: { image: "/images/user/user-17.jpg", name: `${form.FirstName} ${form.LastName}`, PhoneNumber: form.phone_number },
        FirstName: form.FirstName,
        LastName: form.LastName,
        position: form.position,
        Base_salary: Number(form.Base_salary),
        address: form.address,
        phone_number: form.phone_number,
        status: form.status,
        salary: `$${Number(form.Base_salary).toLocaleString()}`,
        Address: form.address,
      };
      setData((prev) => [...prev, newEmp]);
    }

    setShowForm(false);
    setForm(emptyForm());
    setIsEditing(false);
    setEditingId(null);
  }

  function handleDelete(id: number) {
    if (!window.confirm("⚠️ Are you sure you want to delete this employee?")) return;
    setData((prev) => prev.filter((e) => e.id !== id));
    alert("✅ Employee deleted successfully!");
  }

  // ── Status badge color ────────────────────────────────────────────────────

  const statusColor = (status: Employee["status"]) => {
    if (status === "In Progress") return "success";
    if (status === "Vacation") return "warning";
    return "error";
  };

  // ── Column definitions ────────────────────────────────────────────────────

  const cols: { label: string; key: SortKey }[] = [
    { label: "Emp #", key: "emp_number" },
    { label: "Photo", key: "name" },       // photo col, sort by name
    { label: "First Name", key: "name" },
    { label: "Last Name", key: "name" },
    { label: "Position", key: "position" },
    { label: "Base Salary", key: "Base_salary" },
    { label: "Address", key: "address" },
    { label: "Phone", key: "phone_number" },
    { label: "Status", key: "status" },
  ];

  // ── Field helper for drawer form ──────────────────────────────────────────

  const Field = ({
    label, name, type = "text", value,
  }: { label: string; name: string; type?: string; value: string }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-200 transition"
      />
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Slide-in Drawer ──────────────────────────────────────────────── */}
      {showForm && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setShowForm(false)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col transition-transform">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.07]">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                {isEditing ? "Edit Employee" : "Add Employee"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              <Field label="Employee Number" name="emp_number" type="number" value={form.emp_number} />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Personal Image</label>
                <input
                  type="file"
                  name="personal_image"
                  accept="image/*"
                  onChange={handleChange}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-blue-600 dark:file:bg-white/[0.08] dark:file:text-blue-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" name="FirstName" value={form.FirstName} />
                <Field label="Last Name" name="LastName" value={form.LastName} />
              </div>

              <Field label="Position" name="position" value={form.position} />
              <Field label="Base Salary" name="Base_salary" type="number" value={form.Base_salary} />
              <Field label="Address" name="address" value={form.address} />
              <Field label="Phone" name="phone_number" value={form.phone_number} />

              {/* Status select */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-200 transition"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>

            {/* Drawer footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.07]">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-white/[0.1] dark:text-gray-300 dark:hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {isEditing ? "Save Changes" : "Save"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Table Card ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 gap-4 flex-wrap border-b border-gray-100 dark:border-white/[0.05]">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">Employees Management</h2>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Show entries */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Show</span>
              <select
                value={showEntries}
                onChange={(e) => { setShowEntries(Number(e.target.value)); setCurrentPage(1); }}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-300 focus:outline-none"
              >
                {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
              />
            </div>

            {/* Add employee */}
            <button
              onClick={openAdd}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <PlusIcon />
              Add Employee
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/60 dark:bg-white/[0.02]">
                {/* Emp # */}
                <th onClick={() => handleSort("emp_number")} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap">
                  Emp # <SortIcon active={sortKey === "emp_number"} dir={sortDir} />
                </th>
                {/* Photo — not sortable */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Photo</th>
                {/* First Name */}
                <th onClick={() => handleSort("name")} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap">
                  First Name <SortIcon active={sortKey === "name"} dir={sortDir} />
                </th>
                {/* Last Name */}
                <th onClick={() => handleSort("name")} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap">
                  Last Name <SortIcon active={sortKey === "name"} dir={sortDir} />
                </th>
                {/* Position */}
                <th onClick={() => handleSort("position")} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap">
                  Position <SortIcon active={sortKey === "position"} dir={sortDir} />
                </th>
                {/* Base Salary */}
                <th onClick={() => handleSort("Base_salary")} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap">
                  Base Salary <SortIcon active={sortKey === "Base_salary"} dir={sortDir} />
                </th>
                {/* Address */}
                <th onClick={() => handleSort("address")} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap">
                  Address <SortIcon active={sortKey === "address"} dir={sortDir} />
                </th>
                {/* Phone */}
                <th onClick={() => handleSort("phone_number")} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap">
                  Phone <SortIcon active={sortKey === "phone_number"} dir={sortDir} />
                </th>
                {/* Status */}
                <th onClick={() => handleSort("status")} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap">
                  Status <SortIcon active={sortKey === "status"} dir={sortDir} />
                </th>
                {/* Actions */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-400">
                    No employees found.
                  </td>
                </tr>
              ) : (
                paginated.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {emp.emp_number}
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ring-2 ring-gray-100 dark:ring-white/[0.07]">
                        <Image
                          width={40} height={40}
                          src={emp.user.image}
                          alt={`${emp.FirstName} ${emp.LastName}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {emp.FirstName}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {emp.LastName}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {emp.position}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                      ${Number(emp.Base_salary).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {emp.address}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {emp.phone_number}
                    </td>
                    <td className="px-4 py-4">
                      <Badge size="sm" color={statusColor(emp.status)}>{emp.status}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-gray-400">
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                        <button
                          onClick={() => handleEdit(emp)}
                          className="hover:text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/[0.05] text-sm text-gray-500 dark:text-gray-400 flex-wrap gap-3">
          <span>
            Showing {sorted.length === 0 ? 0 : (currentPage - 1) * showEntries + 1}–{Math.min(currentPage * showEntries, sorted.length)} of {sorted.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/[0.1] dark:hover:bg-white/[0.05] transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  p === currentPage
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-gray-200 hover:bg-gray-50 dark:border-white/[0.1] dark:hover:bg-white/[0.05]"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/[0.1] dark:hover:bg-white/[0.05] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
