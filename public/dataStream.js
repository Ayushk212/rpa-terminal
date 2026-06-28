// dataStream.js — RPA Telemetry Stream Simulator
// Loads static CSV baseline, then injects anomalies every 200ms

(function(global) {
  const TICK_MS = 200;

  const DEPARTMENTS   = ['Finance','HR','Operations','IT','Legal','Supply Chain','Marketing','Procurement'];
  const INDUSTRIES    = ['Banking','Healthcare','Manufacturing','Retail','Insurance','Telecom','Energy','Logistics'];
  const AUTO_TYPES    = ['Cloud','On-Premise','Hybrid','SaaS','Edge'];
  const STATUSES      = ['Active','Completed','Failed','Pending','On Hold'];
  const PARTNERS      = ['Deloitte','Accenture','Wipro','TCS','Infosys','Capgemini','IBM','EY'];
  const COUNTRIES     = ['US','IN','DE','GB','JP','SG','AU','FR','BR','CA'];
  const COMPANIES     = ['TechCorp','GlobalBank','MediSys','RetailGiant','InsurePlus','TeleLink','EnergyPro','LogiFlow',
                          'DataStream Inc','FinTrust','CloudNative','AutoBot Ltd','ProcessAI','RoboWorks'];

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randFloat(min, max, dec=2) { return +(Math.random()*(max-min)+min).toFixed(dec); }
  function randInt(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
  function uid() { return 'RPA-' + Math.random().toString(36).slice(2,8).toUpperCase(); }

  function generateRow(id) {
    const status = rand(STATUSES);
    const roi    = status === 'Failed' ? randFloat(-40, -0.5) : randFloat(10, 800);
    return {
      id:                  id || uid(),
      project_name:        rand(COMPANIES) + ' ' + rand(AUTO_TYPES) + ' Automation',
      company_id:          'CO-' + randInt(1000,9999),
      department:          rand(DEPARTMENTS),
      industry:            rand(INDUSTRIES),
      automation_type:     rand(AUTO_TYPES),
      implementation_partner: rand(PARTNERS),
      country:             rand(COUNTRIES),
      status:              status,
      budget:              randInt(50000, 5000000),
      roi_percent:         roi,
      employee_hours_saved: randInt(200, 50000),
      cumulative_savings:  randInt(10000, 2000000),
      active_robots:       randInt(1, 500),
      error_rate:          randFloat(0, 15),
      uptime_percent:      randFloat(85, 99.99),
      last_updated:        Date.now(),
      _isNew:              true,
    };
  }

  // Generate baseline of 500 rows
  const baseline = [];
  for (let i = 0; i < 500; i++) baseline.push(generateRow());

  let listeners = [];
  let intervalId = null;
  let running = false;

  function emit(rows) {
    listeners.forEach(fn => { try { fn(rows); } catch(e) {} });
  }

  function tick() {
    // Inject 3–8 new/mutated rows per tick
    const count = randInt(3, 8);
    const updates = [];
    for (let i = 0; i < count; i++) {
      const mutate = Math.random() > 0.4 && baseline.length > 0;
      if (mutate) {
        const idx = randInt(0, baseline.length - 1);
        const updated = generateRow(baseline[idx].id);
        updated._isNew = false;
        updated._isMutated = true;
        baseline[idx] = updated;
        updates.push(updated);
      } else {
        const newRow = generateRow();
        baseline.push(newRow);
        if (baseline.length > 800) baseline.shift();
        updates.push(newRow);
      }
    }
    emit(updates);
  }

  global.RPAStream = {
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
