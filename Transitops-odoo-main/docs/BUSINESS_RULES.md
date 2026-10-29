# TransitOps — Business Rules Reference

This document maps each mandatory rule from the problem statement to where it's enforced in code.

| Rule | Enforced in |
|---|---|
| Vehicle registration number must be unique | `server/controllers/vehicle.controller.js` (`createVehicle`, `updateVehicle`) via Prisma `@unique` |
| Retired or In Shop vehicles never appear in dispatch selection | `GET /api/vehicles?dispatchable=true` filters to `AVAILABLE` only; enforced again server-side at `POST /api/trips/:id/dispatch` |
| Drivers with expired licenses or Suspended status cannot be assigned | `GET /api/drivers?dispatchable=true` filters; re-validated in `dispatchTrip` |
| A driver/vehicle already On Trip cannot be assigned again | `dispatchTrip` checks current status before transition |
| Cargo weight must not exceed vehicle max load capacity | Checked at trip creation (`createTrip`) and again at dispatch (`dispatchTrip`) |
| Dispatching a trip sets vehicle & driver to On Trip | `dispatchTrip` — atomic `$transaction` |
| Completing a trip sets vehicle & driver back to Available | `completeTrip` — atomic `$transaction` |
| Cancelling a dispatched trip restores vehicle & driver to Available | `cancelTrip` — only restores if the trip had actually been dispatched |
| Creating an active maintenance record sets vehicle to In Shop | `createMaintenance` — atomic `$transaction` |
| Closing maintenance restores vehicle to Available (unless retired) | `closeMaintenance` — checks for other open maintenance records and retired status before restoring |

## Roles (RBAC)

| Role | Can do |
|---|---|
| `ADMIN` | Everything |
| `FLEET_MANAGER` | Vehicles, drivers, trips, maintenance, fuel logs |
| `DRIVER` | Create/dispatch/complete/cancel trips, log fuel |
| `SAFETY_OFFICER` | Manage driver records, view compliance data |
| `FINANCIAL_ANALYST` | Manage expenses, view reports |

All roles can read dashboards and reports; write access is restricted per the table above (see each `routes/*.js` file for exact `authorize(...)` calls).
