// Firebase & Supabase configuration
// Using Supabase for real database (PostgreSQL backend)

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-public-anon-key';

// Initialize Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== STATE =====
const state = {
  user: null,
  households: [],
  devices: [],
  alerts: [],
  readings: [],
  isLoading: false,
  error: null
};

// ===== AUTHENTICATION =====
async function signup(email, password, fullName) {
  try {
    state.isLoading = true;
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (error) throw error;

    // Create user profile
    await supabaseClient
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          email,
          full_name: fullName,
          created_at: new Date()
        }
      ]);

    showToast('Account created! Please check your email to verify.');
    return data;
  } catch (error) {
    showToast('Signup failed: ' + error.message, 'error');
    throw error;
  } finally {
    state.isLoading = false;
  }
}

async function signin(email, password) {
  try {
    state.isLoading = true;
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    state.user = data.user;
    await loadUserData();
    navigateToApp();
    showToast('Welcome back!');
    return data;
  } catch (error) {
    showToast('Login failed: ' + error.message, 'error');
    throw error;
  } finally {
    state.isLoading = false;
  }
}

async function logout() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    state.user = null;
    state.households = [];
    state.devices = [];
    navigateToAuth();
    showToast('Logged out');
  } catch (error) {
    showToast('Logout failed: ' + error.message, 'error');
  }
}

async function checkAuthStatus() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    state.user = session.user;
    await loadUserData();
    navigateToApp();
  }
}

// ===== USER DATA =====
async function loadUserData() {
  try {
    // Load households
    const { data: households, error: householdError } = await supabaseClient
      .from('households')
      .select('*')
      .eq('user_id', state.user.id);

    if (householdError) throw householdError;
    state.households = households || [];

    // Load devices
    const { data: devices, error: deviceError } = await supabaseClient
      .from('devices')
      .select('*')
      .in('household_id', state.households.map(h => h.id));

    if (deviceError) throw deviceError;
    state.devices = devices || [];

    // Load latest readings
    const { data: readings, error: readingError } = await supabaseClient
      .from('readings')
      .select('*')
      .in('device_id', state.devices.map(d => d.id))
      .order('created_at', { ascending: false })
      .limit(1000);

    if (readingError) throw readingError;
    state.readings = readings || [];

    // Load alerts
    const { data: alerts, error: alertError } = await supabaseClient
      .from('alerts')
      .select('*')
      .in('household_id', state.households.map(h => h.id))
      .eq('resolved', false);

    if (alertError) throw alertError;
    state.alerts = alerts || [];

    renderUI();
  } catch (error) {
    showToast('Failed to load data: ' + error.message, 'error');
  }
}

// ===== HOUSEHOLDS =====
async function createHousehold(name, address, occupants) {
  try {
    state.isLoading = true;
    const { data, error } = await supabaseClient
      .from('households')
      .insert([
        {
          user_id: state.user.id,
          name,
          address,
          occupants,
          created_at: new Date()
        }
      ])
      .select();

    if (error) throw error;

    state.households.push(data[0]);
    renderUI();
    showToast(`${name} created successfully!`);
    return data[0];
  } catch (error) {
    showToast('Failed to create household: ' + error.message, 'error');
  } finally {
    state.isLoading = false;
  }
}

async function updateHousehold(id, updates) {
  try {
    const { data, error } = await supabaseClient
      .from('households')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    const idx = state.households.findIndex(h => h.id === id);
    if (idx >= 0) state.households[idx] = data[0];
    renderUI();
    showToast('Updated successfully!');
  } catch (error) {
    showToast('Update failed: ' + error.message, 'error');
  }
}

async function deleteHousehold(id) {
  try {
    const { error } = await supabaseClient
      .from('households')
      .delete()
      .eq('id', id);

    if (error) throw error;

    state.households = state.households.filter(h => h.id !== id);
    state.devices = state.devices.filter(d => d.household_id !== id);
    renderUI();
    showToast('Household deleted');
  } catch (error) {
    showToast('Delete failed: ' + error.message, 'error');
  }
}

