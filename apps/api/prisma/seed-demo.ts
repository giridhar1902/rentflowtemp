/**
 * Demo seed — creates real Supabase auth users and rich demo data.
 *
 * Landlord: demo-landlord@domvio.app  /  Demo@12345  /  +910000000000
 * Tenant  : demo-tenant@domvio.app   /  Demo@12345  /  +911111111111
 *
 * Run: cd apps/api && npx ts-node --project tsconfig.json -e "require('ts-node/register'); require('./prisma/seed-demo.ts')"
 * Or:  cd apps/api && npx tsx prisma/seed-demo.ts
 */

import { createClient } from "@supabase/supabase-js";
import {
  PrismaClient,
  UserRole,
  LeaseStatus,
  ChargeStatus,
  PaymentStatus,
  MaintenanceStatus,
  MaintenancePriority,
  MessageType,
} from "@prisma/client";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const LANDLORD_EMAIL = "demo-landlord@domvio.app";
const TENANT_EMAIL = "demo-tenant@domvio.app";
const DEMO_PASSWORD = "Demo@12345";

async function upsertSupabaseUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
  phone: string,
  appRole: string,
): Promise<string> {
  // Try to find existing user by email
  const { data: listData } = await (supabaseAdmin.auth.admin as any).listUsers({
    page: 1,
    perPage: 1000,
  });
  const existing = listData?.users?.find((u: any) => u.email === email);

  if (existing) {
    console.log(`  ✓ Supabase user exists: ${email} (${existing.id})`);
    // Update app_metadata role
    await (supabaseAdmin.auth.admin as any).updateUserById(existing.id, {
      app_metadata: { role: appRole },
    });
    return existing.id;
  }

  const { data, error } = await (supabaseAdmin.auth.admin as any).createUser({
    email,
    password: DEMO_PASSWORD,
    phone,
    email_confirm: true,
    phone_confirm: true,
    app_metadata: { role: appRole },
    user_metadata: {},
  });

  if (error) {
    throw new Error(
      `Failed to create Supabase user ${email}: ${error.message}`,
    );
  }

  console.log(`  ✓ Created Supabase user: ${email} (${data.user.id})`);
  return data.user.id;
}

