"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddStaffModal } from "@/components/admin/add-staff-modal";

export function AddStaffModalTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add staff member
      </Button>
      <AddStaffModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
