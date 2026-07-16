"use client";

import { useState } from "react";
import { Users, ClipboardList, MessageSquare, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { AddStaffModal } from "@/components/admin/add-staff-modal";

const staffMembers = [
  {
    id: "STAFF-001",
    name: "Maya Thompson",
    email: "maya.t@heloci.ngo",
    assignedCases: 12,
    resolved: 47,
    unread: 3,
    status: "Active"
  },
  {
    id: "STAFF-002",
    name: "Priya Anand",
    email: "priya.a@heloci.ngo",
    assignedCases: 9,
    resolved: 61,
    unread: 1,
    status: "Active"
  },
  {
    id: "STAFF-003",
    name: "Leon Murray",
    email: "leon.m@heloci.ngo",
    assignedCases: 14,
    resolved: 38,
    unread: 5,
    status: "Active"
  },
  {
    id: "STAFF-004",
    name: "Sofia Ramirez",
    email: "sofia.r@heloci.ngo",
    assignedCases: 0,
    resolved: 22,
    unread: 0,
    status: "On leave"
  }
];

export default function AdminStaffPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <AdminShell
        title="Staff management"
        description="View staff case loads, track performance, and manage accounts."
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add staff member
          </Button>
        }
      >
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total staff", value: "18" },
            { label: "Active today", value: "14" },
            { label: "Total open cases", value: "35" }
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Staff cards */}
        <div className="grid gap-5 xl:grid-cols-2">
          {staffMembers.map((staff) => (
            <div key={staff.id} className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-lg font-bold text-brand">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{staff.name}</p>
                    <p className="text-xs text-slate-500">{staff.email}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${staff.status === "Active" ? "bg-success/10 text-success" : "bg-slate-100 text-slate-500"}`}>
                  {staff.status}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-brand">
                    <ClipboardList className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{staff.assignedCases}</p>
                  <p className="text-xs text-slate-500">Open cases</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-success">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{staff.resolved}</p>
                  <p className="text-xs text-slate-500">Resolved</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-warning">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{staff.unread}</p>
                  <p className="text-xs text-slate-500">Unread</p>
                </div>
              </div>

              <div className="mt-5 flex gap-2 border-t border-border pt-4">
                <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  View cases
                </button>
                <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-brand/10 py-2 text-sm font-medium text-brand transition hover:bg-brand/20">
                  Assign case
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminShell>

      <AddStaffModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