async function main() {
  console.log("🌱 Starting demo seed...\n");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env",
    );
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 1. Create Supabase auth users ──────────────────────────────────────────
  console.log("1️⃣  Creating Supabase auth users...");
  const landlordAuthId = await upsertSupabaseUser(
    supabaseAdmin,
    LANDLORD_EMAIL,
    "+910000000000",
    "LANDLORD",
  );
  const tenantAuthId = await upsertSupabaseUser(
    supabaseAdmin,
    TENANT_EMAIL,
    "+911111111111",
    "TENANT",
  );

  // ── 2. Upsert Prisma users ─────────────────────────────────────────────────
  console.log("\n2️⃣  Upserting Prisma users...");

  const landlord = await prisma.user.upsert({
    where: { authUserId: landlordAuthId },
    update: {
      email: LANDLORD_EMAIL,
      role: UserRole.LANDLORD,
      firstName: "Rajesh",
      lastName: "Mehta",
      phone: "+910000000000",
      subscriptionTier: "LOCAL_PRO",
    },
    create: {
      authUserId: landlordAuthId,
      email: LANDLORD_EMAIL,
      role: UserRole.LANDLORD,
      firstName: "Rajesh",
      lastName: "Mehta",
      phone: "+910000000000",
      subscriptionTier: "LOCAL_PRO",
      landlordProfile: { create: { companyName: "Mehta Properties" } },
    },
  });
  console.log(
    `  ✓ Landlord: ${landlord.firstName} ${landlord.lastName} (${landlord.id})`,
  );

  const tenantUser = await prisma.user.upsert({
    where: { authUserId: tenantAuthId },
    update: {
      email: TENANT_EMAIL,
      role: UserRole.TENANT,
      firstName: "Arjun",
      lastName: "Sharma",
      phone: "+911111111111",
    },
    create: {
      authUserId: tenantAuthId,
      email: TENANT_EMAIL,
      role: UserRole.TENANT,
      firstName: "Arjun",
      lastName: "Sharma",
      phone: "+911111111111",
      tenantProfile: {
        create: {
          emergencyContactName: "Suresh Sharma",
          emergencyContactPhone: "+919876543210",
        },
      },
    },
  });
  console.log(
    `  ✓ Tenant: ${tenantUser.firstName} ${tenantUser.lastName} (${tenantUser.id})`,
  );

  // ── 3. Clean up old demo properties for this landlord ──────────────────────
  console.log("\n3️⃣  Cleaning up old demo data...");
  await prisma.property.deleteMany({
    where: { ownerId: landlord.id },
  });
  console.log("  ✓ Old properties cleared");

  // ── 4. Property 1: Skyline Residency (tenant resides here) ─────────────────
  console.log("\n4️⃣  Creating Property 1: Skyline Residency...");
  const skyline = await prisma.property.create({
    data: {
      ownerId: landlord.id,
      name: "Skyline Residency",
      propertyType: "Apartment",
      floors: 4,
      totalUnits: 3,
      amenities: ["Wi-Fi", "24/7 Security", "Power Backup", "Parking", "CCTV"],
      ownership: "SELF_OWNED",
      status: "ACTIVE",
      addressLine1: "142 MG Road",
      addressLine2: "Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560038",
      country: "IN",
      units: {
        create: [
          {
            name: "Flat 101",
            bedrooms: 2,
            bathrooms: 2,
            occupancy: 2,
            furnishing: "Fully Furnished",
            monthlyRent: 32000,
            securityDeposit: 64000,
            status: "OCCUPIED",
            floor: "1",
            meterNumber: "MTR-SKY-101",
          },
          {
            name: "Flat 201",
            bedrooms: 2,
            bathrooms: 2,
            occupancy: 2,
            furnishing: "Semi-Furnished",
            monthlyRent: 28000,
            securityDeposit: 56000,
            status: "OCCUPIED",
            floor: "2",
            meterNumber: "MTR-SKY-201",
          },
          {
            name: "Flat 301",
            bedrooms: 1,
            bathrooms: 1,
            occupancy: 1,
            furnishing: "Unfurnished",
            monthlyRent: 18000,
            securityDeposit: 36000,
            status: "VACANT",
            floor: "3",
            meterNumber: "MTR-SKY-301",
          },
        ],
      },
    },
    include: { units: true },
  });
  console.log(
    `  ✓ Created: ${skyline.name} with ${skyline.units.length} units`,
  );

  const flat101 = skyline.units.find((u) => u.name === "Flat 101")!;
  const flat201 = skyline.units.find((u) => u.name === "Flat 201")!;

  // ── 5. Property 2: Oakwood Villas ──────────────────────────────────────────
  console.log("\n5️⃣  Creating Property 2: Oakwood Villas...");
  const oakwood = await prisma.property.create({
    data: {
      ownerId: landlord.id,
      name: "Oakwood Villas",
      propertyType: "Villa",
      floors: 2,
      totalUnits: 2,
      amenities: ["Parking", "Garden", "Generator", "Swimming Pool"],
      ownership: "SELF_OWNED",
      status: "ACTIVE",
      addressLine1: "55 Koregaon Park Road",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      country: "IN",
      units: {
        create: [
          {
            name: "Villa A",
            bedrooms: 4,
            bathrooms: 3,
            occupancy: 4,
            furnishing: "Fully Furnished",
            monthlyRent: 75000,
            securityDeposit: 150000,
            status: "OCCUPIED",
            floor: "G+1",
            meterNumber: "MTR-OAK-A",
          },
          {
            name: "Villa B",
            bedrooms: 3,
            bathrooms: 2,
            occupancy: 3,
            furnishing: "Semi-Furnished",
            monthlyRent: 55000,
            securityDeposit: 110000,
            status: "VACANT",
            floor: "G+1",
            meterNumber: "MTR-OAK-B",
          },
        ],
      },
    },
    include: { units: true },
  });
  console.log(
    `  ✓ Created: ${oakwood.name} with ${oakwood.units.length} units`,
  );

  const villaA = oakwood.units.find((u) => u.name === "Villa A")!;

  // ── 6. Tenant records ──────────────────────────────────────────────────────
  console.log("\n6️⃣  Creating tenant records...");

  // Demo tenant (Arjun) in Flat 101
  const arjunTenant = await prisma.tenant.create({
    data: {
      userId: tenantUser.id,
      unitId: flat101.id,
      name: "Arjun Sharma",
      phone: "+911111111111",
      rentAmount: 32000,
      isActive: true,
    },
  });

  // Second tenant in Flat 101 (no user account)
  await prisma.tenant.create({
    data: {
      unitId: flat101.id,
      name: "Priya Nair",
      phone: "+919876501234",
      rentAmount: 0,
      isActive: true,
    },
  });

  // Tenant in Flat 201
  const flat201Tenant = await prisma.tenant.create({
    data: {
      unitId: flat201.id,
      name: "Sameer Khan",
      phone: "+919090909090",
      rentAmount: 28000,
      isActive: true,
    },
  });

  // Tenant in Villa A
  const villaATenant = await prisma.tenant.create({
    data: {
      unitId: villaA.id,
      name: "Neha Gupta",
      phone: "+918080808080",
      rentAmount: 75000,
      isActive: true,
    },
  });

  console.log("  ✓ Created 4 tenant records");

  // ── 7. Leases ──────────────────────────────────────────────────────────────
  console.log("\n7️⃣  Creating leases...");

  const leaseStart = new Date("2026-01-01");
  const leaseEnd = new Date("2026-12-31");

  // Arjun's lease (Flat 101)
  const arjunLease = await prisma.lease.create({
    data: {
      propertyId: skyline.id,
      unitId: flat101.id,
      landlordId: landlord.id,
      tenantId: tenantUser.id,
      status: LeaseStatus.ACTIVE,
      startDate: leaseStart,
      endDate: leaseEnd,
      monthlyRent: 32000,
      securityDeposit: 64000,
      dueDay: 5,
      partialPaymentsAllowed: false,
      cashPaymentsAllowed: true,
      cashApprovalRequired: true,
      autoRemindersEnabled: true,
    },
  });

  // Sameer's lease (Flat 201) — separate user, no app account
  const sameerLease = await prisma.lease.create({
    data: {
      propertyId: skyline.id,
      unitId: flat201.id,
      landlordId: landlord.id,
      tenantId: landlord.id, // placeholder — no tenant user account
      status: LeaseStatus.ACTIVE,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-08-31"),
      monthlyRent: 28000,
      securityDeposit: 56000,
      dueDay: 1,
      autoRemindersEnabled: true,
    },
  });

  // Villa A lease
  const villaALease = await prisma.lease.create({
    data: {
      propertyId: oakwood.id,
      unitId: villaA.id,
      landlordId: landlord.id,
      tenantId: landlord.id, // placeholder
      status: LeaseStatus.ACTIVE,
      startDate: new Date("2025-06-01"),
      endDate: new Date("2026-05-31"),
      monthlyRent: 75000,
      securityDeposit: 150000,
      dueDay: 1,
      autoRemindersEnabled: true,
    },
  });

  console.log("  ✓ Created 3 active leases");

  // ── 8. Rent charges for Arjun (Jan, Feb paid; Mar due) ────────────────────
  console.log("\n8️⃣  Creating rent charges...");

  const mkCharge = async (
    leaseId: string,
    year: number,
    month: number,
    status: ChargeStatus,
  ) => {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);
    const dueDate = new Date(year, month - 1, 5);
    const base = 32000;
    return prisma.rentCharge.create({
      data: {
        leaseId,
        periodStart,
        periodEnd,
        dueDate,
        baseRentAmount: base,
        totalAmount: base,
        balanceAmount: status === ChargeStatus.PAID ? 0 : base,
        status,
      },
    });
  };

  const janCharge = await mkCharge(arjunLease.id, 2026, 1, ChargeStatus.PAID);
  const febCharge = await mkCharge(arjunLease.id, 2026, 2, ChargeStatus.PAID);
  const marCharge = await mkCharge(arjunLease.id, 2026, 3, ChargeStatus.ISSUED);

  // Sameer's charges
  for (const [m, status] of [
    [1, ChargeStatus.PAID],
    [2, ChargeStatus.PAID],
    [3, ChargeStatus.OVERDUE],
  ] as [number, ChargeStatus][]) {
    const ps = new Date(2026, m - 1, 1);
    const pe = new Date(2026, m, 0);
    const dd = new Date(2026, m - 1, 1);
    await prisma.rentCharge.create({
      data: {
        leaseId: sameerLease.id,
        periodStart: ps,
        periodEnd: pe,
        dueDate: dd,
        baseRentAmount: 28000,
        totalAmount: 28000,
        balanceAmount: status === ChargeStatus.PAID ? 0 : 28000,
        status,
      },
    });
  }

  // Villa A charges
  for (const [m, status] of [
    [1, ChargeStatus.PAID],
    [2, ChargeStatus.PAID],
    [3, ChargeStatus.PAID],
  ] as [number, ChargeStatus][]) {
    const ps = new Date(2026, m - 1, 1);
    const pe = new Date(2026, m, 0);
    await prisma.rentCharge.create({
      data: {
        leaseId: villaALease.id,
        periodStart: ps,
        periodEnd: pe,
        dueDate: new Date(2026, m - 1, 1),
        baseRentAmount: 75000,
        totalAmount: 75000,
        balanceAmount: 0,
        status,
      },
    });
  }

  console.log(
    "  ✓ Created rent charges (Jan/Feb paid, Mar due for Arjun; Mar overdue for Sameer)",
  );

  // ── 9. Payments for Jan + Feb (Arjun) ─────────────────────────────────────
  console.log("\n9️⃣  Creating payment records...");

  await prisma.payment.create({
    data: {
      chargeId: janCharge.id,
      payerId: tenantUser.id,
      leaseId: arjunLease.id,
      amount: 32000,
      currency: "INR",
      status: PaymentStatus.SUCCEEDED,
      provider: "razorpay",
      providerPaymentId: "pay_demo_jan_001",
      paidAt: new Date("2026-01-04"),
      notes: "January rent",
    },
  });

  await prisma.payment.create({
    data: {
      chargeId: febCharge.id,
      payerId: tenantUser.id,
      leaseId: arjunLease.id,
      amount: 32000,
      currency: "INR",
      status: PaymentStatus.SUCCEEDED,
      provider: "razorpay",
      providerPaymentId: "pay_demo_feb_001",
      paidAt: new Date("2026-02-03"),
      notes: "February rent",
    },
  });

  // March charge is pending (no payment yet)
  console.log("  ✓ Created 2 successful payments (Jan + Feb)");

  // ── 10. Expenses ───────────────────────────────────────────────────────────
  console.log("\n1️⃣0️⃣  Creating expenses...");

  await prisma.expense.createMany({
    data: [
      {
        propertyId: skyline.id,
        leaseId: arjunLease.id,
        createdById: landlord.id,
        category: "MAINTENANCE",
        amount: 4500,
        description: "Plumbing repair — Flat 101 bathroom",
        incurredAt: new Date("2026-02-15"),
      },
      {
        propertyId: skyline.id,
        createdById: landlord.id,
        category: "UTILITIES",
        amount: 8200,
        description: "Common area electricity — February",
        incurredAt: new Date("2026-02-28"),
      },
      {
        propertyId: skyline.id,
        createdById: landlord.id,
        category: "INSURANCE",
        amount: 12000,
        description: "Annual building insurance premium",
        incurredAt: new Date("2026-01-10"),
      },
      {
        propertyId: oakwood.id,
        createdById: landlord.id,
        category: "TAX",
        amount: 18500,
        description: "Property tax Q1 2026",
        incurredAt: new Date("2026-01-20"),
      },
      {
        propertyId: oakwood.id,
        createdById: landlord.id,
        category: "MAINTENANCE",
        amount: 6000,
        description: "Pool maintenance — Villa A",
        incurredAt: new Date("2026-03-05"),
      },
    ],
  });
  console.log("  ✓ Created 5 expenses");

  // ── 11. Maintenance requests ───────────────────────────────────────────────
  console.log("\n1️⃣1️⃣  Creating maintenance requests...");

  const mainReq1 = await prisma.maintenanceRequest.create({
    data: {
      propertyId: skyline.id,
      unitId: flat101.id,
      leaseId: arjunLease.id,
      requesterId: tenantUser.id,
      title: "Bathroom tap leaking",
      category: "Plumbing",
      details:
        "The cold water tap in the main bathroom has been leaking for two days. Water is dripping constantly even when closed fully.",
      priority: MaintenancePriority.HIGH,
      status: MaintenanceStatus.IN_PROGRESS,
      scheduledAt: new Date("2026-03-18T10:00:00Z"),
    },
  });

  await prisma.maintenanceComment.create({
    data: {
      requestId: mainReq1.id,
      authorId: landlord.id,
      comment:
        "Plumber has been booked for Tuesday 18th March, 10 AM. Please ensure someone is home.",
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      propertyId: skyline.id,
      unitId: flat101.id,
      leaseId: arjunLease.id,
      requesterId: tenantUser.id,
      title: "AC remote not working",
      category: "Electrical",
      details:
        "Living room AC remote stopped responding. Tried changing batteries — no luck.",
      priority: MaintenancePriority.LOW,
      status: MaintenanceStatus.COMPLETED,
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      propertyId: oakwood.id,
      unitId: villaA.id,
      requesterId: landlord.id,
      title: "Gate motor servicing",
      category: "General",
      details: "Main gate motor making grinding noise. Needs annual servicing.",
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.SCHEDULED,
      scheduledAt: new Date("2026-03-22T09:00:00Z"),
    },
  });

  console.log("  ✓ Created 3 maintenance requests");

  // ── 12. Chat thread between landlord and Arjun ────────────────────────────
  console.log("\n1️⃣2️⃣  Creating chat thread...");

  const chatThread = await prisma.chatThread.create({
    data: {
      property: { connect: { id: skyline.id } },
      lease: { connect: { id: arjunLease.id } },
      title: "Flat 101 — General",
      participants: {
        create: [{ userId: landlord.id }, { userId: tenantUser.id }],
      },
    },
  });

  const messages = [
    {
      threadId: chatThread.id,
      senderId: landlord.id,
      content:
        "Hi Arjun! Welcome to Skyline Residency. Let me know if you need anything.",
      messageType: MessageType.TEXT,
      createdAt: new Date("2026-01-01T10:00:00Z"),
    },
    {
      threadId: chatThread.id,
      senderId: tenantUser.id,
      content:
        "Thank you Rajesh ji! The flat is great. I have just one request — the bathroom tap seems a bit loose.",
      messageType: MessageType.TEXT,
      createdAt: new Date("2026-01-02T09:15:00Z"),
    },
    {
      threadId: chatThread.id,
      senderId: landlord.id,
      content:
        "I'll get it fixed this week. I've already raised a maintenance request for it.",
      messageType: MessageType.TEXT,
      createdAt: new Date("2026-01-02T11:30:00Z"),
    },
    {
      threadId: chatThread.id,
      senderId: tenantUser.id,
      content: "February rent sent! Please confirm receipt.",
      messageType: MessageType.TEXT,
      createdAt: new Date("2026-02-03T14:00:00Z"),
    },
    {
      threadId: chatThread.id,
      senderId: landlord.id,
      content: "Received, thank you! March rent is due on the 5th.",
      messageType: MessageType.TEXT,
      createdAt: new Date("2026-02-03T14:45:00Z"),
    },
  ];

  for (const msg of messages) {
    await prisma.chatMessage.create({ data: msg });
  }
  console.log("  ✓ Created chat thread with 5 messages");

  // ── 13. Notifications for tenant ──────────────────────────────────────────
  console.log("\n1️⃣3️⃣  Creating notifications...");

  await prisma.notification.createMany({
    data: [
      {
        userId: tenantUser.id,
        type: "PAYMENT_DUE",
        title: "Rent due on 5th March",
        body: "Your March 2026 rent of ₹32,000 is due on 5th March. Pay now to avoid late fees.",
        channel: "IN_APP",
      },
      {
        userId: tenantUser.id,
        type: "MAINTENANCE_UPDATE",
        title: "Maintenance update: Bathroom tap",
        body: "Your maintenance request has been accepted. Plumber scheduled for 18th March, 10 AM.",
        channel: "IN_APP",
        readAt: new Date("2026-03-10T09:00:00Z"),
      },
      {
        userId: tenantUser.id,
        type: "PAYMENT_RECEIVED",
        title: "February rent confirmed ✓",
        body: "Your payment of ₹32,000 for February 2026 has been received. Thank you!",
        channel: "IN_APP",
        readAt: new Date("2026-02-03T15:00:00Z"),
      },
      {
        userId: landlord.id,
        type: "PAYMENT_RECEIVED",
        title: "Rent received from Arjun",
        body: "₹32,000 received from Arjun Sharma for Flat 101 (February 2026).",
        channel: "IN_APP",
      },
      {
        userId: landlord.id,
        type: "PAYMENT_DUE",
        title: "Sameer Khan — rent overdue",
        body: "Sameer Khan (Flat 201) has not paid March 2026 rent of ₹28,000. It was due on 1st March.",
        channel: "IN_APP",
      },
    ],
  });
  console.log("  ✓ Created notifications");

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n✅ Demo seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  LANDLORD LOGIN");
  console.log(`  Email   : ${LANDLORD_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Phone   : +91 00000 00000  (demo bypass)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  TENANT LOGIN");
  console.log(`  Email   : ${TENANT_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Phone   : +91 11111 11111  (demo bypass)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Properties : Skyline Residency (BLR) · Oakwood Villas (Pune)");
  console.log("  Arjun's lease: Flat 101 · Jan–Dec 2026 · ₹32,000/mo");
  console.log("  Jan + Feb : PAID  |  March : DUE (₹32,000)");
  console.log("  Maintenance: Bathroom tap (IN_PROGRESS), AC remote (DONE)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
