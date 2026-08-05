const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n=== TEST SUBMISSION ===\n');
    
    // 1. Find a user with a draft application
    console.log('1. Finding user with draft application...');
    const draft = await prisma.programApplication.findFirst({
      where: { status: 'draft' },
      include: {
        user: { select: { id: true, email: true, name: true } },
        program: { select: { id: true, slug: true, name: true, organizationId: true } }
      }
    });
    
    if (!draft) {
      console.log('   ❌ No draft application found');
      return;
    }
    
    console.log(`   ✅ Found: ${draft.user?.email} / ${draft.program?.name}`);
    console.log(`   Application ID: ${draft.id}`);
    console.log(`   Program Slug: ${draft.program?.slug}`);
    
    // 2. Build a test payload (minimal but valid)
    console.log('\n2. Building test payload...');
    const testPayload = {
      // Housing
      'housing.state': 'CA',
      'housing.zipCode': '90210',
      'housing.city': 'Los Angeles',
      'housing.county': 'Los Angeles',
      'housing.currentAddress': '123 Main St',
      'housing.currentHousingSituation': 'renting',
      'housing.ownOrRent': 'rent',
      'housing.monthlyRent': '1500',
      'housing.lengthOfResidence': '2',
      'housing.facingEviction': false,
      'housing.wasHomeless': false,
      'housing.priorEviction': false,
      
      // Income
      'income.incomeRange': '20000-40000',
      'income.monthlyIncome': '2500',
      'income.annualIncome': '30000',
      'income.sources': ['employment'],
      
      // Household
      'household.householdSize': 2,
      'household.type': 'couple',
      'household.adults': 2,
      'household.children': 0,
      'household.elderlyMembers': 0,
      'household.disabledMembers': 0,
      
      // Personal
      'personal.isVeteran': false,
      'personal.isDisabilityAffected': false,
      'personal.isSenior': false,
      'personal.isStudent': false,
      'personal.isPublicWorker': false,
      'personal.firstName': 'John',
      'personal.lastName': 'Doe',
      'personal.email': 'john@example.com',
      'personal.phone': '5551234567',
      'personal.dateOfBirth': '1980-01-15',
      'personal.citizenshipStatus': 'citizen',
      
      // Employment
      'employment.status': 'employed',
      'employment.employerName': 'Acme Corp',
      'employment.occupation': 'Software Engineer',
      
      // Financial
      'financial.assets': ['car'],
      'financial.checkingBalance': '5000',
      'financial.savingsBalance': '10000',
      'financial.ownsProperty': false,
      'financial.ownsVehicle': true,
      
      // Banking
      'banking.bankName': 'Chase',
      'banking.accountType': 'checking',
      'banking.routingNumber': '121000248',
      'banking.accountNumber': '12345678',
      'banking.directDeposit': true,
    };
    
    console.log(`   Payload keys: ${Object.keys(testPayload).length}`);
    
    // 3. Simulate what the API endpoint does
    console.log('\n3. Simulating API transformation...');
    
    // Transform function from route
    const KEY_MAPPING = {
      "housing.state": "state",
      "housing.zipCode": "zipCode",
      "housing.city": "city",
      "housing.county": "county",
      "housing.currentAddress": "currentAddress",
      "housing.currentHousingSituation": "currentHousingSituation",
      "housing.ownOrRent": "ownOrRent",
      "housing.monthlyRent": "monthlyRent",
      "housing.lengthOfResidence": "lengthOfResidence",
      "housing.facingEviction": "riskOfEviction",
      "housing.wasHomeless": "wasHomeless",
      "housing.priorEviction": "priorEviction",
      "income.incomeRange": "incomeRange",
      "income.monthlyIncome": "monthlyIncome",
      "income.annualIncome": "annualIncome",
      "income.sources": "incomeSources",
      "household.householdSize": "householdSize",
      "household.type": "householdType",
      "household.adults": "adults",
      "household.children": "children",
      "household.elderlyMembers": "elderlyMembers",
      "household.disabledMembers": "disabledMembers",
      "personal.isVeteran": "isVeteran",
      "personal.isDisabilityAffected": "hasDisability",
      "personal.isSenior": "isSenior",
      "personal.isStudent": "isStudent",
      "personal.isPublicWorker": "isPublicWorker",
      "personal.firstName": "firstName",
      "personal.lastName": "lastName",
      "personal.email": "email",
      "personal.phone": "phone",
      "personal.dateOfBirth": "dateOfBirth",
      "personal.citizenshipStatus": "citizenshipStatus",
      "employment.status": "employmentStatus",
      "employment.employerName": "employerName",
      "employment.occupation": "occupation",
      "financial.assets": "assets",
      "financial.checkingBalance": "checkingBalance",
      "financial.savingsBalance": "savingsBalance",
      "financial.ownsProperty": "ownsProperty",
      "financial.ownsVehicle": "ownsVehicle",
      "banking.bankName": "bankName",
      "banking.accountType": "accountType",
      "banking.routingNumber": "routingNumber",
      "banking.accountNumber": "accountNumber",
      "banking.directDeposit": "directDeposit",
    };
    
    function transformWizardToQuestionSet(wizardData) {
      const transformed = {};
      
      for (const [wizardKey, value] of Object.entries(wizardData)) {
        if (KEY_MAPPING[wizardKey]) {
          const questionSetKey = KEY_MAPPING[wizardKey];
          let normalizedValue = value;
          
          if (typeof value === 'number') {
            normalizedValue = String(value);
          }
          
          if (typeof value === 'boolean') {
            normalizedValue = String(value);
          }
          
          transformed[questionSetKey] = normalizedValue;
          transformed[wizardKey] = value;
        } else if (!wizardKey.includes('.')) {
          const hasNamespacedVersion = Object.values(KEY_MAPPING).includes(wizardKey);
          if (!hasNamespacedVersion) {
            transformed[wizardKey] = value;
          }
        } else {
          transformed[wizardKey] = value;
        }
      }
      
      if (!transformed['isSenior']) {
        const elderlyMembers = transformed['elderlyMembers'] || transformed['household.elderlyMembers'];
        transformed['isSenior'] = elderlyMembers && Number(elderlyMembers) > 0 ? 'true' : 'false';
      }
      
      if (!transformed['isStudent']) {
        transformed['isStudent'] = 'false';
      }
      
      return transformed;
    }
    
    const transformed = transformWizardToQuestionSet(testPayload);
    console.log(`   Transformed keys: ${Object.keys(transformed).length}`);
    
    // Show what's different
    console.log('\n   Transformed Question Set keys:');
    const questionSetKeys = Object.keys(transformed).filter(k => !k.includes('.'));
    questionSetKeys.forEach(k => {
      console.log(`     ${k}: ${JSON.stringify(transformed[k])}`);
    });
    
    // 4. Get the form for the program
    console.log('\n4. Loading form for program...');
    const { getFormForProgram } = await import('./lib/forms/renderer.ts');
    const form = await getFormForProgram(draft.program?.slug ?? '', draft.user?.id);
    const allQuestions = (form.pages ?? []).flatMap((page) => page.questions);
    
    console.log(`   Total questions in form: ${allQuestions.length}`);
    console.log(`   Question keys:`);
    allQuestions.forEach(q => {
      console.log(`     ${q.key}: ${q.required ? 'REQUIRED' : 'OPTIONAL'} (${q.type})`);
    });
    
    // 5. Check which questions are missing from payload
    console.log('\n5. Checking payload coverage...');
    const missing = allQuestions.filter(q => !(q.key in transformed));
    const covered = allQuestions.filter(q => q.key in transformed);
    
    console.log(`   Covered: ${covered.length}/${allQuestions.length}`);
    if (missing.length > 0) {
      console.log(`   ❌ Missing fields:`);
      missing.forEach(q => {
        console.log(`      ${q.key}: ${q.required ? 'REQUIRED' : 'optional'}`);
      });
    }
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
