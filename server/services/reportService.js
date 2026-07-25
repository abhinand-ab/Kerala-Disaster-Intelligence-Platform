import Incident from "../models/Incident.js";
import Shelter from "../models/Shelter.js";
import Warehouse from "../models/Warehouse.js";
import Vehicle from "../models/Vehicle.js";
import RescueTeam from "../models/RescueTeam.js";
import AIRecommendation from "../models/AIRecommendation.js";
import SensorReading from "../models/SensorReading.js";

/**
 * Helper to filter queries by date range
 */
const buildDateFilter = (timeframe, startDate, endDate) => {
    const filter = {};
    const now = new Date();

    if (timeframe === "daily") {
        const start = new Date(now.setHours(0, 0, 0, 0));
        filter.createdAt = { $gte: start };
    } else if (timeframe === "weekly") {
        const start = new Date();
        start.setDate(now.getDate() - 7);
        filter.createdAt = { $gte: start };
    } else if (timeframe === "monthly") {
        const start = new Date();
        start.setMonth(now.getMonth() - 1);
        filter.createdAt = { $gte: start };
    } else if (timeframe === "custom" && startDate) {
        filter.createdAt = {};
        filter.createdAt.$gte = new Date(startDate);
        if (endDate) {
            filter.createdAt.$lte = new Date(endDate);
        }
    }
    return filter;
};

/**
 * CSV Builder
 */