// ===== DEVICES =====
async function createDevice(householdId, name, type, location) {
  try {
    state.isLoading = true;
    const { data, error } = await supabaseClient
      .from('devices')
      .insert([
        {
          household_id: householdId,
          name,
          type,
          location,
          status: 'online',
          created_at: new Date()
        }
      ])
      .select();

    if (error) throw error;

    state.devices.push(data[0]);
    renderUI();
    showToast(`${name} added successfully!`);
    return data[0];
  } catch (error) {
    showToast('Failed to add device: ' + error.message, 'error');
  } finally {
    state.isLoading = false;
  }
}

async function updateDeviceReading(deviceId, litersPerMinute, temperature) {
  try {
    const { data, error } = await supabaseClient
      .from('readings')
      .insert([
        {
          device_id: deviceId,
          flow_rate: litersPerMinute,
          temperature,
          created_at: new Date()
        }
      ])
      .select();

    if (error) throw error;

    state.readings.unshift(data[0]);

    // Check for anomalies
    checkForAnomalies(deviceId, litersPerMinute);

    renderUI();
  } catch (error) {
    showToast('Failed to update reading: ' + error.message, 'error');
  }
}

async function deleteDevice(id) {
  try {
    const { error } = await supabaseClient
      .from('devices')
      .delete()
      .eq('id', id);

    if (error) throw error;

    state.devices = state.devices.filter(d => d.id !== id);
    renderUI();
    showToast('Device removed');
  } catch (error) {
    showToast('Delete failed: ' + error.message, 'error');
  }
}

// ===== ALERTS & ANOMALIES =====
async function checkForAnomalies(deviceId, flowRate) {
  const device = state.devices.find(d => d.id === deviceId);
  const household = state.households.find(h => h.id === device.household_id);

  let alertTitle = '';
  let alertDesc = '';
  let severity = 'warning';

  // Check for high flow (potential burst)
  if (flowRate > 5) {
    alertTitle = 'High flow detected';
    alertDesc = `${device.name} is flowing at ${flowRate} L/min. Check for open taps or burst pipes.`;
    severity = 'critical';
  }

  // Check for continuous night flow (potential leak)
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) {
    if (flowRate > 0.3 && flowRate < 1) {
      alertTitle = 'Night flow detected';
      alertDesc = `Low continuous flow detected at ${device.name} during night hours. May indicate a leak.`;
      severity = 'warning';
    }
  }

  if (alertTitle) {
    createAlert(household.id, device.id, alertTitle, alertDesc, severity);
  }
}

async function createAlert(householdId, deviceId, title, description, severity = 'warning') {
  try {
    const { data, error } = await supabaseClient
      .from('alerts')
      .insert([
        {
          household_id: householdId,
          device_id: deviceId,
          title,
          description,
          severity,
          resolved: false,
          created_at: new Date()
        }
      ])
      .select();

    if (error) throw error;

    state.alerts.push(data[0]);
    renderUI();
    showToast(`Alert: ${title}`, 'warning');
  } catch (error) {
    console.error('Alert creation failed:', error);
  }
}

async function resolveAlert(alertId) {
  try {
    const { error } = await supabaseClient
      .from('alerts')
      .update({ resolved: true })
      .eq('id', alertId);

    if (error) throw error;

    state.alerts = state.alerts.filter(a => a.id !== alertId);
    renderUI();
    showToast('Alert resolved');
  } catch (error) {
    showToast('Failed to resolve alert: ' + error.message, 'error');
  }
}

// ===== ANALYTICS =====
async function getUsageAnalytics(householdId, days = 7) {
  try {
    const household = state.households.find(h => h.id === householdId);
    const householdDevices = state.devices.filter(d => d.household_id === householdId);
    const deviceIds = householdDevices.map(d => d.id);

    const { data, error } = await supabaseClient
      .from('readings')
      .select('*')
      .in('device_id', deviceIds)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Calculate statistics
    const stats = {
      totalUsage: data.reduce((sum, r) => sum + (r.flow_rate || 0), 0),
      averageFlow: data.reduce((sum, r) => sum + (r.flow_rate || 0), 0) / data.length,
      peakFlow: Math.max(...data.map(r => r.flow_rate || 0)),
      readingCount: data.length,
      dataPoints: data
    };

    return stats;
  } catch (error) {
    showToast('Failed to fetch analytics: ' + error.message, 'error');
    return null;
  }
}

