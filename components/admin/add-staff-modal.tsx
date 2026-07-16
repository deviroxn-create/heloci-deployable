"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createStaffMember } from "@/actions/staff.actions";

const schema = z
  .object({
    name: z.string().min(2, "Enter the staff member's full name."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Please confirm the password.")
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddStaffModal({ open, onClose }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const result = await createStaffMember({
      name: values.name,
      email: values.email,
      password: values.password
    });

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    setSuccessEmail(result.email);
    reset();
  };

  const handleClose = () => {
    reset();
    setServerError(null);
    setSuccessEmail(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Admin action</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Add staff member</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border text-slate-500 hover:bg-slate-50 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {successEmail ? (
          <div className="space-y-4">
            <div className="rounded-[20px] border border-success/20 bg-success/5 px-5 py-4">
              <p className="font-semibold text-success">Staff account created</p>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-medium">{successEmail}</span> can now sign in and access the staff dashboard.
              </p>
            </div>
            <Button className="w-full h-12 rounded-2xl" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Full name" error={errors.name?.message}>
              <input
                {...register("name")}
                type="text"
                autoComplete="name"
                placeholder="e.g. Maya Thompson"
                className="input-base"
              />
            </Field>

            <Field label="Email address" error={errors.email?.message}>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="staff@heloci.ngo"
                className="input-base"
              />
            </Field>

            <Field label="Temporary password" error={errors.password?.message}>
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="input-base"
              />
            </Field>

            <Field label="Confirm password" error={errors.confirmPassword?.message}>
              <input
                {...register("confirmPassword")}
                type="password"
                autoComplete="new-password"
                placeholder="Repeat the password"
                className="input-base"
              />
            </Field>

            {serverError ? (
              <p className="rounded-[16px] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                {serverError}
              </p>
            ) : null}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-2xl"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-2xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
