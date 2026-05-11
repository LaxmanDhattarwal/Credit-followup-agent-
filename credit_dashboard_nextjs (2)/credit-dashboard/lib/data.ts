import { Invoice, AuditEntry, GeneratedEmail, RunStats } from "./types";

export const invoices: Invoice[] = [
  {
    id: "INV-2024-001", client: "Rajesh Kapoor", company: "Kapoor Industries Ltd",
    amount: 45000, dueDate: "2026-05-03", email: "rajesh@kapoorindustries.com",
    payLink: "https://pay.acme.in/INV-2024-001", accountManager: "Ananya Singh",
    daysOverdue: 7, stage: 1, followUpCount: 0,
  },
  {
    id: "INV-2024-002", client: "Priya Sharma", company: "Sharma Tech Solutions",
    amount: 128500, dueDate: "2026-04-26", email: "priya@sharmatech.in",
    payLink: "https://pay.acme.in/INV-2024-002", accountManager: "Ananya Singh",
    daysOverdue: 14, stage: 2, followUpCount: 1,
  },
  {
    id: "INV-2024-003", client: "Amit Verma", company: "Verma Exports Pvt Ltd",
    amount: 67200, dueDate: "2026-04-19", email: "amit@vermaexports.com",
    payLink: "https://pay.acme.in/INV-2024-003", accountManager: "Rohit Mehta",
    daysOverdue: 21, stage: 3, followUpCount: 2,
  },
  {
    id: "INV-2024-004", client: "Sunita Mehta", company: "Mehta Group Holdings",
    amount: 210000, dueDate: "2026-04-10", email: "sunita@mehtagroup.com",
    payLink: "https://pay.acme.in/INV-2024-004", accountManager: "Rohit Mehta",
    daysOverdue: 30, stage: 4, followUpCount: 3,
  },
  {
    id: "INV-2024-005", client: "Vikram Singh", company: "Singh & Associates",
    amount: 34800, dueDate: "2026-05-08", email: "vikram@singhassoc.com",
    payLink: "https://pay.acme.in/INV-2024-005", accountManager: "Ananya Singh",
    daysOverdue: 2, stage: 1, followUpCount: 0,
  },
  {
    id: "INV-2024-006", client: "Neha Gupta", company: "Gupta Pharmaceuticals",
    amount: 89000, dueDate: "2026-03-28", email: "neha@guptapharma.in",
    payLink: "https://pay.acme.in/INV-2024-006", accountManager: "Priya Kapoor",
    daysOverdue: 43, stage: 5, followUpCount: 4,
  },
  {
    id: "INV-2024-007", client: "Arjun Nair", company: "Nair Constructions Co.",
    amount: 156000, dueDate: "2026-04-05", email: "arjun@nairconstructions.com",
    payLink: "https://pay.acme.in/INV-2024-007", accountManager: "Priya Kapoor",
    daysOverdue: 35, stage: 5, followUpCount: 3,
  },
  {
    id: "INV-2024-008", client: "Deepa Krishnan", company: "Krishnan Textiles Mills",
    amount: 52300, dueDate: "2026-05-06", email: "deepa@krishnantextiles.com",
    payLink: "https://pay.acme.in/INV-2024-008", accountManager: "Rohit Mehta",
    daysOverdue: 4, stage: 1, followUpCount: 1,
  },
];

