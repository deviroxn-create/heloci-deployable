import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import { addPropertyImage, deletePropertyImage, uploadPropertyImage, type PropertyImageInput } from "@/lib/properties/admin-property.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const { id } = await params;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "image file is required" }, { status: 400 });
      const organizationId = await getOrganizationContext(user, formData.get("organizationId")?.toString());
      await requireOrgRole(user.id, organizationId, ["org_admin"]);
      const image = await uploadPropertyImage(organizationId, id, file, formData.get("altText")?.toString());
      return NextResponse.json({ image }, { status: 201 });
    }
    const body = await request.json() as PropertyImageInput & { organizationId?: string };
    const organizationId = await getOrganizationContext(user, body.organizationId);
    await requireOrgRole(user.id, organizationId, ["org_admin"]);
    const image = await addPropertyImage(organizationId, id, body);
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add property image.";
    const status = message === "PROPERTY_NOT_FOUND" ? 404 : message === "UNAUTHENTICATED" ? 401 : message === "Unauthorized" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const { id } = await params;
    const imageId = new URL(request.url).searchParams.get("imageId");
    if (!imageId) return NextResponse.json({ error: "imageId is required" }, { status: 400 });
    const organizationId = await getOrganizationContext(user, new URL(request.url).searchParams.get("organizationId"));
    await requireOrgRole(user.id, organizationId, ["org_admin"]);
    await deletePropertyImage(organizationId, id, imageId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete property image.";
    const status = message === "PROPERTY_NOT_FOUND" || message === "PROPERTY_IMAGE_NOT_FOUND" ? 404 : message === "UNAUTHENTICATED" ? 401 : message === "Unauthorized" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}