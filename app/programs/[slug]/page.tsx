import { prisma } from "@/lib/prisma/client";
import ProgramDetails from "@/components/ProgramDetails";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const program = await prisma.program.findUnique({
    where: { slug },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      questionSets: { where: { isActive: true }, select: { id: true, name: true } }
    }
  });

  if (!program || program.isArchived || !program.isPublic) return notFound();

  const hasQuestionSet = (program.questionSets || []).length > 0;

  return (
    <div className="space-y-6">
      <ProgramDetails program={{
        id: program.id,
        name: program.name,
        slug: program.slug,
        organization: program.organization ? { id: program.organization.id, name: program.organization.name } : null,
        housingGoal: program.housingGoal,
        category: program.category,
        matchDescription: program.matchDescription,
        summary: program.summary,
        description: program.description,
        deadline: program.deadline ? program.deadline.toISOString() : null,
        hasQuestionSet
      }} />
    </div>
  );
}
