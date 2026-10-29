# TransitOps API Reference (v1)

Base URL: `http://localhost:4000/api`
Auth: `Authorization: Bearer <token>` (obtained from `/auth/login`)

## Auth
- `POST /auth/register` — { name, email, password, role }
- `POST /auth/login` — { email, password } → { token, user }
- `GET /auth/me`

## Vehicles
- `GET /vehicles?status=&type=&region=&dispatchable=true`
- `GET /vehicles/:id`
- `POST /vehicles` — { registrationNumber, name, type, maxLoadCapacityKg, odometerKm, acquisitionCost, region }
- `PUT /vehicles/:id`
- `DELETE /vehicles/:id`

## Drivers
- `GET /drivers?status=&dispatchable=true`
- `GET /drivers/expiring-licenses?days=30`
- `GET /drivers/:id`
- `POST /drivers` — { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore }
- `PUT /drivers/:id`
- `DELETE /drivers/:id`

## Trips
- `GET /trips?status=`
- `GET /trips/:id`
- `POST /trips` — { source, destination, vehicleId, driverId, cargoWeightKg, plannedDistanceKm } (creates a Draft)
- `POST /trips/:id/dispatch`
- `POST /trips/:id/complete` — { finalOdometerKm, fuelConsumedL }
- `POST /trips/:id/cancel`

## Maintenance
- `GET /maintenance?status=&vehicleId=`
- `POST /maintenance` — { vehicleId, description, cost }
- `POST /maintenance/:id/close` — { cost }

## Fuel & Expenses
- `GET /fuel-logs?vehicleId=`
- `POST /fuel-logs` — { vehicleId, liters, cost, date }
- `GET /expenses?vehicleId=&category=`
- `POST /expenses` — { vehicleId, category, amount, date, notes }

## Reports
- `GET /reports/dashboard?type=&region=` — KPIs
- `GET /reports/analytics` — per-vehicle fuel efficiency / cost / ROI
- `GET /reports/export/csv` — CSV download
