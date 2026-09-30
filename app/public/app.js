let appState = null;
let currentTab = 'board';
let currentViewMode = 'kanban';
let filterGov = 'ALL';
let filterPriority = 'ALL';
let filterPayment = 'ALL';
let searchQuery = '';

const STATUS_COLUMNS = [
  { key: 'todo', label: 'قيد الانتظار', badgeBg: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' },
  { key: 'in_progress', label: 'قيد التنفيذ', badgeBg: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200' },
  { key: 'review', label: 'قيد المراجعة والاعتماد', badgeBg: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200' },
  { key: 'done', label: 'مكتملة ومنجزة', badgeBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200' }
];

const PRIORITY_META = {
  urgent: { label: 'عاجل جداً', classes: 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800' },
  high: { label: 'مرتفع', classes: 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800' },
  medium: { label: 'متوسط', classes: 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800' },
  low: { label: 'منخفض', classes: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700' }
};

const PAYMENT_STATUS_META = {
  paid: { label: 'مدفوعة بالكامل', classes: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' },
  escrow: { label: 'محجوزة بالضمان (Escrow)', classes: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' },
  unpaid: { label: 'بانتظار الدفع', classes: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' }
};

const GATEWAY_CONFIG = {
  syriatel_cash: {
    name: 'سيريتل كاش (Syriatel Cash)',
    accountLabel: 'رقم موبايل سيريتل أو رمز التاجر *',
    accountPlaceholder: '093XXXXXXX / 098XXXXXXX',
    defaultAccount: '0933451289',
    refLabel: 'رقم عملية التحويل (رسالة سيريتل كاش)',
    defaultRef: 'SYR-8849201',
    instructionsHtml: `
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1 text-xs">
          <div class="font-extrabold text-teal-900 dark:text-teal-200">تعليمات الدفع الفوري عبر سيريتل كاش (Syriatel Cash):</div>
          <p class="text-slate-700 dark:text-slate-300">1. اطلب الكود <span class="font-mono-num font-bold text-red-600 dark:text-red-400">*3040#</span> من خط سيريتل أو افتح تطبيق <span class="font-bold">أقرب إليك</span>.</p>
          <p class="text-slate-700 dark:text-slate-300">2. اختر «الدفع لتاجر» عبر الرمز <span class="font-mono-num font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border">88412</span> أو التحويل المباشر لرقم المستفيد.</p>
          <p class="text-slate-700 dark:text-slate-300">3. أدخل رقم العملية المرسل برسالة SMS ليتم التوثيق وإصدار الإيصال فوراً.</p>
        </div>
        <div class="shrink-0 bg-white p-2 rounded-xl border border-teal-300 text-center">
          <svg class="w-14 h-14 mx-auto text-slate-900" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
            <rect x="2" y="2" width="10" height="10" rx="1"/><rect x="4" y="4" width="6" height="6" fill="white"/><rect x="5.5" y="5.5" width="3" height="3"/>
            <rect x="24" y="2" width="10" height="10" rx="1"/><rect x="26" y="4" width="6" height="6" fill="white"/><rect x="27.5" y="5.5" width="3" height="3"/>
            <rect x="2" y="24" width="10" height="10" rx="1"/><rect x="4" y="26" width="6" height="6" fill="white"/><rect x="5.5" y="27.5" width="3" height="3"/>
            <rect x="15" y="4" width="3" height="3"/><rect x="15" y="10" width="6" height="3"/><rect x="14" y="16" width="8" height="4"/><rect x="25" y="16" width="6" height="3"/><rect x="15" y="24" width="4" height="8"/><rect x="23" y="24" width="8" height="4"/><rect x="26" y="30" width="6" height="4"/>
          </svg>
          <span class="block text-[10px] font-mono-num font-bold text-slate-700 mt-0.5">Merchant #88412</span>
        </div>
      </div>
    `
  },
  sham_cash: {
    name: 'شام كاش (Sham Cash)',
    accountLabel: 'معرف حساب شام كاش (Sham ID) *',
    accountPlaceholder: 'SHAM-XXXX-XX',
    defaultAccount: 'SHAM-4410-99',
    refLabel: 'رقم إشعار التحويل في تطبيق شام كاش',
    defaultRef: 'SHM-9920148',
    instructionsHtml: `
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1 text-xs">
          <div class="font-extrabold text-teal-900 dark:text-teal-200">الدفع السريع عبر تطبيق شام كاش (Sham Cash - SYP / USD):</div>
          <p class="text-slate-700 dark:text-slate-300">1. افتح تطبيق <span class="font-bold">Sham Cash</span> وامسح رمز QR المقابل أو أدخل معرف المستفيد.</p>
          <p class="text-slate-700 dark:text-slate-300">2. يدعم التحويل بالليرة السورية أو الدولار الأمريكي بدون عمولة إضافية بين حسابات المنصة.</p>
        </div>
        <div class="shrink-0 bg-white p-2 rounded-xl border border-emerald-300 text-center">
          <svg class="w-14 h-14 mx-auto text-emerald-900" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
            <rect x="2" y="2" width="10" height="10" rx="1"/><rect x="4" y="4" width="6" height="6" fill="white"/><rect x="5.5" y="5.5" width="3" height="3"/>
            <rect x="24" y="2" width="10" height="10" rx="1"/><rect x="26" y="4" width="6" height="6" fill="white"/><rect x="27.5" y="5.5" width="3" height="3"/>
            <rect x="2" y="24" width="10" height="10" rx="1"/><rect x="4" y="26" width="6" height="6" fill="white"/><rect x="5.5" y="27.5" width="3" height="3"/>
            <rect x="14" y="6" width="6" height="3"/><rect x="16" y="12" width="6" height="6"/><rect x="4" y="15" width="8" height="3"/><rect x="24" y="15" width="8" height="4"/><rect x="15" y="22" width="6" height="10"/><rect x="24" y="25" width="8" height="7"/>
          </svg>
          <span class="block text-[10px] font-mono-num font-bold text-emerald-800 mt-0.5">SHAM-MADAR-09</span>
        </div>
      </div>
    `
  },
  mtn_cash: {
    name: 'إم تي إن كاش (MTN Cash)',
    accountLabel: 'رقم محفظة إم تي إن كاش *',
    accountPlaceholder: '094XXXXXXX / 095XXXXXXX',
    defaultAccount: '0944819203',
    refLabel: 'رقم عملية كاش موبايل (*2021#)',
    defaultRef: 'MTN-5540192',
    instructionsHtml: `
      <div class="space-y-1 text-xs">
        <div class="font-extrabold text-teal-900 dark:text-teal-200">تعليمات الدفع عبر محفظة إم تي إن كاش (MTN Cash):</div>
        <p class="text-slate-700 dark:text-slate-300">1. اطلب <span class="font-mono-num font-bold text-amber-700 dark:text-amber-400">*2021#</span> أو استخدم تطبيق <span class="font-bold">MTN Cash</span> واختر «دفع الفواتير والتجار».</p>
        <p class="text-slate-700 dark:text-slate-300">2. أدخل رقم محفظة المستفيد والمبلغ بالليرة السورية ثم أكد العملية بالرقم السري.</p>
      </div>
    `
  },
  bemo_ecash: {
    name: 'بنك بيمو السعودي الفرنسي / إي كاش',
    accountLabel: 'رقم الحساب المصرفي (BBSF) أو بطاقة إي كاش *',
    accountPlaceholder: 'BBSF-019283746',
    defaultAccount: 'BBSF-019283746',
    refLabel: 'رمز التحقق المصرفي (OTP) / رقم الإشعار',
    defaultRef: 'BBSF-771920',
    instructionsHtml: `
      <div class="space-y-1 text-xs">
        <div class="font-extrabold text-teal-900 dark:text-teal-200">الدفع المصرفي عبر بنك بيمو السعودي الفرنسي (BBSF) أو بوابة ECash:</div>
        <p class="text-slate-700 dark:text-slate-300">• يدعم التحويل الفوري بين الحسابات المصرفية السورية (بيمو، البركة، الدولي الإسلامي) وبطاقات الدفع الإلكتروني ECash.</p>
      </div>
    `
  },
  haram_transfer: {
    name: 'شركة الهرم / الفؤاد للحوالات المالية',
    accountLabel: 'الاسم الثلاثي للمستفيد ورقم الهاتف والفرع *',
    accountPlaceholder: 'الاسم الثلاثي - فرع المحافظة',
    defaultAccount: 'م. يامن الدمشقي - فرع دمشق (المزة)',
    refLabel: 'رقم إشعار الحوالة المالي الصادر *',
    defaultRef: 'HRM-6690124',
    instructionsHtml: `
      <div class="space-y-1 text-xs">
        <div class="font-extrabold text-teal-900 dark:text-teal-200">توثيق الحوالات المالية المباشرة (شركة الهرم / الفؤاد):</div>
        <p class="text-slate-700 dark:text-slate-300">• أدخل رقم إشعار الحوالة واسم المستلم والفرع في المحافظة ليتم أرشفة الإشعار وإرسال بيانات الاستلام للمستفيد فوراً.</p>
      </div>
    `
  },
  usdt_trc20: {
    name: 'العملات الرقمية (USDT - شبكة TRC20)',
    accountLabel: 'عنوان محفظة المستفيد (TRON TRC20 Address) *',
    accountPlaceholder: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    defaultAccount: 'TX9kMadarSyriaWallet8829104928aP',
    refLabel: 'معرف المعاملة على الشبكة (TXID / Hash)',
    defaultRef: '0x94f8a...c412e',
    instructionsHtml: `
      <div class="space-y-1 text-xs">
        <div class="font-extrabold text-teal-900 dark:text-teal-200">التحويل الرقمي عبر شبكة USDT (TRC20) للفرق والمستقلين:</div>
        <p class="text-slate-700 dark:text-slate-300">• مناسب للمشاريع المشتركة والفرق التقنية مع احتساب المعادل الفوري بالليرة السورية والدولار.</p>
      </div>
    `
  }
};

const SAAS_PLANS = [
  {
    id: 'starter',
    name: 'باقة المستقلين والفرق الناشئة',
    subtitle: 'مثالية للمستقلين والمكاتب الصغيرة في سوريا',
    priceUsd: 15,
    features: [
      'حتى 5 أعضاء في الفريق',
      'إدارة مهام غير محدودة (كانبان + جدول)',
      'ربط سيريتل كاش وشام كاش',
      'إصدار إيصالات دفع إلكترونية رسمية',
      'دعم العمل دون اتصال (Offline PWA)'
    ]
  },
  {
    id: 'business',
    name: 'باقة الأعمال والشركات السورية',
    subtitle: 'الباقة الأكثر اختياراً للشركات والوكالات التقنية',
    priceUsd: 50,
    popular: true,
    features: [
      'حتى 25 عضواً في جميع المحافظات السورية',
      'نظام الضمان المالي للمهام (Escrow Wallet)',
      'تفعيل كافة بوابات الدفع (سيريتل، شام، MTN، بيمو، الهرم)',
      'تقارير الأداء ومخططات Bullet القياسية',
      'محرك فوترة مزدوج (ل.س SYP / $ USD)'
    ]
  },
  {
    id: 'enterprise',
    name: 'باقة المؤسسات والمنظمات الكبرى',
    subtitle: 'للمؤسسات متعددة الفروع والمشاريع الضخمة',
    priceUsd: 120,
    features: [
      'عدد غير محدود من الأعضاء والمشاريع',
      'صلاحيات مالية متعددة المستويات واعتماد الفروع',
      'ربط API مخصص مع الأنظمة المحاسبية والمصرفية',
      'مدير حساب مخصص ودعم فني على مدار الساعة',
      'نسخ احتياطي مشفر وتقارير تدقيق مالي كاملة'
    ]
  }
];

function formatMoney(amountSyp) {
  const rate = appState?.settings?.exchangeRate || 15000;
  const mode = appState?.settings?.displayCurrency || 'SYP';
  const sypNum = Math.round(Number(amountSyp) || 0);
  const usdNum = (sypNum / rate).toFixed(2);
  const sypFormatted = `${sypNum.toLocaleString('en-US')} ل.س`;
  const usdFormatted = `$${Number(usdNum).toLocaleString('en-US')}`;

  if (mode === 'USD') return usdFormatted;
  if (mode === 'BOTH') return `${sypFormatted} (${usdFormatted})`;
  return sypFormatted;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bg =
    type === 'error'
      ? 'bg-red-700 border-red-500 text-white'
      : 'bg-teal-900 dark:bg-teal-800 border-teal-500 text-white';

  toast.className = `pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-bold ${bg}`;
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <svg class="w-5 h-5 text-emerald-300 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>${message}</span>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4200);
}

async function fetchState() {
  const res = await fetch('/api/state');
  appState = await res.json();
  renderAll();
}

function renderAll() {
  if (!appState) return;
  renderHeaderAndKpis();
  renderBoardAndTable();
  renderPaymentFormTaskOptions();
  renderGatewayInstructions();
  renderTransactionsLedger();
  renderAnalytics();
  renderTeamDirectory();
  renderPlans();
}

function renderHeaderAndKpis() {
  const { wallet, tasks, transactions, settings } = appState;
  const rate = settings.exchangeRate || 15000;

  document.getElementById('exchange-rate-input').value = rate;

  document.querySelectorAll('.currency-btn').forEach(btn => {
    const isActive = btn.dataset.currency === settings.displayCurrency;
    btn.className = `currency-btn cursor-pointer px-2.5 py-0.5 rounded-md font-semibold transition-colors ${
      isActive ? 'bg-teal-600 text-white' : 'text-teal-100 hover:text-white'
    }`;
  });

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const doneRate = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  document.getElementById('header-wallet-balance').textContent = formatMoney(wallet.balanceSyp);
  document.getElementById('kpi-total-tasks').textContent = tasks.length;
  document.getElementById('kpi-done-rate').textContent = `${doneRate}% مكتملة (${doneCount}/${tasks.length})`;
  document.getElementById('kpi-wallet-balance').textContent = formatMoney(wallet.balanceSyp);
  document.getElementById('kpi-wallet-usd').textContent = `≈ $${(wallet.balanceSyp / rate).toFixed(2)} USD جاهز للصرف الفوري`;
  document.getElementById('kpi-escrow-balance').textContent = formatMoney(wallet.escrowSyp);
  document.getElementById('kpi-total-paid').textContent = formatMoney(wallet.totalPaidSyp);
  document.getElementById('kpi-tx-count').textContent = `${transactions.length} عمليات موثقة عبر القنوات السورية`;

  document.getElementById('wallet-card-syp').textContent = `${wallet.balanceSyp.toLocaleString('en-US')} ل.س`;
  document.getElementById('wallet-card-usd').textContent = `≈ $${(wallet.balanceSyp / rate).toFixed(2)} USD`;
  document.getElementById('wallet-card-escrow').textContent = formatMoney(wallet.escrowSyp);
}

function getFilteredTasks() {
  return (appState?.tasks || []).filter(task => {
    if (filterGov !== 'ALL' && task.governorate !== filterGov) return false;
    if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
    if (filterPayment !== 'ALL' && task.paymentStatus !== filterPayment) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const hay = `${task.id} ${task.title} ${task.description} ${task.project} ${task.governorate} ${task.assigneeName} ${(task.tags || []).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderBoardAndTable() {
  const filteredTasks = getFilteredTasks();
  const kanbanContainer = document.getElementById('kanban-view-container');
  const tableBody = document.getElementById('tasks-table-body');

  // Populate Kanban
  kanbanContainer.innerHTML = STATUS_COLUMNS.map(col => {
    const colTasks = filteredTasks.filter(t => t.status === col.key);
    const totalColSyp = colTasks.reduce((acc, t) => acc + (Number(t.bountySyp) || 0), 0);

    return `
      <div class="bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col max-h-[780px]">
        <!-- Column Header -->
        <div class="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold ${col.badgeBg}">${col.label}</span>
            <span class="text-xs font-mono-num font-bold text-slate-500 dark:text-slate-400">(${colTasks.length})</span>
          </div>
          <span class="text-[11px] font-mono-num font-bold text-teal-700 dark:text-teal-400">${formatMoney(totalColSyp)}</span>
        </div>

        <!-- Column Cards -->
        <div class="kanban-col space-y-3 overflow-y-auto flex-1 pr-0.5">
          ${
            colTasks.length === 0
              ? `<div class="text-center py-10 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-500 dark:text-slate-400">لا توجد مهام مطابقة في هذا العمود</div>`
              : colTasks.map(task => renderTaskCardHtml(task)).join('')
          }
        </div>
      </div>
    `;
  }).join('');

  // Populate Table View
  tableBody.innerHTML =
    filteredTasks.length === 0
      ? `<tr><td colspan="8" class="text-center py-8 text-slate-500">لا توجد مهام مطابقة لمعايير البحث</td></tr>`
      : filteredTasks
          .map(task => {
            const pri = PRIORITY_META[task.priority] || PRIORITY_META.medium;
            const pay = PAYMENT_STATUS_META[task.paymentStatus] || PAYMENT_STATUS_META.unpaid;
            const colMeta = STATUS_COLUMNS.find(c => c.key === task.status) || STATUS_COLUMNS[0];

            return `
              <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="py-3.5 px-4">
                  <div class="font-mono-num text-xs font-bold text-teal-600 dark:text-teal-400">${task.id}</div>
                  <div class="font-bold text-slate-900 dark:text-white mt-0.5">${task.title}</div>
                </td>
                <td class="py-3.5 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">${task.governorate}</span>
                  <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${task.project}</div>
                </td>
                <td class="py-3.5 px-4">
                  <div class="font-semibold text-slate-900 dark:text-white">${task.assigneeName}</div>
                  <div class="text-xs text-slate-500">${task.dueDate}</div>
                </td>
                <td class="py-3.5 px-4">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${pri.classes}">${pri.label}</span>
                </td>
                <td class="py-3.5 px-4">
                  <select data-action="status-select" data-task-id="${task.id}" aria-label="تغيير حالة المهمة ${task.id}" class="cursor-pointer text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5">
                    ${STATUS_COLUMNS.map(s => `<option value="${s.key}" ${s.key === task.status ? 'selected' : ''}>${s.label}</option>`).join('')}
                  </select>
                </td>
                <td class="py-3.5 px-4 font-mono-num font-bold text-slate-900 dark:text-white">${formatMoney(task.bountySyp)}</td>
                <td class="py-3.5 px-4">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${pay.classes}">${pay.label}</span>
                </td>
                <td class="py-3.5 px-4 text-center">
                  ${
                    task.paymentStatus !== 'paid'
                      ? `<button type="button" data-action="pay-task" data-task-id="${task.id}" class="cursor-pointer px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold">دفع المستحقات</button>`
                      : `<span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">مدفوعة (${task.paidVia || 'إلكترونياً'})</span>`
                  }
                </td>
              </tr>
            `;
          })
          .join('');
}

function renderTaskCardHtml(task) {
  const pri = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const pay = PAYMENT_STATUS_META[task.paymentStatus] || PAYMENT_STATUS_META.unpaid;
  const subtasks = task.subtasks || [];
  const completedSub = subtasks.filter(s => s.completed).length;
  const progressPct = subtasks.length > 0 ? Math.round((completedSub / subtasks.length) * 100) : task.status === 'done' ? 100 : 0;

  return `
    <article class="interactive-card bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 shadow-sm">
      <!-- Top Row: ID, Governorate, Priority -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5">
          <span class="font-mono-num text-xs font-extrabold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">${task.id}</span>
          <span class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            <svg class="w-3 h-3 text-teal-600 dark:text-teal-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ${task.governorate}
          </span>
        </div>
        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full border ${pri.classes}">${pri.label}</span>
      </div>

      <!-- Title & Description -->
      <div>
        <h3 class="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">${task.title}</h3>
        <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">${task.description}</p>
      </div>

      <!-- Project & Tags -->
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50/70 dark:bg-slate-900 px-2 py-0.5 rounded">${task.project}</span>
        ${(task.tags || [])
          .map(tag => `<span class="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">#${tag}</span>`)
          .join('')}
      </div>

      <!-- Subtasks Checklist -->
      ${
        subtasks.length > 0
          ? `
        <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/70">
          <div class="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span>المهام الفرعية (${completedSub}/${subtasks.length})</span>
            <span class="font-mono-num">${progressPct}%</span>
          </div>
          <div class="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div class="h-full bg-teal-600 transition-all" style="width: ${progressPct}%"></div>
          </div>
          <div class="space-y-1 pt-1">
            ${subtasks
              .map(
                st => `
              <label class="cursor-pointer flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300">
                <input
                  type="checkbox"
                  data-action="toggle-subtask"
                  data-task-id="${task.id}"
                  data-subtask-id="${st.id}"
                  ${st.completed ? 'checked' : ''}
                  class="cursor-pointer rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                />
                <span class="${st.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}">${st.title}</span>
              </label>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- Financial Bounty & Payment Status Box -->
      <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
        <div>
          <span class="block text-[10px] text-slate-500 dark:text-slate-400">مكافأة المهمة</span>
          <span class="font-mono-num text-xs font-extrabold text-slate-900 dark:text-white">${formatMoney(task.bountySyp)}</span>
        </div>
        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full border ${pay.classes}">${pay.label}</span>
      </div>

      <!-- Footer: Assignee + Status Mover + Instant E-Pay Button -->
      <div class="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
        <div class="text-xs">
          <div class="font-bold text-slate-800 dark:text-slate-200">${task.assigneeName}</div>
          <div class="text-[11px] text-slate-500 font-mono-num">التسليم: ${task.dueDate}</div>
        </div>

        <div class="flex items-center gap-1.5">
          <select
            data-action="status-select"
            data-task-id="${task.id}"
            aria-label="نقل حالة المهمة ${task.id}"
            class="cursor-pointer text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1"
          >
            ${STATUS_COLUMNS.map(s => `<option value="${s.key}" ${s.key === task.status ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>

          ${
            task.paymentStatus !== 'paid'
              ? `
            <button
              type="button"
              data-action="pay-task"
              data-task-id="${task.id}"
              class="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold transition-colors"
              title="دفع مستحقات المهمة إلكترونياً"
            >
              <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>ادفع</span>
            </button>
          `
              : ''
          }
        </div>
      </div>
    </article>
  `;
}

function renderPaymentFormTaskOptions() {
  const select = document.getElementById('pay-task-select');
  if (!select || !appState) return;

  const unpaidTasks = appState.tasks.filter(t => t.paymentStatus !== 'paid');
  select.innerHTML =
    `<option value="">-- اختر مهمة غير مدفوعة لتعبئة بيانات المستفيد والمبلغ تلقائياً --</option>` +
    unpaidTasks
      .map(
        t =>
          `<option value="${t.id}">[${t.id}] ${t.title} — ${t.assigneeName} (${formatMoney(t.bountySyp)})</option>`
      )
      .join('');

  // Populate New Task Modal dropdowns as well
  const projSelect = document.getElementById('new-task-project');
  if (projSelect) {
    projSelect.innerHTML = appState.projects.map(p => `<option value="${p.name}">${p.name} (${p.governorate})</option>`).join('');
  }
  const assigneeSelect = document.getElementById('new-task-assignee');
  if (assigneeSelect) {
    assigneeSelect.innerHTML = appState.team.map(m => `<option value="${m.id}">${m.name} — ${m.governorate}</option>`).join('');
  }
}

function renderGatewayInstructions() {
  const method = document.getElementById('pay-method-input').value || 'syriatel_cash';
  const cfg = GATEWAY_CONFIG[method] || GATEWAY_CONFIG.syriatel_cash;

  document.getElementById('gateway-instructions-box').innerHTML = cfg.instructionsHtml;
  document.getElementById('pay-account-label').textContent = cfg.accountLabel;
  document.getElementById('pay-account-input').placeholder = cfg.accountPlaceholder;
  document.getElementById('pay-ref-label').textContent = cfg.refLabel;
}

function renderTransactionsLedger() {
  const listEl = document.getElementById('transactions-list');
  if (!listEl || !appState) return;

  listEl.innerHTML = appState.transactions
    .map(
      tx => `
    <div
      data-action="open-receipt"
      data-tx-id="${tx.id}"
      tabindex="0"
      role="button"
      class="cursor-pointer p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3 transition-colors"
    >
      <div class="space-y-0.5">
        <div class="flex items-center gap-2">
          <span class="font-mono-num text-xs font-extrabold text-teal-700 dark:text-teal-300">${tx.id}</span>
          <span class="text-[11px] font-bold px-2 py-0.2 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200">${tx.methodLabel}</span>
        </div>
        <div class="font-bold text-xs text-slate-900 dark:text-white">${tx.title}</div>
        <div class="text-[11px] text-slate-500 dark:text-slate-400">المستفيد: ${tx.recipientName} (${tx.governorate}) • <span class="font-mono-num">${tx.createdAt}</span></div>
      </div>

      <div class="text-left shrink-0">
        <div class="font-mono-num text-sm font-extrabold ${
          tx.type === 'wallet_topup' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
        }">
          ${tx.type === 'wallet_topup' ? '+' : ''}${formatMoney(tx.amountSyp)}
        </div>
        <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
          <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          إيصال رسمي
        </span>
      </div>
    </div>
  `
    )
    .join('');
}

function renderAnalytics() {
  if (!appState) return;
  const bulletContainer = document.getElementById('bullet-charts-container');
  const a11yTable = document.getElementById('analytics-a11y-table');
  const channelsContainer = document.getElementById('payment-channels-chart');

  // Render Bullet Charts per UI/UX Pro Max Chart Guidelines
  bulletContainer.innerHTML = appState.projects
    .map(proj => {
      const statusText = proj.progress >= proj.target ? 'متفوق على المستهدف' : proj.progress >= 65 ? 'ضمن المسار الجيد' : 'يحتاج تسريع';
      const statusBadge =
        proj.progress >= proj.target
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300';

      return `
        <div class="space-y-1.5">
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span class="font-extrabold text-slate-900 dark:text-white">${proj.name}</span>
              <span class="text-slate-500 mr-2">(${proj.governorate})</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono-num font-bold">الفعلي: ${proj.progress}% | المستهدف: ${proj.target}%</span>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${statusBadge}">${statusText}</span>
            </div>
          </div>

          <!-- Qualitative Range Bullet Bar (Bad <50%, OK 50-75%, Good 75-100%) -->
          <div class="relative h-7 w-full rounded-lg overflow-hidden flex bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" role="img" aria-label="مخطط أداء ${proj.name}: الإنجاز الفعلي ${proj.progress}% مقابل المستهدف ${proj.target}%">
            <div class="h-full bg-red-200/70 dark:bg-red-950/50" style="width: 50%" title="نطاق أدنى (0-50%)"></div>
            <div class="h-full bg-amber-200/70 dark:bg-amber-950/50" style="width: 25%" title="نطاق مقبول (50-75%)"></div>
            <div class="h-full bg-emerald-200/70 dark:bg-emerald-950/50" style="width: 25%" title="نطاق ممتاز (75-100%)"></div>

            <!-- Actual Performance Bar -->
            <div class="absolute top-1.5 bottom-1.5 right-0 bg-teal-600 dark:bg-teal-400 rounded-l" style="width: ${proj.progress}%"></div>

            <!-- Target Marker Line -->
            <div class="absolute top-0 bottom-0 w-1 bg-slate-950 dark:bg-amber-400 z-10" style="right: ${proj.target}%" title="المستهدف: ${proj.target}%"></div>
          </div>
        </div>
      `;
    })
    .join('');

  a11yTable.innerHTML = appState.projects
    .map(
      proj => `
      <tr>
        <td class="p-2.5 font-bold">${proj.name}</td>
        <td class="p-2.5">${proj.governorate}</td>
        <td class="p-2.5 font-mono-num font-bold">${proj.progress}%</td>
        <td class="p-2.5 font-mono-num">${proj.target}%</td>
        <td class="p-2.5 font-mono-num">${formatMoney(proj.budgetSyp)}</td>
        <td class="p-2.5 font-bold ${proj.progress >= proj.target ? 'text-emerald-600' : 'text-teal-600'}">
          ${proj.progress >= proj.target ? 'تجاوز الهدف' : 'قيد الإنجاز'}
        </td>
      </tr>
    `
    )
    .join('');

  // Payment Channels Breakdown
  const totalsByMethod = {};
  let grandTotal = 0;
  appState.transactions.forEach(tx => {
    totalsByMethod[tx.method] = (totalsByMethod[tx.method] || 0) + tx.amountSyp;
    grandTotal += tx.amountSyp;
  });

  const methodsOrder = ['bemo_ecash', 'haram_transfer', 'sham_cash', 'syriatel_cash', 'mtn_cash', 'usdt_trc20'];
  channelsContainer.innerHTML = methodsOrder
    .map(mKey => {
      const cfg = GATEWAY_CONFIG[mKey];
      const amount = totalsByMethod[mKey] || 0;
      const pct = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;
      return `
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-800 dark:text-slate-200">${cfg.name}</span>
            <span class="font-mono-num font-bold text-teal-700 dark:text-teal-300">${formatMoney(amount)} (${pct}%)</span>
          </div>
          <div class="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div class="h-full bg-teal-600 rounded-full" style="width: ${Math.max(pct, 4)}%"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderTeamDirectory() {
  const container = document.getElementById('team-grid-container');
  if (!container || !appState) return;

  container.innerHTML = appState.team
    .map(
      member => `
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
      <div class="space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-base shrink-0" style="background-color: ${member.color}">
              ${member.avatarInitials}
            </div>
            <div>
              <h3 class="font-extrabold text-base text-slate-900 dark:text-white">${member.name}</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400">${member.role}</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">${member.governorate}</span>
        </div>

        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 text-xs space-y-1">
          <div class="font-bold text-slate-700 dark:text-slate-300">حسابات الدفع الإلكتروني المعتمدة:</div>
          <div class="font-mono-num text-slate-600 dark:text-slate-400">${member.walletAccount}</div>
        </div>
      </div>

      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div class="text-xs text-slate-600 dark:text-slate-400">
          <span class="font-bold text-slate-900 dark:text-white font-mono-num">${member.completedTasks}</span> مهمة منجزة • تقييم <span class="font-mono-num font-bold text-amber-600">${member.rating}</span>
        </div>
        <button
          type="button"
          data-action="pay-member"
          data-member-id="${member.id}"
          class="cursor-pointer px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
        >
          تحويل دفعة مالية
        </button>
      </div>
    </div>
  `
    )
    .join('');
}

function renderPlans() {
  const container = document.getElementById('plans-grid-container');
  if (!container || !appState) return;
  const rate = appState.settings.exchangeRate || 15000;
  const currentPlan = appState.settings.currentPlan || 'business';

  container.innerHTML = SAAS_PLANS.map(plan => {
    const sypPrice = plan.priceUsd * rate;
    const isCurrent = plan.id === currentPlan;

    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col justify-between border-2 ${
        plan.popular ? 'border-teal-600 shadow-md' : 'border-slate-200 dark:border-slate-800'
      }">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold px-2.5 py-1 rounded-full ${
              plan.popular ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }">${plan.popular ? 'الأكثر طلباً في سوريا' : 'باقة مرنة'}</span>
            ${isCurrent ? `<span class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">باقتك الحالية ✓</span>` : ''}
          </div>

          <div>
            <h3 class="text-lg font-extrabold text-slate-900 dark:text-white">${plan.name}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${plan.subtitle}</p>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <div class="text-2xl font-extrabold text-teal-700 dark:text-teal-300 font-mono-num">${sypPrice.toLocaleString('en-US')} ل.س <span class="text-xs font-normal">/ شهرياً</span></div>
            <div class="text-xs font-mono-num text-slate-500 mt-0.5">أو $${plan.priceUsd} USD شهرياً</div>
          </div>

          <ul class="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            ${plan.features
              .map(
                f => `
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>${f}</span>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>

        <button
          type="button"
          data-action="subscribe-plan"
          data-plan-id="${plan.id}"
          class="cursor-pointer w-full mt-6 py-3 px-4 rounded-xl font-extrabold text-sm transition-colors ${
            isCurrent
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-600 hover:text-white'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }"
        >
          ${isCurrent ? 'تجديد الاشتراك عبر الدفع الإلكتروني' : 'الترقية والاشتراك عبر بوابة الدفع'}
        </button>
      </div>
    `;
  }).join('');
}

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.id !== `tab-${tabId}`);
  });
  document.querySelectorAll('.nav-tab').forEach(btn => {
    const active = btn.dataset.tab === tabId;
    btn.className = `nav-tab cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-colors ${
      active
        ? 'bg-teal-600 text-white'
        : 'text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700'
    }`;
  });
}

function openReceiptModal(tx) {
  const modal = document.getElementById('receipt-modal');
  document.getElementById('receipt-id-badge').textContent = tx.id;
  document.getElementById('receipt-body-content').innerHTML = `
    <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
      <div>
        <span class="text-xs text-slate-500 block">بوابة الدفع المعتمدة</span>
        <span class="font-extrabold text-slate-900">${tx.methodLabel}</span>
      </div>
      <div>
        <span class="text-xs text-slate-500 block">تاريخ وتوقيت العملية</span>
        <span class="font-mono-num font-bold text-slate-900">${tx.createdAt}</span>
      </div>
      <div>
        <span class="text-xs text-slate-500 block">المستفيد / الجهة</span>
        <span class="font-bold text-slate-900">${tx.recipientName} (${tx.governorate})</span>
      </div>
      <div>
        <span class="text-xs text-slate-500 block">رقم الحساب / المرجع</span>
        <span class="font-mono-num font-bold text-teal-800">${tx.referenceCode}</span>
      </div>
    </div>

    <div class="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
      <div>
        <span class="text-xs text-teal-800 font-bold block">إجمالي المبلغ المدفوع</span>
        <span class="text-xs text-teal-700">${tx.title}</span>
      </div>
      <div class="text-left">
        <div class="font-mono-num text-lg font-extrabold text-teal-900">${Number(tx.amountSyp).toLocaleString('en-US')} ل.س</div>
        <div class="font-mono-num text-xs font-bold text-amber-700">≈ $${tx.amountUsd} USD</div>
      </div>
    </div>

    <div class="flex items-center justify-between text-xs text-slate-500 pt-2">
      <span>الحالة: <strong class="text-emerald-700">مكتملة وموثقة رقمياً ✓</strong></span>
      <span class="font-mono-num">حساب: ${tx.accountNumber}</span>
    </div>
  `;
  modal.classList.remove('hidden');
}

function prefillPaymentForTask(taskId) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;
  const member = appState.team.find(m => m.id === task.assigneeId) || appState.team[0];

  switchTab('payments');
  setPaymentType('task_payout');
  document.getElementById('pay-task-select').value = task.id;
  setPaymentMethod(member.preferredMethod || 'syriatel_cash');

  document.getElementById('pay-recipient-input').value = task.assigneeName;
  document.getElementById('pay-gov-select').value = task.governorate;
  document.getElementById('pay-account-input').value = member.phone || '0933451289';
  document.getElementById('pay-amount-syp').value = task.bountySyp;
  const rate = appState.settings.exchangeRate || 15000;
  document.getElementById('pay-amount-usd').value = Math.round((task.bountySyp / rate) * 100) / 100;
  document.getElementById('pay-title-input').value = `صرف مستحقات مهمة: ${task.title} (${task.id})`;
  showToast(`تم تجهيز بوابة الدفع لصرف مستحقات المهمة ${task.id}`);
}

function setPaymentType(payType) {
  document.getElementById('pay-type-input').value = payType;
  document.querySelectorAll('.pay-type-btn').forEach(btn => {
    const active = btn.dataset.paytype === payType;
    btn.className = `pay-type-btn cursor-pointer p-3 rounded-xl border-2 text-right transition-colors ${
      active
        ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40'
        : 'border-slate-200 dark:border-slate-700 hover:border-teal-500'
    }`;
  });
  const taskSelectorWrap = document.getElementById('pay-task-selector-wrap');
  taskSelectorWrap.classList.toggle('hidden', payType !== 'task_payout');
}

function setPaymentMethod(methodKey) {
  document.getElementById('pay-method-input').value = methodKey;
  document.querySelectorAll('.pay-method-btn').forEach(btn => {
    const active = btn.dataset.method === methodKey;
    btn.className = `pay-method-btn cursor-pointer p-3 rounded-xl border-2 flex flex-col items-start gap-1 text-right transition-colors ${
      active
        ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/50'
        : 'border-slate-200 dark:border-slate-700'
    }`;
  });
  const cfg = GATEWAY_CONFIG[methodKey] || GATEWAY_CONFIG.syriatel_cash;
  document.getElementById('pay-account-input').value = cfg.defaultAccount;
  document.getElementById('pay-ref-input').value = cfg.defaultRef;
  renderGatewayInstructions();
}

// Event Listeners Setup
document.addEventListener('DOMContentLoaded', () => {
  fetchState();

  // Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('header-wallet-btn')?.addEventListener('click', () => switchTab('payments'));
  document.getElementById('quick-topup-btn')?.addEventListener('click', () => {
    setPaymentType('wallet_topup');
    document.getElementById('pay-recipient-input').value = 'محفظة مدار سوريا المؤسسية';
    document.getElementById('pay-amount-syp').value = 7500000;
    document.getElementById('pay-amount-usd').value = 500;
    document.getElementById('pay-title-input').value = 'تغذية رصيد المحفظة الرقمية للمشاريع';
    showToast('تم اختيار وضع شحن محفظة الشركة');
  });

  // Theme Toggle
  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });

  // Exchange Rate Input
  document.getElementById('exchange-rate-input')?.addEventListener('change', async e => {
    const exchangeRate = Number(e.target.value) || 15000;
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exchangeRate })
    });
    const data = await res.json();
    if (data.ok) {
      appState.settings = data.settings;
      renderAll();
      showToast(`تم تحديث سعر الصرف إلى ${exchangeRate.toLocaleString('en-US')} ل.س لكل دولار`);
    }
  });

  // Currency Mode Switcher
  document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const displayCurrency = btn.dataset.currency;
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayCurrency })
      });
      const data = await res.json();
      if (data.ok) {
        appState.settings = data.settings;
        renderAll();
      }
    });
  });

  // Task Filters & Search
  document.getElementById('task-search-input')?.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderBoardAndTable();
  });
  document.getElementById('filter-governorate')?.addEventListener('change', e => {
    filterGov = e.target.value;
    renderBoardAndTable();
  });
  document.getElementById('filter-priority')?.addEventListener('change', e => {
    filterPriority = e.target.value;
    renderBoardAndTable();
  });
  document.getElementById('filter-payment')?.addEventListener('change', e => {
    filterPayment = e.target.value;
    renderBoardAndTable();
  });

  // View Mode Switcher (Kanban vs Table)
  document.querySelectorAll('.view-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentViewMode = btn.dataset.view;
      document.getElementById('kanban-view-container').classList.toggle('hidden', currentViewMode !== 'kanban');
      document.getElementById('table-view-container').classList.toggle('hidden', currentViewMode !== 'table');
      document.querySelectorAll('.view-mode-btn').forEach(b => {
        const active = b.dataset.view === currentViewMode;
        b.className = `view-mode-btn cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
          active ? 'bg-teal-600 text-white' : 'text-slate-700 dark:text-slate-300'
        }`;
      });
    });
  });

  // Delegated Actions on Tasks, Team, Plans, Receipts
  document.body.addEventListener('change', async e => {
    const target = e.target;
    if (target.dataset.action === 'status-select') {
      const taskId = target.dataset.taskId;
      const status = target.value;
      const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.ok) {
        appState = data.state;
        renderAll();
        showToast(`تم تحديث حالة المهمة ${taskId}`);
      }
    } else if (target.dataset.action === 'toggle-subtask') {
      const taskId = target.dataset.taskId;
      const toggleSubtaskId = target.dataset.subtaskId;
      const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleSubtaskId })
      });
      const data = await res.json();
      if (data.ok) {
        appState = data.state;
        renderAll();
      }
    }
  });

  document.body.addEventListener('click', e => {
    const payTaskBtn = e.target.closest('[data-action="pay-task"]');
    if (payTaskBtn) {
      prefillPaymentForTask(payTaskBtn.dataset.taskId);
      return;
    }

    const payMemberBtn = e.target.closest('[data-action="pay-member"]');
    if (payMemberBtn) {
      const member = appState.team.find(m => m.id === payMemberBtn.dataset.memberId);
      if (member) {
        switchTab('payments');
        setPaymentType('task_payout');
        setPaymentMethod(member.preferredMethod || 'syriatel_cash');
        document.getElementById('pay-recipient-input').value = member.name;
        document.getElementById('pay-gov-select').value = member.governorate;
        document.getElementById('pay-account-input').value = member.phone;
        document.getElementById('pay-title-input').value = `تحويل مستحقات مالية إلى ${member.name}`;
        showToast(`تم تجهيز التحويل المالي إلى ${member.name}`);
      }
      return;
    }

    const subscribeBtn = e.target.closest('[data-action="subscribe-plan"]');
    if (subscribeBtn) {
      const plan = SAAS_PLANS.find(p => p.id === subscribeBtn.dataset.planId);
      if (plan) {
        const rate = appState.settings.exchangeRate || 15000;
        const syp = plan.priceUsd * rate;
        switchTab('payments');
        setPaymentType('subscription');
        document.getElementById('pay-recipient-input').value = 'منصة مدار سوريا السحابية';
        document.getElementById('pay-amount-syp').value = syp;
        document.getElementById('pay-amount-usd').value = plan.priceUsd;
        document.getElementById('pay-title-input').value = `اشتراك شهري: ${plan.name}`;
        showToast(`تم تجهيز الدفع لاشتراك ${plan.name}`);
      }
      return;
    }

    const receiptTrigger = e.target.closest('[data-action="open-receipt"]');
    if (receiptTrigger) {
      const tx = appState.transactions.find(t => t.id === receiptTrigger.dataset.txId);
      if (tx) openReceiptModal(tx);
    }
  });

  // Payment Gateway Controls
  document.querySelectorAll('.pay-type-btn').forEach(btn => {
    btn.addEventListener('click', () => setPaymentType(btn.dataset.paytype));
  });

  document.querySelectorAll('.pay-method-btn').forEach(btn => {
    btn.addEventListener('click', () => setPaymentMethod(btn.dataset.method));
  });

  document.getElementById('pay-task-select')?.addEventListener('change', e => {
    if (e.target.value) {
      prefillPaymentForTask(e.target.value);
    }
  });

  // Synchronize SYP <-> USD inputs in Payment Form
  document.getElementById('pay-amount-syp')?.addEventListener('input', e => {
    const rate = appState?.settings?.exchangeRate || 15000;
    const syp = Number(e.target.value) || 0;
    document.getElementById('pay-amount-usd').value = Math.round((syp / rate) * 100) / 100;
  });

  document.getElementById('pay-amount-usd')?.addEventListener('input', e => {
    const rate = appState?.settings?.exchangeRate || 15000;
    const usd = Number(e.target.value) || 0;
    document.getElementById('pay-amount-syp').value = Math.round(usd * rate);
  });

  // Submit Syrian Electronic Payment Form
  document.getElementById('syria-payment-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = document.getElementById('pay-submit-btn');
    const submitText = document.getElementById('pay-submit-text');
    submitBtn.disabled = true;
    submitText.textContent = 'جاري التحقق من العملية عبر بوابة الدفع السورية...';

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

    submitBtn.disabled = false;
    submitText.textContent = 'تأكيد وتنفيذ الدفع الإلكتروني وإصدار الإيصال';

    if (data.ok) {
      appState = data.state;
      renderAll();
      openReceiptModal(data.transaction);
      showToast(`تمت عملية الدفع بنجاح (${data.transaction.id})`);
    }
  });

  // New Task Modal Controls
  const taskModal = document.getElementById('task-modal');
  document.getElementById('open-new-task-btn')?.addEventListener('click', () => {
    taskModal.classList.remove('hidden');
  });
  document.getElementById('close-task-modal-btn')?.addEventListener('click', () => {
    taskModal.classList.add('hidden');
  });
  document.getElementById('cancel-task-modal-btn')?.addEventListener('click', () => {
    taskModal.classList.add('hidden');
  });

  document.getElementById('new-task-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const subtasksRaw = document.getElementById('new-task-subtasks').value;
    const subtasks = subtasksRaw
      .split(/[,،]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(title => ({ title, completed: false }));

    const payload = {
      title: document.getElementById('new-task-title').value,
      description: document.getElementById('new-task-desc').value,
      project: document.getElementById('new-task-project').value,
      governorate: document.getElementById('new-task-gov').value,
      assigneeId: document.getElementById('new-task-assignee').value,
      priority: document.getElementById('new-task-priority').value,
      dueDate: document.getElementById('new-task-due').value,
      bountySyp: Number(document.getElementById('new-task-bounty').value),
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
      showToast(`تمت إضافة المهمة ${data.task.id} بنجاح`);
    }
  });

  // Receipt Modal Controls
  document.getElementById('close-receipt-modal-btn')?.addEventListener('click', () => {
    document.getElementById('receipt-modal').classList.add('hidden');
  });
  document.getElementById('print-receipt-btn')?.addEventListener('click', () => {
    window.print();
  });

  // Reset Demo Data
  document.getElementById('reset-demo-btn')?.addEventListener('click', async () => {
    const res = await fetch('/api/reset', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      appState = data.state;
      renderAll();
      showToast('تمت إعادة ضبط البيانات التجريبية بنجاح');
    }
  });
});
