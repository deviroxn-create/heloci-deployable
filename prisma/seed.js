"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const requireEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
// ─── Dev credentials ──────────────────────────────────────────────────────────
const USERS = [
    {
        email: "superadmin@heloci.platform",
        password: requireEnv("DEFAULT_ADMIN_PASSWORD"),
        name: "Platform Super Admin",
        role: "SUPER_ADMIN",
        label: "super_admin",
        organizationId: null // Platform Super Admin
    },
    {
        email: "admin@heloci.ngo",
        password: requireEnv("DEFAULT_ADMIN_PASSWORD"),
        name: "Heloci Admin",
        role: "ADMIN",
        label: "admin",
        organizationId: "org_heloci"
    },
    {
        email: "staff@heloci.ngo",
        password: requireEnv("STAFF_DEFAULT_PASSWORD"),
        name: "Maya Thompson",
        role: "STAFF",
        label: "staff",
        organizationId: "org_heloci"
    },
    {
        email: "reviewer@heloci.ngo",
        password: requireEnv("REVIEWER_DEFAULT_PASSWORD"),
        name: "Carlos Rodriguez",
        role: "STAFF",
        label: "reviewer",
        organizationId: "org_heloci"
    },
    {
        email: "admin@texas.gov",
        password: requireEnv("TEXAS_ADMIN_DEFAULT_PASSWORD"),
        name: "Texas Admin",
        role: "ADMIN",
        label: "texas_admin",
        organizationId: "org_texas"
    },
    {
        email: "reviewer@texas.gov",
        password: requireEnv("TEXAS_REVIEWER_DEFAULT_PASSWORD"),
        name: "Jessica Williams",
        role: "STAFF",
        label: "texas_reviewer",
        organizationId: "org_texas"
    },
    {
        email: "admin@california.gov",
        password: requireEnv("CALIFORNIA_ADMIN_DEFAULT_PASSWORD"),
        name: "California Admin",
        role: "ADMIN",
        label: "california_admin",
        organizationId: "org_california"
    },
    {
        email: "applicant@heloci.ngo",
        password: requireEnv("APPLICANT_DEFAULT_PASSWORD"),
        name: "Jordan Rivera",
        role: "APPLICANT",
        label: "applicant",
        organizationId: null // Applicants don't belong to orgs
    }
];
// ─── Houston property data (from Zillow feed) ─────────────────────────────────
// Units: price is stored as an integer (dollars, no cents)
// We strip "$" and "+" from the price strings
function parsePrice(raw) {
    return parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0;
}
const HOUSTON_PROPERTIES = [
    {
        externalId: "aster-on-aldine",
        title: "Aster on Aldine",
        description: "Modern apartment community in North Houston with resort-style amenities and spacious floor plans.",
        address: "Houston, TX",
        addressStreet: null,
        city: "Houston",
        state: "TX",
        zip: "77060",
        latitude: 29.776705,
        longitude: -95.62517,
        contactPhone: "832-769-0957",
        imageUrl: "/images/properties/aster-on-aldine.jpg.jpg",
        availabilityCount: 19,
        specialOffers: ["Two sparkling swimming pools"],
        units: [
            { beds: 1, price: "$1,669+" },
            { beds: 2, price: "$2,155+" },
            { beds: 3, price: "$2,723+" }
        ]
    },
    {
        externalId: "novu-new-forest",
        title: "Novu New Forest",
        description: "Contemporary apartments in East Houston featuring resort-inspired amenities and modern finishes.",
        address: "6301 Pale Sage Dr, Houston, TX",
        addressStreet: "6301 Pale Sage Dr # 1204",
        city: "Houston",
        state: "TX",
        zip: "77049",
        latitude: 29.815693,
        longitude: -95.16628,
        contactPhone: "832-479-2093",
        imageUrl: "/images/properties/novu-new-forest.jpg",
        availabilityCount: 12,
        specialOffers: ["Resort-inspired swimming pool", "Special Offer Available"],
        units: [
            { beds: 1, price: "$1,225+" },
            { beds: 2, price: "$1,590+" },
            { beds: 3, price: "$2,429+" }
        ]
    },
    {
        externalId: "the-vic-on-park-row",
        title: "The Vic on Park Row",
        description: "Upscale community in Houston with exclusive lounge access and premium living spaces.",
        address: "Houston, TX",
        addressStreet: null,
        city: "Houston",
        state: "TX",
        zip: null,
        latitude: null,
        longitude: null,
        contactPhone: "832-648-2862",
        imageUrl: "/images/properties/the-vic-on-park-row.jpg.jpg",
        availabilityCount: 0,
        specialOffers: ["Lounge Access"],
        units: []
    },
    {
        externalId: "the-argyle",
        title: "The Argyle",
        description: "Established apartment community in West Houston offering comfortable layouts at accessible price points.",
        address: "1335 Silverado Dr, Houston, TX",
        addressStreet: "1335 Silverado Dr # 1009",
        city: "Houston",
        state: "TX",
        zip: "77077",
        latitude: 29.75691,
        longitude: -95.60885,
        contactPhone: "832-402-1793",
        imageUrl: "/images/properties/the-argyle.jpg.jpg",
        availabilityCount: 8,
        specialOffers: ["Stunning swimming pool", "Special Offer Available"],
        units: [
            { beds: 1, price: "$860+" },
            { beds: 2, price: "$1,270+" }
        ]
    },
    {
        externalId: "woodscape-apartments",
        title: "Woodscape Apartments",
        description: "Affordable community in the Westwood area accepting Section 8 vouchers, with high availability.",
        address: "9700 Woodfair Dr, Houston, TX",
        addressStreet: "9700 Woodfair Dr",
        city: "Houston",
        state: "TX",
        zip: "77036",
        latitude: 29.704221,
        longitude: -95.51239,
        contactPhone: "832-669-6793",
        imageUrl: "/images/properties/woodscape-apartments.jpg.jpg",
        availabilityCount: 59,
        specialOffers: ["Section 8 Vouchers Accepted"],
        units: [
            { beds: 1, price: "$799+" },
            { beds: 2, price: "$999+" }
        ]
    },
    {
        externalId: "cortland-museum-district",
        title: "Cortland Museum District",
        description: "Luxury apartments near the Houston Museum District with high-end finishes and urban walkability.",
        address: "5280 Caroline St, Houston, TX",
        addressStreet: "5280 Caroline St",
        city: "Houston",
        state: "TX",
        zip: "77004",
        latitude: 29.726854,
        longitude: -95.38566,
        contactPhone: "832-979-4394",
        imageUrl: "/images/properties/cortland-museum-district.jpg.jpg",
        availabilityCount: 33,
        specialOffers: ["Luxury finishes"],
        units: [
            { beds: 1, price: "$1,450+" },
            { beds: 2, price: "$2,100+" }
        ]
    },
    {
        externalId: "seacrest-katy",
        title: "Seacrest",
        description: "Spacious apartments in Katy, TX with private patios, valet trash service, and first-month-free specials.",
        address: "21540 Provincial Blvd, Katy, TX",
        addressStreet: "21540 Provincial Blvd # 717",
        city: "Katy",
        state: "TX",
        zip: "77450",
        latitude: 29.778788,
        longitude: -95.741005,
        contactPhone: "325-440-5817",
        imageUrl: "/images/properties/seacrest-katy.jpg.jpg",
        availabilityCount: 46,
        specialOffers: ["Private patio with storage", "1 Month Free", "Valet trash"],
        units: [
            { beds: 1, price: "$1,054+" },
            { beds: 2, price: "$1,275+" },
            { beds: 3, price: "$1,919+" }
        ]
    },
    {
        externalId: "cortland-river-oaks",
        title: "Cortland River Oaks",
        description: "Premium community near River Oaks featuring upscale finishes, a deck, and significant move-in specials.",
        address: "777 Dunlavy St, Houston, TX",
        addressStreet: "777 Dunlavy St # 5107",
        city: "Houston",
        state: "TX",
        zip: "77019",
        latitude: 29.758514,
        longitude: -95.4013,
        contactPhone: "832-900-3081",
        imageUrl: "/images/properties/cortland-river-oaks.jpg.jpg",
        availabilityCount: 46,
        specialOffers: ["3D Tour Available", "$3,000 Off", "Deck"],
        units: [
            { beds: 1, price: "$1,661+" },
            { beds: 2, price: "$2,109+" }
        ]
    }
];
// ─── Supabase admin API ───────────────────────────────────────────────────────
async function ensureSupabaseUser(email, password, name, label) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        console.warn(`  ⚠ Skipping Supabase user for ${label}: missing env vars.`);
        return;
    }
    // First, try to create the user
    let createRes;
    try {
        createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: name,
                    email_verified: true // Ensure this is set from creation
                }
            }),
            signal: AbortSignal.timeout(10000)
        });
    }
    catch (error) {
        console.warn(`  ⚠ Supabase ${label} sync skipped: ${error instanceof Error ? error.message : String(error)}`);
        return;
    }
    const createBody = await createRes.json().catch(() => null);
    let userId = null;
    if (!createRes.ok) {
        const msg = createBody?.msg || createBody?.message || JSON.stringify(createBody);
        if (createRes.status === 409 ||
            createRes.status === 422 ||
            /already registered|duplicate|user.*exists/i.test(msg)) {
            console.log(`  ✓ Supabase ${label} already exists`);
            // Get the user ID to verify email confirmation
            userId = await getSupabaseUserIdByEmail(email, serviceRoleKey, supabaseUrl);
        }
        else {
            console.warn(`  ⚠ Supabase ${label} create skipped (${createRes.status}): ${msg}`);
            return;
        }
    }
    else {
        userId = createBody?.id;
        console.log(`  ✓ Created Supabase ${label}: ${email}`);
    }
    // Ensure email is confirmed (important: sometimes email_confirm flag isn't respected)
    if (userId) {
        await confirmSupabaseUserEmail(userId, serviceRoleKey, supabaseUrl, label);
    }
}
// Helper: Get Supabase user ID by email
async function getSupabaseUserIdByEmail(email, serviceRoleKey, supabaseUrl) {
    try {
        const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?limit=1000`, {
            method: "GET",
            headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`
            }
        });
        if (!res.ok)
            return null;
        const { users } = await res.json().catch(() => ({ users: [] }));
        const user = users?.find((u) => u.email === email);
        return user?.id || null;
    }
    catch {
        return null;
    }
}
// Helper: Confirm Supabase user email
async function confirmSupabaseUserEmail(userId, serviceRoleKey, supabaseUrl, label) {
    try {
        const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({
                email_confirm: true,
                user_metadata: {
                    email_verified: true
                }
            })
        });
        if (!res.ok) {
            const body = await res.json().catch(() => null);
            console.warn(`  ⚠ Failed to confirm email for ${label}: ${body?.message || res.status}`);
            return;
        }
        console.log(`  ✓ Email confirmed for ${label}`);
    }
    catch (error) {
        console.warn(`  ⚠ Error confirming email for ${label}: ${error}`);
    }
}
// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    // 1. Seed Platform Super Admin and Applicant first (no organizationId)
    console.log("\n🌱  Seeding platform users...\n");
    const platformUsers = USERS.filter(u => u.organizationId === null);
    for (const user of platformUsers) {
        await ensureSupabaseUser(user.email, user.password, user.name, user.label);
        // IMPORTANT: Update with the EXACT role (including cleanup of org-related fields)
        await prisma.user.upsert({
            where: { email: user.email },
            update: {
                name: user.name,
                role: user.role, // CRITICAL: Ensure role is set to exactly what we want
                organizationId: null, // Platform users have null organizationId
                departmentId: null, // Clear org-related fields
                teamId: null, // Clear org-related fields
                jobTitle: null, // Clear employment fields
                employeeId: null, // Clear employment fields
                employmentStatus: null // Clear employment fields
            },
            create: {
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: null // Explicitly set to null for platform users
            }
        });
        console.log(`  ✓ ${user.label}: ${user.email} (${user.role})`);
    }
    // 2. Get Super Admin for creating organizations
    const superAdminUser = await prisma.user.findUnique({ where: { email: "superadmin@heloci.platform" } });
    if (!superAdminUser) {
        throw new Error("Platform Super Admin not found");
    }
    // 3. Create organizations first
    console.log("\n🏢  Creating organizations...\n");
    const organizations = [
        {
            id: "org_heloci",
            name: "Heloci Housing Authority",
            slug: "heloci",
            organizationType: "HOUSING_AUTHORITY",
            description: "Centralized housing assistance platform serving multiple communities",
            email: "contact@heloci.ngo",
            phone: "(555) 100-0001",
            website: "https://heloci.ngo",
            addressStreet: "123 Housing Way",
            addressCity: "Houston",
            addressState: "TX",
            addressZip: "77001",
            addressCountry: "USA",
            timezone: "America/Chicago",
            emailFromName: "Heloci Housing",
            createdBy: superAdminUser.id
        },
        {
            id: "org_texas",
            name: "Texas Housing Authority",
            slug: "texas-housing",
            organizationType: "GOVERNMENT",
            description: "State-wide housing authority for Texas residents",
            email: "contact@texas.gov",
            phone: "(555) 200-0001",
            website: "https://housing.texas.gov",
            addressStreet: "456 Capitol Dr",
            addressCity: "Austin",
            addressState: "TX",
            addressZip: "78701",
            addressCountry: "USA",
            timezone: "America/Chicago",
            emailFromName: "Texas Housing",
            createdBy: superAdminUser.id
        },
        {
            id: "org_california",
            name: "California Housing Partnership",
            slug: "california-housing",
            organizationType: "NGO",
            description: "Non-profit housing assistance for California families",
            email: "info@cahousing.org",
            phone: "(555) 300-0001",
            website: "https://cahousing.org",
            addressStreet: "789 Bay Street",
            addressCity: "San Francisco",
            addressState: "CA",
            addressZip: "94102",
            addressCountry: "USA",
            timezone: "America/Los_Angeles",
            emailFromName: "CA Housing Partnership",
            createdBy: superAdminUser.id
        }
    ];
    for (const org of organizations) {
        await prisma.organization.upsert({
            where: { id: org.id },
            update: {
                name: org.name,
                organizationType: org.organizationType,
                description: org.description,
                email: org.email,
                phone: org.phone,
                website: org.website,
                addressStreet: org.addressStreet,
                addressCity: org.addressCity,
                addressState: org.addressState,
                addressZip: org.addressZip,
                addressCountry: org.addressCountry,
                timezone: org.timezone,
                emailFromName: org.emailFromName
            },
            create: {
                id: org.id,
                name: org.name,
                slug: org.slug,
                organizationType: org.organizationType,
                description: org.description,
                email: org.email,
                phone: org.phone,
                website: org.website,
                addressStreet: org.addressStreet,
                addressCity: org.addressCity,
                addressState: org.addressState,
                addressZip: org.addressZip,
                addressCountry: org.addressCountry,
                timezone: org.timezone,
                emailFromName: org.emailFromName,
                createdBy: org.createdBy
            }
        });
        console.log(`  ✓ ${org.name}`);
    }
    // 4. Now seed org users
    console.log("\n👥  Seeding organization users...\n");
    const orgUsers = USERS.filter(u => u.organizationId !== null);
    for (const user of orgUsers) {
        await ensureSupabaseUser(user.email, user.password, user.name, user.label);
        await prisma.user.upsert({
            where: { email: user.email },
            update: { name: user.name, role: user.role, organizationId: user.organizationId },
            create: {
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            }
        });
        console.log(`  ✓ ${user.label}: ${user.email} (${user.role})`);
    }
    // 2. Seed Houston properties
    console.log("\n🏠  Seeding Houston properties...\n");
    for (const p of HOUSTON_PROPERTIES) {
        const prices = p.units.map((u) => parsePrice(u.price));
        const rent = prices.length > 0 ? Math.min(...prices) : 0;
        const rentMax = prices.length > 1 ? Math.max(...prices) : null;
        const minBeds = p.units.length > 0 ? Math.min(...p.units.map((u) => u.beds)) : 1;
        const property = await prisma.property.upsert({
            where: { externalId: p.externalId },
            update: {
                title: p.title,
                availabilityCount: p.availabilityCount,
                specialOffers: p.specialOffers,
                contactPhone: p.contactPhone
            },
            create: {
                externalId: p.externalId,
                title: p.title,
                description: p.description,
                address: p.addressStreet ?? p.address,
                city: p.city,
                state: p.state,
                zip: p.zip,
                latitude: p.latitude,
                longitude: p.longitude,
                rent,
                rentMax,
                bedrooms: minBeds,
                bathrooms: 1,
                sqft: 750,
                amenities: [],
                specialOffers: p.specialOffers,
                contactPhone: p.contactPhone,
                availabilityCount: p.availabilityCount,
                status: p.availabilityCount > 0 ? "AVAILABLE" : "UNAVAILABLE"
            }
        });
        // Replace units (delete old, insert new)
        await prisma.propertyUnit.deleteMany({ where: { propertyId: property.id } });
        if (p.units.length > 0) {
            await prisma.propertyUnit.createMany({
                data: p.units.map((u) => ({
                    propertyId: property.id,
                    beds: u.beds,
                    price: parsePrice(u.price),
                    available: p.availabilityCount > 0
                }))
            });
        }
        if (p.imageUrl) {
            const existingImage = await prisma.propertyImage.findFirst({
                where: { propertyId: property.id, url: p.imageUrl }
            });
            if (!existingImage) {
                await prisma.propertyImage.create({
                    data: {
                        propertyId: property.id,
                        url: p.imageUrl,
                        altText: `${p.title} housing exterior`
                    }
                });
            }
        }
        console.log(`  ✓ ${p.title} (${p.availabilityCount} units available)`);
    }
    // ─── Seed departments, teams, programs ─────────────────────────────────
    console.log("\n🏢  Seeding departments, teams, and programs...\n");
    const helocicreatorId = (await prisma.user.findUnique({ where: { email: "admin@heloci.ngo" } }))?.id;
    const texasCreatorId = (await prisma.user.findUnique({ where: { email: "admin@texas.gov" } }))?.id;
    const californiaCreatorId = (await prisma.user.findUnique({ where: { email: "admin@california.gov" } }))?.id;
    const departmentConfigs = {
        org_heloci: [
            { name: "Housing Services", code: "HSNG", description: "General housing assistance and voucher programs" },
            { name: "Veterans Affairs", code: "VET", description: "Housing assistance for veterans and their families" },
            { name: "Case Management", code: "CASE", description: "Application review and case management" },
            { name: "Compliance", code: "COMP", description: "Quality assurance and regulatory compliance" }
        ],
        org_texas: [
            { name: "Rental Assistance", code: "RENT", description: "Section 8 and rental voucher programs" },
            { name: "Homeownership", code: "HOME", description: "First-time homebuyer assistance" },
            { name: "Emergency Services", code: "EMRG", description: "Emergency housing and disaster relief" }
        ],
        org_california: [
            { name: "Family Services", code: "FAM", description: "Housing for families and children" },
            { name: "Senior Programs", code: "SNR", description: "Senior housing and independent living" },
            { name: "Disability Services", code: "DIS", description: "Accessible housing programs" }
        ]
    };
    for (const [orgId, depts] of Object.entries(departmentConfigs)) {
        for (const dept of depts) {
            const department = await prisma.department.upsert({
                where: {
                    organizationId_name: {
                        organizationId: orgId,
                        name: dept.name
                    }
                },
                update: {
                    code: dept.code,
                    description: dept.description
                },
                create: {
                    organizationId: orgId,
                    name: dept.name,
                    code: dept.code,
                    description: dept.description
                }
            });
            // Create teams for Case Management department
            if (dept.code === "CASE") {
                const teams = [
                    { name: "Case Review Team", description: "Initial application review and eligibility verification" },
                    { name: "Appeals Team", description: "Handles application appeals and reconsiderations" },
                    { name: "Senior Review Team", description: "Final review and complex case resolution" }
                ];
                for (const team of teams) {
                    await prisma.team.upsert({
                        where: {
                            departmentId_name: {
                                departmentId: department.id,
                                name: team.name
                            }
                        },
                        update: {},
                        create: {
                            departmentId: department.id,
                            name: team.name,
                            description: team.description
                        }
                    });
                }
            }
        }
    }
    console.log("  ✓ Created departments and teams");
    // Assign staff to departments and teams
    const helocicaseManagementDept = await prisma.department.findFirst({
        where: { organizationId: "org_heloci", code: "CASE" }
    });
    const helocicaseReviewTeam = await prisma.team.findFirst({
        where: { departmentId: helocicaseManagementDept?.id, name: "Case Review Team" }
    });
    if (helocicaseManagementDept && helocicaseReviewTeam) {
        await prisma.user.update({
            where: { email: "reviewer@heloci.ngo" },
            data: {
                departmentId: helocicaseManagementDept.id,
                teamId: helocicaseReviewTeam.id,
                jobTitle: "Senior Housing Reviewer",
                employeeId: "EMP-001",
                employmentStatus: "ACTIVE",
                hireDate: new Date("2024-01-15")
            }
        });
        console.log("  ✓ Assigned reviewer@heloci.ngo to Case Review Team");
        // Assign staff@heloci.ngo to department and team (BLOCKER FIX)
        await prisma.user.update({
            where: { email: "staff@heloci.ngo" },
            data: {
                departmentId: helocicaseManagementDept.id,
                teamId: helocicaseReviewTeam.id,
                jobTitle: "Housing Case Worker",
                employeeId: "EMP-002",
                employmentStatus: "ACTIVE",
                hireDate: new Date("2024-01-15")
            }
        });
        console.log("  ✓ Assigned staff@heloci.ngo to Case Management Department & Team");
    }
    const texasRentalDept = await prisma.department.findFirst({
        where: { organizationId: "org_texas", code: "RENT" }
    });
    if (texasRentalDept) {
        await prisma.user.update({
            where: { email: "reviewer@texas.gov" },
            data: {
                departmentId: texasRentalDept.id,
                jobTitle: "Housing Specialist",
                employeeId: "TX-EMP-001",
                employmentStatus: "ACTIVE",
                hireDate: new Date("2024-03-01")
            }
        });
        console.log("  ✓ Assigned reviewer@texas.gov to Rental Assistance Department");
    }
    // Create organization memberships with roles
    const memberships = [
        { organizationId: "org_heloci", email: "admin@heloci.ngo", role: "org_admin" },
        { organizationId: "org_heloci", email: "staff@heloci.ngo", role: "case_worker" },
        { organizationId: "org_heloci", email: "reviewer@heloci.ngo", role: "reviewer" },
        { organizationId: "org_texas", email: "admin@texas.gov", role: "org_admin" },
        { organizationId: "org_texas", email: "reviewer@texas.gov", role: "reviewer" },
        { organizationId: "org_california", email: "admin@california.gov", role: "org_admin" }
    ];
    for (const membership of memberships) {
        const user = await prisma.user.findUnique({ where: { email: membership.email } });
        if (user) {
            await prisma.organizationMember.upsert({
                where: {
                    organizationId_userId: {
                        organizationId: membership.organizationId,
                        userId: user.id
                    }
                },
                update: { role: membership.role },
                create: {
                    organizationId: membership.organizationId,
                    userId: user.id,
                    role: membership.role
                }
            });
        }
    }
    console.log("  ✓ Created organization memberships");
    // Get creator ID for program seeding
    const creatorId = helocicreatorId ?? superAdminUser.id;
    if (creatorId) {
        await prisma.program.createMany({
            data: [
                // Government
                {
                    name: "Housing Choice Voucher - Section 8",
                    slug: "section-8-hcv",
                    organizationId: "org_heloci",
                    description: "Federal rental assistance for low-income families",
                    category: "Government",
                    housingGoal: "Rental Assistance",
                    status: "active",
                    isPublic: true,
                    priority: 20,
                    createdBy: creatorId
                },
                {
                    name: "Public Housing Program",
                    slug: "public-housing",
                    organizationId: "org_heloci",
                    description: "Government-owned affordable apartments",
                    category: "Government",
                    housingGoal: "Affordable Rent",
                    status: "active",
                    isPublic: true,
                    priority: 18,
                    createdBy: creatorId
                },
                // NGO
                {
                    name: "Emergency Housing Assistance",
                    slug: "emergency-housing",
                    organizationId: "org_heloci",
                    description: "Temporary shelter and rapid rehousing",
                    category: "NGO",
                    housingGoal: "Emergency Housing",
                    status: "active",
                    isPublic: true,
                    priority: 17,
                    createdBy: creatorId
                },
                {
                    name: "Family Housing Support",
                    slug: "family-support",
                    organizationId: "org_heloci",
                    description: "Housing for single parents and large families",
                    category: "NGO",
                    housingGoal: "Family Housing",
                    status: "active",
                    isPublic: true,
                    priority: 8,
                    createdBy: creatorId
                },
                // Veterans
                {
                    name: "VA Supportive Housing - VASH",
                    slug: "vash",
                    organizationId: "org_heloci",
                    description: "Rental assistance and case management for veterans",
                    category: "Veterans",
                    housingGoal: "Veteran Housing",
                    status: "active",
                    isPublic: true,
                    priority: 19,
                    createdBy: creatorId
                },
                {
                    name: "Disabled Veteran Housing Grant",
                    slug: "sah-grant",
                    organizationId: "org_heloci",
                    description: "Grants to adapt homes for disabled veterans",
                    category: "Veterans",
                    housingGoal: "Disability Housing",
                    status: "active",
                    isPublic: true,
                    priority: 7,
                    createdBy: creatorId
                },
                // Employment
                {
                    name: "Teacher Housing Initiative",
                    slug: "teacher-housing",
                    organizationId: "org_heloci",
                    description: "Discounted rent for K-12 teachers",
                    category: "Employment",
                    housingGoal: "Teacher Housing",
                    status: "active",
                    isPublic: true,
                    priority: 16,
                    createdBy: creatorId
                },
                {
                    name: "Healthcare Worker Housing",
                    slug: "healthcare-housing",
                    organizationId: "org_heloci",
                    description: "Housing near hospitals for nurses and doctors",
                    category: "Employment",
                    housingGoal: "Healthcare Worker Housing",
                    status: "active",
                    isPublic: true,
                    priority: 6,
                    createdBy: creatorId
                },
                // Home Buyer
                {
                    name: "First Time Homebuyer Assistance",
                    slug: "fthb",
                    organizationId: "org_heloci",
                    description: "Down payment and closing cost grants",
                    category: "Home Buyer",
                    housingGoal: "Buy My First Home",
                    status: "active",
                    isPublic: true,
                    priority: 15,
                    createdBy: creatorId
                },
                {
                    name: "FHA Loan Program",
                    slug: "fha-loan",
                    organizationId: "org_heloci",
                    description: "Low down payment mortgages",
                    category: "Home Buyer",
                    housingGoal: "Mortgage Assistance",
                    status: "active",
                    isPublic: true,
                    priority: 5,
                    createdBy: creatorId
                },
                // Special Programs
                {
                    name: "Senior Independent Living",
                    slug: "senior-housing",
                    organizationId: "org_heloci",
                    description: "Age 55+ communities with services",
                    category: "Senior",
                    housingGoal: "Senior Housing",
                    status: "active",
                    isPublic: true,
                    priority: 4,
                    createdBy: creatorId
                },
                {
                    name: "Student Housing Partnership",
                    slug: "student-housing",
                    organizationId: "org_heloci",
                    description: "Affordable rooms for university students",
                    category: "Student",
                    housingGoal: "Student Housing",
                    status: "active",
                    isPublic: true,
                    priority: 3,
                    createdBy: creatorId
                },
                {
                    name: "Domestic Violence Housing",
                    slug: "dv-housing",
                    organizationId: "org_heloci",
                    description: "Confidential safe housing and services",
                    category: "Special Programs",
                    housingGoal: "Domestic Violence Support",
                    status: "active",
                    isPublic: true,
                    priority: 2,
                    createdBy: creatorId
                },
                // Rent-to-own / Disability
                {
                    name: "Lease Purchase Program",
                    slug: "lease-purchase",
                    organizationId: "org_heloci",
                    description: "Rent now, buy later with credits",
                    category: "Rent-to-Own",
                    housingGoal: "Rent to Own",
                    status: "active",
                    isPublic: true,
                    priority: 14,
                    createdBy: creatorId
                },
                {
                    name: "Accessible Housing Vouchers",
                    slug: "accessible-housing",
                    organizationId: "org_heloci",
                    description: "Vouchers for wheelchair-accessible units",
                    category: "Disability",
                    housingGoal: "Accessible Housing",
                    status: "active",
                    isPublic: true,
                    priority: 1,
                    createdBy: creatorId
                }
            ],
            skipDuplicates: true
        });
        const globalProgram = await prisma.program.upsert({
            where: { slug: "global-eligibility" },
            update: {
                name: "Global Housing Eligibility",
                description: "Fallback eligibility questions used when no program-specific questions are configured.",
                category: "General",
                housingGoal: "Housing Eligibility",
                status: "active",
                isPublic: false,
                priority: 0,
                createdBy: creatorId
            },
            create: {
                organizationId: "org_heloci",
                name: "Global Housing Eligibility",
                slug: "global-eligibility",
                description: "Fallback eligibility questions used when no program-specific questions are configured.",
                category: "General",
                housingGoal: "Housing Eligibility",
                status: "active",
                isPublic: false,
                priority: 0,
                createdBy: creatorId
            }
        });
        await prisma.questionSet.upsert({
            where: { programId_version: { programId: globalProgram.id, version: 1 } },
            update: {},
            create: {
                programId: globalProgram.id,
                name: "Global Housing Eligibility",
                version: 1,
                isActive: true,
                pages: {
                    create: [
                        {
                            title: "Basic Information",
                            sortOrder: 1,
                            questions: {
                                create: [
                                    {
                                        key: "incomeRange",
                                        label: "Which income range best describes your household?",
                                        type: "SELECT",
                                        required: true,
                                        order: 1,
                                        helpText: "Choose the range that feels closest.",
                                        options: [
                                            { label: "Under $25,000", value: "under_25k" },
                                            { label: "$25,000-$49,999", value: "25k_49k" },
                                            { label: "$50,000-$74,999", value: "50k_74k" },
                                            { label: "$75,000 or more", value: "75k_plus" },
                                            { label: "Prefer not to say", value: "prefer_not_to_say" }
                                        ]
                                    },
                                    {
                                        key: "householdSize",
                                        label: "How many people are in your household?",
                                        type: "SELECT",
                                        required: true,
                                        order: 2,
                                        options: [
                                            { label: "1", value: "1" },
                                            { label: "2", value: "2" },
                                            { label: "3", value: "3" },
                                            { label: "4", value: "4" },
                                            { label: "5", value: "5" },
                                            { label: "6", value: "6" },
                                            { label: "7", value: "7" },
                                            { label: "8+", value: "8_plus" }
                                        ]
                                    },
                                    {
                                        key: "state",
                                        label: "Which state do you live in?",
                                        type: "SELECT",
                                        required: false,
                                        order: 3,
                                        options: [
                                            { label: "Alabama", value: "AL" },
                                            { label: "Alaska", value: "AK" },
                                            { label: "Arizona", value: "AZ" },
                                            { label: "Arkansas", value: "AR" },
                                            { label: "California", value: "CA" },
                                            { label: "Colorado", value: "CO" },
                                            { label: "Connecticut", value: "CT" },
                                            { label: "Delaware", value: "DE" },
                                            { label: "District of Columbia", value: "DC" },
                                            { label: "Florida", value: "FL" },
                                            { label: "Georgia", value: "GA" },
                                            { label: "Hawaii", value: "HI" },
                                            { label: "Idaho", value: "ID" },
                                            { label: "Illinois", value: "IL" },
                                            { label: "Indiana", value: "IN" },
                                            { label: "Iowa", value: "IA" },
                                            { label: "Kansas", value: "KS" },
                                            { label: "Kentucky", value: "KY" },
                                            { label: "Louisiana", value: "LA" },
                                            { label: "Maine", value: "ME" },
                                            { label: "Maryland", value: "MD" },
                                            { label: "Massachusetts", value: "MA" },
                                            { label: "Michigan", value: "MI" },
                                            { label: "Minnesota", value: "MN" },
                                            { label: "Mississippi", value: "MS" },
                                            { label: "Missouri", value: "MO" },
                                            { label: "Montana", value: "MT" },
                                            { label: "Nebraska", value: "NE" },
                                            { label: "Nevada", value: "NV" },
                                            { label: "New Hampshire", value: "NH" },
                                            { label: "New Jersey", value: "NJ" },
                                            { label: "New Mexico", value: "NM" },
                                            { label: "New York", value: "NY" },
                                            { label: "North Carolina", value: "NC" },
                                            { label: "North Dakota", value: "ND" },
                                            { label: "Ohio", value: "OH" },
                                            { label: "Oklahoma", value: "OK" },
                                            { label: "Oregon", value: "OR" },
                                            { label: "Pennsylvania", value: "PA" },
                                            { label: "Rhode Island", value: "RI" },
                                            { label: "South Carolina", value: "SC" },
                                            { label: "South Dakota", value: "SD" },
                                            { label: "Tennessee", value: "TN" },
                                            { label: "Texas", value: "TX" },
                                            { label: "Utah", value: "UT" },
                                            { label: "Vermont", value: "VT" },
                                            { label: "Virginia", value: "VA" },
                                            { label: "Washington", value: "WA" },
                                            { label: "West Virginia", value: "WV" },
                                            { label: "Wisconsin", value: "WI" },
                                            { label: "Wyoming", value: "WY" }
                                        ]
                                    },
                                    {
                                        key: "zipCode",
                                        label: "What ZIP code do you live in?",
                                        type: "TEXT",
                                        required: false,
                                        order: 4,
                                        validation: {
                                            pattern: "^\\d{5}$",
                                            validateZipState: true
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            title: "Household Details",
                            sortOrder: 2,
                            questions: {
                                create: [
                                    {
                                        key: "isVeteran",
                                        label: "Are you a U.S. military veteran?",
                                        type: "RADIO",
                                        required: true,
                                        order: 1,
                                        options: [
                                            { label: "Yes", value: "true" },
                                            { label: "No", value: "false" }
                                        ]
                                    },
                                    {
                                        key: "hasDisability",
                                        label: "Do you or anyone in household have a disability?",
                                        type: "RADIO",
                                        required: true,
                                        order: 2,
                                        options: [
                                            { label: "Yes", value: "true" },
                                            { label: "No", value: "false" }
                                        ]
                                    },
                                    {
                                        key: "isSenior",
                                        label: "Is anyone in household 62 or older?",
                                        type: "RADIO",
                                        required: true,
                                        order: 3,
                                        options: [
                                            { label: "Yes", value: "true" },
                                            { label: "No", value: "false" }
                                        ]
                                    },
                                    {
                                        key: "isStudent",
                                        label: "Are you a full-time student?",
                                        type: "RADIO",
                                        required: false,
                                        order: 4,
                                        options: [
                                            { label: "Yes", value: "true" },
                                            { label: "No", value: "false" }
                                        ]
                                    }
                                ]
                            }
                        },
                        {
                            title: "Housing Situation",
                            sortOrder: 3,
                            questions: {
                                create: [
                                    {
                                        key: "currentHousing",
                                        label: "What best describes your current housing situation?",
                                        type: "SELECT",
                                        required: true,
                                        order: 1,
                                        options: [
                                            { label: "Renting", value: "renting" },
                                            { label: "Homeless", value: "homeless" },
                                            { label: "Living with family", value: "family" },
                                            { label: "Own home", value: "own" }
                                        ]
                                    },
                                    {
                                        key: "riskOfEviction",
                                        label: "Are you at risk of eviction in the next 30 days?",
                                        type: "RADIO",
                                        required: true,
                                        order: 2,
                                        options: [
                                            { label: "Yes", value: "true" },
                                            { label: "No", value: "false" }
                                        ]
                                    },
                                    {
                                        key: "housingGoals",
                                        label: "What are your housing goals?",
                                        type: "MULTISELECT",
                                        required: true,
                                        order: 3,
                                        options: [
                                            { label: "Buy My First Home", value: "first_home" },
                                            { label: "Affordable Rent", value: "affordable_rent" },
                                            { label: "Emergency Housing", value: "emergency" },
                                            { label: "Down Payment Assistance", value: "down_payment" },
                                            { label: "Veteran Housing", value: "veteran" },
                                            { label: "Senior Housing", value: "senior" }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });
        console.log("  ✓ Seeded organizations, programs, and global fallback question set");
        // Seed programs for Texas Housing Authority
        await prisma.program.createMany({
            data: [
                {
                    name: "Texas Section 8 Housing Choice Voucher",
                    slug: "tx-section-8",
                    organizationId: "org_texas",
                    description: "Federal rental assistance for low-income Texas families",
                    category: "Government",
                    housingGoal: "Rental Assistance",
                    status: "active",
                    isPublic: true,
                    priority: 20,
                    createdBy: texasCreatorId ?? superAdminUser.id
                },
                {
                    name: "Texas First-Time Homebuyer Program",
                    slug: "tx-first-home",
                    organizationId: "org_texas",
                    description: "Down payment and closing cost assistance for Texas residents",
                    category: "Home Buyer",
                    housingGoal: "Buy My First Home",
                    status: "active",
                    isPublic: true,
                    priority: 15,
                    createdBy: texasCreatorId ?? superAdminUser.id
                }
            ],
            skipDuplicates: true
        });
        // Seed programs for California Housing Partnership
        await prisma.program.createMany({
            data: [
                {
                    name: "California Family Housing Program",
                    slug: "ca-family-housing",
                    organizationId: "org_california",
                    description: "Affordable housing for California families with children",
                    category: "NGO",
                    housingGoal: "Family Housing",
                    status: "active",
                    isPublic: true,
                    priority: 18,
                    createdBy: californiaCreatorId ?? superAdminUser.id
                },
                {
                    name: "California Senior Independent Living",
                    slug: "ca-senior-housing",
                    organizationId: "org_california",
                    description: "Age 55+ communities with services throughout California",
                    category: "Senior",
                    housingGoal: "Senior Housing",
                    status: "active",
                    isPublic: true,
                    priority: 16,
                    createdBy: californiaCreatorId ?? superAdminUser.id
                }
            ],
            skipDuplicates: true
        });
        console.log("  ✓ Seeded programs for all organizations");
    }
    else {
        console.warn("  ⚠ Skipping organization/program seed: super admin user not found");
    }
    // ─── Print credentials summary ────────────────────────────────────────────
    console.log(`
┌──────────────────────────────────────────────────────────────────────────┐
│                     Dev Login Credentials                                │
├───────────────────┬─────────────────────────────┬────────────────────────┤
│ Role              │ Email                       │ Password               │
├───────────────────┼─────────────────────────────┼────────────────────────┤
│ Platform Admin    │ superadmin@heloci.platform  │ configured via env     │
├───────────────────┼─────────────────────────────┼────────────────────────┤
│ Heloci Admin      │ admin@heloci.ngo            │ configured via env     │
│ Heloci Staff      │ staff@heloci.ngo            │ configured via env     │
│ Heloci Reviewer   │ reviewer@heloci.ngo         │ configured via env     │
├───────────────────┼─────────────────────────────┼────────────────────────┤
│ Texas Admin       │ admin@texas.gov             │ configured via env     │
│ Texas Reviewer    │ reviewer@texas.gov          │ configured via env     │
├───────────────────┼─────────────────────────────┼────────────────────────┤
│ California Admin  │ admin@california.gov        │ configured via env     │
├───────────────────┼─────────────────────────────┼────────────────────────┤
│ Applicant         │ applicant@heloci.ngo        │ configured via env     │
└───────────────────┴─────────────────────────────┴────────────────────────┘

  // ─── Seed Notification Templates ───────────────────────────────────────────
  const notificationTemplates = [
    // User Registration Templates (Audience-Prefixed)
    { name: "applicant.user-registration.email", eventName: "user_registration", channel: "email", subject: "Welcome to Heloci", html: "Hello {{name}}, welcome to Heloci!", plainText: "Hello {{name}}, welcome to Heloci!" },
    { name: "admin.user-registration.telegram", eventName: "user_registration", channel: "telegram", subject: "New user registration", html: "New user registered: {{name}} ({{userEmail}})", plainText: "New user registered: {{name}} ({{userEmail}})" },
    
    // User Login Templates (Audience-Prefixed)
    { name: "applicant.user-login.email", eventName: "user_login", channel: "email", subject: "New sign-in detected", html: "Hello {{name}}, a new sign-in was detected for your account.", plainText: "Hello {{name}}, a new sign-in was detected for your account." },
    { name: "admin.user-login.telegram", eventName: "user_login", channel: "telegram", subject: "User login detected", html: "User {{name}} logged in at {{loginTime}}", plainText: "User {{name}} logged in at {{loginTime}}" },
    
    // Application Templates
    { name: "application_submitted_email", eventName: "application_submitted", channel: "email", subject: "Application submitted", html: "Application submitted by {{name}} for {{programName}}.", plainText: "Application submitted by {{name}} for {{programName}}." },
    { name: "application_under_review_email", eventName: "application_under_review", channel: "email", subject: "Application under review", html: "Your application is now under review, {{name}}.", plainText: "Your application is now under review, {{name}}." },
    { name: "documents_requested_email", eventName: "documents_requested", channel: "email", subject: "Additional documents needed", html: "Please provide the requested documents to continue your application, {{name}}.", plainText: "Please provide the requested documents to continue your application, {{name}}." },
    { name: "document_approved_email", eventName: "document_approved", channel: "email", subject: "Document approved", html: "Your {{documentType}} ({{fileName}}) has been approved, {{name}}.", plainText: "Your {{documentType}} ({{fileName}}) has been approved, {{name}}." },
    { name: "document_rejected_email", eventName: "document_rejected", channel: "email", subject: "Document requires revision", html: "Your {{documentType}} ({{fileName}}) was rejected: {{rejectionReason}}. Please upload a corrected version.", plainText: "Your {{documentType}} ({{fileName}}) was rejected: {{rejectionReason}}. Please upload a corrected version." },
    { name: "application_approved_email", eventName: "application_approved", channel: "email", subject: "Congratulations! Your application was approved", html: "Congratulations {{name}}! Your application for {{programName}} has been approved.", plainText: "Congratulations {{name}}! Your application for {{programName}} has been approved." },
    { name: "application_rejected_email", eventName: "application_rejected", channel: "email", subject: "Application status update", html: "Thank you for applying {{name}}. Unfortunately, your application was not approved at this time.", plainText: "Thank you for applying {{name}}. Unfortunately, your application was not approved at this time." },
    { name: "application_waitlisted_email", eventName: "application_waitlisted", channel: "email", subject: "Application waitlisted", html: "Your application has been waitlisted, {{name}}. We will notify you if a spot opens up.", plainText: "Your application has been waitlisted, {{name}}. We will notify you if a spot opens up." },
    // Staff Notifications
    { name: "staff_invited_email", eventName: "staff_invited", channel: "email", subject: "You've been invited to join", html: "You've been invited to join {{organizationName}}. Click the link to accept.", plainText: "You've been invited to join {{organizationName}}. Click the link to accept." },
    { name: "staff_role_changed_email", eventName: "staff_role_changed", channel: "email", subject: "Your role changed", html: "Your organization role was changed to {{newRole}}.", plainText: "Your organization role was changed to {{newRole}}." },
    // Admin Notifications
    { name: "admin_test_email", eventName: "admin_test", channel: "email", subject: "Notification test", html: "This is a test notification for {{name}}.", plainText: "This is a test notification for {{name}}." },
    // System Notifications
    { name: "system_error_email", eventName: "system_error", channel: "email", subject: "System error", html: "A system error was reported for {{name}}.", plainText: "A system error was reported for {{name}}." },
    { name: "ops_alert_email", eventName: "ops_alert", channel: "email", subject: "Operations alert", html: "Alert: {{eventName}} for {{programName}} (application {{applicationId}}) requires attention.", plainText: "Alert: {{eventName}} for {{programName}} (application {{applicationId}}) requires attention." }
  ];

  for (const template of notificationTemplates) {
    await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: {
        subject: template.subject,
        html: template.html,
        plainText: template.plainText,
        active: true,
        status: "PUBLISHED"
      },
      create: {
        name: template.name,
        eventName: template.eventName as any,
        channel: template.channel as any,
        subject: template.subject,
        html: template.html,
        plainText: template.plainText,
        title: template.subject,
        active: true,
        version: 1,
        locale: "en",
        status: "PUBLISHED"
      }
    });
  }

  console.log("  ✓ Seeded notification templates");

  // ─── Seed Communication Settings ───────────────────────────────────────────
  await prisma.communicationSettings.upsert({
    where: { id: "default" },
    update: {
      enabled: true,
      senderEmail: "support@heloci.us",
      channels: {
        email: true,
        telegram: true,
        internal: true
      }
    },
    create: {
      id: "default",
      enabled: true,
      senderEmail: "support@heloci.us",
      channels: {
        email: true,
        telegram: true,
        internal: true
      }
    }
  });

  console.log("  ✓ Seeded communication settings");

Organizations Created:
  • Heloci Housing Authority (4 departments, 3 teams)
  • Texas Housing Authority (3 departments)
  • California Housing Partnership (3 departments)

Platform Super Admin:
  • organizationId = NULL
  • Can access all organizations
  • Role: SUPER_ADMIN
  `);
}
main()
    .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    console.log("✅ Seed complete and database connection closed");
});
