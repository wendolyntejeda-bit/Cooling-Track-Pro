/**
 * app.js - Gestión de 120 CDUs, Parámetros Químicos, Lotes Veolia y Stock
 * CoolingTrack Pro
 */

const App = {
  cdus: [],
  batches: [],
  selectedPodFilter: 'all',

  init() {
    this.loadData();
    this.initTabs();
    this.renderAll();

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  loadData() {
    const storedCdus = localStorage.getItem('cooling_120_cdus_v2');
    const storedBatches = localStorage.getItem('cooling_veolia_batches_v2');

    if (storedCdus && storedBatches) {
      this.cdus = JSON.parse(storedCdus);
      this.batches = JSON.parse(storedBatches);
    } else {
      const generatedCdus = [];
      const today = new Date();

      const podConfiguration = [
  { pod: 'POD-01', cdus: 4 },
  { pod: 'POD-02', cdus: 4 },
  { pod: 'POD-03', cdus: 6 },
  { pod: 'POD-04', cdus: 4 }
];

podConfiguration.forEach(config => {

  const podName = config.pod;

  const podNumber = parseInt(
    podName.replace('POD-', '')
  );

  for (let c = 1; c <= config.cdus; c++) {

    const cduId =
      `CDU-P${String(podNumber).padStart(2, '0')}-${String(c).padStart(2, '0')}`;
          
          let daysAgo = 1;
        if (podNumber === 3) daysAgo = 6;
if (podNumber >= 4) daysAgo = 9;
    
          const sampleDate = new Date(today);
          sampleDate.setDate(sampleDate.getDate() - daysAgo);

          let status = 'optimal';
          if (daysAgo >= 7) status = 'critical';
          else if (daysAgo >= 5) status = 'warning';

          // Parámetros químicos simulados para la demo
          const ph = +(8.0 + (Math.random() * 0.5 - 0.2)).toFixed(1);
          const cond = Math.floor(35 + Math.random() * 20);
          const turbidity = +(Math.random() * 3).toFixed(1);
const tss = Math.floor(10 + Math.random() * 40);
const tds = Math.floor(50 + Math.random() * 200);
const bacteria = Math.floor(50 + Math.random() * 500);
const azoles = Math.floor(800 + Math.random() * 800);

          generatedCdus.push({
            id: cduId,
            name: `CDU ${c} (${podName})`,
            pod: podName,
            cduIndex: c,
            fixedBoteId: `BOTE-${cduId}`,
            lastSample: sampleDate.toISOString().split('T')[0],
            daysAgo: daysAgo,
            lastPH: ph,
            lastConductivity: cond,
            lastTurbidity: turbidity,
lastTSS: tss,
lastTDS: tds,
lastBacteria: bacteria,
lastAzoles: azoles,
            notes: 'Parámetros en especificación normal.',
            sampleStatus: 'not_taken',
            status: status
          });
        }
     });

      this.cdus = generatedCdus;

      this.batches = [
        {
          id: 'LOT-WW34-2026',
          week: 'Week #34',
          dosingDate: '21/08/2026',
          responsible: 'Wendolyn Tejeda',
          totalDrums: 120,
          consumedDrums: 38,
          remainingDrums: 82,
          notes: 'Lote semanal preparado para pruebas de racks (Purge & Dry)',
          status: 'active'
        },
        {
          id: 'LOT-WW33-2026',
          week: 'Week #33',
          dosingDate: '14/08/2026',
          responsible: 'Wendolyn Tejeda',
          totalDrums: 120,
          consumedDrums: 120,
          remainingDrums: 0,
          notes: 'Lote finalizado',
          status: 'depleted'
        }
      ];

      this.saveData();
    }
  },

  saveData() {
    localStorage.setItem('cooling_120_cdus_v2', JSON.stringify(this.cdus));
    localStorage.setItem('cooling_veolia_batches_v2', JSON.stringify(this.batches));
  },

  getActiveBatch() {
    return this.batches.find(b => b.status === 'active') || this.batches[0];
  },

  findCDU(query) {
    const q = query.trim().toUpperCase();
    return this.cdus.find(c => c.id.toUpperCase() === q || c.fixedBoteId.toUpperCase() === q || c.name.toUpperCase().includes(q));
  },

  // Registrar muestreo semanal rápido (solo fecha)
  registerWeeklySample(cduId) {
    const cdu = this.cdus.find(c => c.id === cduId);
    if (!cdu) return;

    const todayStr = new Date().toISOString().split('T')[0];
    cdu.lastSample = todayStr;
    cdu.daysAgo = 0;
    cdu.status = 'optimal';

    this.saveData();
    this.renderAll();
    this.showToast(`✅ Muestreo de ${cdu.id} actualizado a la fecha de hoy.`, 'success');
  },

  // Registrar muestreo semanal con parámetros químicos completos
  registerWeeklySampleWithParams(cduId, params) {
    const cdu = this.cdus.find(c => c.id === cduId);
    if (!cdu) return;

    const todayStr = new Date().toISOString().split('T')[0];
    cdu.lastSample = todayStr;
    cdu.daysAgo = 0;
   cdu.lastPH = params.ph;
cdu.lastConductivity = params.conductivity;
cdu.lastTurbidity = params.turbidity;
cdu.lastTSS = params.tss;
cdu.lastTDS = params.tds;
cdu.lastBacteria = params.bacteria;
cdu.lastAzoles = params.azoles;
cdu.notes = params.notes;

    // Evaluar estado de calidad
if (params.ph < 7.2 || params.ph > 9.1) {
  cdu.status = 'critical';
} else if (params.ph < 7.5 || params.ph > 8.8) {
  cdu.status = 'warning';
} else {
  cdu.status = 'optimal';
}

    this.saveData();
    this.renderAll();
    this.showToast(`💾 Muestreo y parámetros guardados para ${cdu.id} (pH ${params.ph}, ${params.biocide} PPM)`, 'success');
  },

  consumeBidon(qty = 1) {
    const active = this.getActiveBatch();
    if (!active) return;

    if (active.remainingDrums <= 0) {
      this.showToast("⚠️ Stock en cero. Es necesario dar de alta un nuevo lote de bidones.", "warning");
      return;
    }

    active.consumedDrums += qty;
    active.remainingDrums = Math.max(0, active.totalDrums - active.consumedDrums);
    if (active.remainingDrums === 0) active.status = 'depleted';

    this.saveData();
    this.renderAll();
    this.showToast(`🛢️ Consumo registrado: -${qty} bidón. Quedan ${active.remainingDrums} disponibles.`, 'info');
  },

  saveNewBatch(e) {
    if (e) e.preventDefault();

    const week = document.getElementById('new-batch-week').value || 'Week #35';
    const dosingDate = document.getElementById('new-batch-date').value || '26/08/2026';
    const totalDrums = parseInt(document.getElementById('new-batch-qty').value) || 120;
    const responsible = document.getElementById('new-batch-resp').value || 'Wendolyn Tejeda';
    const notes = document.getElementById('new-batch-notes').value || '';

    this.batches.forEach(b => { if (b.status === 'active') b.status = 'archived'; });

    const newBatch = {
      id: `LOT-${week.replace(/\s+/g, '').replace('#', '')}-${Date.now().toString().slice(-4)}`,
      week,
      dosingDate,
      responsible,
      totalDrums,
      consumedDrums: 0,
      remainingDrums: totalDrums,
      notes,
      status: 'active'
    };

    this.batches.unshift(newBatch);
    this.saveData();
    this.renderAll();

    document.getElementById('new-batch-modal')?.classList.add('hidden');
    this.showToast(`✨ Lote ${week} (${totalDrums} bidones) guardado exitosamente.`, 'success');
  },

  getCDUsForPrint(podFilter) {
    if (!podFilter || podFilter === 'all') return this.cdus;
    return this.cdus.filter(c => c.pod === podFilter);
  },

  renderAll() {
    this.renderKPIs();
    this.renderPODMap();
    this.renderBatches();
    this.populatePodSelectors();
    if (window.lucide) lucide.createIcons();
  },

  renderKPIs() {
    const total = this.cdus.length;
    const optimal = this.cdus.filter(c => c.status === 'optimal').length;
    const warning = this.cdus.filter(c => c.status === 'warning').length;
    const critical = this.cdus.filter(c => c.status === 'critical').length;
    const activeBatch = this.getActiveBatch();

    document.getElementById('kpi-cdus-total').textContent = total;
    document.getElementById('kpi-cdus-optimal').textContent = optimal;
    document.getElementById('kpi-cdus-alerts').textContent = critical + warning;
    document.getElementById('kpi-stock-veolia').textContent = `${activeBatch?.remainingDrums || 0} / ${activeBatch?.totalDrums || 0}`;
  },

  renderPODMap() {
    const container = document.getElementById('pods-map-container');
    if (!container) return;
    container.innerHTML = '';

  const podGroups = {};

this.cdus.forEach(cdu => {
  if (!podGroups[cdu.pod]) {
    podGroups[cdu.pod] = [];
  }

  podGroups[cdu.pod].push(cdu);
});

    Object.keys(podGroups).forEach(podName => {
      const cduList = podGroups[podName];

      if (this.selectedPodFilter !== 'all' && this.selectedPodFilter !== podName) {
        return;
      }

      const hasCritical = cduList.some(c => c.status === 'critical');
      const hasWarning = cduList.some(c => c.status === 'warning');
      
      let podBorder = 'border-slate-200';
      let podHeaderBg = 'bg-slate-50/80';

      if (hasCritical) {
        podBorder = 'border-rose-200 ring-1 ring-rose-300';
        podHeaderBg = 'bg-rose-50/70';
      } else if (hasWarning) {
        podBorder = 'border-amber-200 ring-1 ring-amber-300';
        podHeaderBg = 'bg-amber-50/70';
      }

      const podCard = document.createElement('div');
      podCard.className = `glass-card rounded-2xl border ${podBorder} overflow-hidden flex flex-col justify-between transition-all hover:shadow-md`;

      let cduRowsHtml = '';
      cduList.forEach(cdu => {
        let dotColor = 'bg-emerald-500';
        let statusBadge = `<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Al Día</span>`;

        if (cdu.status === 'critical') {
          dotColor = 'bg-rose-500';
          statusBadge = `<span class="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">Vencido (${cdu.daysAgo}d)</span>`;
        } else if (cdu.status === 'warning') {
          dotColor = 'bg-amber-500';
          statusBadge = `<span class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Próximo (${cdu.daysAgo}d)</span>`;
        }

        cduRowsHtml += `
          <div class="py-2.5 px-3.5 flex flex-col gap-1.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full ${dotColor}"></span>
                <span class="font-mono font-black text-slate-900 text-xs">${cdu.id.split('-').slice(1).join('-')}</span>
              </div>
              <div class="flex items-center gap-2">
                ${statusBadge}
                <button onclick="window.PokaYokeScanner.simulate('cdu', '${cdu.id}'); window.App.switchTab('scanner');" class="text-sky-600 hover:text-sky-800 font-bold text-[11px] bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded transition-colors">
                  Muestrear
                </button>
              </div>
            </div>
          
        `;
      });

      podCard.innerHTML = `
        <div>
          <div class="py-3 px-4 ${podHeaderBg} border-b border-slate-200/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-black text-slate-900 text-sm tracking-tight">${podName}</span>
             <span class="text-[10px] text-slate-500 font-bold uppercase bg-white px-2 py-0.5 rounded border border-slate-200">${cduList.length} CDUs</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono font-medium">Monitoreo semanal</span>
          </div>
          <div class="divide-y divide-slate-100">
            ${cduRowsHtml}
          </div>
        </div>
      `;

      container.appendChild(podCard);
    });
    // TARJETA AGREGAR POD
const addPodCard = document.createElement('div');

addPodCard.className =
  'glass-card rounded-3xl border-2 border-dashed border-slate-300 hover:border-cyan-500 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[250px]';

addPodCard.onclick = () => {
  document.getElementById('pods-admin-modal').classList.remove('hidden');
};

addPodCard.innerHTML = `
  <div class="text-5xl mb-4 text-cyan-500">➕</div>

  <div class="text-xl font-extrabold text-slate-700">
    Agregar POD
  </div>

  <div class="text-sm text-slate-500 text-center mt-2 px-4">
    Crear un nuevo POD y definir la cantidad de CDUs
  </div>
`;

container.appendChild(addPodCard);
  },

  renderBatches() {
    const container = document.getElementById('batches-list-body');
    if (!container) return;
    container.innerHTML = '';

    this.batches.forEach(b => {
      const percent = Math.round((b.remainingDrums / b.totalDrums) * 100);
      const isCurrent = b.status === 'active';

      const tr = document.createElement('tr');
      tr.className = `border-b border-slate-100 hover:bg-slate-50/80 text-xs transition-colors ${isCurrent ? 'bg-emerald-50/30' : ''}`;
      tr.innerHTML = `
        <td class="py-3.5 px-4">
          <div class="font-black text-slate-900 text-sm">${b.week}</div>
          <div class="text-[10px] text-slate-400 font-mono">${b.id}</div>
        </td>
        <td class="py-3.5 px-4 font-bold text-slate-700">${b.dosingDate}</td>
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-2">
            <div class="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style="width: ${percent}%"></div>
            </div>
            <span class="font-black text-slate-900">${b.remainingDrums} / ${b.totalDrums} Bidones</span>
          </div>
        </td>
        <td class="py-3.5 px-4 font-semibold text-slate-700">${b.responsible}</td>
        <td class="py-3.5 px-4">
          ${isCurrent ? '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Lote Activo en Uso</span>' : '<span class="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">Agotado / Histórico</span>'}
        </td>
        <td class="py-3.5 px-4 text-right">
          ${isCurrent ? `
            <button onclick="window.App.consumeBidon(1)" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-sm transition-all">
              -1 Bidón
            </button>
            <button onclick="window.App.consumeBidon(13)" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-sm transition-all" title="Registrar consumo de 1 turno (~13 bidones)">
              -13 (Día)
            </button>
          ` : '-'}
        </td>
      `;
      container.appendChild(tr);
    });
  },

populatePodSelectors() {
  const selectors = [
    document.getElementById('map-pod-filter'),
    document.getElementById('label-pod-selector')
  ];

  selectors.forEach(sel => {

    if (!sel || sel.options.length > 2) return;

    const pods = [...new Set(this.cdus.map(cdu => cdu.pod))];

    pods.forEach(podName => {
      const opt = document.createElement('option');
      opt.value = podName;
      opt.textContent = podName;
      sel.appendChild(opt);
    });

  });
},

  filterMapByPod(pod) {
    this.selectedPodFilter = pod;
    this.renderPODMap();
  },

  initTabs() {
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab-target');
        this.switchTab(target);
      });
    });
  },

  switchTab(tabId) {
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      if (btn.getAttribute('data-tab-target') === tabId) {
        btn.className = "flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-sky-700 font-extrabold shadow-sm border border-slate-200/80 transition-all text-xs";
      } else {
        btn.className = "flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 font-bold transition-all text-xs";
      }
    });

    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');

    if (tabId === 'labels') {
      LabelsManager.renderPrintSheet(document.getElementById('label-type-selector')?.value || 'veolia-bidon');
    }

    if (window.lucide) lucide.createIcons();
  },

  // Exportar reporte completo con todos los parámetros químicos a Excel
  exportReport() {
    let csv = "POD,CDU_ID,ESTADO,ULTIMO_MUESTREO,DIAS_SIN_MUESTREO,PH,CONDUCTIVIDAD_US,BIOCIDA_PPM,GLICOL_PORCENTAJE,BOTE_FIJO,OBSERVACIONES\n";
    this.cdus.forEach(c => {
      csv += `"${c.pod}","${c.id}","${c.status}","${c.lastSample}",${c.daysAgo},${c.lastPH || ''},${c.lastConductivity || ''},${c.lastBiocide || ''},${c.lastGlycol || 25},"${c.fixedBoteId}","${c.notes || ''}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Calidad_120_CDUs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    this.showToast("📥 Reporte completo descargado con parámetros para Excel", "success");
  },

  showToast(msg, type = 'info') {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    const bgColors = {
      success: 'bg-emerald-600 text-white shadow-emerald-900/20',
      error: 'bg-rose-600 text-white shadow-rose-900/20',
      warning: 'bg-amber-500 text-white shadow-amber-900/20',
      info: 'bg-slate-900 text-white shadow-slate-900/20'
    };

    toast.className = `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold transition-all duration-300 transform ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `<div class="flex items-center gap-2">${msg}</div>`;
    toast.classList.remove('hidden');

    setTimeout(() => toast.classList.add('hidden'), 3500);
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
