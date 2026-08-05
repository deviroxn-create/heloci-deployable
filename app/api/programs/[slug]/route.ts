import { NextResponse } from "next/server";
import { getPublicProgramBySlug } from "@/lib/programs/program.service";

/**
 * GET /api/programs/[slug]
 * Public program detail endpoint — used by the application wizard header
 * and the program detail page to avoid a server component fetch.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const program = await getPublicProgramBySlug(slug);

    if (!program || program.isArchived || !program.isPublic) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unable to load program." },
      { status: 500 }
    );
  }
}
