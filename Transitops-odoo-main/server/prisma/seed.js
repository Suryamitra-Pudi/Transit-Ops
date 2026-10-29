const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('password123', 10);

  const users = [
    { name: 'Ava Fleet', email: 'fleet.manager@transitops.dev', role: 'FLEET_MANAGER' },
    { name: 'Dev Driver', email: 'driver@transitops.dev', role: 'DRIVER' },
    { name: 'Sam Safety', email: 'safety.officer@transitops.dev', role: 'SAFETY_OFFICER' },
    { name: 'Fiona Finance', email: 'financial.analyst@transitops.dev', role: 'FINANCIAL_ANALYST' },
    { name: 'Admin User', email: 'admin@transitops.dev', role: 'ADMIN' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: password },
    });
  }

  const van = await prisma.vehicle.upsert({
    where: { registrationNumber: 'VAN-05' },
    update: {},
    create: {
      registrationNumber: 'VAN-05',
      name: 'Van-05',
      type: 'Van',
      maxLoadCapacityKg: 500,
      odometerKm: 12000,
      acquisitionCost: 25000,
      region: 'North',
      status: 'AVAILABLE',
    },
  });

  const truck = await prisma.vehicle.upsert({
    where: { registrationNumber: 'TRK-11' },
    update: {},
    create: {
      registrationNumber: 'TRK-11',
      name: 'Truck-11',
      type: 'Truck',
      maxLoadCapacityKg: 3000,
      odometerKm: 54000,
      acquisitionCost: 65000,
      region: 'South',
      status: 'AVAILABLE',
    },
  });

  const driverUser = await prisma.user.findUnique({ where: { email: 'driver@transitops.dev' } });

  const alex = await prisma.driver.upsert({
    where: { licenseNumber: 'DL-1001' },
    update: {},
    create: {
      name: 'Alex',
      userId: driverUser?.id || null,
      licenseNumber: 'DL-1001',
      licenseCategory: 'Light Motor Vehicle',
      licenseExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      contactNumber: '+1-555-0101',
      safetyScore: 95,
      status: 'AVAILABLE',
    },
  });

  await prisma.driver.upsert({
    where: { licenseNumber: 'DL-1002' },
    update: {},
    create: {
      name: 'Priya',
      licenseNumber: 'DL-1002',
      licenseCategory: 'Heavy Motor Vehicle',
      licenseExpiryDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // expired, for demo
      contactNumber: '+1-555-0102',
      safetyScore: 88,
      status: 'AVAILABLE',
    },
  });

  console.log('Seed complete:');
  console.log('  Vehicles:', van.registrationNumber, truck.registrationNumber);
  console.log('  Drivers:', alex.name, '(Priya has an expired license for demo purposes)');
  console.log('  Demo logins (password: password123):');
  users.forEach((u) => console.log(`    ${u.role}: ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
