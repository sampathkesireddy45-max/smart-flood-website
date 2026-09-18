const API_BASE = "http://localhost:8000/api";

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`Fetch error for ${endpoint}, using fallback if available:`, err);
    throw err;
  }
}

export const api = {
  // Authentication & OTP Verification
  requestOtp: (phone, portal = "citizen") =>
    request("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone, portal }),
    }),
  verifyOtp: (phone, otp, portal = "citizen") =>
    request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp, portal }),
    }),
  getAuthConfig: () => request("/auth/config"),
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Weather
  getCurrentWeather: (lat, lng) => {
    let q = [];
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/weather/current${q.length ? "?" + q.join("&") : ""}`);
  },
  getWeatherForecast: (lat, lng) => {
    let q = [];
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/weather/forecast${q.length ? "?" + q.join("&") : ""}`);
  },

  // Risk
  getRiskAreas: (lat, lng) => {
    let q = [];
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/risk/areas${q.length ? "?" + q.join("&") : ""}`);
  },
  getWardRisk: (id, lat, lng) => {
    let q = [];
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/risk/wards/${id}${q.length ? "?" + q.join("&") : ""}`);
  },
  recalculateRisk: () => request("/risk/recalculate", { method: "POST" }),
  getRiskConfig: () => request("/risk/config"),

  // Roads
  getRoads: (status, lat, lng) => {
    let q = [];
    if (status) q.push(`status=${status}`);
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/roads${q.length ? "?" + q.join("&") : ""}`);
  },
  getRoadSummary: () => request("/roads/summary"),
  updateRoadStatus: (id, payload) =>
    request(`/roads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getRoadHistory: () => request("/roads/history"),

  // Drainage
  getDrainageAssets: (wardId, lat, lng) => {
    let q = [];
    if (wardId) q.push(`ward_id=${wardId}`);
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/drainage${q.length ? "?" + q.join("&") : ""}`);
  },
  getDrainageSummary: (lat, lng) => {
    let q = [];
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/drainage/summary${q.length ? "?" + q.join("&") : ""}`);
  },
  updateDrainageCondition: (id, payload) =>
    request(`/drainage/${id}/condition`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // Facilities
  getFacilities: (facility_type, accessibility, lat, lng) => {
    let q = [];
    if (facility_type) q.push(`facility_type=${facility_type}`);
    if (accessibility) q.push(`accessibility=${accessibility}`);
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/facilities${q.length ? "?" + q.join("&") : ""}`);
  },
  getFacilitiesSummary: () => request("/facilities/summary"),

  // Reports
  getReports: (status, type, lat, lng) => {
    let q = [];
    if (status) q.push(`verification_status=${status}`);
    if (type) q.push(`report_type=${type}`);
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/reports${q.length ? "?" + q.join("&") : ""}`);
  },
  submitReport: (payload) =>
    request("/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyReport: (id, payload) =>
    request(`/reports/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // Incidents
  getIncidents: (status, priority, lat, lng) => {
    let q = [];
    if (status) q.push(`status=${status}`);
    if (priority) q.push(`priority=${priority}`);
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/incidents${q.length ? "?" + q.join("&") : ""}`);
  },
  createIncident: (payload) =>
    request("/incidents", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateIncidentStatus: (id, payload) =>
    request(`/incidents/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // Tasks
  getTasks: (workerName, status, lat, lng) => {
    let q = [];
    if (workerName) q.push(`worker_name=${encodeURIComponent(workerName)}`);
    if (status) q.push(`status=${status}`);
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/tasks${q.length ? "?" + q.join("&") : ""}`);
  },
  createTask: (payload) =>
    request("/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTaskStatus: (id, payload) =>
    request(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  submitTaskEvidence: (id, payload) =>
    request(`/tasks/${id}/evidence`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Safe Route
  calculateRoute: (payload) =>
    request("/routes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Resources
  getResources: () => request("/resources"),
  getTeams: () => request("/resources/teams"),
  updateResource: (id, payload) =>
    request(`/resources/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // Analytics & KPIs
  getDashboardSummary: (lat, lng) => {
    let q = [];
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/analytics/summary${q.length ? "?" + q.join("&") : ""}`);
  },
  getHistoricalCharts: (lat, lng) => {
    let q = [];
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/analytics/charts${q.length ? "?" + q.join("&") : ""}`);
  },
  getAuditLogs: (limit = 25, lat, lng) => {
    let q = [`limit=${limit}`];
    if (lat !== undefined && lat !== null) q.push(`lat=${lat}`);
    if (lng !== undefined && lng !== null) q.push(`lng=${lng}`);
    return request(`/analytics/audit?${q.join("&")}`);
  },

  // Simulation
  runSimulation: (payload) =>
    request("/simulation/run", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Demo
  resetDemo: () => request("/demo/reset", { method: "POST" }),
  triggerDemoStep: (step) =>
    request("/demo/trigger-step", {
      method: "POST",
      body: JSON.stringify({ step }),
    }),
};
