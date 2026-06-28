// dataStream.js — RPA Telemetry Stream Simulator
// Loads static CSV baseline from automation_projects.csv, then injects anomalies every 200ms

(function(global) {
  const TICK_MS = 200;

  function randInt(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
  function randFloat(min, max, dec=2) { return +(Math.random()*(max-min)+min).toFixed(dec); }

  let baseline = [];
  let listeners = [];
  let intervalId = null;
  let running = false;
  let initPromise = null;

  async function initialize() {
    if (initPromise) return initPromise;
    initPromise = fetch('/automation_projects.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split('\n');
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length < 18) continue;
          baseline.push({
            id: parts[0],
            company_id: parts[1],
            project_name: parts[2],
            status: parts[5],
            automation_type: parts[6],
            active_robots: parseInt(parts[7], 10) || 0,
            budget: parseFloat(parts[8]) || 0,
            cumulative_savings: parseFloat(parts[9]) || 0,
            roi_percent: parseFloat(parts[10]) || 0,
            department: parts[11],
            implementation_partner: parts[12],
            country: parts[13],
            industry: parts[14],
            employee_hours_saved: parseInt(parts[15], 10) || 0,
            error_rate: randFloat(0, 5),
            uptime_percent: randFloat(95, 100),
            last_updated: Date.now(),
            _isNew: true
          });
        }
      });
    return initPromise;
  }

  function emit(rows) {
    listeners.forEach(fn => { try { fn(rows); } catch(e) {} });
  }

  function tick() {
    // Inject 3–8 mutated rows per tick from the loaded baseline
    const count = randInt(3, 8);
    const updates = [];
    for (let i = 0; i < count; i++) {
      if (baseline.length > 0) {
        const idx = randInt(0, baseline.length - 1);
        const updated = { ...baseline[idx] };
        
        // Mutate slightly
        updated.error_rate = randFloat(0, 15);
        updated.uptime_percent = randFloat(85, 99.99);
        if (Math.random() > 0.8) updated.status = 'Failed';
        updated.last_updated = Date.now();
        updated._isNew = false;
        updated._isMutated = true;
        
        baseline[idx] = updated;
        updates.push(updated);
      }
    }
    if (updates.length > 0) {
      emit(updates);
    }
  }

  global.RPAStream = {
    init: initialize,
    getBaseline() { return [...baseline]; },
    subscribe(fn) {
      listeners.push(fn);
      return () => { listeners = listeners.filter(l => l !== fn); };
    },
    start() {
      if (running) return;
      running = true;
      intervalId = setInterval(tick, TICK_MS);
    },
    stop() {
      running = false;
      clearInterval(intervalId);
    },
    isRunning() { return running; }
  };
})(window);
