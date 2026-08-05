const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n=== FORM SCHEMA INSPECTION ===\n');
    
    // Find the default program
    const program = await prisma.program.findFirst({
      where: { slug: 'global-eligibility' },
      include: {
        questionSets: {
          where: { isActive: true },
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            pages: {
              orderBy: { sortOrder: 'asc' },
              include: {
                questions: {
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        }
      }
    });
    
    if (!program?.questionSets?.[0]) {
      console.log('❌ No form found');
      return;
    }
    
    console.log(`Program: ${program.name}`);
    const qs = program.questionSets[0];
    console.log(`QuestionSet: v${qs.version} (${qs.isActive ? 'ACTIVE' : 'INACTIVE'})`);
    console.log(`Pages: ${qs.pages.length}`);
    
    // List all questions
    console.log('\n📋 ALL QUESTIONS:');
    const allQuestions = qs.pages.flatMap(p => p.questions);
    console.log(`Total: ${allQuestions.length}\n`);
    
    allQuestions.forEach((q, idx) => {
      console.log(`${idx + 1}. KEY: ${q.key}`);
      console.log(`   Type: ${q.type}`);
      console.log(`   Required: ${q.required}`);
      console.log(`   Label: ${q.label}`);
      if (q.validation) {
        console.log(`   Validation: ${JSON.stringify(q.validation)}`);
      }
      console.log('');
    });
    
    // Group by type
    console.log('\n📊 SUMMARY BY TYPE:');
    const byType = {};
    allQuestions.forEach(q => {
      byType[q.type] = (byType[q.type] || 0) + 1;
    });
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
    // Required fields
    console.log('\n🔴 REQUIRED FIELDS:');
    const required = allQuestions.filter(q => q.required);
    required.forEach(q => {
      console.log(`   ${q.key}`);
    });
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
