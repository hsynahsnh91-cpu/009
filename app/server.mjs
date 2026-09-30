import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const INITIAL_DATA = {
  settings: {
    workspaceName: 'مَدار سوريا للتقنية والأعمال',
    exchangeRate: 15000, // 1 USD = 15,000 SYP
    displayCurrency: 'SYP', // 'SYP' | 'USD' | 'BOTH'
    currentPlan: 'business',
    governorate: 'دمشق'
  },
  wallet: {
    balanceSyp: 24750000,
    escrowSyp: 8250000,
    totalPaidSyp: 42300000,
    monthlyBudgetSyp: 60000000
  },
  team: [
    {
      id: 'mem-1',
      name: 'م. يامن الدمشقي',
      role: 'مطور واجهات أمامية (React / Next.js)',
      governorate: 'دمشق',
      phone: '0933451289',
      preferredMethod: 'syriatel_cash',
      walletAccount: 'سيريتل كاش: 0933451289 | رمز التاجر: 88412',
      completedTasks: 18,
      rating: 4.9,
      avatarInitials: 'يد',
      color: '#0D9488'
    },
    {
      id: 'mem-2',
      name: 'م. لين الحلبي',
      role: 'مصممة تجربة وواجهات المستخدم UI/UX',
      governorate: 'حلب',
      phone: '0944819203',
      preferredMethod: 'sham_cash',
      walletAccount: 'شام كاش: SHAM-4410-99 | إم تي إن: 0944819203',
      completedTasks: 24,
      rating: 5.0,
      avatarInitials: 'لح',
      color: '#EA580C'
    },
    {
      id: 'mem-3',
      name: 'م. طارق العاصي',
      role: 'مهندس برمجيات خلفية وقواعد بيانات',
      governorate: 'حمص',
      phone: '0988123904',
      preferredMethod: 'bemo_ecash',
      walletAccount: 'بنك بيمو BBSF: 019283746 | إي كاش: 4910-XXXX',
      completedTasks: 15,
      rating: 4.8,
      avatarInitials: 'طع',
      color: '#2563EB'
    },
    {
      id: 'mem-4',
      name: 'أ. ريم الساحل',
      role: 'أخصائية محتوى وتسويق رقمي',
      governorate: 'اللاذقية',
      phone: '0991746251',
      preferredMethod: 'mtn_cash',
      walletAccount: 'إم تي إن كاش: 0955746251 | الهرم للحوالات - اللاذقية',
      completedTasks: 21,
      rating: 4.9,
      avatarInitials: 'رس',
      color: '#7C3AED'
    },
    {
      id: 'mem-5',
      name: 'م. كنان الشامي',
      role: 'مختبر جودة وأمن معلومات QA & SecOps',
      governorate: 'طرطوس',
      phone: '0938910234',
      preferredMethod: 'usdt_trc20',
      walletAccount: 'شام كاش: SHAM-9102 | USDT: TX9k...82aP',
      completedTasks: 12,
      rating: 4.9,
      avatarInitials: 'كش',
      color: '#059669'
    }
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'منصة التجارة الإلكترونية (سوق الشام)',
      governorate: 'دمشق',
      progress: 78,
      target: 85,
      budgetSyp: 22500000
    },
    {
      id: 'proj-2',
      name: 'تطبيق التوصيل والخدمات اللوجستية (نبض حلب)',
      governorate: 'حلب',
      progress: 64,
      target: 75,
      budgetSyp: 18000000
    },
    {
      id: 'proj-3',
      name: 'النظام المحاسبي السحابي للشركات السورية',
      governorate: 'حمص',
      progress: 91,
      target: 90,
      budgetSyp: 15000000
    },
    {
      id: 'proj-4',
      name: 'بوابة الحجز السياحي والفندقي للساحل',
      governorate: 'اللاذقية وطرطوس',
      progress: 52,
      target: 70,
      budgetSyp: 12000000
    }
  ],
  tasks: [
    {
      id: 'TSK-101',
      title: 'ربط بوابة دفع سيريتل كاش وإم تي إن كاش مع سلة المشتريات',
      description: 'تطوير واجهة البرمجة (API) للتحقق الفوري من رقم عملية التحويل ورمز التاجر وإصدار إيصال رقمي للعميل بالليرة السورية.',
      project: 'منصة التجارة الإلكترونية (سوق الشام)',
      governorate: 'دمشق',
      status: 'in_progress',
      priority: 'urgent',
      assigneeId: 'mem-3',
      assigneeName: 'م. طارق العاصي',
      assigneeRole: 'مهندس برمجيات خلفية',
      dueDate: '2026-10-03',
      bountySyp: 2700000,
      paymentStatus: 'escrow',
      paidVia: 'شام كاش (ضمان)',
      tags: ['دفع إلكتروني', 'API', 'سيريتل كاش'],
      subtasks: [
        { id: 'st-1', title: 'إعداد نقطة النهاية للتحقق من رمز العملية', completed: true },
        { id: 'st-2', title: 'معالجة حالات الخطأ وانقطاع الشبكة مع إعادة المحاولة', completed: true },
        { id: 'st-3', title: 'توليد إيصال PDF/HTML تلقائي بعد الدفع', completed: false }
      ]
    },
    {
      id: 'TSK-102',
      title: 'تصميم نظام الهوية البصرية وواجهات المستخدم المتجاوبة RTL',
      description: 'تصميم شاشات لوحة التحكم، المحفظة المالية، وتتبع الطلبات وفق معايير الوصول والتباين العالي للخطوط العربية.',
      project: 'منصة التجارة الإلكترونية (سوق الشام)',
      governorate: 'حلب',
      status: 'done',
      priority: 'high',
      assigneeId: 'mem-2',
      assigneeName: 'م. لين الحلبي',
      assigneeRole: 'مصممة UI/UX',
      dueDate: '2026-09-28',
      bountySyp: 2250000,
      paymentStatus: 'paid',
      paidVia: 'شام كاش',
      tags: ['UI/UX', 'Figma', 'تباين عالي'],
      subtasks: [
        { id: 'st-4', title: 'تصميم دليل الألوان والخطوط العربية (Cairo / Plus Jakarta)', completed: true },
        { id: 'st-5', title: 'تصميم شاشات الدفع الإلكتروني للهاتف المحمول', completed: true },
        { id: 'st-6', title: 'تسليم ملف المكونات النهائي للمطورين', completed: true }
      ]
    },
    {
      id: 'TSK-103',
      title: 'تطوير خريطة تتبع المندوبين في أحياء حلب ودمشق',
      description: 'بناء واجهة تفاعلية خفيفة تعمل بكفاءة عالية حتى مع سرعات الإنترنت المحدودة مع تخزين مؤقت للمسارات.',
      project: 'تطبيق التوصيل والخدمات اللوجستية (نبض حلب)',
      governorate: 'حلب',
      status: 'in_progress',
      priority: 'high',
      assigneeId: 'mem-1',
      assigneeName: 'م. يامن الدمشقي',
      assigneeRole: 'مطور واجهات أمامية',
      dueDate: '2026-10-05',
      bountySyp: 3000000,
      paymentStatus: 'escrow',
      paidVia: 'سيريتل كاش (ضمان)',
      tags: ['خرائط', 'React', 'أداء عالي'],
      subtasks: [
        { id: 'st-7', title: 'ضغط بيانات الخرائط المتجهية للمدن السورية', completed: true },
        { id: 'st-8', title: 'إضافة إشعارات لحظية لحالة المندوب', completed: false },
        { id: 'st-9', title: 'اختبار الاستجابة على الأجهزة اللوحية والهواتف', completed: false }
      ]
    },
    {
      id: 'TSK-104',
      title: 'برمجة محرك الفوترة المزدوج (ليرة سورية / دولار أمريكي)',
      description: 'دعم إصدار الفواتير والتقارير الضريبية والمحاسبية بالليرة السورية مع التحديث الفوري لسعر الصرف وحفظ السجل التاريخي.',
      project: 'النظام المحاسبي السحابي للشركات السورية',
      governorate: 'حمص',
      status: 'review',
      priority: 'urgent',
      assigneeId: 'mem-1',
      assigneeName: 'م. يامن الدمشقي',
      assigneeRole: 'مطور واجهات أمامية',
      dueDate: '2026-10-01',
      bountySyp: 1950000,
      paymentStatus: 'unpaid',
      paidVia: '',
      tags: ['محاسبة', 'فواتير', 'سعر الصرف'],
      subtasks: [
        { id: 'st-10', title: 'بناء حاسبة الصرف الفورية في شاشة الفاتورة', completed: true },
        { id: 'st-11', title: 'تصدير كشف الحساب بصيغة قابلة للطباعة', completed: true },
        { id: 'st-12', title: 'مراجعة دقة التقريب المالي للعملتين', completed: true }
      ]
    },
    {
      id: 'TSK-105',
      title: 'حملة إطلاق المنصة والتسويق الرقمي للمتاجر في المحافظات',
      description: 'إعداد خطة المحتوى الإعلاني والتواصل مع غرف التجارة وأصحاب المشاريع في دمشق وحلب وحمص واللاذقية.',
      project: 'منصة التجارة الإلكترونية (سوق الشام)',
      governorate: 'اللاذقية',
      status: 'todo',
      priority: 'medium',
      assigneeId: 'mem-4',
      assigneeName: 'أ. ريم الساحل',
      assigneeRole: 'أخصائية محتوى وتسويق',
      dueDate: '2026-10-09',
      bountySyp: 1500000,
      paymentStatus: 'unpaid',
      paidVia: '',
      tags: ['تسويق رقمي', 'محتوى', 'علاقات عامة'],
      subtasks: [
        { id: 'st-13', title: 'كتابة نصوص صفحة الهبوط الإعلانية', completed: true },
        { id: 'st-14', title: 'تصميم عروض تعريفية للشركات', completed: false }
      ]
    },
    {
      id: 'TSK-106',
      title: 'فحص أمني شامل واختبار اختراق لبوابات الدفع والمحافظ',
      description: 'التأكد من تشفير كافة بيانات المعاملات المالية والالتزام بمعايير حماية البيانات المصرفية والتحقق الثنائي.',
      project: 'النظام المحاسبي السحابي للشركات السورية',
      governorate: 'طرطوس',
      status: 'review',
      priority: 'urgent',
      assigneeId: 'mem-5',
      assigneeRole: 'مختبر جودة وأمن معلومات',
      assigneeName: 'م. كنان الشامي',
      dueDate: '2026-10-02',
      bountySyp: 2550000,
      paymentStatus: 'escrow',
      paidVia: 'USDT TRC20 (ضمان)',
      tags: ['أمن سيبراني', 'تشفير', 'QA'],
      subtasks: [
        { id: 'st-15', title: 'فحص نقاط النهاية ضد هجمات التلاعب بالأسعار', completed: true },
        { id: 'st-16', title: 'اختبار صلاحيات الوصول وتوثيق الجلسات', completed: true }
      ]
    },
    {
      id: 'TSK-107',
      title: 'تطوير نظام الحجز الفندقي والدفع المقدم عبر بنك بيمو وإي كاش',
      description: 'تمكين السياح والزوار من حجز الغرف والشاليهات في اللاذقية وطرطوس وكسب وتأكيد الحجز إلكترونياً.',
      project: 'بوابة الحجز السياحي والفندقي للساحل',
      governorate: 'اللاذقية',
      status: 'todo',
      priority: 'high',
      assigneeId: 'mem-3',
      assigneeName: 'م. طارق العاصي',
      assigneeRole: 'مهندس برمجيات خلفية',
      dueDate: '2026-10-12',
      bountySyp: 2400000,
      paymentStatus: 'unpaid',
      paidVia: '',
      tags: ['سياحة', 'إي كاش', 'بنك بيمو'],
      subtasks: [
        { id: 'st-17', title: 'بناء تقويم التوافر الفوري للغرف', completed: false },
        { id: 'st-18', title: 'ربط إشعارات التأكيد عبر الرسائل القصيرة SMS', completed: false }
      ]
    },
    {
      id: 'TSK-108',
      title: 'تحسين سرعة التحميل والعمل دون اتصال (Offline PWA) عند انقطاع الكهرباء',
      description: 'حفظ المهام والتعديلات محلياً ومزامنتها فور عودة الاتصال بالإنترنت لضمان عدم ضياع أي بيانات للفرق.',
      project: 'تطبيق التوصيل والخدمات اللوجستية (نبض حلب)',
      governorate: 'دمشق',
      status: 'done',
      priority: 'high',
      assigneeId: 'mem-1',
      assigneeName: 'م. يامن الدمشقي',
      assigneeRole: 'مطور واجهات أمامية',
      dueDate: '2026-09-25',
      bountySyp: 1800000,
      paymentStatus: 'paid',
      paidVia: 'سيريتل كاش',
      tags: ['PWA', 'Offline-First', 'أداء'],
      subtasks: [
        { id: 'st-19', title: 'تفعيل Service Worker للتخزين المحلي', completed: true },
        { id: 'st-20', title: 'مزامنة تلقائية للعمليات المؤجلة', completed: true }
      ]
    }
  ],
  transactions: [
    {
      id: 'SY-PAY-2026-9042',
      type: 'task_payout',
      title: 'صرف مستحقات مهمة: تصميم نظام الهوية البصرية (TSK-102)',
      recipientName: 'م. لين الحلبي',
      governorate: 'حلب',
      method: 'sham_cash',
      methodLabel: 'شام كاش (Sham Cash)',
      amountSyp: 2250000,
      amountUsd: 150,
      referenceCode: 'SHM-9928174',
      accountNumber: 'SHAM-4410-99',
      status: 'completed',
      createdAt: '2026-09-28 14:20',
      taskId: 'TSK-102'
    },
    {
      id: 'SY-PAY-2026-9018',
      type: 'task_payout',
      title: 'صرف مستحقات مهمة: تحسين العمل دون اتصال PWA (TSK-108)',
      recipientName: 'م. يامن الدمشقي',
      governorate: 'دمشق',
      method: 'syriatel_cash',
      methodLabel: 'سيريتل كاش (Syriatel Cash)',
      amountSyp: 1800000,
      amountUsd: 120,
      referenceCode: 'SYR-7741029',
      accountNumber: '0933451289',
      status: 'completed',
      createdAt: '2026-09-26 11:05',
      taskId: 'TSK-108'
    },
    {
      id: 'SY-PAY-2026-8975',
      type: 'wallet_topup',
      title: 'تغذية محفظة الشركة الرقمية - فرع دمشق الرئيسي',
      recipientName: 'محفظة مدار سوريا',
      governorate: 'دمشق',
      method: 'bemo_ecash',
      methodLabel: 'بنك بيمو السعودي الفرنسي / إي كاش',
      amountSyp: 15000000,
      amountUsd: 1000,
      referenceCode: 'BBSF-5501928',
      accountNumber: 'BBSF-CORP-0091',
      status: 'completed',
      createdAt: '2026-09-24 09:45',
      taskId: null
    },
    {
      id: 'SY-PAY-2026-8910',
      type: 'subscription',
      title: 'تجديد اشتراك باقة الأعمال السورية (15 عضو فريق)',
      recipientName: 'منصة مدار سوريا السحابية',
      governorate: 'دمشق',
      method: 'mtn_cash',
      methodLabel: 'إم تي إن كاش (MTN Cash)',
      amountSyp: 750000,
      amountUsd: 50,
      referenceCode: 'MTN-3309481',
      accountNumber: '0944001122',
      status: 'completed',
      createdAt: '2026-09-20 16:30',
      taskId: null
    },
    {
      id: 'SY-PAY-2026-8864',
      type: 'wallet_topup',
      title: 'إيداع رصيد مشاريع عبر شركة الهرم للحوالات المالية',
      recipientName: 'محفظة مدار سوريا',
      governorate: 'حمص',
      method: 'haram_transfer',
      methodLabel: 'شركة الهرم للحوالات المالية',
      amountSyp: 9000000,
      amountUsd: 600,
      referenceCode: 'HRM-6612094',
      accountNumber: 'إشعار حوالة رقم 6612094 - فرع حمص',
      status: 'completed',
      createdAt: '2026-09-18 12:15',
      taskId: null
    }
  ]
};

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading DB, re-initializing:', err);
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}

function saveDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

let db = loadDb();

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.zip': 'application/zip'
};

const METHOD_LABELS = {
  syriatel_cash: 'سيريتل كاش (Syriatel Cash)',
  sham_cash: 'شام كاش (Sham Cash)',
  mtn_cash: 'إم تي إن كاش (MTN Cash)',
  bemo_ecash: 'بنك بيمو / إي كاش (ECash)',
  haram_transfer: 'شركة الهرم / الفؤاد للحوالات',
  usdt_trc20: 'العملات الرقمية (USDT TRC20)'
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  try {
    // API Routes
    if (pathname === '/api/state' && req.method === 'GET') {
      return sendJson(res, 200, db);
    }

    if (pathname === '/api/settings' && req.method === 'PATCH') {
      const body = await parseBody(req);
      if (body.exchangeRate && Number(body.exchangeRate) > 0) {
        db.settings.exchangeRate = Number(body.exchangeRate);
      }
      if (body.displayCurrency) {
        db.settings.displayCurrency = body.displayCurrency;
      }
      if (body.governorate) {
        db.settings.governorate = body.governorate;
      }
      if (body.workspaceName) {
        db.settings.workspaceName = body.workspaceName;
      }
      saveDb(db);
      return sendJson(res, 200, { ok: true, settings: db.settings });
    }

    if (pathname === '/api/tasks' && req.method === 'POST') {
      const body = await parseBody(req);
      const assignee = db.team.find(m => m.id === body.assigneeId) || db.team[0];
      const nextNum = 101 + db.tasks.length + Math.floor(Math.random() * 50);
      const bountySyp = Number(body.bountySyp) || 1500000;
      const newTask = {
        id: `TSK-${nextNum}`,
        title: (body.title || 'مهمة جديدة').trim(),
        description: (body.description || '').trim(),
        project: body.project || db.projects[0].name,
        governorate: body.governorate || 'دمشق',
        status: body.status || 'todo',
        priority: body.priority || 'medium',
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        assigneeRole: assignee.role,
        dueDate: body.dueDate || '2026-10-10',
        bountySyp,
        paymentStatus: body.paymentStatus || 'unpaid',
        paidVia: body.paidVia || '',
        tags: Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : ['مهمة جديدة'],
        subtasks: Array.isArray(body.subtasks)
          ? body.subtasks.map((t, idx) => ({
              id: `st-${Date.now()}-${idx}`,
              title: typeof t === 'string' ? t : t.title,
              completed: Boolean(t.completed)
            }))
          : []
      };

      if (newTask.paymentStatus === 'escrow') {
        db.wallet.escrowSyp += bountySyp;
      }

      db.tasks.unshift(newTask);
      saveDb(db);
      return sendJson(res, 201, { ok: true, task: newTask, state: db });
    }

    if (pathname.startsWith('/api/tasks/') && req.method === 'PATCH') {
      const taskId = decodeURIComponent(pathname.replace('/api/tasks/', ''));
      const task = db.tasks.find(t => t.id === taskId);
      if (!task) {
        return sendJson(res, 404, { error: 'المهمة غير موجودة' });
      }
      const body = await parseBody(req);
      if (body.status) task.status = body.status;
      if (body.priority) task.priority = body.priority;
      if (body.title) task.title = body.title;
      if (body.description !== undefined) task.description = body.description;
      if (body.governorate) task.governorate = body.governorate;
      if (body.dueDate) task.dueDate = body.dueDate;
      if (body.bountySyp !== undefined) task.bountySyp = Number(body.bountySyp);
      if (body.paymentStatus) task.paymentStatus = body.paymentStatus;
      if (body.assigneeId) {
        const member = db.team.find(m => m.id === body.assigneeId);
        if (member) {
          task.assigneeId = member.id;
          task.assigneeName = member.name;
          task.assigneeRole = member.role;
        }
      }
      if (body.toggleSubtaskId) {
        const st = task.subtasks.find(s => s.id === body.toggleSubtaskId);
        if (st) st.completed = !st.completed;
      }
      if (body.newSubtaskTitle) {
        task.subtasks.push({
          id: `st-${Date.now()}`,
          title: body.newSubtaskTitle.trim(),
          completed: false
        });
      }
      saveDb(db);
      return sendJson(res, 200, { ok: true, task, state: db });
    }

    if (pathname.startsWith('/api/tasks/') && req.method === 'DELETE') {
      const taskId = decodeURIComponent(pathname.replace('/api/tasks/', ''));
      db.tasks = db.tasks.filter(t => t.id !== taskId);
      saveDb(db);
      return sendJson(res, 200, { ok: true, state: db });
    }

    if (pathname === '/api/payments' && req.method === 'POST') {
      const body = await parseBody(req);
      const amountSyp = Number(body.amountSyp) || 1500000;
      const amountUsd = Math.round((amountSyp / (db.settings.exchangeRate || 15000)) * 100) / 100;
      const method = body.method || 'syriatel_cash';
      const methodLabel = METHOD_LABELS[method] || method;
      const paymentType = body.type || 'task_payout'; // 'task_payout' | 'wallet_topup' | 'subscription'
      const now = new Date();
      const dateStr = `2026-09-30 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const randCode = Math.floor(1000 + Math.random() * 9000);
      const txId = `SY-PAY-2026-${randCode}`;

      const transaction = {
        id: txId,
        type: paymentType,
        title: body.title || 'عملية دفع إلكتروني',
        recipientName: body.recipientName || 'مستفيد في المنصة',
        governorate: body.governorate || 'دمشق',
        method,
        methodLabel,
        amountSyp,
        amountUsd,
        referenceCode: body.referenceCode || `REF-${crypto.randomInt(100000, 999999)}`,
        accountNumber: body.accountNumber || '093XXXXXXX',
        status: 'completed',
        createdAt: dateStr,
        taskId: body.taskId || null
      };

      if (paymentType === 'wallet_topup') {
        db.wallet.balanceSyp += amountSyp;
      } else if (paymentType === 'task_payout') {
        if (body.taskId) {
          const task = db.tasks.find(t => t.id === body.taskId);
          if (task) {
            if (task.paymentStatus === 'escrow') {
              db.wallet.escrowSyp = Math.max(0, db.wallet.escrowSyp - amountSyp);
            } else {
              db.wallet.balanceSyp = Math.max(0, db.wallet.balanceSyp - amountSyp);
            }
            task.paymentStatus = 'paid';
            task.paidVia = methodLabel.split(' (')[0];
          } else {
            db.wallet.balanceSyp = Math.max(0, db.wallet.balanceSyp - amountSyp);
          }
        } else {
          db.wallet.balanceSyp = Math.max(0, db.wallet.balanceSyp - amountSyp);
        }
        db.wallet.totalPaidSyp += amountSyp;
      } else if (paymentType === 'subscription') {
        db.wallet.balanceSyp = Math.max(0, db.wallet.balanceSyp - amountSyp);
        db.wallet.totalPaidSyp += amountSyp;
        if (body.planId) {
          db.settings.currentPlan = body.planId;
        }
      }

      db.transactions.unshift(transaction);
      saveDb(db);
      return sendJson(res, 201, { ok: true, transaction, state: db });
    }

    if (pathname === '/api/reset' && req.method === 'POST') {
      db = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveDb(db);
      return sendJson(res, 200, { ok: true, state: db });
    }

    // Serve static files from PUBLIC_DIR
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { error: 'حدث خطأ في الخادم الداخلي', details: err.message });
  }
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Madar Syria Task & E-Payment Platform listening on http://0.0.0.0:${PORT}`);
});
