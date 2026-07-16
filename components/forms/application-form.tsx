"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema } from "@/lib/validations/schemas";
import type { z } from "zod";

type ApplicationInput = z.infer<typeof applicationSchema>;

export function ApplicationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ApplicationInput>({ resolver: zodResolver(applicationSchema) });

  const onSubmit = (data: ApplicationInput) => {
    console.log("submit", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700">Monthly income</label>
        <input type="number" {...register("income", { valueAsNumber: true })} className="mt-2 w-full rounded-3xl border border-border bg-surface px-4 py-3" />
        <p className="mt-1 text-xs text-red-500">{errors.income?.message}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Household size</label>
        <input type="number" {...register("householdSize", { valueAsNumber: true })} className="mt-2 w-full rounded-3xl border border-border bg-surface px-4 py-3" />
        <p className="mt-1 text-xs text-red-500">{errors.householdSize?.message}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Additional notes</label>
        <textarea {...register("notes")} className="mt-2 w-full rounded-3xl border border-border bg-surface px-4 py-3" rows={4} />
      </div>
      <button type="submit" className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
        Submit Application
      </button>
    </form>
  );
}
