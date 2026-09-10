"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Edit3, ImagePlus, Loader2, MapPin, Plus, Save, Trash2, Upload, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Unit = { id: string; beds: number; price: number; available: boolean };
type Image = { id: string; url: string; altText: string | null };
type Property = { id: string; title: string; description: string; address: string; city: string; state: string; zip: string | null; rent: number; bedrooms: number; bathrooms: number; sqft: number; status: string; units: Unit[]; images: Image[] };
type Program = { id: string; name: string; housingGoal: string };
type Readiness = { status: string; checks: Record<string, boolean>; availableUnitCount: number; imageCount: number; readyForProgramAssignment: boolean };
type Assignment = { id: string; programId: string; propertyId: string; isActive: boolean; availableFrom: string | null; availableUntil: string | null; property: { title: string } };

const emptyForm = { title: "", description: "", address: "", city: "", state: "", zip: "", rent: "", bedrooms: "", bathrooms: "", sqft: "" };
const emptyUnit = { beds: "", price: "", available: true };

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Property | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [unitForm, setUnitForm] = useState(emptyUnit);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [assignmentDates, setAssignmentDates] = useState({ availableFrom: "", availableUntil: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [propertyResponse, programResponse] = await Promise.all([fetch("/api/admin/properties"), fetch("/api/admin/programs")]);
      const propertyBody = await propertyResponse.json();
      const programBody = await programResponse.json();
      if (!propertyResponse.ok) throw new Error(propertyBody.error || "Unable to load properties.");
      if (!programResponse.ok) throw new Error(programBody.error || "Unable to load programs.");
      setProperties(propertyBody.properties ?? []);
      setPrograms(Array.isArray(programBody) ? programBody : []);
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load properties."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadData(); }, []);

  async function openProperty(property: Property) {
    const propertyResponse = await fetch(`/api/admin/properties/${property.id}`);
    const propertyBody = await propertyResponse.json();
    const currentProperty = propertyResponse.ok ? propertyBody.property as Property : property;
    setSelected(currentProperty); setForm(propertyToForm(currentProperty)); setError(null); setNotice(null);
    const [readinessResponse, ...assignmentResponses] = await Promise.all([
      fetch(`/api/admin/properties/${property.id}/readiness`),
      ...programs.map((program) => fetch(`/api/admin/programs/${program.id}/properties`))
    ]);
    if (readinessResponse.ok) setReadiness(await readinessResponse.json());
    const found: Assignment[] = [];
    for (const response of assignmentResponses) {
      if (response.ok) {
        const body = await response.json();
        found.push(...(body.assignments ?? []).filter((assignment: Assignment) => assignment.propertyId === property.id));
      }
    }
    setAssignments(found);
  }

  async function request(url: string, init?: RequestInit) {
    const response = await fetch(url, init);
    const body = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(body?.error || "Unable to save property changes.");
    return body;
  }

  async function saveProperty(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return; setSaving(true);
    try { await request(`/api/admin/properties/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toPropertyInput(form)) }); setNotice("Property details saved."); await loadData(); if (selected) await openProperty({ ...selected, ...toPropertyInput(form) } as Property); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save property."); } finally { setSaving(false); }
  }

  async function createProperty(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try { await request("/api/admin/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toPropertyInput(form)) }); setForm(emptyForm); setShowCreate(false); setNotice("Property created."); await loadData(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create property."); } finally { setSaving(false); }
  }

  async function saveUnit(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return;
    try { await request(`/api/admin/properties/${selected.id}/units${editingUnit ? `?unitId=${editingUnit}` : ""}`, { method: editingUnit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ beds: Number(unitForm.beds), price: Number(unitForm.price), available: unitForm.available }) }); setUnitForm(emptyUnit); setEditingUnit(null); setNotice("Unit saved."); await loadData(); await openProperty(selected); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save unit."); }
  }

  async function deleteUnit(unitId: string) { if (!selected || !window.confirm("Remove this unit?")) return; try { await request(`/api/admin/properties/${selected.id}/units?unitId=${unitId}`, { method: "DELETE" }); setNotice("Unit removed."); await loadData(); await openProperty(selected); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to remove unit."); } }
  async function addImage(event: React.FormEvent) { event.preventDefault(); if (!selected) return; try { if (imageFile) { const body = new FormData(); body.set("file", imageFile); await request(`/api/admin/properties/${selected.id}/images`, { method: "POST", body }); } else { await request(`/api/admin/properties/${selected.id}/images`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: imageUrl }) }); } setImageUrl(""); setImageFile(null); setNotice("Image added."); await loadData(); await openProperty(selected); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to add image."); } }
  async function deleteImage(imageId: string) { if (!selected || !window.confirm("Remove this image?")) return; try { await request(`/api/admin/properties/${selected.id}/images?imageId=${imageId}`, { method: "DELETE" }); setNotice("Image removed."); await loadData(); await openProperty(selected); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to remove image."); } }

  async function saveAssignment(assignment?: Assignment, activeOverride?: boolean) {
    if (!selected || (!assignment && !selectedProgram)) return;
    try {
      const programId = assignment?.programId ?? selectedProgram;
      const url = assignment ? `/api/admin/programs/${programId}/properties/${assignment.id}` : `/api/admin/programs/${programId}/properties`;
      await request(url, { method: assignment ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: selected.id, isActive: activeOverride ?? assignment?.isActive ?? true, availableFrom: assignmentDates.availableFrom || null, availableUntil: assignmentDates.availableUntil || null }) });
      setSelectedProgram(""); setAssignmentDates({ availableFrom: "", availableUntil: "" }); setNotice("Program assignment saved."); await openProperty(selected);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save program assignment."); }
  }

  const availableUnits = selected?.units.filter((unit) => unit.available).length ?? 0;
  return <AdminShell title="Property management" description="Manage property details, units, images, readiness, and program visibility." actions={<div className="flex gap-2"><Link href="/admin/properties/import"><Button size="sm" variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></Link><Button size="sm" onClick={() => { setForm(emptyForm); setShowCreate(true); }}><Plus className="mr-2 h-4 w-4" /> Add property</Button></div>}>
    {error && <div className="rounded-2xl border border-error/20 bg-error/5 p-4 text-sm text-error">{error}</div>}
    {notice && <div className="rounded-2xl border border-success/20 bg-success/5 p-4 text-sm text-success">{notice}</div>}
    <div className="grid gap-4 sm:grid-cols-3">{[{ label: "Owned listings", value: properties.length }, { label: "Available properties", value: properties.filter((property) => property.status === "AVAILABLE").length }, { label: "Needs setup", value: properties.filter((property) => property.status !== "AVAILABLE").length }].map((item) => <div key={item.label} className="rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p></div>)}</div>
    {loading ? <div className="mt-5 flex items-center gap-3 rounded-3xl bg-white p-8 text-slate-600"><Loader2 className="h-5 w-5 animate-spin text-brand" /> Loading properties...</div> : properties.length === 0 ? <div className="mt-5 rounded-[28px] border-2 border-dashed border-border bg-white p-10 text-center"><Building2 className="mx-auto h-10 w-10 text-brand/50" /><h2 className="mt-4 font-semibold">No owned properties yet</h2><Button className="mt-5" onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> Add property</Button></div> : <div className="mt-5 grid gap-5 xl:grid-cols-2">{properties.map((property) => <PropertyCard key={property.id} property={property} onOpen={() => void openProperty(property)} />)}</div>}
    {selected && <PropertyWorkspace property={selected} form={form} setForm={setForm} saving={saving} onSave={saveProperty} readiness={readiness} availableUnits={availableUnits} unitForm={unitForm} setUnitForm={setUnitForm} editingUnit={editingUnit} setEditingUnit={setEditingUnit} onSaveUnit={saveUnit} onDeleteUnit={deleteUnit} imageUrl={imageUrl} setImageUrl={setImageUrl} imageFile={imageFile} setImageFile={setImageFile} onAddImage={addImage} onDeleteImage={deleteImage} programs={programs} assignments={assignments} selectedProgram={selectedProgram} setSelectedProgram={setSelectedProgram} assignmentDates={assignmentDates} setAssignmentDates={setAssignmentDates} onSaveAssignment={saveAssignment} onClose={() => setSelected(null)} />}
    {showCreate && <PropertyForm title="Add property" form={form} setForm={setForm} saving={saving} onSubmit={createProperty} onClose={() => setShowCreate(false)} />}
  </AdminShell>;
}

function PropertyCard({ property, onOpen }: { property: Property; onOpen: () => void }) { return <button type="button" onClick={onOpen} className="w-full rounded-[28px] border border-border bg-white p-6 text-left shadow-soft transition hover:border-brand/40"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><Building2 className="h-6 w-6 text-brand" /><div><h2 className="font-semibold text-slate-950">{property.title}</h2><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {property.city}, {property.state}</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">Property: {property.status}</span></div><div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm"><span><strong className="block text-slate-950">{property.units.length}</strong>total units</span><span><strong className="block text-slate-950">{property.units.filter((unit) => unit.available).length}</strong>available units</span><span><strong className="block text-slate-950">{property.images.length}</strong>images</span></div><p className="mt-5 text-sm font-semibold text-brand">Manage lifecycle <Edit3 className="ml-1 inline h-4 w-4" /></p></button>; }

function PropertyWorkspace({ property, form, setForm, saving, onSave, readiness, availableUnits, unitForm, setUnitForm, editingUnit, setEditingUnit, onSaveUnit, onDeleteUnit, imageUrl, setImageUrl, imageFile, setImageFile, onAddImage, onDeleteImage, programs, assignments, selectedProgram, setSelectedProgram, assignmentDates, setAssignmentDates, onSaveAssignment, onClose }: any) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4"><div className="mx-auto my-6 max-w-6xl rounded-3xl bg-slate-50 p-5 shadow-xl md:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Property lifecycle</p><h2 className="mt-2 text-2xl font-semibold text-slate-950">{property.title}</h2></div><Button variant="outline" onClick={onClose}>Close</Button></div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl bg-white p-5"><h3 className="font-semibold">Property details</h3><form onSubmit={onSave} className="mt-4 grid gap-3 sm:grid-cols-2">{(["title", "address", "city", "state", "zip", "rent", "bedrooms", "bathrooms", "sqft"] as const).map((field) => <label key={field} className="text-sm font-medium text-slate-700">{field}<input required={field !== "zip"} type={["rent", "bedrooms", "bathrooms", "sqft"].includes(field) ? "number" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-1 w-full rounded-xl border border-border px-3 py-2" /></label>)}<label className="text-sm font-medium text-slate-700 sm:col-span-2">description<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-border px-3 py-2" /></label><Button type="submit" disabled={saving} className="sm:col-span-2"><Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save details"}</Button></form></section><ReadinessPanel readiness={readiness} availableUnits={availableUnits} /></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><UnitsPanel property={property} unitForm={unitForm} setUnitForm={setUnitForm} editingUnit={editingUnit} setEditingUnit={setEditingUnit} onSave={onSaveUnit} onDelete={onDeleteUnit} /><ImagesPanel property={property} imageUrl={imageUrl} setImageUrl={setImageUrl} imageFile={imageFile} setImageFile={setImageFile} onAdd={onAddImage} onDelete={onDeleteImage} /></div><AssignmentsPanel programs={programs} assignments={assignments} selectedProgram={selectedProgram} setSelectedProgram={setSelectedProgram} dates={assignmentDates} setDates={setAssignmentDates} onSave={onSaveAssignment} readiness={readiness} /></div></div>;
}

function ReadinessPanel({ readiness, availableUnits }: { readiness: Readiness | null; availableUnits: number }) { const checks = readiness ? [{ label: "Organization assigned", value: readiness.checks.organizationAssigned }, { label: "Required details", value: readiness.checks.requiredDetailsComplete }, { label: "Units entered", value: readiness.checks.unitsEntered }, { label: "Available units", value: readiness.checks.availableUnits }, { label: "Images entered", value: readiness.checks.imagesEntered }, { label: "Property status AVAILABLE", value: readiness.status === "AVAILABLE" }] : []; return <section className="rounded-2xl bg-white p-5"><h3 className="font-semibold">Canonical readiness</h3>{readiness ? <><p className="mt-2 text-sm text-slate-600">Property status: <strong>{readiness.status}</strong> · Available units: <strong>{availableUnits}</strong></p><div className="mt-4 grid gap-2">{checks.map((check) => <div key={check.label} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${check.value ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{check.value ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {check.label}</div>)}</div><p className="mt-4 text-sm font-semibold">{readiness.readyForProgramAssignment ? "Ready for active program assignment" : "Not ready for active program assignment"}</p></> : <p className="mt-3 text-sm text-slate-500">Loading readiness...</p>}</section>; }

function UnitsPanel({ property, unitForm, setUnitForm, editingUnit, setEditingUnit, onSave, onDelete }: any) { return <section className="rounded-2xl bg-white p-5"><h3 className="font-semibold">Units</h3><p className="mt-2 text-sm text-slate-600">Total: {property.units.length} · Available: {property.units.filter((unit: Unit) => unit.available).length} · Unavailable: {property.units.filter((unit: Unit) => !unit.available).length}</p><div className="mt-4 space-y-2">{property.units.map((unit: Unit) => <div key={unit.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm"><span>{unit.beds} beds · ${unit.price.toLocaleString()} · {unit.available ? "Available" : "Unavailable"}</span><span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditingUnit(unit.id); setUnitForm({ beds: String(unit.beds), price: String(unit.price), available: unit.available }); }}>Edit</Button><Button size="sm" variant="outline" onClick={() => void onDelete(unit.id)}><Trash2 className="h-4 w-4" /></Button></span></div>)}</div><form onSubmit={onSave} className="mt-4 flex flex-wrap gap-2"><input required type="number" min="0" placeholder="Beds" value={unitForm.beds} onChange={(event) => setUnitForm({ ...unitForm, beds: event.target.value })} className="w-24 rounded-xl border border-border px-3 py-2" /><input required type="number" min="0" placeholder="Price" value={unitForm.price} onChange={(event) => setUnitForm({ ...unitForm, price: event.target.value })} className="w-28 rounded-xl border border-border px-3 py-2" /><label className="flex items-center gap-2 px-2 text-sm"><input type="checkbox" checked={unitForm.available} onChange={(event) => setUnitForm({ ...unitForm, available: event.target.checked })} /> Available</label><Button type="submit">{editingUnit ? "Save unit" : "Add unit"}</Button></form></section>; }

function ImagesPanel({ property, imageUrl, setImageUrl, imageFile, setImageFile, onAdd, onDelete }: any) { return <section className="rounded-2xl bg-white p-5"><h3 className="font-semibold">Images</h3><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{property.images.map((image: Image) => <div key={image.id} className="relative overflow-hidden rounded-xl border border-border"><img src={image.url} alt={image.altText || property.title} className="aspect-[4/3] w-full object-cover" /><button type="button" aria-label="Remove image" onClick={() => void onDelete(image.id)} className="absolute right-2 top-2 rounded-lg bg-white/90 p-2 text-error"><Trash2 className="h-4 w-4" /></button></div>)}</div><form onSubmit={onAdd} className="mt-4 grid gap-2"><input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} className="block w-full text-sm" /><div className="flex gap-2"><input type="url" placeholder="Or image URL" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-border px-3 py-2" /><Button type="submit"><ImagePlus className="mr-2 h-4 w-4" /> Add image</Button></div></form></section>; }

function AssignmentsPanel({ programs, assignments, selectedProgram, setSelectedProgram, dates, setDates, onSave, readiness }: any) { const selectedAssignment = assignments.find((assignment: Assignment) => assignment.programId === selectedProgram); return <section className="mt-5 rounded-2xl bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Program assignments</h3><p className="mt-1 text-sm text-slate-600">Active assignments are enabled only when canonical readiness passes.</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${readiness?.readyForProgramAssignment ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{readiness?.readyForProgramAssignment ? "Ready" : "Not ready"}</span></div><div className="mt-4 space-y-3">{assignments.map((assignment: Assignment) => <div key={assignment.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><strong>{programs.find((program: Program) => program.id === assignment.programId)?.name || assignment.programId}</strong><p className="text-xs text-slate-500">{assignment.isActive ? "Active" : "Inactive"} · {assignment.availableFrom ? new Date(assignment.availableFrom).toLocaleDateString() : "No start"} to {assignment.availableUntil ? new Date(assignment.availableUntil).toLocaleDateString() : "No end"}</p></div><Button size="sm" variant="outline" onClick={() => { setSelectedProgram(assignment.programId); setDates({ availableFrom: assignment.availableFrom?.slice(0, 10) || "", availableUntil: assignment.availableUntil?.slice(0, 10) || "" }); }}>{assignment.isActive ? "Edit dates / deactivate" : "Edit dates / activate"}</Button></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><select value={selectedProgram} onChange={(event) => setSelectedProgram(event.target.value)} className="rounded-xl border border-border px-3 py-2"><option value="">Assign a program...</option>{programs.filter((program: Program) => !assignments.some((assignment: Assignment) => assignment.programId === program.id)).map((program: Program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select><input type="date" value={dates.availableFrom} onChange={(event) => setDates({ ...dates, availableFrom: event.target.value })} className="rounded-xl border border-border px-3 py-2" /><input type="date" value={dates.availableUntil} onChange={(event) => setDates({ ...dates, availableUntil: event.target.value })} className="rounded-xl border border-border px-3 py-2" />{selectedAssignment ? <><Button onClick={() => void onSave(selectedAssignment)}>Save dates</Button><Button variant="outline" onClick={() => void onSave(selectedAssignment, !selectedAssignment.isActive)} disabled={!selectedAssignment.isActive && !readiness?.readyForProgramAssignment}>{selectedAssignment.isActive ? "Deactivate" : "Activate"}</Button></> : <Button onClick={() => void onSave()} disabled={!readiness?.readyForProgramAssignment || !selectedProgram}>Assign active</Button>}</div></section>; }

function PropertyForm({ title, form, setForm, saving, onSubmit, onClose }: any) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{title}</h2><Button type="button" variant="outline" onClick={onClose}>Close</Button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{(["title", "address", "city", "state", "zip", "rent", "bedrooms", "bathrooms", "sqft"] as const).map((field) => <label key={field} className="text-sm font-medium text-slate-700">{field}<input required={field !== "zip"} type={["rent", "bedrooms", "bathrooms", "sqft"].includes(field) ? "number" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-1 w-full rounded-xl border border-border px-3 py-2" /></label>)}<label className="text-sm font-medium text-slate-700 sm:col-span-2">description<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-border px-3 py-2" /></label></div><Button type="submit" disabled={saving} className="mt-6"><Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save property"}</Button></form></div>; }

function propertyToForm(property: Property) { return { title: property.title, description: property.description, address: property.address, city: property.city, state: property.state, zip: property.zip || "", rent: String(property.rent), bedrooms: String(property.bedrooms), bathrooms: String(property.bathrooms), sqft: String(property.sqft) }; }
function toPropertyInput(form: typeof emptyForm) { return { ...form, rent: Number(form.rent), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), sqft: Number(form.sqft), zip: form.zip || null }; }