export const generatedEmails: Record<string, GeneratedEmail> = {
  "INV-2024-001": {
    invoiceId: "INV-2024-001",
    subject: "Friendly Reminder: Overdue Payment for INV-2024-001",
    body: `Dear Rajesh Kapoor,

Hope this email finds you well. We wanted to reach out regarding the overdue payment of Rs.45,000 for invoice INV-2024-001, which was due on 2026-05-03 and is now 7 days past due.

We understand that delays can happen and we are more than happy to help. To avoid any additional charges, we kindly request you to settle this amount at your earliest convenience.

You can pay now via the link below:
https://pay.acme.in/INV-2024-001

Or through bank transfer — details are available upon request. Please let us know if you need any assistance.

We appreciate your prompt attention to this matter and look forward to hearing from you soon.

Warm regards,
Accounts Receivable Team
Acme Finance Pvt Ltd | ar@acme.in | +91-22-4000-1234`,
    tone: "Warm & Friendly", generatedAt: "2026-05-10 21:03:30", status: "DRY_RUN", model: "llama-3.3-70b-versatile",
  },
  "INV-2024-002": {
    invoiceId: "INV-2024-002",
    subject: "Overdue Invoice INV-2024-002 for Rs.128,500",
    body: `Dear Priya Sharma,

We value our relationship with Sharma Tech Solutions and appreciate the business you have entrusted to us.

However, we are writing to bring to your attention that your invoice INV-2024-002 for Rs.128,500 is now 14 days overdue, with the original due date being 2026-04-26.

We understand unforeseen circumstances may arise, but it is essential we receive the payment as soon as possible. To facilitate the payment, you can use the following link:
https://pay.acme.in/INV-2024-002

Please confirm your payment date by replying to this email. We look forward to resolving this matter promptly.

Regards,
Accounts Receivable Team
Acme Finance Pvt Ltd | ar@acme.in | +91-22-4000-1234`,
    tone: "Polite but Firm", generatedAt: "2026-05-10 21:03:31", status: "DRY_RUN", model: "llama-3.3-70b-versatile",
  },
  "INV-2024-003": {
    invoiceId: "INV-2024-003",
    subject: "Overdue Payment: INV-2024-003 for Rs.67,200",
    body: `Dear Amit Verma,

This is a formal follow-up regarding your outstanding invoice INV-2024-003 for Rs.67,200, which was due on 2026-04-19 and is now 21 days overdue.

We are concerned that continued non-payment may impact your credit terms with us. To avoid any adverse effects, we urge you to settle this amount immediately.

Please make the payment at:
https://pay.acme.in/INV-2024-003

We request that you respond to this email within 48 hours to discuss the payment and avoid any impact on your credit terms.

Sincerely,
Accounts Receivable Team
Acme Finance Pvt Ltd | ar@acme.in | +91-22-4000-1234`,
    tone: "Formal & Serious", generatedAt: "2026-05-10 21:03:32", status: "DRY_RUN", model: "llama-3.3-70b-versatile",
  },
  "INV-2024-004": {
    invoiceId: "INV-2024-004",
    subject: "OVERDUE: INV-2024-004 - Immediate Payment Required",
    body: `Dear Sunita Mehta,

This is a final automated reminder regarding the overdue payment of Rs.210,000 for invoice INV-2024-004, which was due on 2026-04-10 and is now 30 days overdue.

We urge you to remit the payment immediately using the payment link below or contact us within the next 24 hours to avoid any further action.
https://pay.acme.in/INV-2024-004

Failure to pay within the specified timeframe will trigger escalation to our legal and recovery team. We cannot stress enough the importance of settling this outstanding amount promptly.

Accounts Receivable Team
Acme Finance Pvt Ltd | ar@acme.in | +91-22-4000-1234`,
    tone: "Stern & Urgent", generatedAt: "2026-05-10 21:03:32", status: "DRY_RUN", model: "llama-3.3-70b-versatile",
  },
  "INV-2024-005": {
    invoiceId: "INV-2024-005",
    subject: "Overdue Payment Reminder for INV-2024-005",
    body: `Dear Vikram Singh,

Hope you are doing well. We wanted to bring to your attention that your invoice INV-2024-005 for Rs.34,800 is now 2 days overdue, with the original due date being 2026-05-08.

We completely understand that delays can happen and we are more than happy to help. To avoid any late fees, we kindly request you to settle this amount at your earliest convenience.

You can pay now via the link:
https://pay.acme.in/INV-2024-005

Or through a bank transfer. If you have already made the payment, please disregard this notice.

Best regards,
Accounts Receivable Team
Acme Finance Pvt Ltd | ar@acme.in | +91-22-4000-1234`,
    tone: "Warm & Friendly", generatedAt: "2026-05-10 21:03:33", status: "DRY_RUN", model: "llama-3.3-70b-versatile",
  },
  "INV-2024-008": {
    invoiceId: "INV-2024-008",
    subject: "Overdue Payment Reminder for INV-2024-008",
    body: `Dear Deepa Krishnan,

We hope this email finds you well. We wanted to reach out regarding the overdue payment for invoice INV-2024-008 for Rs.52,300, which was due on 2026-05-06 and is now 4 days overdue.

We completely understand that delays can happen and we're more than happy to help you get back on track. To avoid any additional charges, please pay now via the link below:
https://pay.acme.in/INV-2024-008

Alternatively, you can also make a bank transfer using the details we have on file. If you have already made the payment, please disregard this email.

We appreciate your prompt attention to this matter.

Best regards,
Accounts Receivable Team
Acme Finance Pvt Ltd | ar@acme.in | +91-22-4000-1234`,
    tone: "Warm & Friendly", generatedAt: "2026-05-10 21:03:34", status: "DRY_RUN", model: "llama-3.3-70b-versatile",
  },
};

