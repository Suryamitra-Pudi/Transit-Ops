const { Parser } = require('json2csv');
const reportService = require('../services/report.service');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/reports/dashboard?type=&region=
exports.dashboard = asyncHandler(async (req, res) => {
  const { type, region } = req.query;
  const kpis = await reportService.getDashboardKpis({ type, region });
  res.json(kpis);
});

// GET /api/reports/analytics
exports.analytics = asyncHandler(async (req, res) => {
  const data = await reportService.getVehicleAnalytics();
  res.json(data);
});

// GET /api/reports/export/csv
exports.exportCsv = asyncHandler(async (req, res) => {
  const data = await reportService.getVehicleAnalytics();
  const parser = new Parser();
  const csv = parser.parse(data);

  res.header('Content-Type', 'text/csv');
  res.attachment('transitops-analytics.csv');
  res.send(csv);
});
