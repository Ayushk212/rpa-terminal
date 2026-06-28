// dataStream.js — COMPLETE REWRITE
// Generates 50,000 rows. Fixes the StrictMode race at the source.
// ONLY FILE YOU NEED TO REPLACE. No React file changes required.

(function(global) {
  'use strict';

  var TICK_MS     = 200;
  var TARGET      = 50000;
  var CHUNK       = 5000;

  var DEPTS    = ['Finance','HR','Operations','IT','Legal','Supply Chain','Marketing','Procurement'];
  var INDUSTRY = ['Banking','Healthcare','Manufacturing','Retail','Insurance','Telecom','Energy','Logistics'];
  var TYPES    = ['Cloud','On-Premise','Hybrid','SaaS','Edge'];
  var STATUSES = ['Active','Completed','Failed','Pending','On Hold'];
  var PARTNERS = ['Deloitte','Accenture','Wipro','TCS','Infosys','Capgemini','IBM','EY'];
  var COUNTRIES= ['US','IN','DE','GB','JP','SG','AU','FR','BR','CA'];
  var NAMES    = ['TechCorp','GlobalBank','MediSys','RetailGiant','InsurePlus','TeleLink',
                  'EnergyPro','LogiFlow','FinTrust','CloudNative','AutoBot Ltd','ProcessAI',
                  'RoboWorks','NovaSys','AlphaFlow','BetaBot','GammaOps','DeltaAI','EpsilonRPA','ZetaStream'];

  function p(a)    { return a[Math.floor(Math.random()*a.length)]; }
  function rf(a,b) { return +(Math.random()*(b-a)+a).toFixed(2); }
  function ri(a,b) { return Math.floor(Math.random()*(b-a+1))+a; }

  function row(id, i) {
    var s = p(STATUSES);
    return {
      id: id, project_name: p(NAMES)+' '+p(TYPES)+' Automation',
      company_id: 'CO-'+(1000+(i%9000)),
      department: DEPTS[i%DEPTS.length], industry: INDUSTRY[i%INDUSTRY.length],
      automation_type: p(TYPES), implementation_partner: p(PARTNERS),
      country: p(COUNTRIES), status: s,
      budget: ri(50000,5000000),
      roi_percent: s==='Failed' ? rf(-40,-0.5) : rf(10,800),
      employee_hours_saved: ri(200,50000),
      cumulative_savings: ri(10000,2000000),
      active_robots: ri(1,500),
      error_rate: rf(0,15), uptime_percent: rf(85,99.99),
      last_updated: Date.now(), _isNew: false,
    };
  }

  // ── Baseline builder ───────────────────────────────────────────────────────
  var baseline = [], listeners = [], timer = null, running = false;
  var ready = false, readyCBs = [], chunkIdx = 0;

  function buildChunk() {
    var s = chunkIdx * CHUNK, e = Math.min(s+CHUNK, TARGET);
    for (var i=s; i<e; i++) baseline.push(row('RPA-'+String(i).padStart(6,'0'), i));
    chunkIdx++;
    if (e < TARGET) { setTimeout(buildChunk, 0); }
    else {
      ready = true;
      console.log('[dataStream] ✅ ready —', baseline.length, 'rows');
      readyCBs.forEach(function(f){ try{f();}catch(e){console.error("DATASTREAM ERROR:", e)} });
      readyCBs=[];
    }
  }
  setTimeout(buildChunk, 0);

  // ── Tick ──────────────────────────────────────────────────────────────────
  function emit(rows) { listeners.forEach(function(f){ try{f(rows);}catch(e){} }); }

  function tick() {
    if (!ready) return;
    var n=ri(3,8), upd=[];
    for (var i=0;i<n;i++) {
      var mutate = Math.random()>0.35 && baseline.length>0;
      if (mutate) {
        var idx=ri(0,baseline.length-1), r=row(baseline[idx].id,idx);
        r._isNew=false; r._isMutated=true; baseline[idx]=r; upd.push(r);
      } else {
        var nr=row('RPA-'+Math.random().toString(36).slice(2,8).toUpperCase(), baseline.length);
        nr._isNew=true;
        if (baseline.length>=TARGET) baseline[ri(0,baseline.length-1)]=nr; else baseline.push(nr);
        upd.push(nr);
      }
    }
    emit(upd);
  }

  // ── API ───────────────────────────────────────────────────────────────────
  global.RPAStream = {
    getBaseline : function() { return baseline.slice(); },
    isReady     : function() { return ready; },
    size        : function() { return baseline.length; },
    onReady     : function(fn) { if(ready){try{fn();}catch(e){}}else{readyCBs.push(fn);} },
    subscribe   : function(fn) {
      listeners.push(fn);
      return function(){ listeners=listeners.filter(function(l){return l!==fn;}); };
    },
    start : function() { if(running)return; running=true; timer=setInterval(tick,TICK_MS); },
    stop  : function() { running=false; clearInterval(timer); timer=null; },
    isRunning: function() { return running; },
    generateRows: function(count) {
      var c = count || 5000;
      var res = [];
      for(var i=0; i<c; i++){
        var nr = row('RPA-BURST-'+Math.random().toString(36).slice(2,8).toUpperCase(), baseline.length + i);
        nr._isNew = true;
        res.push(nr);
      }
      return res;
    }
  };

})(window);
