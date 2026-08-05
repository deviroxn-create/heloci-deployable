const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n=== PHASE 5H.5: SUBMISSION ARCHITECTURE TRACE ===\n');
    
    // ============================================================
    // STEP 1: Get all programs and their forms
    // ============================================================
    console.log('STEP 1: Enumerate all programs and their question sets\n');
    
    const programs = await prisma.program.findMany({
      include: {
        questionSets: {
          where: { isActive: true },
          include: {
            pages: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Found ${programs.length} programs:\n`);
    
    for (const prog of programs) {
      console.log(`\n📋 PROGRAM: "${prog.name}" (slug: ${prog.slug})`);
      console.log(`   Active Question Sets: ${prog.questionSets.length}`);
      
      for (const qs of prog.questionSets) {
        const allQs = qs.pages.flatMap(p => p.questions);
        console.log(`   ├─ QuestionSet v${qs.version}:`);
        console.log(`   │  Pages: ${qs.pages.length}`);
        console.log(`   │  Total Questions: ${allQs.length}`);
        console.log(`   │  Question Keys: ${allQs.map(q => q.key).join(', ')}`);
        
        // Show required vs optional
        const required = allQs.filter(q => q.required).map(q => q.key);
        const optional = allQs.filter(q => !q.required).map(q => q.key);
        console.log(`   │  Required: ${required.join(', ')}`);
        console.log(`   │  Optional: ${optional.join(', ')}`);
      }
    }
    
    // ============================================================
    // STEP 2: Get a draft application
    // ============================================================
    console.log('\n\nSTEP 2: Examine a draft application\n');
    
    const draft = await prisma.programApplication.findFirst({
      where: { status: 'draft' },
      include: {
        user: { select: { id: true, email: true, name: true } },
        program: { select: { id: true, slug: true, name: true } }
      }
    });
    
    if (!draft) {
      console.log('❌ No draft application found. Cannot proceed with architecture analysis.');
      return;
    }
    
    console.log(`📝 Application: ${draft.id}`);
    console.log(`👤 User: ${draft.user.email}`);
    console.log(`📋 Program: ${draft.program.name} (${draft.program.slug})`);
    
    // ============================================================
    // STEP 3: Analyze what data the UI collected
    // ============================================================
    console.log('\n\nSTEP 3: Analyze wizard payload structure\n');
    
    // We need to check what fields exist in the saved draft data
    if (draft.data && typeof draft.data === 'object') {
      const draftData = draft.data;
      const draftKeys = Object.keys(draftData).sort();
      
      console.log(`Draft has ${draftKeys.length} saved fields:\n`);
      
      // Group by namespace
      const byNamespace = {};
      draftKeys.forEach(key => {
        const namespace = key.includes('.') ? key.split('.')[0] : 'root';
        if (!byNamespace[namespace]) byNamespace[namespace] = [];
        byNamespace[namespace].push(key);
      });
      
      Object.entries(byNamespace).forEach(([ns, keys]) => {
        console.log(`   ${ns}:`);
        keys.forEach(k => {
          const value = draftData[k];
          const type = Array.isArray(value) ? 'array' : typeof value;
          console.log(`     - ${k}: ${type} = ${JSON.stringify(value).substring(0, 40)}`);
        });
      });
    }
    
    // ============================================================
    // STEP 4: Compare Wizard Fields vs Question Set
    // ============================================================
    console.log('\n\nSTEP 4: Compare wizard fields vs question set\n');
    
    const program = draft.program;
    const qs = program.questionSets?.[0];
    
    if (!qs) {
      console.log('❌ No question set found for program');
      return;
    }
    
    const allQuestions = qs.pages.flatMap(p => p.questions);
    const questionKeys = allQuestions.map(q => q.key);
    const draftData = draft.data || {};
    const draftKeys = Object.keys(draftData);
    
    console.log(`Wizard Namespace Fields: ${draftKeys.length}`);
    console.log(`Question Set Fields: ${questionKeys.length}\n`);
    
    console.log('QUESTION SET EXPECTATIONS:');
    allQuestions.forEach(q => {
      const wizardHasIt = draftKeys.some(k => k.includes(q.key));
      const status = wizardHasIt ? '✅' : '❌';
      console.log(`  ${status} ${q.key} (${q.required ? 'REQUIRED' : 'optional'}) [type: ${q.type}]`);
    });
    
    console.log('\n\nWIZARD FIELDS NOT IN QUESTION SET:');
    const questionsAsValues = new Set(questionKeys);
    let wizardOnlyCount = 0;
    draftKeys.forEach(wizKey => {
      // Check if this wizard key maps to any question
      const isDirectMatch = questionKeys.includes(wizKey);
      const isNamespacedMatch = questionKeys.some(qk => {
        const namespace = wizKey.split('.')[0];
        const field = wizKey.split('.')[1];
        return qk.toLowerCase().includes(field?.toLowerCase());
      });
      
      if (!isDirectMatch && !isNamespacedMatch) {
        console.log(`  ⚠️  ${wizKey} (no matching question)`);
        wizardOnlyCount++;
      }
    });
    
    if (wizardOnlyCount === 0) {
      console.log('  (None - all wizard fields map to questions)');
    }
    
    // ============================================================
    // STEP 5: Key architectural question
    // ============================================================
    console.log('\n\nSTEP 5: ARCHITECTURAL ANALYSIS\n');
    
    console.log('Current Submission Flow:');
    console.log('  1. UI collects ~80+ wizard fields (namespaced)');
    console.log(`  2. POST /submit receives wizard payload`);
    console.log('  3. transformWizardToQuestionSet() maps namespace keys');
    console.log(`  4. getFormForProgram() loads ${questionKeys.length} question definitions`);
    console.log('  5. validatePage() validates mapped payload against question set');
    console.log('  6. If valid: update database');
    console.log('  7. If invalid: HTTP 400\n');
    
    console.log('THE QUESTION:');
    console.log('Should submitApplication() validate:');
    console.log('  A) The complete wizard payload (all ~80 fields)?');
    console.log('  B) Only the question set fields (11 fields)?');
    console.log('  C) Something else?\n');
    
    // ============================================================
    // STEP 6: Check what validation schema is actually used
    // ============================================================
    console.log('STEP 6: Validation Schema Source\n');
    console.log('Current code path:');
    console.log('  const form = await getFormForProgram(program?.slug, userId);');
    console.log('  const allQuestions = form.pages.flatMap(page => page.questions);');
    console.log(`  const validation = validatePage(allQuestions, questionSetPayload);\n`);
    
    console.log(`This means validation schema comes from:`);
    console.log(`  Program "${program.name}" → QuestionSet v${qs.version}`);
    console.log(`  Question count: ${questionKeys.length}`);
    console.log(`  So it IS validating against the question set, not the full wizard.\n`);
    
    // ============================================================
    // STEP 7: What happens to non-question-set fields?
    // ============================================================
    console.log('STEP 7: Fate of Wizard-Only Fields\n');
    
    console.log('After validation passes, the database stores:');
    console.log('  data: {');
    console.log('    ...existing_data,');
    console.log('    ...questionSetPayload  ← Only validated fields');
    console.log('  }');
    console.log('\nSo wizard-only fields are:');
    console.log('  - Transformed by transformWizardToQuestionSet()');
    console.log('  - But NOT validated');
    console.log('  - And NOT stored in the database');
    console.log('  - They are LOST\n');
    
    // ============================================================
    // STEP 8: Conclusion
    // ============================================================
    console.log('CONCLUSION:\n');
    
    console.log('The submission endpoint IS intentionally validating against');
    console.log(`the eligibility form (${questionKeys.length} questions).`);
    console.log('\nBUT there\'s a design issue:');
    console.log('  - Wizard collects ~80 fields');
    console.log(`  - Question set validates only ~${questionKeys.length} fields`);
    console.log('  - Non-validated fields are silently discarded');
    console.log('\nThis suggests TWO possible architectures:');
    console.log('\n  OPTION A (Current?): Two-step validation');
    console.log('    1. Save full wizard data during form filling');
    console.log('    2. On submit, validate only eligibility questions');
    console.log('    3. Store only validated portion');
    console.log('\n  OPTION B (Alternative?): Single validation');
    console.log('    1. Validate entire wizard upfront');
    console.log('    2. Save only if all data valid');
    console.log('    3. Store complete wizard payload\n');
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
