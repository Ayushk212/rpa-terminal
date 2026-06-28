import { useEffect, useRef } from 'react';

function randInt(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
function randFloat(min, max, dec=2) { return +(Math.random()*(max-min)+min).toFixed(dec); }

export function normalizeRow(raw) {
  return {
    id:                     raw.project_id || '',
    company_id:             raw.company_id || '',
    project_name:           raw.project_name || '',
    status:                 raw.project_status || raw.status || '',
    automation_type:        raw.automation_type || '',
    active_robots:          parseInt(raw.robots_deployed, 10) || 0,
    budget:                 parseFloat(raw.budget_usd) || 0,
    cumulative_savings:     parseFloat(raw.annual_savings_usd) || 0,
    roi_percent:            parseFloat(raw.roi_percent) || 0,
    department:             raw.department || '',
    implementation_partner: raw.implementation_partner || '',
    country:                raw.country || '',
    industry:               raw.industry || '',
    employee_hours_saved:   parseInt(raw.employee_hours_saved, 10) || 0,
    error_rate:             randFloat(0, 5),
    uptime_percent:         randFloat(95, 100),
    last_updated:           Date.now(),
    _isNew:                 true,
    _raw:                   raw,
  };
}

export function useCSVStream(onChunk) {
  const onChunkRef = useRef(onChunk);
  
  useEffect(() => {
    onChunkRef.current = onChunk;
  }, [onChunk]);

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;
    let baseline = [];

    async function loadData() {
      try {
        const response = await fetch('/automation_projects.csv');
        if (!response.ok) throw new Error('Failed to fetch CSV: ' + response.status);
        const text = await response.text();
        
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          const rawRow = {};
          
          headers.forEach((h, idx) => {
            rawRow[h] = values[idx]?.trim() ?? '';
          });

          baseline.push(normalizeRow(rawRow));
        }

        if (!cancelled) {
          if (typeof onChunkRef.current === 'function') {
            onChunkRef.current([...baseline], true);
          }

          intervalId = setInterval(() => {
            if (cancelled || baseline.length === 0) return;
            
            const count = randInt(3, 8);
            const updates = [];
            for (let i = 0; i < count; i++) {
              const idx = randInt(0, baseline.length - 1);
              const updated = { ...baseline[idx] };
              
              updated.error_rate = randFloat(0, 15);
              updated.uptime_percent = randFloat(85, 99.99);
              if (Math.random() > 0.8) updated.status = 'Failed';
              updated.last_updated = Date.now();
              updated._isNew = false;
              updated._isMutated = true;
              
              baseline[idx] = updated;
              updates.push(updated);
            }
            
            if (typeof onChunkRef.current === 'function') {
              onChunkRef.current(updates, false);
            }
          }, 200);
        }

      } catch (err) {
        console.error('Failed to load CSV stream:', err);
      }
    }

    loadData();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}
