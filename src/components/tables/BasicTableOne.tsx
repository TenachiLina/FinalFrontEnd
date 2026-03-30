"use client";
import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Badge from "../ui/badge/Badge";
import EditEmployeeDrawer from "../EditingDrawer/EditComponant";
import { Employee } from "@/types/employee";

const tableData: Employee[] = [
  {
    id: 1,
    user: { image: "/images/user/user-17.jpg", name: "Lindsey Curtis", PhoneNumber: "0777895432" },
    position: "Sales Assistant", salary: "$89,500", Address: "Constantine, Algeria", status: "Vacation",
  },
  {
    id: 2,
    user: { image: "/images/user/user-18.jpg", name: "Kaiya George", PhoneNumber: "0777895432" },
    position: "Chief Executive Officer", salary: "$105,000", Address: "Constantine, Algeria", status: "In Progress",
  },
  {
    id: 3,
    user: { image: "/images/user/user-17.jpg", name: "Zain Geidt", PhoneNumber: "0777895432" },
    position: "Junior Technical Author", salary: "$120,000", Address: "Constantine, Algeria", status: "In Progress",
  },
  {
    id: 4,
    user: { image: "/images/user/user-20.jpg", name: "Abram Schleifer", PhoneNumber: "0777895432" },
    position: "Software Engineer", salary: "$95,000", Address: "Constantine, Algeria", status: "In Progress",
  },
  {
    id: 5,
    user: { image: "/images/user/user-21.jpg", name: "Carla George", PhoneNumber: "0777895432" },
    position: "Front-end Developer", salary: "$78,000", Address: "Constantine, Algeria", status: "In Progress",
  },
];

type SortKey = "id" | "user" | "position" | "salary" | "Address" | "status";
type SortDir = "asc" | "desc";

const SortIcon = () => (
  <svg className="inline ml-1 w-3 h-3 text-gray-400" viewBox="0 0 10 14" fill="none">
    <path d="M5 1v12M1 5l4-4 4 4M1 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const EditIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export default function BasicTableOne() {
  const router = useRouter();
  const [data, setData] = useState<Employee[]>(tableData);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [showEntries, setShowEntries] = useState(5);
  const [sortKey, setSortKey] = useState<SortKey>("user");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleSave = (updated: Employee) => {
    setData((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((e) =>
      e.user.name.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q) ||
      e.Address.toLowerCase().includes(q) ||
      e.status.toLowerCase().includes(q)
    );
  }, [search, data]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = sortKey === "user" ? a.user.name : (a as any)[sortKey];
      let bv = sortKey === "user" ? b.user.name : (b as any)[sortKey];
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = sorted.slice((currentPage - 1) * showEntries, currentPage * showEntries);

  const statusColor = (status: Employee["status"]) => {
    if (status === "In Progress") return "success";
    if (status === "Vacation") return "warning";
    return "error";
  };

  const cols: { label: string; key: SortKey }[] = [
    { label: "ID", key: "id" },
    { label: "Employee", key: "user" },
    { label: "Position", key: "position" },
    { label: "Salary", key: "salary" },
    { label: "Address", key: "Address" },
    { label: "Status", key: "status" },
  ];

  return (
    <>
      <EditEmployeeDrawer
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSave={handleSave}
      />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Show</span>
            <select
              value={showEntries}
              onChange={(e) => { setShowEntries(Number(e.target.value)); setCurrentPage(1); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-300 focus:outline-none"
            >
              {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-56"
              />
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/[0.1] dark:text-gray-300 dark:hover:bg-white/[0.05] transition-colors">
              Download
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button
              onClick={() => router.push("/add-employee")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Employee
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-t border-b border-gray-100 dark:border-white/[0.05]">
                {cols.map(({ label, key }) => (
                  <th key={key} onClick={() => handleSort(key)}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {label}<SortIcon />
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">No results found.</td></tr>
              ) : paginated.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{employee.id}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image width={36} height={36} src={employee.user.image} alt={employee.user.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{employee.user.name}</p>
                        <p className="text-xs text-gray-400">{employee.user.PhoneNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{employee.position}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{employee.salary}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{employee.Address}</td>
                  <td className="px-4 py-4">
                    <Badge size="sm" color={statusColor(employee.status)}>{employee.status}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3 text-gray-400">
                      <button className="hover:text-red-500 transition-colors" title="Delete"><TrashIcon /></button>
                      <button onClick={() => setEditingEmployee(employee)} className="hover:text-blue-500 transition-colors" title="Edit"><EditIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}




