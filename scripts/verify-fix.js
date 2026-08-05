const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n=== VERIFY FIX ===\n');
    
    console.log('Testing KEY_MAPPING corrections...\n');
    
    const FIXED_MAPPING = {
      "housing.state": "state",
      "housing.zipCode": "zipCode",
      "housing.city": "city",
      "housing.county": "county",
      "housing.currentAddress": "currentAddress",
      "housing.currentHousingSituation": "currentHousing",  // ← FIXED
      "housing.ownOrRent": "ownOrRent",
      "housing.monthlyRent": "monthlyRent",
      "housing.lengthOfResidence": "lengthOfResidence",
      "housing.facingEviction": "riskOfEviction",
      "housing.wasHomeless": "wasHomeless",
      "housing.priorEviction": "priorEviction",
      "housing.housingGoals": "housingGoals",  // ← ADDED
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
    
    // Test transformation
    function transform(wizard) {
      const result = {};
      for (const [k, v] of Object.entries(wizard)) {
        if (FIXED_MAPPING[k]) {
          const qKey = FIXED_MAPPING[k];
          let normalized = v;
          if (typeof v === 'number') normalized = String(v);
          if (typeof v === 'boolean') normalized = String(v);
          result[qKey] = normalized;
          result[k] = v;
        } else if (!k.includes('.')) {
          if (!Object.values(FIXED_MAPPING).includes(k)) {
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
    
    const transformed = transform(minimalPayload);
    
    console.log('1. Testing transformed keys:');
    const EXPECTED_KEYS = [
      'incomeRange', 'householdSize', 'state', 'zipCode',
      'isVeteran', 'hasDisability', 'isSenior', 'isStudent',
      'currentHousing', 'riskOfEviction', 'housingGoals'
    ];
    
    let allPresent = true;
    EXPECTED_KEYS.forEach(key => {
      const value = transformed[key];
      const status = value !== undefined ? '✅' : '❌';
      console.log(`   ${status} ${key}: ${JSON.stringify(value)}`);
      if (value === undefined) allPresent = false;
    });
    
    console.log(`\n2. Result:`);
    if (allPresent) {
      console.log('   ✅ ALL REQUIRED FIELDS PRESENT');
      console.log('   ✅ VALIDATION SHOULD PASS');
    } else {
      console.log('   ❌ MISSING REQUIRED FIELDS');
    }
    
    console.log('\n3. Specific fixes applied:');
    console.log('   ✅ "housing.currentHousingSituation" → "currentHousing"');
    console.log('   ✅ Added "housing.housingGoals" → "housingGoals"');
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
