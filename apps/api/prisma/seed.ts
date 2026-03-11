import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Setup Auth Wrappers
  const admin = await prisma.user.upsert({
    where: { authUserId: "seed-admin-auth-id" },
    update: { email: "admin@proptech.local", role: UserRole.ADMIN },
    create: {
      authUserId: "seed-admin-auth-id",
      email: "admin@proptech.local",
      role: UserRole.ADMIN,
      firstName: "System",
      lastName: "Admin",
    },
  });

  const landlord = await prisma.user.upsert({
    where: { authUserId: "seed-landlord-auth-id" },
    update: { email: "landlord@proptech.local", role: UserRole.LANDLORD },
    create: {
      authUserId: "seed-landlord-auth-id",
      email: "landlord@proptech.local",
      role: UserRole.LANDLORD,
      firstName: "Demo",
      lastName: "Landlord",
      landlordProfile: {
        create: {
          companyName: "Demo Properties LLC",
        },
      },
    },
  });

  const tenantUser = await prisma.user.upsert({
    where: { authUserId: "seed-tenant-auth-id" },
    update: { email: "tenant@proptech.local", role: UserRole.TENANT },
    create: {
      authUserId: "seed-tenant-auth-id",
      email: "tenant@proptech.local",
      role: UserRole.TENANT,
      firstName: "Demo",
      lastName: "Tenant",
      tenantProfile: {
        create: {
          emergencyContactName: "Emergency Contact",
          emergencyContactPhone: "+10000000000",
        },
      },
    },
  });

  // 2. Clear out Old Demo Properties to ensure a clean slate
  await prisma.property.deleteMany({
    where: {
      ownerId: landlord.id,
      name: { in: ["Skyline Hostel & PG", "Oakwood Shared Apartments"] },
    },
  });

  // 3. Setup Property 1: "Skyline Hostel & PG"
  const skylineProperty = await prisma.property.create({
    data: {
      ownerId: landlord.id,
      name: "Skyline Hostel & PG",
      propertyType: "PG / Hostel",
      floors: 3,
      totalUnits: 6,
      amenities: ["Wi-Fi", "24/7 Security", "Power Backup", "Meals Included"],
      ownership: "MANAGED",
      status: "ACTIVE",
      addressLine1: "142 Skyline Blvd",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      country: "IN",
      units: {
        create: [
          {
            name: "Room 101",
            bedrooms: 1,
            bathrooms: 1,
            occupancy: 3,
            furnishing: "Fully Furnished",
            monthlyRent: 30000,
            securityDeposit: 60000,
            status: "OCCUPIED",
            floor: "1",
            meterNumber: "MTR-SKY-101",
            beds: {
              create: [
                { label: "Bed A" },
                { label: "Bed B" },
                { label: "Bed C" },
              ],
            },
          },
          {
            name: "Room 102",
            bedrooms: 1,
            bathrooms: 1,
            occupancy: 2,
            furnishing: "Fully Furnished",
            monthlyRent: 22000,
            securityDeposit: 44000,
            status: "OCCUPIED",
            floor: "1",
            meterNumber: "MTR-SKY-102",
            beds: {
              create: [{ label: "Bed A" }, { label: "Bed B" }],
            },
          },
        ],
      },
    },
    include: { units: { include: { beds: true } } },
  });

  // 4. Setup Property 2: "Oakwood Shared Apartments"
  const oakwoodProperty = await prisma.property.create({
    data: {
      ownerId: landlord.id,
      name: "Oakwood Shared Apartments",
      propertyType: "Apartment",
      floors: 5,
      totalUnits: 15,
      amenities: ["Parking", "Gym", "Lift / Elevator", "Power Backup"],
      ownership: "SELF_OWNED",
      status: "ACTIVE",
      addressLine1: "99 Oakwood Drive",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411014",
      country: "IN",
      units: {
        create: [
          {
            name: "Flat A-201",
            bedrooms: 3,
            bathrooms: 3,
            occupancy: 3,
            furnishing: "Semi-Furnished",
            monthlyRent: 45000,
            securityDeposit: 90000,
            status: "OCCUPIED",
            floor: "2",
            meterNumber: "MTR-OAK-201",
            beds: {
              create: [
                { label: "Master Bed" },
                { label: "Guest Bed 1" },
                { label: "Guest Bed 2" },
              ],
            },
          },
        ],
      },
    },
    include: { units: { include: { beds: true } } },
  });

  // 5. Populate Tenants for Skyline 101
  const skylineUnit101 = skylineProperty.units[0];
  const t1 = await prisma.tenant.create({
    data: {
      userId: tenantUser.id, // Linking our Demo Tenant here
      unitId: skylineUnit101.id,
      bedId: skylineUnit101.beds[0].id,
      name: "Demo Tenant (Arjun)",
      phone: "+91 9876543210",
      rentAmount: 10000,
    },
  });
  await prisma.bed.update({
    where: { id: skylineUnit101.beds[0].id },
    data: { tenantId: t1.id },
  });

  const t2 = await prisma.tenant.create({
    data: {
      unitId: skylineUnit101.id,
      bedId: skylineUnit101.beds[1].id,
      name: "Ravi Kumar",
      phone: "+91 9876543211",
      rentAmount: 10000,
    },
  });
  await prisma.bed.update({
    where: { id: skylineUnit101.beds[1].id },
    data: { tenantId: t2.id },
  });

  // 6. Populate Tenants for Oakwood Flat 201
  const oakwoodFlat = oakwoodProperty.units[0];
  const t3 = await prisma.tenant.create({
    data: {
      unitId: oakwoodFlat.id,
      bedId: oakwoodFlat.beds[0].id, // Master Bed
      name: "Priya Sharma",
      phone: "+91 8888888888",
      rentAmount: 20000,
    },
  });
  await prisma.bed.update({
    where: { id: oakwoodFlat.beds[0].id },
    data: { tenantId: t3.id },
  });

  // 7. Generate Shared Utility Expense (Electric Bill for Skyline 101)
  const monthDate = new Date();
  monthDate.setDate(1); // Start of month

  const skylineElectricUtility = await prisma.utility.create({
    data: {
      propertyId: skylineProperty.id,
      unitId: skylineUnit101.id,
      type: "ELECTRICITY",
      amount: 1500,
      billingMonth: monthDate,
      splitMethod: "PER_TENANT",
    },
  });

  // Distribute utility split proportionally (750 each for the 2 active tenants on 101)
  await prisma.utilitySplit.createMany({
    data: [
      { utilityId: skylineElectricUtility.id, tenantId: t1.id, amount: 750 },
      { utilityId: skylineElectricUtility.id, tenantId: t2.id, amount: 750 },
    ],
  });

  console.log(
    JSON.stringify(
      {
        seeded: true,
        message: "Successfully seeded dummy Investor PG Properties!",
        users: {
          admin: admin.id,
          landlord: landlord.id,
          tenant: tenantUser.id,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
