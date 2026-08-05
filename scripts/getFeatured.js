const {PrismaClient} = require('@prisma/client');
(async ()=>{
  const prisma = new PrismaClient();
  try{
    const programs = await prisma.program.findMany({ where: { status: 'active', isArchived: false, isPublic: true }, orderBy: { priority: 'desc' }, take: 6 });
    console.log('featured programs returned', programs.length);
    for (const p of programs) console.log('-', p.slug, p.priority);
  }catch(e){console.error(e);process.exit(1)}finally{await prisma.$disconnect()}
})();
