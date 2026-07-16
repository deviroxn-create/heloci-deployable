import { Building2, Plus, MapPin, Edit2, Eye, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";

const properties = [
  {
    id: "PROP-001",
    title: "Cedar Grove Supportive Home",
    address: "120 Central Ave, Portland, OR 97209",
    rent: 720,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 840,
    status: "Available",
    amenities: ["Transit access", "Community kitchen", "Service coordination"]
  },
  {
    id: "PROP-002",
    title: "Harborview Family Residence",
    address: "438 Harbor Blvd, Seattle, WA 98101",
    rent: 850,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1100,
    status: "Available",
    amenities: ["School access", "Medical shuttle", "Case manager"]
  },
  {
    id: "PROP-003",
    title: "Willow Lane Transitional Unit",
    address: "781 Willow Ln, Austin, TX 78701",
    rent: 680,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 680,
    status: "Occupied",
    amenities: ["Vet services", "Counseling", "Transit"]
  },
  {
    id: "PROP-004",
    title: "Maple Street Veterans Home",
    address: "205 Maple St, Denver, CO 80203",
    rent: 590,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 620,
    status: "Under review",
    amenities: ["VA support", "Employment help", "Peer support"]
  }
];

const statusStyles: Record<string, string> = {
  Available: "bg-success/10 text-success",
  Occupied: "bg-slate-100 text-slate-600",
  "Under review": "bg-warning/10 text-warning"
};

export default function AdminPropertiesPage() {
  return (
    <AdminShell
      title="Property management"
      description="Manage listings, update availability, and publish housing opportunities."
      actions={
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add property
        </Button>
      }
    >
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total listings", value: "64", color: "text-slate-950" },
          { label: "Available", value: "41", color: "text-success" },
          { label: "Occupied", value: "23", color: "text-slate-500" }
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Property cards */}
      <div className="grid gap-5 xl:grid-cols-2">
        {properties.map((property) => (
          <div key={property.id} className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{property.id}</p>
                  <h3 className="font-semibold text-slate-950">{property.title}</h3>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[property.status]}`}>
                {property.status}
              </span>
            </div>

            {/* Address */}
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-brand" />
              {property.address}
            </div>

            {/* Details */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
                <p className="text-xs text-slate-500">Bedrooms</p>
                <p className="mt-0.5 text-base font-semibold text-slate-950">{property.bedrooms}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
                <p className="text-xs text-slate-500">Bathrooms</p>
                <p className="mt-0.5 text-base font-semibold text-slate-950">{property.bathrooms}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
                <p className="text-xs text-slate-500">Sq ft</p>
                <p className="mt-0.5 text-base font-semibold tabular-nums text-slate-950">{property.sqft}</p>
              </div>
            </div>

            {/* Rent */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-950">${property.rent}<span className="text-sm font-normal text-slate-500">/mo</span></p>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.slice(0, 2).map((a) => (
                  <span key={a} className="rounded-full bg-brand/5 px-2.5 py-1 text-xs font-medium text-brand">{a}</span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2 border-t border-border pt-4">
              <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-white py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                <Eye className="h-4 w-4" /> View
              </button>
              <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-white py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                <Edit2 className="h-4 w-4" /> Edit
              </button>
              <button type="button" className="flex items-center justify-center rounded-2xl border border-error/20 bg-error/5 px-3 py-2 text-sm font-medium text-error transition hover:bg-error/10" aria-label="Remove property">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add property CTA */}
      <div className="rounded-[28px] border-2 border-dashed border-border bg-white p-8 text-center shadow-soft">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Plus className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-950">Add a new property</h3>
        <p className="mt-2 text-sm text-slate-500">Publish a verified housing unit to the platform for applicant search and applications.</p>
        <Button className="mt-5" size="sm">Add property listing</Button>
      </div>
    </AdminShell>
  );
}