async function getDailyUsage(householdId) {
  try {
    const household = state.households.find(h => h.id === householdId);
    const householdDevices = state.devices.filter(d => d.household_id === householdId);
    const deviceIds = householdDevices.map(d => d.id);

    const { data, error } = await supabaseClient
      .from('readings')
      .select('*')
      .in('device_id', deviceIds)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Group by day
    const dailyData = {};
    data.forEach(reading => {
      const day = new Date(reading.created_at).toLocaleDateString();
      if (!dailyData[day]) dailyData[day] = { total: 0, count: 0 };
      dailyData[day].total += reading.flow_rate || 0;
      dailyData[day].count++;
    });

    return Object.entries(dailyData).map(([day, stats]) => ({
      day,
      usage: stats.total,
      average: stats.total / stats.count
    }));
  } catch (error) {
    showToast('Failed to fetch daily data: ' + error.message, 'error');
    return [];
  }
}

// ===== EXPORT DATA =====
async function downloadReport(householdId) {
  try {
    const household = state.households.find(h => h.id === householdId);
    const analytics = await getUsageAnalytics(householdId, 30);
    const dailyData = await getDailyUsage(householdId);

    const reportData = {
      household: household.name,
      generatedAt: new Date().toLocaleString(),
      analytics,
      dailyData,
      devices: state.devices.filter(d => d.household_id === householdId)
    };

    const csv = convertToCSV(reportData);
    downloadCSV(csv, `${household.name}-report-${new Date().getTime()}.csv`);
    showToast('Report downloaded!');
  } catch (error) {
    showToast('Failed to generate report: ' + error.message, 'error');
  }
}

function convertToCSV(data) {
  let csv = `Smart Flow BW Report - ${data.household}\n`;
  csv += `Generated: ${data.generatedAt}\n\n`;

  csv += 'Daily Usage\n';
  csv += 'Date,Usage (L),Average (L/min)\n';
  data.dailyData.forEach(d => {
    csv += `${d.day},${d.usage},${d.average.toFixed(2)}\n`;
  });

  csv += '\nDevices\n';
  csv += 'Device Name,Type,Status\n';
  data.devices.forEach(d => {
    csv += `${d.name},${d.type},${d.status}\n`;
  });

  return csv;
}

function downloadCSV(csv, filename) {
  const link = document.createElement('a');
  link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  link.download = filename;
  link.click();
}

// ===== REAL-TIME SUBSCRIPTIONS =====
function subscribeToReadings() {
  const deviceIds = state.devices.map(d => d.id);
  if (deviceIds.length === 0) return;

  const subscription = supabaseClient
    .channel('readings-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'readings',
        filter: `device_id=in.(${deviceIds.join(',')})`
      },
      (payload) => {
        state.readings.unshift(payload.new);
        renderUI();
      }
    )
    .subscribe();

  return subscription;
}

function subscribeToAlerts() {
  const householdIds = state.households.map(h => h.id);
  if (householdIds.length === 0) return;

  const subscription = supabaseClient
    .channel('alerts-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts',
        filter: `household_id=in.(${householdIds.join(',')})`
      },
      (payload) => {
        if (!payload.new.resolved) {
          state.alerts.push(payload.new);
          renderUI();
        }
      }
    )
    .subscribe();

  return subscription;
}

// ===== UI FUNCTIONS =====
function showToast(message, type = 'info') {
  const toast = document.querySelector('.toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function renderUI() {
  // UI will be rendered based on state changes
  // (Implementation in HTML file)
}

function navigateToApp() {
  document.getElementById('authOverlay').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');
}

function navigateToAuth() {
  document.getElementById('authOverlay').classList.remove('hidden');
  document.getElementById('appShell').classList.add('hidden');
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  subscribeToReadings();
  subscribeToAlerts();
});
