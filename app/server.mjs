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

// 100% Clean Production Initial State — ZERO fake tasks, ZERO fake people, ZERO fake transactions
const CLEAN_INITIAL_STATE = {
  workspace: {
    isConfigured: false,
    name: '',
    ownerName: '',
    governorate: 'دمشق',
    exchangeRate: 15000,
    displayCurrency: 'SYP', // 'SYP' | 'USD' | 'BOTH'
    bgMode: 'aurora', // 'aurora' | 'waves' | 'geometry'
    createdAt: null
  },
  paymentAccounts: {
    syriatel_cash: {
      enabled: true,
      merchantCode: '',
      phoneNumber: '',
      accountHolder: ''
    },
    sham_cash: {
      enabled: true,
      accountId: '',
      accountHolder: ''
    },
    mtn_cash: {
      enabled: true,
      phoneNumber: '',
      accountHolder: ''
    },
    bemo_ecash: {
      enabled: true,
      bankName: 'بنك بيمو السعودي الفرنسي (BBSF)',
      accountNumber: '',
      ibanOrCard: '',
      accountHolder: ''
    },
    haram_transfer: {
      enabled: true,
      company: 'شركة الهرم للحوالات المالية',
      recipientFullName: '',
      phoneNumber: '',
      branchGovernorate: 'دمشق'
    },
    usdt_trc20: {
      enabled: true,
      walletAddress: '',
      network: 'TRON (TRC20)'
    }
  },
  wallet: {
    balanceSyp: 0,
    escrowSyp: 0,
    totalPaidSyp: 0,
    totalDepositedSyp: 0
  },
  projects: [],
  team: [],
  tasks: [],
  transactions: []
};

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      if (parsed && parsed.workspace && Array.isArray(parsed.tasks)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading DB, initializing clean state:', err);
  }
  const fresh = JSON.parse(JSON.stringify(CLEAN_INITIAL_STATE));
  fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2), 'utf8');
  return fresh;
}

function saveDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function recalculateWalletAndProjects(db) {
  let escrowSyp = 0;
  db.tasks.forEach(t => {
    if (t.paymentStatus === 'escrow') {
      escrowSyp += Number(t.bountySyp) || 0;
    }
  });
  db.wallet.escrowSyp = escrowSyp;

  // Recalculate project completion % automatically from its real tasks
  db.projects.forEach(proj => {
    const projTasks = db.tasks.filter(t => t.projectId === proj.id);
    if (projTasks.length > 0) {
      const doneCount = projTasks.filter(t => t.status === 'done').length;
      proj.progress = Math.round((doneCount / projTasks.length) * 100);
      proj.tasksCount = projTasks.length;
    } else {
      proj.tasksCount = 0;
    }
  });

  // Recalculate team member completed tasks count
  db.team.forEach(member => {
    member.completedTasks = db.tasks.filter(
      t => t.assigneeId === member.id && t.status === 'done'
    ).length;
    member.assignedTasks = db.tasks.filter(t => t.assigneeId === member.id).length;
  });
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
      if (body.length > 5 * 1024 * 1024) {
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

function nowTimestamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

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
    // 1. GET FULL STATE
    if (pathname === '/api/state' && req.method === 'GET') {
      recalculateWalletAndProjects(db);
      return sendJson(res, 200, db);
    }

    // 2. UPDATE WORKSPACE SETTINGS / ONBOARDING
    if (pathname === '/api/workspace' && req.method === 'PATCH') {
      const body = await parseBody(req);
      if (body.name !== undefined) db.workspace.name = String(body.name).trim();
      if (body.ownerName !== undefined) db.workspace.ownerName = String(body.ownerName).trim();
      if (body.governorate !== undefined) db.workspace.governorate = body.governorate;
      if (body.exchangeRate && Number(body.exchangeRate) > 0) {
        db.workspace.exchangeRate = Number(body.exchangeRate);
      }
      if (body.displayCurrency) db.workspace.displayCurrency = body.displayCurrency;
      if (body.bgMode) db.workspace.bgMode = body.bgMode;
      if (body.isConfigured !== undefined) {
        db.workspace.isConfigured = Boolean(body.isConfigured);
        if (!db.workspace.createdAt) db.workspace.createdAt = nowTimestamp();
      }
      saveDb(db);
      return sendJson(res, 200, { ok: true, state: db });
    }

    // 3. UPDATE REAL PAYMENT GATEWAY ACCOUNTS
    if (pathname === '/api/payment-accounts' && req.method === 'PATCH') {
      const body = await parseBody(req);
      for (const key of Object.keys(db.paymentAccounts)) {
        if (body[key] && typeof body[key] === 'object') {
          db.paymentAccounts[key] = {
            ...db.paymentAccounts[key],
            ...body[key]
          };
        }
      }
      saveDb(db);
      return sendJson(res, 200, { ok: true, state: db });
    }

    // 4. PROJECTS CRUD
    if (pathname === '/api/projects' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.name || !String(body.name).trim()) {
        return sendJson(res, 400, { error: 'يرجى إدخال اسم المشروع' });
      }
      const proj = {
        id: `PRJ-${Date.now().toString().slice(-5)}`,
        name: String(body.name).trim(),
        description: String(body.description || '').trim(),
        governorate: body.governorate || db.workspace.governorate || 'دمشق',
        budgetSyp: Number(body.budgetSyp) || 0,
        target: Math.min(100, Math.max(1, Number(body.target) || 100)),
        progress: Number(body.progress) || 0,
        tasksCount: 0,
        createdAt: nowTimestamp()
      };
      db.projects.unshift(proj);
      recalculateWalletAndProjects(db);
      saveDb(db);
      return sendJson(res, 201, { ok: true, project: proj, state: db });
    }

    if (pathname.startsWith('/api/projects/') && req.method === 'DELETE') {
      const projId = decodeURIComponent(pathname.replace('/api/projects/', ''));
      db.projects = db.projects.filter(p => p.id !== projId);
      recalculateWalletAndProjects(db);
      saveDb(db);
      return sendJson(res, 200, { ok: true, state: db });
    }

    // 5. TEAM MEMBERS CRUD
    if (pathname === '/api/team' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.name || !String(body.name).trim()) {
        return sendJson(res, 400, { error: 'يرجى إدخال اسم عضو الفريق أو المستقل' });
      }
      const cleanName = String(body.name).trim();
      const parts = cleanName.replace(/^م\.\s*|^أ\.\s*|^د\.\s*/, '').split(/\s+/);
      const initials =
        parts.length >= 2
          ? `${parts[0][0] || ''}${parts[1][0] || ''}`
          : cleanName.slice(0, 2);
      const palette = ['#0D9488', '#EA580C', '#2563EB', '#7C3AED', '#059669', '#D97706'];
      const color = palette[db.team.length % palette.length];

      const member = {
        id: `MEM-${Date.now().toString().slice(-5)}`,
        name: cleanName,
        role: String(body.role || 'عضو فريق').trim(),
        governorate: body.governorate || 'دمشق',
        phone: String(body.phone || '').trim(),
        preferredMethod: body.preferredMethod || 'syriatel_cash',
        walletAccount: String(body.walletAccount || '').trim(),
        avatarInitials: initials,
        color,
        completedTasks: 0,
        assignedTasks: 0,
        createdAt: nowTimestamp()
      };
      db.team.unshift(member);
      recalculateWalletAndProjects(db);
      saveDb(db);
      return sendJson(res, 201, { ok: true, member, state: db });
    }

    if (pathname.startsWith('/api/team/') && req.method === 'DELETE') {
      const memId = decodeURIComponent(pathname.replace('/api/team/', ''));
      db.team = db.team.filter(m => m.id !== memId);
      recalculateWalletAndProjects(db);
      saveDb(db);
      return sendJson(res, 200, { ok: true, state: db });
    }

    // 6. TASKS CRUD
    if (pathname === '/api/tasks' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.title || !String(body.title).trim()) {
        return sendJson(res, 400, { error: 'يرجى إدخال عنوان المهمة' });
      }
      const proj = db.projects.find(p => p.id === body.projectId) || null;
      const member = db.team.find(m => m.id === body.assigneeId) || null;
      const bountySyp = Math.max(0, Number(body.bountySyp) || 0);
      const paymentStatus = body.paymentStatus || 'unpaid';

      // If escrow is chosen and wallet has funds, deduct from available balance into escrow
      if (paymentStatus === 'escrow' && bountySyp > 0) {
        if (db.wallet.balanceSyp >= bountySyp) {
          db.wallet.balanceSyp -= bountySyp;
        }
      }

      const task = {
        id: `TSK-${String(db.tasks.length + 1).padStart(3, '0')}-${Math.floor(10 + Math.random() * 89)}`,
        title: String(body.title).trim(),
        description: String(body.description || '').trim(),
        projectId: proj ? proj.id : '',
        projectName: proj ? proj.name : String(body.projectName || 'عام').trim(),
        governorate: body.governorate || (proj ? proj.governorate : db.workspace.governorate || 'دمشق'),
        status: body.status || 'todo',
        priority: body.priority || 'medium',
        assigneeId: member ? member.id : '',
        assigneeName: member ? member.name : String(body.assigneeName || 'غير معين').trim(),
        dueDate: body.dueDate || '',
        bountySyp,
        paymentStatus,
        paidVia: '',
        tags: Array.isArray(body.tags) ? body.tags.filter(Boolean) : [],
        subtasks: Array.isArray(body.subtasks)
          ? body.subtasks.map((st, idx) => ({
              id: `st-${Date.now()}-${idx}`,
              title: typeof st === 'string' ? st : st.title,
              completed: Boolean(st.completed)
            }))
          : [],
        createdAt: nowTimestamp()
      };

      db.tasks.unshift(task);
      recalculateWalletAndProjects(db);
      saveDb(db);
      return sendJson(res, 201, { ok: true, task, state: db });
    }

    if (pathname.startsWith('/api/tasks/') && req.method === 'PATCH') {
      const taskId = decodeURIComponent(pathname.replace('/api/tasks/', ''));
      const task = db.tasks.find(t => t.id === taskId);
      if (!task) return sendJson(res, 404, { error: 'المهمة غير موجودة' });

      const body = await parseBody(req);
      if (body.status) task.status = body.status;
      if (body.priority) task.priority = body.priority;
      if (body.title) task.title = String(body.title).trim();
      if (body.description !== undefined) task.description = String(body.description).trim();
      if (body.governorate) task.governorate = body.governorate;
      if (body.dueDate !== undefined) task.dueDate = body.dueDate;
      if (body.bountySyp !== undefined) task.bountySyp = Math.max(0, Number(body.bountySyp) || 0);
      if (body.paymentStatus) task.paymentStatus = body.paymentStatus;

      if (body.toggleSubtaskId) {
        const st = task.subtasks.find(s => s.id === body.toggleSubtaskId);
        if (st) st.completed = !st.completed;
      }
      if (body.newSubtaskTitle && String(body.newSubtaskTitle).trim()) {
        task.subtasks.push({
          id: `st-${Date.now()}`,
          title: String(body.newSubtaskTitle).trim(),
          completed: false
        });
      }
      if (body.deleteSubtaskId) {
        task.subtasks = task.subtasks.filter(s => s.id !== body.deleteSubtaskId);
      }

      recalculateWalletAndProjects(db);
      saveDb(db);
      return sendJson(res, 200, { ok: true, task, state: db });
    }

    if (pathname.startsWith('/api/tasks/') && req.method === 'DELETE') {
      const taskId = decodeURIComponent(pathname.replace('/api/tasks/', ''));
      const task = db.tasks.find(t => t.id === taskId);
      if (task && task.paymentStatus === 'escrow' && task.bountySyp > 0) {
        // Return reserved escrow back to wallet balance
        db.wallet.balanceSyp += Number(task.bountySyp) || 0;
      }
      db.tasks = db.tasks.filter(t => t.id !== taskId);
      recalculateWalletAndProjects(db);
      saveDb(db);
      return sendJson(res, 200, { ok: true, state: db });
    }

    // 7. REAL ELECTRONIC PAYMENTS & WALLET LEDGER
    if (pathname === '/api/payments' && req.method === 'POST') {
      const body = await parseBody(req);
      const amountSyp = Math.max(0, Number(body.amountSyp) || 0);
      if (amountSyp <= 0) {
        return sendJson(res, 400, { error: 'يرجى إدخال مبلغ صحيح أكبر من الصفر' });
      }

      const rate = db.workspace.exchangeRate || 15000;
      const amountUsd = Math.round((amountSyp / rate) * 100) / 100;
      const method = body.method || 'syriatel_cash';
      const methodLabel = METHOD_LABELS[method] || method;
      const paymentType = body.type || 'task_payout'; // 'wallet_topup' | 'task_payout' | 'direct_transfer'

      const tx = {
        id: `SY-PAY-${Date.now().toString().slice(-6)}`,
        type: paymentType,
        title: String(body.title || 'عملية مالية إلكترونية').trim(),
        recipientName: String(body.recipientName || '').trim(),
        governorate: body.governorate || db.workspace.governorate || 'دمشق',
        method,
        methodLabel,
        amountSyp,
        amountUsd,
        referenceCode: String(body.referenceCode || '').trim() || `OP-${crypto.randomInt(100000, 999999)}`,
        accountNumber: String(body.accountNumber || '').trim(),
        notes: String(body.notes || '').trim(),
        status: 'completed',
        createdAt: nowTimestamp(),
        taskId: body.taskId || null
      };

      if (paymentType === 'wallet_topup') {
        db.wallet.balanceSyp += amountSyp;
        db.wallet.totalDepositedSyp += amountSyp;
      } else if (paymentType === 'task_payout') {
        const linkedTask = body.taskId ? db.tasks.find(t => t.id === body.taskId) : null;
        if (linkedTask) {
          if (linkedTask.paymentStatus !== 'escrow') {
            db.wallet.balanceSyp = Math.max(0, db.wallet.balanceSyp - amountSyp);
          }
          linkedTask.paymentStatus = 'paid';
          linkedTask.paidVia = methodLabel;
        } else {
          db.wallet.balanceSyp = Math.max(0, db.wallet.balanceSyp - amountSyp);
        }
        db.wallet.totalPaidSyp += amountSyp;
      } else {
        db.wallet.balanceSyp = Math.max(0, db.wallet.balanceSyp - amountSyp);
        db.wallet.totalPaidSyp += amountSyp;
      }

      db.transactions.unshift(tx);
      recalculateWalletAndProjects(db);
      saveDb(db);
      return sendJson(res, 201, { ok: true, transaction: tx, state: db });
    }

    if (pathname.startsWith('/api/payments/') && req.method === 'DELETE') {
      const txId = decodeURIComponent(pathname.replace('/api/payments/', ''));
      db.transactions = db.transactions.filter(t => t.id !== txId);
      saveDb(db);
      return sendJson(res, 200, { ok: true, state: db });
    }

    // 8. EXPORT / IMPORT REAL WORKSPACE BACKUP
    if (pathname === '/api/export' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="madar-syria-backup.json"'
      });
      return res.end(JSON.stringify(db, null, 2));
    }

    if (pathname === '/api/import' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body || !body.workspace || !Array.isArray(body.tasks)) {
        return sendJson(res, 400, { error: 'ملف النسخة الاحتياطية غير صالح' });
      }
      db = body;
      recalculateWalletAndProjects(db);
      saveDb(db);
      return sendJson(res, 200, { ok: true, state: db });
    }

    if (pathname === '/api/clear-all' && req.method === 'POST') {
      db = JSON.parse(JSON.stringify(CLEAN_INITIAL_STATE));
      saveDb(db);
      return sendJson(res, 200, { ok: true, state: db });
    }

    // Serve Static Frontend Assets
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
    sendJson(res, 500, { error: 'خطأ في الخادم', details: err.message });
  }
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Madar Syria Real Production App listening on http://0.0.0.0:${PORT}`);
});