const convertToCSV = (headers, rows) => {
    const headerRow = headers.join(",");
    const dataRows = rows.map((row) =>
        row
            .map((val) => {
                const clean = String(val === null || val === undefined ? "" : val).replace(/"/g, '""');
                return clean.includes(",") || clean.includes("\n") || clean.includes('"') ? `"${clean}"` : clean;
            })
            .join(",")
    );
    return [headerRow, ...dataRows].join("\r\n");
};

/**
 * Report Data Collector
 */
export const fetchReportData = async (reportType, filters) => {
    const { timeframe, startDate, endDate, district, extraType } = filters;
    const dateFilter = buildDateFilter(timeframe, startDate, endDate);

    if (district) {
        if (reportType === "incidents") {
            dateFilter["location.district"] = district;
        } else if (reportType === "shelters" || reportType === "vehicles" || reportType === "ai" || reportType === "sensors") {
            dateFilter.district = district;
        }
    }

    if (extraType && reportType === "incidents") {
        dateFilter.category = extraType;
    }

    switch (reportType) {
        case "incidents":
            return await Incident.find(dateFilter).sort({ createdAt: -1 });
        case "shelters":
            return await Shelter.find(dateFilter).sort({ createdAt: -1 });
        case "resources":
            // Warehouse inventories aren't strictly based on dates
            return await Warehouse.find(district ? { district } : {}).sort({ createdAt: -1 });
        case "vehicles":
            return await Vehicle.find(district ? { district } : {}).sort({ createdAt: -1 });
        case "ai":
            return await AIRecommendation.find(dateFilter).sort({ createdAt: -1 });
        case "sensors":
            return await SensorReading.find(dateFilter).populate("sensorId").sort({ createdAt: -1 }).limit(300);
        default:
            return [];
    }
};

/**
 * CSV Generation Service
 */
export const generateCSVReport = (reportType, data) => {
    if (!data || data.length === 0) {
        return "No data recorded for this timeframe.";
    }

    let headers = [];
    let rows = [];

    if (reportType === "incidents") {
        headers = ["ID", "Title", "Category", "Severity", "Status", "District", "Created At"];
        rows = data.map((d) => [
            d._id,
            d.title,
            d.category,
            d.severity,
            d.status,
            d.location?.district || "",
            d.createdAt.toISOString(),
        ]);
    } else if (reportType === "shelters") {
        headers = ["ID", "Name", "District", "Status", "Capacity", "Current Occupancy", "Created At"];
        rows = data.map((d) => [
            d._id,
            d.name,
            d.district || "",
            d.status,
            d.capacity,
            d.currentOccupancy,
            d.createdAt.toISOString(),
        ]);
    } else if (reportType === "resources") {
        headers = ["Warehouse ID", "Warehouse Name", "District", "Resource Category", "Item Name", "Quantity"];
        data.forEach((w) => {
            (w.inventory || []).forEach((item) => {
                rows.push([
                    w._id,
                    w.name,
                    w.district || "",
                    item.category || "",
                    item.name,
                    item.quantity,
                ]);
            });
        });
        if (rows.length === 0) return "No resources active in warehouses.";
    } else if (reportType === "vehicles") {
        headers = ["ID", "Vehicle Number", "Type", "Status", "Driver Name", "District"];
        rows = data.map((d) => [
            d._id,
            d.vehicleNumber,
            d.vehicleType,
            d.status,
            d.driverName,
            d.district || "",
        ]);
    } else if (reportType === "ai") {
        headers = ["ID", "Type", "Priority", "District", "Recommendation", "Confidence Score", "Status", "Generated At"];
        rows = data.map((d) => [
            d._id,
            d.recommendationType,
            d.priority,
            d.district,
            d.recommendation,
            d.confidenceScore,
            d.status,
            d.createdAt.toISOString(),
        ]);
    } else if (reportType === "sensors") {
        headers = ["Reading ID", "Sensor Name", "District", "Type", "Value", "Raw Status", "Time"];
        rows = data.map((d) => [
            d._id,
            d.sensorId?.name || "Unknown",
            d.sensorId?.district || "",
            d.sensorId?.sensorType || "",
            d.value,
            d.status,
            d.createdAt.toISOString(),
        ]);
    }

    return convertToCSV(headers, rows);
};

/**
 * Beautiful HTML Report (Renders perfectly for printing PDF or Excel imports)
 */
export const generateHTMLReport = (reportType, data, filters) => {
    const { timeframe, startDate, endDate, district } = filters;
    const dateStr = timeframe === "custom" ? `${startDate} to ${endDate || "current"}` : timeframe.toUpperCase();

    let tableHeaders = "";
    let tableRows = "";

    if (reportType === "incidents") {
        tableHeaders = `
            <th>Title</th>
            <th>Category</th>
            <th>Severity</th>
            <th>Status</th>
            <th>District</th>
            <th>Date Reported</th>
        `;
        tableRows = data.map(d => `
            <tr>
                <td><strong>${d.title}</strong></td>
                <td><span class="badge gray">${d.category}</span></td>
                <td><span class="badge ${d.severity === 'Critical' ? 'red' : d.severity === 'High' ? 'orange' : 'blue'}">${d.severity}</span></td>
                <td><span class="badge green">${d.status}</span></td>
                <td>${d.location?.district || "Unknown"}</td>
                <td>${new Date(d.createdAt).toLocaleString()}</td>
            </tr>
        `).join("");
    } else if (reportType === "shelters") {
        tableHeaders = `
            <th>Shelter Name</th>
            <th>District</th>
            <th>Status</th>
            <th>Capacity</th>
            <th>Occupancy</th>
            <th>Utilization</th>
        `;
        tableRows = data.map(d => {
            const utilization = d.capacity > 0 ? Math.round((d.currentOccupancy / d.capacity) * 100) : 0;
            return `
                <tr>
                    <td><strong>${d.name}</strong></td>
                    <td>${d.district || "Unknown"}</td>
                    <td><span class="badge green">${d.status}</span></td>
                    <td>${d.capacity}</td>
                    <td>${d.currentOccupancy}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${utilization}%"></div>
                        </div>
                        <span class="pct">${utilization}%</span>
                    </td>
                </tr>
            `;
        }).join("");
    } else if (reportType === "resources") {
        tableHeaders = `
            <th>Warehouse</th>
            <th>District</th>
            <th>Resource Type</th>
            <th>Item Name</th>
            <th>In-stock Qty</th>
        `;
        data.forEach(w => {
            (w.inventory || []).forEach(item => {
                tableRows += `
                    <tr>
                        <td><strong>${w.name}</strong></td>
                        <td>${w.district || "Unknown"}</td>
                        <td><span class="badge blue">${item.category || "General"}</span></td>
                        <td>${item.name}</td>
                        <td>${item.quantity} units</td>
                    </tr>
                `;
            });
        });
    } else if (reportType === "vehicles") {
        tableHeaders = `
            <th>Vehicle No</th>
            <th>Type</th>
            <th>Status</th>
            <th>Driver Name</th>
            <th>District</th>
        `;
        tableRows = data.map(d => `
            <tr>
                <td><strong>${d.vehicleNumber}</strong></td>
                <td>${d.vehicleType}</td>
                <td><span class="badge ${d.status === 'Available' ? 'green' : 'orange'}">${d.status}</span></td>
                <td>${d.driverName}</td>
                <td>${d.district || "State-wide"}</td>
            </tr>
        `).join("");
    } else if (reportType === "ai") {
        tableHeaders = `
            <th>AI Recommendation</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Confidence</th>
            <th>District</th>
            <th>Status</th>
        `;
        tableRows = data.map(d => `
            <tr>
                <td style="max-width: 300px;">${d.recommendation}</td>
                <td><span class="badge gray">${d.recommendationType}</span></td>
                <td><span class="badge ${d.priority === 'Critical' ? 'red' : 'orange'}">${d.priority}</span></td>
                <td><strong>${d.confidenceScore}%</strong></td>
                <td>${d.district}</td>
                <td><span class="badge ${d.status === 'Accepted' ? 'green' : d.status === 'Rejected' ? 'red' : 'blue'}">${d.status}</span></td>
            </tr>
        `).join("");
    } else if (reportType === "sensors") {
        tableHeaders = `
            <th>Sensor Node</th>
            <th>Type</th>
            <th>Value</th>
            <th>Safety Status</th>
            <th>District</th>
            <th>Reading Logged</th>
        `;
        tableRows = data.map(d => `
            <tr>
                <td><strong>${d.sensorId?.name || "Unknown"}</strong></td>
                <td>${d.sensorId?.sensorType || "Unknown"}</td>
                <td>${d.value?.toFixed(1) || 0}</td>
                <td><span class="badge ${d.status === 'Normal' ? 'green' : 'red'}">${d.status}</span></td>
                <td>${d.sensorId?.district || "Unknown"}</td>
                <td>${new Date(d.createdAt).toLocaleString()}</td>
            </tr>
        `).join("");
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Disaster Platform - ${reportType.toUpperCase()} Executive Summary</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #fff; margin: 30px; }
            .header-container { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-section h1 { margin: 0; font-size: 22px; font-weight: 800; color: #4338ca; }
            .logo-section p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
            .meta-section { text-align: right; font-size: 11px; color: #64748b; line-height: 1.6; }
            .report-title { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 20px; color: #0f172a; }
            .summary-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px; margin-bottom: 30px; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
            .card h3 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; }
            .card p { margin: 0; font-size: 20px; font-weight: 800; color: #1e1b4b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th { text-align: left; background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 10px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            tr:hover { background-color: #f8fafc; }
            .badge { display: inline-flex; align-items: center; justify-content: center; padding: 2px 8px; border-radius: 9999px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
            .badge.green { background: #dcfce7; color: #166534; }
            .badge.red { background: #fee2e2; color: #991b1b; }
            .badge.orange { background: #ffedd5; color: #9a3412; }
            .badge.blue { background: #dbeafe; color: #1e40af; }
            .badge.gray { background: #f1f5f9; color: #334155; }
            .progress-bar { display: inline-block; width: 60px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; vertical-align: middle; }
            .progress { height: 100%; background: #4f46e5; }
            .pct { font-size: 10px; font-weight: bold; margin-left: 5px; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; }
            @media print {
                body { margin: 0; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body onload="window.focus();">
        <div class="header-container">
            <div class="logo-section">
                <h1>KERALA DISASTER INTELLIGENCE PLATFORM</h1>
                <p>Advanced Analytics & Operations Reporting</p>
            </div>
            <div class="meta-section">
                <strong>District Filter:</strong> ${district || "All Districts"}<br/>
                <strong>Timeframe:</strong> ${dateStr}<br/>
                <strong>Generated On:</strong> ${new Date().toLocaleString()}
            </div>
        </div>

        <div class="report-title">${reportType} Summary Execution Report</div>

        <div class="summary-cards">
            <div class="card">
                <h3>Total Records</h3>
                <p>${data.length}</p>
            </div>
            <div class="card">
                <h3>Report Class</h3>
                <p>${reportType.toUpperCase()}</p>
            </div>
            <div class="card">
                <h3>System Status</h3>
                <p style="color: #166534;">SECURE</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    ${tableHeaders}
                </tr>
            </thead>
            <tbody>
                ${tableRows || `<tr><td colspan="10" style="text-align: center; color: #94a3b8; font-style: italic; padding: 25px;">No active records in this query.</td></tr>`}
            </tbody>
        </table>

        <div class="footer">
            Confidential operations summary. Generated automatically for disaster emergency administrators. © ${new Date().getFullYear()} Kerala Disaster Intelligence.
        </div>
    </body>
    </html>
    `;
};
