export type Role = 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  region?: string | null;
  status: VehicleStatus;
  createdAt: string;
}

export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  createdAt: string;
}

export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  actualDistanceKm?: number | null;
  fuelConsumedL?: number | null;
  status: TripStatus;
  vehicle?: Vehicle;
  driver?: Driver;
  createdAt: string;
}

export type MaintenanceStatus = 'OPEN' | 'CLOSED';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  openedAt: string;
  closedAt?: string | null;
  vehicle?: Vehicle;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
  status: string;
  vehicle?: Vehicle;
}

export interface Expense {
  id: string;
  vehicleId: string;
  category: string;
  amount: number;
  date: string;
  notes?: string | null;
  status: string;
  vehicle?: Vehicle;
}

export interface DashboardKpis {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
}

export interface VehicleAnalytics {
  vehicleId: string;
  registrationNumber: string;
  name: string;
  status: VehicleStatus;
  totalDistanceKm: number;
  totalFuelLiters: number;
  fuelEfficiencyKmPerL: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOtherExpenses: number;
  operationalCost: number;
  estimatedRevenue: number;
  roi: number;
}
