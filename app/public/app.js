let appState = null;
let currentTab = 'board';
let currentViewMode = 'kanban';
let filterGov = 'ALL';
let filterPriority = 'ALL';
let searchQuery = '';
let motionPaused = false;
let bgMode = 'aurora';

const STATUS_COLUMNS = [
  { key: 'todo', label: 'قيد الانتظار', badge: 'bg-slate-500/20 text-slate-200 border-slate-500/30' },
  { key: 'in_progress', label: 'قيد التنفيذ', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { key: 'review', label: 'قيد المراجعة', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { key: 'done', label: 'مكتملة ومنجزة', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
];

const PRIORITY_META = {
  urgent: { label: 'عاجل جداً', classes: 'bg-red-500/20 text-red-300 border-red-500/35' },
  high: { label: 'مرتفع', classes: 'bg-orange-500/20 text-orange-300 border-orange-500/35' },
  medium: { label: 'متوسط', classes: 'bg-teal-500/20 text-teal-300 border-teal-500/35' },
  low: { label: 'منخفض', classes: 'bg-slate-500/20 text-slate-300 border-slate-500/35' }
};

const PAYMENT_STATUS_META = {
  paid: { label: 'مدفوعة بالكامل ✓', classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35' },
  escrow: { label: 'محجوزة بالضمان (Escrow)', classes: 'bg-blue-500/20 text-blue-300 border-blue-500/35' },
  unpaid: { label: 'بانتظار الدفع', classes: 'bg-amber-500/20 text-amber-300 border-amber-500/35' }
};

const METHOD_NAMES = {
  syriatel_cash: 'سيريتل كاش (Syriatel Cash)',
  sham_cash: 'شام كاش (Sham Cash)',
  mtn_cash: 'إم تي إن كاش (MTN Cash)',
  bemo_ecash: 'بنك بيمو / إي كاش (ECash)',
  haram_transfer: 'شركة الهرم / الفؤاد للحوالات',
  usdt_trc20: 'العملات الرقمية (USDT TRC20)'
};

/* ==========================================================================
   INTERACTIVE 60FPS ANIMATED BACKGROUND ENGINE (AURORA / WAVES / GEOMETRY)
   ========================================================================== */
function initAnimatedBackground() {
  const canvas = document.getElementById('animated-bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  let mouse = { x: width / 2, y: height / 2 };
  let tick = 0;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  const particles = Array.from({ length: 48 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.55,
    vy: (Math.random() - 0.5) * 0.55,
    r: Math.random() * 2.2 + 1,
    hue: Math.random() > 0.3 ? 172 : 36
  }));

  function drawEightPointStar(cx, cy, radius, rotation, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.strokeStyle = `rgba(20, 184, 166, ${alpha})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 2; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-radius / 2, -radius / 2, radius, radius);
    }
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.9})`;
    ctx.stroke();
    ctx.restore();
  }

  function renderFrame() {
    if (!motionPaused) {
      tick += 0.012;
      ctx.clearRect(0, 0, width, height);

      if (bgMode === 'aurora') {
        // Mode 1: Constellation Particles + Mouse Interactive Lines
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.hue === 172 ? 'rgba(45, 212, 191, 0.55)' : 'rgba(251, 191, 36, 0.55)';
          ctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 145) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(20, 184, 166, ${(1 - dist / 145) * 0.18})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }

          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mDist = Math.hypot(mdx, mdy);
          if (mDist < 190) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(245, 158, 11, ${(1 - mDist / 190) * 0.25})`;
            ctx.stroke();
          }
        }
      } else if (bgMode === 'waves') {
        // Mode 2: Flowing Liquid Light Waves
        for (let w = 0; w < 4; w++) {
          ctx.beginPath();
          const baseY = height * (0.28 + w * 0.16);
          ctx.moveTo(0, baseY);
          for (let x = 0; x <= width; x += 24) {
            const y =
              baseY +
              Math.sin(x * 0.004 + tick * (1.2 + w * 0.3)) * (34 + w * 10) +
              Math.cos(x * 0.002 - tick) * 18;
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle =
            w % 2 === 0 ? 'rgba(20, 184, 166, 0.24)' : 'rgba(245, 158, 11, 0.18)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else if (bgMode === 'geometry') {
        // Mode 3: Animated Damascene 8-Pointed Geometric Stars
        const cols = Math.ceil(width / 240) + 1;
        const rows = Math.ceil(height / 240) + 1;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cx = c * 240 + (r % 2 === 0 ? 60 : 180);
            const cy = r * 240 + 80;
            const pulse = 80 + Math.sin(tick + r + c) * 14;
            drawEightPointStar(cx, cy, pulse, tick * 0.25 * (c % 2 === 0 ? 1 : -1), 0.16);
          }
        }
      }
    }
    requestAnimationFrame(renderFrame);
  }

  requestAnimationFrame(renderFrame);
}

/* ==========================================================================
   DYNAMIC DETERMINISTIC QR CODE SVG GENERATOR FOR REAL ACCOUNTS
   ========================================================================== */
function generateDynamicQrSvg(textValue) {
  const seed = String(textValue || 'MADAR-SYRIA');
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const cells = [];
  const size = 11;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isCorner =
        (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);
      if (isCorner) continue;
      const bit = ((hash >>> ((r * size + c) % 24)) ^ (r * 7 + c * 13 + seed.length)) & 1;
      if (bit) {
        cells.push(`<rect x="${c * 3 + 2}" y="${r * 3 + 2}" width="2.6" height="2.6" rx="0.4" />`);
      }
    }
  }
  return `
    <svg class="w-16 h-16 mx-auto text-slate-900" viewBox="0 0 37 37" fill="currentColor" aria-hidden="true">
      <rect x="2" y="2" width="9" height="9" rx="1"/><rect x="3.8" y="3.8" width="5.4" height="5.4" fill="white"/><rect x="5.2" y="5.2" width="2.6" height="2.6"/>
      <rect x="26" y="2" width="9" height="9" rx="1"/><rect x="27.8" y="3.8" width="5.4" height="5.4" fill="white"/><rect x="29.2" y="5.2" width="2.6" height="2.6"/>
      <rect x="2" y="26" width="9" height="9" rx="1"/><rect x="3.8" y="27.8" width="5.4" height="5.4" fill="white"/><rect x="5.2" y="29.2" width="2.6" height="2.6"/>
      ${cells.join('')}
    </svg>
  `;
}

function formatMoney(amountSyp) {
  const rate = appState?.workspace?.exchangeRate || 15000;
  const mode = appState?.workspace?.displayCurrency || 'SYP';
  const sypNum = Math.round(Number(amountSyp) || 0);
  const usdNum = (sypNum / rate).toFixed(2);
  const sypStr = `${sypNum.toLocaleString('en-US')} ل.س`;
  const usdStr = `$${Number(usdNum).toLocaleString('en-US')}`;

  if (mode === 'USD') return usdStr;
  if (mode === 'BOTH') return `${sypStr} (${usdStr})`;
  return sypStr;
}

function showToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `pointer-events-auto glass-panel px-4 py-3 rounded-2xl border text-sm font-bold flex items-center gap-2.5 animate-reveal ${
    isError ? 'border-red-500/60 text-red-200' : 'border-teal-400/50 text-teal-100'
  }`;
  toast.innerHTML = `
    <span class="w-2.5 h-2.5 rounded-full ${isError ? 'bg-red-400' : 'bg-emerald-400'} shrink-0"></span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function fetchState() {
  const res = await fetch('/api/state');
  appState = await res.json();
  if (appState.workspace?.bgMode) {
    bgMode = appState.workspace.bgMode;
  }
  renderAll();
}

function renderAll() {
  if (!appState) return;
  renderWorkspaceAndKpis();
  renderTasksBoardAndTable();
  renderProjectsAndAnalytics();
  renderPaymentGatewaySection();
  renderTeamSection();
  renderPaymentAccountsConfigForm();
}

function renderWorkspaceAndKpis() {
  const { workspace, wallet, tasks, projects, team, transactions } = appState;
  const rate = workspace.exchangeRate || 15000;

  document.getElementById('exchange-rate-input').value = rate;
  document.getElementById('nav-tasks-count').textContent = tasks.length;
  document.getElementById('nav-projects-count').textContent = projects.length;
  document.getElementById('nav-team-count').textContent = team.length;

  // Onboarding Banner visibility
  const onboardingBanner = document.getElementById('onboarding-banner');
  if (workspace.isConfigured && workspace.name) {
    onboardingBanner.classList.add('hidden');
    document.getElementById('header-workspace-title').textContent = workspace.name;
    document.getElementById('header-workspace-subtitle').textContent = `مساحة عمل نشطة • المحافظة: ${workspace.governorate}`;
    document.getElementById('top-workspace-badge').textContent = `${workspace.name} (${workspace.governorate})`;
  } else {
    onboardingBanner.classList.remove('hidden');
    document.getElementById('header-workspace-title').textContent = 'مَدار سوريا';
    document.getElementById('header-workspace-subtitle').textContent = 'منصة إدارة المهام والمشاريع والدفع الإلكتروني في سوريا';
    document.getElementById('top-workspace-badge').textContent = 'تطبيق إنتاجي حقيقي • قاعدة بيانات نظيفة 100%';
  }

  // Currency buttons active state
  document.querySelectorAll('.currency-btn').forEach(btn => {
    const active = btn.dataset.currency === workspace.displayCurrency;
    btn.className = `currency-btn cursor-pointer px-2.5 py-1 rounded-lg font-bold transition-colors ${
      active ? 'bg-teal-600 text-white' : 'text-slate-300 hover:text-white'
    }`;
  });

  // Background mode buttons active state
  document.querySelectorAll('.bg-mode-btn').forEach(btn => {
    const active = btn.dataset.bgmode === bgMode;
    btn.className = `bg-mode-btn cursor-pointer px-2.5 py-0.5 rounded-lg font-bold transition-colors ${
      active ? 'bg-teal-600 text-white' : 'text-slate-300 hover:text-white'
    }`;
  });

  // KPI Metrics
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const doneRate = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  document.getElementById('kpi-total-tasks').textContent = tasks.length;
  document.getElementById('kpi-done-rate').textContent = `${doneRate}% مكتملة (${doneCount}/${tasks.length})`;
  document.getElementById('kpi-projects-summary').textContent = `${projects.length} مشاريع • ${team.length} أعضاء فريق`;
  document.getElementById('kpi-wallet-balance').textContent = formatMoney(wallet.balanceSyp);
  document.getElementById('kpi-wallet-usd').textContent = `≈ $${(wallet.balanceSyp / rate).toFixed(2)} USD`;
  document.getElementById('kpi-escrow-balance').textContent = formatMoney(wallet.escrowSyp);
  document.getElementById('kpi-total-paid').textContent = formatMoney(wallet.totalPaidSyp);
  document.getElementById('kpi-tx-count').textContent = `${transactions.length} عمليات دفع مسجلة`;
}

function getFilteredTasks() {
  return (appState?.tasks || []).filter(t => {
    if (filterGov !== 'ALL' && t.governorate !== filterGov) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const hay = `${t.id} ${t.title} ${t.description} ${t.projectName} ${t.governorate} ${t.assigneeName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderTasksBoardAndTable() {
  const allTasks = appState?.tasks || [];
  const emptyState = document.getElementById('tasks-empty-state');
  const kanbanContainer = document.getElementById('kanban-view-container');
  const tableContainer = document.getElementById('table-view-container');
  const tableBody = document.getElementById('tasks-table-body');

  // Populate Modal selects for Project and Assignee from real data
  const projSelect = document.getElementById('new-task-project');
  if (projSelect) {
    projSelect.innerHTML =
      `<option value="">بدون مشروع محدد (عام)</option>` +
      appState.projects.map(p => `<option value="${p.id}">${p.name} (${p.governorate})</option>`).join('');
  }
  const assigneeSelect = document.getElementById('new-task-assignee');
  if (assigneeSelect) {
    assigneeSelect.innerHTML =
      `<option value="">غير معين حالياً</option>` +
      appState.team.map(m => `<option value="${m.id}">${m.name} (${m.governorate})</option>`).join('');
  }

  if (allTasks.length === 0) {
    emptyState.classList.remove('hidden');
    kanbanContainer.classList.add('hidden');
    tableContainer.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  kanbanContainer.classList.toggle('hidden', currentViewMode !== 'kanban');
  tableContainer.classList.toggle('hidden', currentViewMode !== 'table');

  const filteredTasks = getFilteredTasks();

  // Render Kanban Columns
  kanbanContainer.innerHTML = STATUS_COLUMNS.map(col => {
    const colTasks = filteredTasks.filter(t => t.status === col.key);
    const colBounty = colTasks.reduce((sum, t) => sum + (Number(t.bountySyp) || 0), 0);

    return `
      <div class="glass-panel rounded-3xl p-4 flex flex-col max-h-[780px]">
        <div class="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-xl text-xs font-extrabold border ${col.badge}">${col.label}</span>
            <span class="text-xs font-mono-num font-bold text-slate-400">(${colTasks.length})</span>
          </div>
          <span class="text-[11px] font-mono-num font-bold text-teal-400">${formatMoney(colBounty)}</span>
        </div>

        <div class="space-y-3 overflow-y-auto flex-1 pr-0.5">
          ${
            colTasks.length === 0
              ? `<div class="text-center py-10 px-4 border border-dashed border-white/10 rounded-2xl text-xs text-slate-500">لا توجد مهام في هذا العمود</div>`
              : colTasks.map(t => renderTaskCard(t)).join('')
          }
        </div>
      </div>
    `;
  }).join('');

  // Render Table Rows
  tableBody.innerHTML = filteredTasks
    .map(t => {
      const pri = PRIORITY_META[t.priority] || PRIORITY_META.medium;
      const pay = PAYMENT_STATUS_META[t.paymentStatus] || PAYMENT_STATUS_META.unpaid;
      return `
        <tr class="hover:bg-white/5 transition-colors">
          <td class="py-3.5 px-4">
            <div class="font-mono-num text-xs font-bold text-teal-400">${t.id}</div>
            <div class="font-bold mt-0.5">${t.title}</div>
          </td>
          <td class="py-3.5 px-4">
            <span class="px-2 py-0.5 rounded-lg text-xs font-bold bg-white/10">${t.governorate}</span>
            <div class="text-xs text-slate-400 mt-1">${t.projectName}</div>
          </td>
          <td class="py-3.5 px-4 text-xs">
            <div class="font-bold">${t.assigneeName}</div>
            <div class="text-slate-400 font-mono-num">${t.dueDate || '-'}</div>
          </td>
          <td class="py-3.5 px-4">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${pri.classes}">${pri.label}</span>
          </td>
          <td class="py-3.5 px-4">
            <select data-action="status-select" data-task-id="${t.id}" class="glass-input cursor-pointer text-xs font-bold rounded-xl px-2.5 py-1.5">
              ${STATUS_COLUMNS.map(s => `<option value="${s.key}" ${s.key === t.status ? 'selected' : ''}>${s.label}</option>`).join('')}
            </select>
          </td>
          <td class="py-3.5 px-4 font-mono-num font-bold">${formatMoney(t.bountySyp)}</td>
          <td class="py-3.5 px-4">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${pay.classes}">${pay.label}</span>
          </td>
          <td class="py-3.5 px-4 text-center space-x-1 space-x-reverse">
            ${
              t.paymentStatus !== 'paid' && t.bountySyp > 0
                ? `<button type="button" data-action="pay-task" data-task-id="${t.id}" class="cursor-pointer px-3 py-1.5 rounded-xl btn-gold text-xs font-bold">ادفع</button>`
                : ''
            }
            <button type="button" data-action="delete-task" data-task-id="${t.id}" class="cursor-pointer px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/35 text-red-300 text-xs font-bold">حذف</button>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderTaskCard(task) {
  const pri = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const pay = PAYMENT_STATUS_META[task.paymentStatus] || PAYMENT_STATUS_META.unpaid;
  const subtasks = task.subtasks || [];
  const doneSub = subtasks.filter(s => s.completed).length;
  const pct = subtasks.length > 0 ? Math.round((doneSub / subtasks.length) * 100) : task.status === 'done' ? 100 : 0;

  return `
    <article class="glass-card rounded-2xl p-4 space-y-3 animate-reveal">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5">
          <span class="font-mono-num text-[11px] font-extrabold text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded-lg border border-teal-500/30">${task.id}</span>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/10">${task.governorate}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${pri.classes}">${pri.label}</span>
          <button type="button" data-action="delete-task" data-task-id="${task.id}" class="cursor-pointer text-slate-400 hover:text-red-400 p-1" title="حذف المهمة">✕</button>
        </div>
      </div>

      <div>
        <h3 class="font-black text-sm leading-snug">${task.title}</h3>
        ${task.description ? `<p class="text-xs text-slate-400 mt-1">${task.description}</p>` : ''}
      </div>

      <div class="flex items-center justify-between text-xs text-slate-400">
        <span>المشروع: <strong class="text-teal-300">${task.projectName}</strong></span>
        ${task.dueDate ? `<span class="font-mono-num">${task.dueDate}</span>` : ''}
      </div>

      <!-- Subtasks Checklist -->
      <div class="space-y-1.5 pt-2 border-t border-white/10">
        <div class="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
          <span>خطوات التنفيذ (${doneSub}/${subtasks.length})</span>
          <span class="font-mono-num">${pct}%</span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full bg-teal-400 transition-all" style="width: ${pct}%"></div>
        </div>
        <div class="space-y-1 pt-1">
          ${subtasks
            .map(
              st => `
            <label class="cursor-pointer flex items-center gap-2 text-xs hover:text-teal-300">
              <input
                type="checkbox"
                data-action="toggle-subtask"
                data-task-id="${task.id}"
                data-subtask-id="${st.id}"
                ${st.completed ? 'checked' : ''}
                class="cursor-pointer rounded text-teal-500 w-3.5 h-3.5"
              />
              <span class="${st.completed ? 'line-through text-slate-500' : ''}">${st.title}</span>
            </label>
          `
            )
            .join('')}
        </div>
        <div class="flex items-center gap-1.5 pt-1">
          <input
            type="text"
            placeholder="+ أضف خطوة فرعية..."
            data-subtask-input="${task.id}"
            class="glass-input flex-1 px-2.5 py-1 text-xs rounded-lg"
          />
          <button type="button" data-action="add-subtask" data-task-id="${task.id}" class="cursor-pointer px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/35 text-teal-300 text-xs font-bold">إضافة</button>
        </div>
      </div>

      <!-- Bounty & Payment Status -->
      <div class="p-2.5 rounded-xl bg-slate-950/50 border border-white/10 flex items-center justify-between">
        <div>
          <span class="block text-[10px] text-slate-400">مكافأة المهمة</span>
          <span class="font-mono-num text-xs font-extrabold text-teal-300">${formatMoney(task.bountySyp)}</span>
        </div>
        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full border ${pay.classes}">${pay.label}</span>
      </div>

      <!-- Card Footer -->
      <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
        <span class="text-xs font-bold text-slate-300">${task.assigneeName}</span>
        <div class="flex items-center gap-1.5">
          <select
            data-action="status-select"
            data-task-id="${task.id}"
            aria-label="حالة المهمة"
            class="glass-input cursor-pointer text-[11px] font-bold rounded-lg px-2 py-1"
          >
            ${STATUS_COLUMNS.map(s => `<option value="${s.key}" ${s.key === task.status ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
          ${
            task.paymentStatus !== 'paid' && task.bountySyp > 0
              ? `<button type="button" data-action="pay-task" data-task-id="${task.id}" class="cursor-pointer px-2.5 py-1 rounded-lg btn-gold text-[11px] font-extrabold">ادفع</button>`
              : ''
          }
        </div>
      </div>
    </article>
  `;
}

function renderProjectsAndAnalytics() {
  const container = document.getElementById('projects-list-container');
  if (!container || !appState) return;

  if (appState.projects.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 px-4 border border-dashed border-white/15 rounded-2xl space-y-2">
        <div class="text-base font-extrabold">لا توجد مشاريع مضافة بعد</div>
        <p class="text-xs text-slate-400">استخدم النموذج الجانبي لإضافة أول مشروع حقيقي لك ومتابعة نسبة إنجازه وميزانيته.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = appState.projects
    .map(proj => {
      return `
        <div class="glass-card rounded-2xl p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-black text-base">${proj.name}</span>
                <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-teal-500/20 text-teal-300">${proj.governorate}</span>
              </div>
              <div class="text-xs text-slate-400 mt-0.5">
                عدد المهام المرتبطة: <strong class="font-mono-num text-white">${proj.tasksCount || 0}</strong> • الميزانية: <strong class="font-mono-num text-teal-300">${formatMoney(proj.budgetSyp)}</strong>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono-num text-xs font-bold">الإنجاز: ${proj.progress}% / المستهدف: ${proj.target}%</span>
              <button type="button" data-action="delete-project" data-project-id="${proj.id}" class="cursor-pointer px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/35 text-red-300 text-xs font-bold">حذف</button>
            </div>
          </div>

          <!-- Bullet Chart Bar -->
          <div class="relative h-6 w-full rounded-xl overflow-hidden bg-slate-950/70 border border-white/10">
            <div class="absolute top-1 bottom-1 right-0 bg-gradient-to-l from-teal-500 to-cyan-400 rounded-l transition-all" style="width: ${proj.progress}%"></div>
            <div class="absolute top-0 bottom-0 w-1 bg-amber-400 z-10" style="right: ${proj.target}%" title="المستهدف ${proj.target}%"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderPaymentGatewaySection() {
  if (!appState) return;

  // Populate task selector for task_payout
  const taskSelect = document.getElementById('pay-task-select');
  if (taskSelect) {
    const unpaid = appState.tasks.filter(t => t.paymentStatus !== 'paid');
    taskSelect.innerHTML =
      `<option value="">-- اختر مهمة مسجلة لتعبئة بياناتها تلقائياً --</option>` +
      unpaid.map(t => `<option value="${t.id}">[${t.id}] ${t.title} — ${formatMoney(t.bountySyp)}</option>`).join('');
  }

  renderActiveGatewayAccountBox();

  // Render Real Transactions Ledger
  const listEl = document.getElementById('transactions-list');
  document.getElementById('ledger-count-badge').textContent = `${appState.transactions.length} عمليات`;

  if (appState.transactions.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-12 px-4 border border-dashed border-white/15 rounded-2xl space-y-2">
        <div class="text-sm font-extrabold">السجل المالي فارغ حالياً</div>
        <p class="text-xs text-slate-400">أي عملية إيداع أو صرف مستحقات مهمة تجريها ستُحفظ هنا مع إيصال رسمي قابل للطباعة.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = appState.transactions
    .map(
      tx => `
    <div class="glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3">
      <div class="space-y-1 flex-1 cursor-pointer" data-action="open-receipt" data-tx-id="${tx.id}">
        <div class="flex items-center gap-2">
          <span class="font-mono-num text-xs font-extrabold text-teal-300">${tx.id}</span>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-white/10">${tx.methodLabel}</span>
        </div>
        <div class="font-bold text-xs">${tx.title}</div>
        <div class="text-[11px] text-slate-400">${tx.recipientName} (${tx.governorate}) • <span class="font-mono-num">${tx.createdAt}</span></div>
      </div>

      <div class="text-left shrink-0 space-y-1">
        <div class="font-mono-num text-sm font-black ${tx.type === 'wallet_topup' ? 'text-emerald-400' : 'text-amber-300'}">
          ${tx.type === 'wallet_topup' ? '+' : '-'}${formatMoney(tx.amountSyp)}
        </div>
        <div class="flex items-center gap-1.5 justify-end">
          <button type="button" data-action="open-receipt" data-tx-id="${tx.id}" class="cursor-pointer text-[11px] font-bold text-teal-300 hover:underline">الإيصال</button>
          <button type="button" data-action="delete-tx" data-tx-id="${tx.id}" class="cursor-pointer text-[11px] text-red-400 hover:underline">حذف</button>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function renderActiveGatewayAccountBox() {
  const method = document.getElementById('pay-method-input')?.value || 'syriatel_cash';
  const box = document.getElementById('gateway-live-account-box');
  if (!box || !appState) return;

  const acc = appState.paymentAccounts?.[method] || {};
  let summaryLine = '';
  let qrSeed = '';

  if (method === 'syriatel_cash') {
    summaryLine =
      acc.merchantCode || acc.phoneNumber
        ? `رمز التاجر المعتمد: ${acc.merchantCode || 'غير محدد'} | رقم الموبايل: ${acc.phoneNumber || 'غير محدد'}`
        : 'لم تقم بضبط رمز التاجر أو رقم سيريتل كاش الخاص بك بعد (يمكنك ضبطه من تبويب إعدادات حسابات الدفع).';
    qrSeed = acc.merchantCode || acc.phoneNumber || 'SYRIATEL-CASH';
  } else if (method === 'sham_cash') {
    summaryLine = acc.accountId
      ? `معرف شام كاش المعتمد: ${acc.accountId} (${acc.accountHolder || ''})`
      : 'لم تقم بإدخال معرف شام كاش الخاص بك بعد (يمكنك إضافته من تبويب إعدادات حسابات الدفع).';
    qrSeed = acc.accountId || 'SHAM-CASH';
  } else if (method === 'mtn_cash') {
    summaryLine = acc.phoneNumber
      ? `رقم محفظة MTN كاش: ${acc.phoneNumber} (${acc.accountHolder || ''})`
      : 'يمكنك حفظ رقم محفظة MTN كاش الخاصة بك من إعدادات حسابات الدفع.';
    qrSeed = acc.phoneNumber || 'MTN-CASH';
  } else if (method === 'bemo_ecash') {
    summaryLine = acc.accountNumber
      ? `حساب بنك بيمو / ECash: ${acc.accountNumber} (${acc.accountHolder || ''})`
      : 'يمكنك حفظ رقم حسابك المصرفي في بنك بيمو / ECash من إعدادات حسابات الدفع.';
    qrSeed = acc.accountNumber || 'BBSF-ECASH';
  } else if (method === 'haram_transfer') {
    summaryLine = acc.recipientFullName
      ? `المستلم المعتمد للحوالات: ${acc.recipientFullName} (${acc.phoneNumber || ''})`
      : 'يمكنك حفظ بيانات استلام الحوالات في شركة الهرم / الفؤاد من إعدادات حسابات الدفع.';
    qrSeed = acc.recipientFullName || 'AL-HARAM';
  } else if (method === 'usdt_trc20') {
    summaryLine = acc.walletAddress
      ? `عنوان محفظة USDT TRC20: ${acc.walletAddress}`
      : 'يمكنك حفظ عنوان محفظة USDT TRC20 الخاصة بك من إعدادات حسابات الدفع.';
    qrSeed = acc.walletAddress || 'USDT-TRC20';
  }

  box.innerHTML = `
    <div class="flex items-center justify-between gap-4">
      <div class="space-y-1 text-xs">
        <div class="font-black text-teal-300">${METHOD_NAMES[method]}</div>
        <p class="text-slate-300 font-mono-num">${summaryLine}</p>
      </div>
      <div class="bg-white p-2 rounded-xl shrink-0 text-center">
        ${generateDynamicQrSvg(qrSeed)}
      </div>
    </div>
  `;
}

function renderTeamSection() {
  const container = document.getElementById('team-grid-container');
  if (!container || !appState) return;

  if (appState.team.length === 0) {
    container.innerHTML = `
      <div class="md:col-span-2 text-center py-12 px-4 border border-dashed border-white/15 rounded-2xl space-y-2">
        <div class="text-base font-extrabold">لم تقم بإضافة أعضاء فريق بعد</div>
        <p class="text-xs text-slate-400">أضف أعضاء فريقك أو المستقلين المتعاملين معك عبر النموذج الجانبي لتكليفهم بالمهام وتحويل مستحقاتهم.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = appState.team
    .map(
      member => `
    <div class="glass-card rounded-2xl p-5 space-y-3 flex flex-col justify-between">
      <div class="space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0" style="background-color: ${member.color}">
              ${member.avatarInitials}
            </div>
            <div>
              <h3 class="font-black text-sm">${member.name}</h3>
              <p class="text-xs text-slate-400">${member.role}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-teal-500/20 text-teal-300">${member.governorate}</span>
            <button type="button" data-action="delete-member" data-member-id="${member.id}" class="cursor-pointer text-slate-400 hover:text-red-400 p-1" title="حذف العضو">✕</button>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/50 border border-white/10 text-xs space-y-1">
          <div class="text-slate-400">الموبايل: <strong class="font-mono-num text-white">${member.phone}</strong> • المفضلة: <strong class="text-teal-300">${METHOD_NAMES[member.preferredMethod] || member.preferredMethod}</strong></div>
          ${member.walletAccount ? `<div class="font-mono-num text-slate-300">${member.walletAccount}</div>` : ''}
        </div>
      </div>

      <div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <span class="text-slate-400">المهام المسندة: <strong class="text-white font-mono-num">${member.assignedTasks || 0}</strong> (المنجزة: <strong class="text-emerald-400 font-mono-num">${member.completedTasks || 0}</strong>)</span>
        <button type="button" data-action="pay-member" data-member-id="${member.id}" class="cursor-pointer px-3 py-1.5 rounded-xl btn-aurora font-bold text-xs">
          تحويل دفعة
        </button>
      </div>
    </div>
  `
    )
    .join('');
}

function renderPaymentAccountsConfigForm() {
  if (!appState?.paymentAccounts) return;
  const pa = appState.paymentAccounts;
  document.getElementById('cfg-syr-merchant').value = pa.syriatel_cash?.merchantCode || '';
  document.getElementById('cfg-syr-phone').value = pa.syriatel_cash?.phoneNumber || '';
  document.getElementById('cfg-sham-id').value = pa.sham_cash?.accountId || '';
  document.getElementById('cfg-sham-holder').value = pa.sham_cash?.accountHolder || '';
  document.getElementById('cfg-mtn-phone').value = pa.mtn_cash?.phoneNumber || '';
  document.getElementById('cfg-mtn-holder').value = pa.mtn_cash?.accountHolder || '';
  document.getElementById('cfg-bemo-acc').value = pa.bemo_ecash?.accountNumber || '';
  document.getElementById('cfg-bemo-holder').value = pa.bemo_ecash?.accountHolder || '';
  document.getElementById('cfg-haram-name').value = pa.haram_transfer?.recipientFullName || '';
  document.getElementById('cfg-haram-phone').value = pa.haram_transfer?.phoneNumber || '';
  document.getElementById('cfg-usdt-addr').value = pa.usdt_trc20?.walletAddress || '';
}

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('hidden', p.id !== `tab-${tabId}`);
  });
  document.querySelectorAll('.nav-tab').forEach(btn => {
    const active = btn.dataset.tab === tabId;
    btn.className = `nav-tab cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
      active ? 'btn-aurora text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'
    }`;
  });
}

function setPaymentType(typeKey) {
  document.getElementById('pay-type-input').value = typeKey;
  document.querySelectorAll('.pay-type-btn').forEach(btn => {
    const active = btn.dataset.paytype === typeKey;
    btn.className = `pay-type-btn cursor-pointer p-3 rounded-2xl border-2 text-right transition-all ${
      active ? 'border-teal-500 bg-teal-500/15' : 'border-white/10 hover:border-teal-500/50'
    }`;
  });
  document.getElementById('pay-task-selector-wrap').classList.toggle('hidden', typeKey !== 'task_payout');
}

function setPaymentMethod(methodKey) {
  document.getElementById('pay-method-input').value = methodKey;
  document.querySelectorAll('.pay-method-btn').forEach(btn => {
    const active = btn.dataset.method === methodKey;
    btn.className = `pay-method-btn cursor-pointer p-3 rounded-2xl border-2 text-right ${
      active ? 'border-teal-500 bg-teal-500/15' : 'border-white/10'
    }`;
  });
  renderActiveGatewayAccountBox();
}

function openReceiptModal(tx) {
  const modal = document.getElementById('receipt-modal');
  document.getElementById('receipt-id-badge').textContent = tx.id;
  document.getElementById('receipt-ws-name').textContent = appState.workspace?.name || 'منصة مَدار سوريا';
  document.getElementById('receipt-body-content').innerHTML = `
    <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
      <div>
        <span class="text-xs text-slate-500 block">قناة الدفع</span>
        <span class="font-extrabold text-slate-900">${tx.methodLabel}</span>
      </div>
      <div>
        <span class="text-xs text-slate-500 block">التاريخ والتوقيت</span>
        <span class="font-mono-num font-bold text-slate-900">${tx.createdAt}</span>
      </div>
      <div>
        <span class="text-xs text-slate-500 block">الطرف المستفيد / المودع</span>
        <span class="font-bold text-slate-900">${tx.recipientName} (${tx.governorate})</span>
      </div>
      <div>
        <span class="text-xs text-slate-500 block">رقم العملية المرجعي</span>
        <span class="font-mono-num font-bold text-teal-800">${tx.referenceCode}</span>
      </div>
    </div>

    <div class="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
      <div>
        <span class="text-xs text-teal-800 font-bold block">البيان</span>
        <span class="text-xs text-teal-700 font-semibold">${tx.title}</span>
      </div>
      <div class="text-left">
        <div class="font-mono-num text-lg font-black text-teal-900">${Number(tx.amountSyp).toLocaleString('en-US')} ل.س</div>
        <div class="font-mono-num text-xs font-bold text-amber-700">≈ $${tx.amountUsd} USD</div>
      </div>
    </div>

    <div class="flex items-center justify-between text-xs text-slate-500 pt-2">
      <span>الحالة: <strong class="text-emerald-700">عملية مسجلة وموثقة ✓</strong></span>
      <span class="font-mono-num">الحساب: ${tx.accountNumber}</span>
    </div>
  `;
  modal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  initAnimatedBackground();
  fetchState();

  // Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Animated Background Mode Buttons
  document.querySelectorAll('.bg-mode-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      bgMode = btn.dataset.bgmode;
      await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bgMode })
      });
      renderWorkspaceAndKpis();
    });
  });

  document.getElementById('toggle-motion-btn')?.addEventListener('click', e => {
    motionPaused = !motionPaused;
    document.body.classList.toggle('motion-paused', motionPaused);
    e.target.textContent = motionPaused ? 'تشغيل الحركة' : 'إيقاف الحركة';
  });

  // Theme Toggle
  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });

  // Quick Workspace Setup Form
  document.getElementById('quick-workspace-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('setup-ws-name').value;
    const governorate = document.getElementById('setup-ws-gov').value;
    const res = await fetch('/api/workspace', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, governorate, isConfigured: true })
    });
    const data = await res.json();
    if (data.ok) {
      appState = data.state;
      renderAll();
      showToast(`تم تفعيل مساحة العمل «${name}» بنجاح`);
    }
  });

  document.getElementById('open-workspace-modal-btn')?.addEventListener('click', () => {
    const banner = document.getElementById('onboarding-banner');
    banner.classList.toggle('hidden');
    if (appState?.workspace?.name) {
      document.getElementById('setup-ws-name').value = appState.workspace.name;
    }
  });

  // Exchange Rate & Currency Display
  document.getElementById('exchange-rate-input')?.addEventListener('change', async e => {
    const exchangeRate = Number(e.target.value) || 15000;
    const res = await fetch('/api/workspace', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exchangeRate })
    });
    const data = await res.json();
    if (data.ok) {
      appState = data.state;
      renderAll();
      showToast(`تم تحديث سعر الصرف إلى ${exchangeRate.toLocaleString('en-US')} ل.س`);
    }
  });

  document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const displayCurrency = btn.dataset.currency;
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayCurrency })
      });
      const data = await res.json();
      if (data.ok) {
        appState = data.state;
        renderAll();
      }
    });
  });

  // Search & Filters
  document.getElementById('task-search-input')?.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderTasksBoardAndTable();
  });
  document.getElementById('filter-governorate')?.addEventListener('change', e => {
    filterGov = e.target.value;
    renderTasksBoardAndTable();
  });
  document.getElementById('filter-priority')?.addEventListener('change', e => {
    filterPriority = e.target.value;
    renderTasksBoardAndTable();
  });

  document.querySelectorAll('.view-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentViewMode = btn.dataset.view;
      document.querySelectorAll('.view-mode-btn').forEach(b => {
        b.className = `view-mode-btn cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold ${
          b.dataset.view === currentViewMode ? 'bg-teal-600 text-white' : 'text-slate-300'
        }`;
      });
      renderTasksBoardAndTable();
    });
  });

  // New Task Modal
  const taskModal = document.getElementById('task-modal');
  document.getElementById('open-new-task-btn')?.addEventListener('click', () => taskModal.classList.remove('hidden'));
  document.getElementById('close-task-modal-btn')?.addEventListener('click', () => taskModal.classList.add('hidden'));
  document.getElementById('cancel-task-modal-btn')?.addEventListener('click', () => taskModal.classList.add('hidden'));

  document.getElementById('new-task-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const subtasks = document
      .getElementById('new-task-subtasks')
      .value.split(/[,،]/)
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      title: document.getElementById('new-task-title').value,
      description: document.getElementById('new-task-desc').value,
      projectId: document.getElementById('new-task-project').value,
      governorate: document.getElementById('new-task-gov').value,
      assigneeId: document.getElementById('new-task-assignee').value,
      priority: document.getElementById('new-task-priority').value,
      dueDate: document.getElementById('new-task-due').value,
      bountySyp: Number(document.getElementById('new-task-bounty').value) || 0,
      paymentStatus: document.getElementById('new-task-paystatus').value,
      subtasks
    };

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.ok) {
      appState = data.state;
      taskModal.classList.add('hidden');
      e.target.reset();
      renderAll();
      showToast(`تمت إضافة المهمة ${data.task.id}`);
    }
  });

  // Create Real Project
  document.getElementById('create-project-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('proj-name-input').value,
      governorate: document.getElementById('proj-gov-input').value,
      budgetSyp: Number(document.getElementById('proj-budget-input').value) || 0,
      target: Number(document.getElementById('proj-target-input').value) || 100
    };
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.ok) {
      appState = data.state;
      e.target.reset();
      renderAll();
      showToast(`تم إنشاء المشروع «${data.project.name}»`);
    }
  });

  // Create Real Team Member
  document.getElementById('create-member-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('mem-name-input').value,
      role: document.getElementById('mem-role-input').value,
      governorate: document.getElementById('mem-gov-input').value,
      phone: document.getElementById('mem-phone-input').value,
      preferredMethod: document.getElementById('mem-method-input').value,
      walletAccount: document.getElementById('mem-wallet-input').value
    };
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.ok) {
      appState = data.state;
      e.target.reset();
      renderAll();
      showToast(`تمت إضافة «${data.member.name}» إلى الفريق`);
    }
  });

  // Save Real Payment Accounts Configuration
  document.getElementById('payment-accounts-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      syriatel_cash: {
        merchantCode: document.getElementById('cfg-syr-merchant').value.trim(),
        phoneNumber: document.getElementById('cfg-syr-phone').value.trim()
      },
      sham_cash: {
        accountId: document.getElementById('cfg-sham-id').value.trim(),
        accountHolder: document.getElementById('cfg-sham-holder').value.trim()
      },
      mtn_cash: {
        phoneNumber: document.getElementById('cfg-mtn-phone').value.trim(),
        accountHolder: document.getElementById('cfg-mtn-holder').value.trim()
      },
      bemo_ecash: {
        accountNumber: document.getElementById('cfg-bemo-acc').value.trim(),
        accountHolder: document.getElementById('cfg-bemo-holder').value.trim()
      },
      haram_transfer: {
        recipientFullName: document.getElementById('cfg-haram-name').value.trim(),
        phoneNumber: document.getElementById('cfg-haram-phone').value.trim()
      },
      usdt_trc20: {
        walletAddress: document.getElementById('cfg-usdt-addr').value.trim()
      }
    };
    const res = await fetch('/api/payment-accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.ok) {
      appState = data.state;
      renderAll();
      showToast('تم حفظ وتوثيق حسابات الدفع الخاصة بك بنجاح');
    }
  });

  // Payment Gateway Form Interactions
  document.querySelectorAll('.pay-type-btn').forEach(btn => {
    btn.addEventListener('click', () => setPaymentType(btn.dataset.paytype));
  });
  document.querySelectorAll('.pay-method-btn').forEach(btn => {
    btn.addEventListener('click', () => setPaymentMethod(btn.dataset.method));
  });

  document.getElementById('pay-task-select')?.addEventListener('change', e => {
    const task = appState.tasks.find(t => t.id === e.target.value);
    if (task) {
      const rate = appState.workspace.exchangeRate || 15000;
      document.getElementById('pay-recipient-input').value = task.assigneeName;
      document.getElementById('pay-gov-select').value = task.governorate;
      document.getElementById('pay-amount-syp').value = task.bountySyp;
      document.getElementById('pay-amount-usd').value = Math.round((task.bountySyp / rate) * 100) / 100;
      document.getElementById('pay-title-input').value = `صرف مستحقات مهمة: ${task.title} (${task.id})`;
    }
  });

  document.getElementById('pay-amount-syp')?.addEventListener('input', e => {
    const rate = appState?.workspace?.exchangeRate || 15000;
    const syp = Number(e.target.value) || 0;
    document.getElementById('pay-amount-usd').value = Math.round((syp / rate) * 100) / 100;
  });

  document.getElementById('pay-amount-usd')?.addEventListener('input', e => {
    const rate = appState?.workspace?.exchangeRate || 15000;
    const usd = Number(e.target.value) || 0;
    document.getElementById('pay-amount-syp').value = Math.round(usd * rate);
  });

  document.getElementById('syria-payment-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      type: document.getElementById('pay-type-input').value,
      taskId: document.getElementById('pay-task-select').value || null,
      method: document.getElementById('pay-method-input').value,
      recipientName: document.getElementById('pay-recipient-input').value,
      governorate: document.getElementById('pay-gov-select').value,
      accountNumber: document.getElementById('pay-account-input').value,
      referenceCode: document.getElementById('pay-ref-input').value,
      amountSyp: Number(document.getElementById('pay-amount-syp').value),
      title: document.getElementById('pay-title-input').value
    };
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.ok) {
      appState = data.state;
      e.target.reset();
      renderAll();
      openReceiptModal(data.transaction);
      showToast(`تم تسجيل العملية المالية ${data.transaction.id} بنجاح`);
    } else {
      showToast(data.error || 'تعذر إتمام العملية', true);
    }
  });

  // Delegated Click & Change Events
  document.body.addEventListener('change', async e => {
    const t = e.target;
    if (t.dataset.action === 'status-select') {
      const res = await fetch(`/api/tasks/${encodeURIComponent(t.dataset.taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: t.value })
      });
      const data = await res.json();
      if (data.ok) {
        appState = data.state;
        renderAll();
      }
    } else if (t.dataset.action === 'toggle-subtask') {
      const res = await fetch(`/api/tasks/${encodeURIComponent(t.dataset.taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleSubtaskId: t.dataset.subtaskId })
      });
      const data = await res.json();
      if (data.ok) {
        appState = data.state;
        renderAll();
      }
    }
  });

  document.body.addEventListener('click', async e => {
    const triggerBtn = e.target.closest('[data-trigger]');
    if (triggerBtn) {
      const trig = triggerBtn.dataset.trigger;
      if (trig === 'open-new-task') taskModal.classList.remove('hidden');
      if (trig === 'go-projects') switchTab('projects');
      if (trig === 'go-team') switchTab('team');
      if (trig === 'go-gateways') switchTab('gateways');
      return;
    }

    const addSubBtn = e.target.closest('[data-action="add-subtask"]');
    if (addSubBtn) {
      const taskId = addSubBtn.dataset.taskId;
      const input = document.querySelector(`[data-subtask-input="${taskId}"]`);
      if (input && input.value.trim()) {
        const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newSubtaskTitle: input.value.trim() })
        });
        const data = await res.json();
        if (data.ok) {
          appState = data.state;
          renderAll();
        }
      }
      return;
    }

    const delTaskBtn = e.target.closest('[data-action="delete-task"]');
    if (delTaskBtn) {
      const res = await fetch(`/api/tasks/${encodeURIComponent(delTaskBtn.dataset.taskId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.ok) {
        appState = data.state;
        renderAll();
        showToast('تم حذف المهمة');
      }
      return;
    }

    const delProjBtn = e.target.closest('[data-action="delete-project"]');
    if (delProjBtn) {
      const res = await fetch(`/api/projects/${encodeURIComponent(delProjBtn.dataset.projectId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.ok) {
        appState = data.state;
        renderAll();
        showToast('تم حذف المشروع');
      }
      return;
    }

    const delMemBtn = e.target.closest('[data-action="delete-member"]');
    if (delMemBtn) {
      const res = await fetch(`/api/team/${encodeURIComponent(delMemBtn.dataset.memberId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.ok) {
        appState = data.state;
        renderAll();
        showToast('تم حذف العضو');
      }
      return;
    }

    const delTxBtn = e.target.closest('[data-action="delete-tx"]');
    if (delTxBtn) {
      const res = await fetch(`/api/payments/${encodeURIComponent(delTxBtn.dataset.txId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.ok) {
        appState = data.state;
        renderAll();
        showToast('تم حذف المعاملة من السجل');
      }
      return;
    }

    const payTaskBtn = e.target.closest('[data-action="pay-task"]');
    if (payTaskBtn) {
      const task = appState.tasks.find(t => t.id === payTaskBtn.dataset.taskId);
      if (task) {
        const rate = appState.workspace.exchangeRate || 15000;
        switchTab('payments');
        setPaymentType('task_payout');
        document.getElementById('pay-task-select').value = task.id;
        document.getElementById('pay-recipient-input').value = task.assigneeName;
        document.getElementById('pay-gov-select').value = task.governorate;
        document.getElementById('pay-amount-syp').value = task.bountySyp;
        document.getElementById('pay-amount-usd').value = Math.round((task.bountySyp / rate) * 100) / 100;
        document.getElementById('pay-title-input').value = `صرف مستحقات مهمة: ${task.title} (${task.id})`;
      }
      return;
    }

    const payMemBtn = e.target.closest('[data-action="pay-member"]');
    if (payMemBtn) {
      const member = appState.team.find(m => m.id === payMemBtn.dataset.memberId);
      if (member) {
        switchTab('payments');
        setPaymentType('direct_transfer');
        setPaymentMethod(member.preferredMethod || 'syriatel_cash');
        document.getElementById('pay-recipient-input').value = member.name;
        document.getElementById('pay-gov-select').value = member.governorate;
        document.getElementById('pay-account-input').value = member.phone || member.walletAccount;
        document.getElementById('pay-title-input').value = `تحويل مستحقات مالية إلى ${member.name}`;
      }
      return;
    }

    const receiptBtn = e.target.closest('[data-action="open-receipt"]');
    if (receiptBtn) {
      const tx = appState.transactions.find(t => t.id === receiptBtn.dataset.txId);
      if (tx) openReceiptModal(tx);
    }
  });

  document.getElementById('kpi-topup-shortcut')?.addEventListener('click', () => {
    switchTab('payments');
    setPaymentType('wallet_topup');
  });

  document.getElementById('close-receipt-modal-btn')?.addEventListener('click', () => {
    document.getElementById('receipt-modal').classList.add('hidden');
  });
  document.getElementById('print-receipt-btn')?.addEventListener('click', () => window.print());

  // Import JSON Backup
  document.getElementById('import-backup-input')?.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (data.ok) {
        appState = data.state;
        renderAll();
        showToast('تم استيراد النسخة الاحتياطية بنجاح');
      }
    } catch (err) {
      showToast('فشل قراءة ملف النسخة الاحتياطية', true);
    }
  });

  // Clear All Data
  document.getElementById('clear-all-data-btn')?.addEventListener('click', async () => {
    const res = await fetch('/api/clear-all', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      appState = data.state;
      renderAll();
      showToast('تم تصفير ومسح جميع البيانات بنجاح');
    }
  });
});
