import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  const tenant = await prisma.user.upsert({
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

  console.log(
    JSON.stringify(
      {
        seeded: true,
        users: {
          admin: admin.id,
          landlord: landlord.id,
          tenant: tenant.id,
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
