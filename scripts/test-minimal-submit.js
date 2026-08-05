const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n=== MINIMAL SUBMISSION TEST ===\n');
    
    // Find a draft application
    const draft = await prisma.programApplication.findFirst({
      where: { status: 'draft' },
      include: {
        user: { select: { id: true, email: true } },
        program: { select: { id: true, slug: true } }
      }
    });
    
    if (!draft) {
      console.log('❌ No draft application found. Creating one...');
      // Create a test user and application
      const user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          name: 'Test User',
          password: 'dummy',
        }
      });
      
      const program = await prisma.program.findFirst({
        where: { slug: 'global-eligibility' }
      });
      
      if (!program) {
        console.log('❌ No program found');
        return;
      }
      
      const app = await prisma.programApplication.create({
        data: {
          userId: user.id,
          programId: program.id,
          status: 'draft',
          data: {}
        }
      });
      
      console.log(`✅ Created: User=${user.email}, App=${app.id}`);
      
      draft = {
        id: app.id,
        user: { id: user.id, email: user.email },
        program: { id: program.id, slug: program.slug }
      };
    }
    
    console.log(`📝 Application: ${draft.id}`);
    console.log(`👤 User: ${draft.user.email}`);
    console.log(`📋 Program: ${draft.program.slug}`);
    
    // Build MINIMAL payload with only the 11 required fields
    console.log('\n1. Building MINIMAL payload with 11 required fields...');
    const minimalPayload = {
      'income.incomeRange': 'under-20000',
      'household.householdSize': 1,
      'personal.isVeteran': false,
      'personal.isDisabilityAffected': false,
      'personal.isSenior': false,
      'housing.currentHousingSituation': 'renting',
      'housing.facingEviction': false,
      'housing.housingGoals': ['affordable-housing']
    };
    
    console.log(`   Payload keys: ${Object.keys(minimalPayload).length}`);
    Object.entries(minimalPayload).forEach(([k, v]) => {
      console.log(`     ${k}: ${JSON.stringify(v)}`);
    });
    
    // Transform
    console.log('\n2. Transforming to question set...');
    const KEY_MAPPING = {
      "housing.state": "state",
      "housing.zipCode": "zipCode",
      "housing.city": "city",
      "housing.county": "county",
      "housing.currentAddress": "currentAddress",
      "housing.currentHousingSituation": "currentHousingSituation",  // ← BUG: should be currentHousing
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
      "housing.housingGoals": "housingGoals",
    };
    
    function transform(wizard) {
      const result = {};
      for (const [k, v] of Object.entries(wizard)) {
        if (KEY_MAPPING[k]) {
          const qKey = KEY_MAPPING[k];
          let normalized = v;
          if (typeof v === 'number') normalized = String(v);
          if (typeof v === 'boolean') normalized = String(v);
          result[qKey] = normalized;
          result[k] = v;
        } else if (!k.includes('.')) {
          if (!Object.values(KEY_MAPPING).includes(k)) {
            result[k] = v;
          }
        } else {
          result[k] = v;
        }
      }
      
      if (!result.isSenior) {
        const elderly = result.elderlyMembers || result['household.elderlyMembers'];
        result.isSenior = elderly && Number(elderly) > 0 ? 'true' : 'false';
      }
      
      if (!result.isStudent) {
        result.isStudent = 'false';
      }
      
      return result;
    }
    
    const transformed = transform(minimalPayload);
    console.log(`   ✅ Transformed keys: ${Object.keys(transformed).length}`);
    
    console.log('\n3. What the validator will see:');
    const EXPECTED_KEYS = [
      'incomeRange', 'householdSize', 'state', 'zipCode',
      'isVeteran', 'hasDisability', 'isSenior', 'isStudent',
      'currentHousing', 'riskOfEviction', 'housingGoals'
    ];
    
    EXPECTED_KEYS.forEach(key => {
      const value = transformed[key];
      const status = value !== undefined ? '✅' : '❌';
      console.log(`   ${status} ${key}: ${JSON.stringify(value)}`);
    });
    
    console.log('\n4. THE BUG:');
    console.log(`   ❌ Transformer maps to "currentHousingSituation": ${transformed.currentHousingSituation}`);
    console.log(`   ✅ But validator expects "currentHousing"`);
    console.log(`   RESULT: Validation fails because currentHousing is missing!`);
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