export const auditLog: AuditEntry[] = [
  { id:1, timestamp:"2026-05-10 21:03:30", invoiceNo:"INV-2024-001", clientName:"Rajesh Kapoor",   company:"Kapoor Industries Ltd",    amount:45000,  daysOverdue:7,  stage:1, tone:"Warm & Friendly", subject:"Friendly Reminder: Overdue Payment for INV-2024-001", recipientMasked:"r***@kapoorindustries.com", status:"DRY_RUN",   model:"llama-3.3-70b-versatile" },
  { id:2, timestamp:"2026-05-10 21:03:31", invoiceNo:"INV-2024-002", clientName:"Priya Sharma",    company:"Sharma Tech Solutions",    amount:128500, daysOverdue:14, stage:2, tone:"Polite but Firm", subject:"Overdue Invoice INV-2024-002 for Rs.128,500",          recipientMasked:"p***@sharmatech.in",       status:"DRY_RUN",   model:"llama-3.3-70b-versatile" },
  { id:3, timestamp:"2026-05-10 21:03:32", invoiceNo:"INV-2024-003", clientName:"Amit Verma",      company:"Verma Exports Pvt Ltd",    amount:67200,  daysOverdue:21, stage:3, tone:"Formal & Serious",subject:"Overdue Payment: INV-2024-003 for Rs.67,200",          recipientMasked:"a***@vermaexports.com",    status:"DRY_RUN",   model:"llama-3.3-70b-versatile" },
  { id:4, timestamp:"2026-05-10 21:03:32", invoiceNo:"INV-2024-004", clientName:"Sunita Mehta",    company:"Mehta Group Holdings",     amount:210000, daysOverdue:30, stage:4, tone:"Stern & Urgent",  subject:"OVERDUE: INV-2024-004 - Immediate Payment Required",  recipientMasked:"s***@mehtagroup.com",      status:"DRY_RUN",   model:"llama-3.3-70b-versatile" },
  { id:5, timestamp:"2026-05-10 21:03:33", invoiceNo:"INV-2024-005", clientName:"Vikram Singh",    company:"Singh & Associates",       amount:34800,  daysOverdue:2,  stage:1, tone:"Warm & Friendly", subject:"Overdue Payment Reminder for INV-2024-005",           recipientMasked:"v***@singhassoc.com",      status:"DRY_RUN",   model:"llama-3.3-70b-versatile" },
  { id:6, timestamp:"2026-05-10 21:03:33", invoiceNo:"INV-2024-006", clientName:"Neha Gupta",      company:"Gupta Pharmaceuticals",    amount:89000,  daysOverdue:43, stage:5, tone:"Legal Review",    subject:"",                                                    recipientMasked:"n***@guptapharma.in",      status:"ESCALATED", model:null },
  { id:7, timestamp:"2026-05-10 21:03:33", invoiceNo:"INV-2024-007", clientName:"Arjun Nair",      company:"Nair Constructions Co.",   amount:156000, daysOverdue:35, stage:5, tone:"Legal Review",    subject:"",                                                    recipientMasked:"a***@nairconstructions.com",status:"ESCALATED", model:null },
  { id:8, timestamp:"2026-05-10 21:03:34", invoiceNo:"INV-2024-008", clientName:"Deepa Krishnan",  company:"Krishnan Textiles Mills",  amount:52300,  daysOverdue:4,  stage:1, tone:"Warm & Friendly", subject:"Overdue Payment Reminder for INV-2024-008",           recipientMasked:"d***@krishnantextiles.com",status:"DRY_RUN",   model:"llama-3.3-70b-versatile" },
];

export const runStats: RunStats = {
  runId: "fe4f0cde", timestamp: "2026-05-10 21:03:27",
  duration: 6.2, generated: 6, sent: 0, dryRun: 6, failed: 0, escalated: 2,
  model: "llama-3.3-70b-versatile", mode: "DRY_RUN",
};

export const portfolioSummary = {
  totalInvoices: 8,
  totalOutstanding: 782800,
  byStage: [
    { stage: 1 as const, count: 3, amount: 132100, label: "Stage 1 — Warm" },
    { stage: 2 as const, count: 1, amount: 128500, label: "Stage 2 — Firm" },
    { stage: 3 as const, count: 1, amount: 67200,  label: "Stage 3 — Formal" },
    { stage: 4 as const, count: 1, amount: 210000, label: "Stage 4 — Urgent" },
    { stage: 5 as const, count: 2, amount: 245000, label: "Escalated" },
  ],
};

export function fmtINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export function stageFromDays(days: number): 0|1|2|3|4|5 {
  if (days <= 0) return 0;
  if (days <= 7) return 1;
  if (days <= 14) return 2;
  if (days <= 21) return 3;
  if (days <= 30) return 4;
  return 5;
}
