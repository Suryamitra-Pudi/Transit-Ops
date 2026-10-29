const prisma = require('./prisma');

// Dashboard KPIs
async function getDashboardKpis(filters = {}) {
  const { type, region } = filters;
  const vehicleWhere = {};
  if (type) vehicleWhere.type = type;
  if (region) vehicleWhere.region = region;

  const vehicles = await prisma.vehicle.findMany({ where: vehicleWhere });
  const drivers = await prisma.driver.findMany();
  const trips = await prisma.trip.findMany({ where: { vehicle: vehicleWhere } });

  const activeVehicles = vehicles.filter((v) => v.status !== 'RETIRED').length;
  const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const vehiclesInMaintenance = vehicles.filter((v) => v.status === 'IN_SHOP').length;
  const activeTrips = trips.filter((t) => t.status === 'DISPATCHED').length;
  const pendingTrips = trips.filter((t) => t.status === 'DRAFT').length;
  const driversOnDuty = drivers.filter((d) => d.status === 'ON_TRIP').length;

  // Fleet utilization = vehicles currently on a trip / total non-retired vehicles.
  const onTripVehicles = vehicles.filter((v) => v.status === 'ON_TRIP').length;
  const fleetUtilization = activeVehicles > 0 ? (onTripVehicles / activeVehicles) * 100 : 0;

  return {
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization: Number(fleetUtilization.toFixed(1)),
  };
}

// Per-vehicle analytics: fuel efficiency, operational cost, ROI.
async function getVehicleAnalytics() {
  const vehicles = await prisma.vehicle.findMany({
    include: { fuelLogs: true, maintenanceLogs: true, expenses: true, trips: true },
  });

  return vehicles.map((v) => {
    const approvedFuel = v.fuelLogs.filter((f) => f.status === 'APPROVED');
    const totalFuelLiters = approvedFuel.reduce((sum, f) => sum + f.liters, 0);
    const totalFuelCost = approvedFuel.reduce((sum, f) => sum + f.cost, 0);
    const totalMaintenanceCost = v.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
    const approvedExpenses = v.expenses.filter((e) => e.status === 'APPROVED');
    const totalOtherExpenses = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalDistance = v.trips
      .filter((t) => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + (t.actualDistanceKm || 0), 0);

    // Revenue isn't tracked as a distinct entity in the data model yet;
    // approximate it from completed trip distance as a placeholder so the
    // ROI formula from the spec is still demonstrable end-to-end.
    const estimatedRevenue = totalDistance * 25; // placeholder rate per km

    const operationalCost = totalFuelCost + totalMaintenanceCost;
    const fuelEfficiency = totalFuelLiters > 0 ? totalDistance / totalFuelLiters : 0;
    const roi =
      v.acquisitionCost > 0
        ? (estimatedRevenue - (totalMaintenanceCost + totalFuelCost)) / v.acquisitionCost
        : 0;

    return {
      vehicleId: v.id,
      registrationNumber: v.registrationNumber,
      name: v.name,
      status: v.status,
      totalDistanceKm: Number(totalDistance.toFixed(1)),
      totalFuelLiters: Number(totalFuelLiters.toFixed(1)),
      fuelEfficiencyKmPerL: Number(fuelEfficiency.toFixed(2)),
      totalFuelCost: Number(totalFuelCost.toFixed(2)),
      totalMaintenanceCost: Number(totalMaintenanceCost.toFixed(2)),
      totalOtherExpenses: Number(totalOtherExpenses.toFixed(2)),
      operationalCost: Number((operationalCost + totalOtherExpenses).toFixed(2)),
      estimatedRevenue: Number(estimatedRevenue.toFixed(2)),
      roi: Number(roi.toFixed(3)),
    };
  });
}

module.exports = { getDashboardKpis, getVehicleAnalytics };
