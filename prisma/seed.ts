import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Dev credentials ──────────────────────────────────────────────────────────
const USERS = [
  {
    email: "admin@heloci.ngo",
    password: process.env.DEFAULT_ADMIN_PASSWORD ?? "Admin1234!",
    name: "Heloci Admin",
    role: "ADMIN" as const,
    label: "admin"
  },
  {
    email: "staff@heloci.ngo",
    password: "Staff1234!",
    name: "Maya Thompson",
    role: "STAFF" as const,
    label: "staff"
  },
  {
    email: "applicant@heloci.ngo",
    password: "Applicant1234!",
    name: "Jordan Rivera",
    role: "APPLICANT" as const,
    label: "applicant"
  }
];

// ─── Houston property data (from Zillow feed) ─────────────────────────────────
// Units: price is stored as an integer (dollars, no cents)
// We strip "$" and "+" from the price strings
function parsePrice(raw: string): number {
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
    availabilityCount: 46,
    specialOffers: ["3D Tour Available", "$3,000 Off", "Deck"],
    units: [
      { beds: 1, price: "$1,661+" },
      { beds: 2, price: "$2,109+" }
    ]
  }
];

// ─── Supabase admin API ───────────────────────────────────────────────────────
async function ensureSupabaseUser(
  email: string,
  password: string,
  name: string,
  label: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(`  ⚠ Skipping Supabase user for ${label}: missing env vars.`);
    return;
  }

  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
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
      user_metadata: { full_name: name }
    })
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = body?.msg || body?.message || JSON.stringify(body);
    if (
      res.status === 409 ||
      res.status === 422 ||
      /already registered|duplicate|user.*exists/i.test(msg)
    ) {
      console.log(`  ✓ Supabase ${label} already exists`);
      return;
    }
    throw new Error(`Supabase ${label} create failed (${res.status}): ${msg}`);
  }

  console.log(`  ✓ Created Supabase ${label}: ${email}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Seed dev users
  console.log("\n🌱  Seeding dev users...\n");
  for (const user of USERS) {
    await ensureSupabaseUser(user.email, user.password, user.name, user.label);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: { name: user.name, email: user.email, role: user.role }
    });
    console.log(`  ✓ Prisma ${user.label}: ${user.email} (${user.role})`);
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

    console.log(`  ✓ ${p.title} (${p.availabilityCount} units available)`);
  }

  // ─── Print credentials summary ────────────────────────────────────────────
  console.log(`
┌─────────────────────────────────────────────────────────┐
│               Dev login credentials                     │
├──────────────┬──────────────────────────┬───────────────┤
│ Role         │ Email                    │ Password      │
├──────────────┼──────────────────────────┼───────────────┤
│ Admin        │ admin@heloci.ngo         │ Admin1234!    │
│ Staff        │ staff@heloci.ngo         │ Staff1234!    │
│ Applicant    │ applicant@heloci.ngo     │ Applicant1234!│
└──────────────┴──────────────────────────┴───────────────┘
  `);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
