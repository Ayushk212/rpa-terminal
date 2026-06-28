import { useEffect, useRef } from 'react';

function randInt(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
function randFloat(min, max, dec=2) { return +(Math.random()*(max-min)+min).toFixed(dec); }

export function useCSVStream(onChunk) {
  const onChunkRef = useRef(onChunk);
  
  useEffect(() => {
    onChunkRef.current = onChunk;
  });

  useEffect(() => {
    let mounted = true;
    let intervalId = null;
    let baseline = [];

    async function loadData() {
      try {
        const response = await fetch('/automation_projects.csv');
        if (!response.ok) throw new Error('Failed to fetch CSV');
        const text = await response.text();
        
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

        if (!mounted) return;

        // Emit baseline
        if (typeof onChunkRef.current === 'function') {
          onChunkRef.current([...baseline], true);
        }

        // Start mutation loop
        intervalId = setInterval(() => {
          if (!mounted || baseline.length === 0) return;
          
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

      } catch (err) {
        console.error('Failed to load CSV stream:', err);
      }
    }

    loadData();

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}
