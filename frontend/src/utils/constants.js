// Environment-aware API Base URL:
// 1. Prioritize VITE_API_BASE_URL environment variable (configured in Vercel or .env)
// 2. In local development (localhost / 127.0.0.1) without custom env, use local backend
// 3. In cloud production deployments, default to the live Render backend
const getApiBaseUrl = () => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL 
    ? String(import.meta.env.VITE_API_BASE_URL).trim() 
    : '';

  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000/api';
  }

  return 'https://sentrix-api-ak86.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const BUREAUS = [
  "All",
  "PGRC (Public Grievance Redressal)",
  "Regulation Bureau (RB)",
  "Approval Bureau (AB)",
  "Policy & Academic Planning Bureau (PAPB)",
  "Anti-Ragging Cell (ARC)",
  "Skill Development Cell (SDC)"
];

export const BUREAU_SHORT_MAP = {
  "PGRC (Public Grievance Redressal)": "PGRC",
  "Regulation Bureau (RB)": "RB",
  "Approval Bureau (AB)": "AB",
  "Policy & Academic Planning Bureau (PAPB)": "PAPB",
  "Anti-Ragging Cell (ARC)": "ARC",
  "Skill Development Cell (SDC)": "SDC"
};

export const STATUS_OPTIONS = [
  "All",
  "Submitted",
  "Pending Verification",
  "Needs More Information",
  "Under Review",
  "Under Process",
  "Hearing Scheduled",
  "Action Taken Report Awaited",
  "Joint Investigation",
  "Escalated to Committee",
  "Transferred",
  "Duplicate Linked",
  "Disposed",
  "Rejected"
];

export const VERIFICATION_STATUSES = [
  "Submitted",
  "Pending Verification",
  "Needs More Information",
  "Verified",
  "Rejected"
];

export const PRIORITY_OPTIONS = ["All", "Urgent", "High", "Medium", "Low"];

export const REGIONS = [
  "All",
  "Northern",
  "Southern",
  "Western",
  "Eastern",
  "Central",
  "South-West",
  "North-West",
  "South-Central"
];

export const CATEGORIES = [
  "All",
  "Fee Overcharging / Capitation",
  "Withholding Original Certificates",
  "Faculty Non-Payment & Understaffing",
  "Infrastructure & Laboratory Deficit",
  "Unapproved Courses & Excess Intake",
  "Ragging & Student Harassment",
  "Misappropriation of Grant Funds",
  "Admissions & Affiliation Irregularities",
  "Governance Malpractice & Retaliation"
];

export const AFFILIATION_OPTIONS = [
  "Student",
  "Parent / Guardian",
  "Faculty",
  "Staff Member",
  "Alumni",
  "Concerned Citizen / Other"
];

export const OFFICERS_LIST = [
  "Dr. Sunita Sharma (Chief Redressal Officer)",
  "Er. Rajesh Verma (Joint Director, Regulation)",
  "Shri Arun Kumar Saxena (Deputy Director, Approval)",
  "Dr. Priyadarshini Rao (Assistant Director, PAPB)",
  "Col. Vikramaditya Rathore (Chief Coordinator, Anti-Ragging)",
  "Smt. Deepa Nair (Skill Mission Officer, SDC)",
  "Dr. Manoj K. Srivastava (Senior Vigilance Officer)",
  "Er. Amitava Sen (Zonal Scrutiny Officer)"
];

export const DEMO_ROLES = [
  {
    id: "admin",
    name: "Dr. K. N. Satyanarayana",
    role: "Administrator",
    roleName: "Main Administrator (AICTE Central HQ)",
    bureau: "All Bureaus (Central Command)",
    complainantId: null,
    identifier: "ADMIN-001",
    canEditAll: true,
    canReview: true,
    canAssign: true,
    canDecideOverlap: true,
    description: "Central administrative oversight across all AICTE bureaus, workload monitoring, inter-bureau coordination, and definitive overlap decisions."
  },
  {
    id: "reviewer_pgrc",
    name: "Dr. Sunita Sharma",
    role: "Reviewer",
    roleName: "Grievance Reviewer (PGRC)",
    bureau: "PGRC (Public Grievance Redressal)",
    complainantId: null,
    identifier: "REV-PGRC-04",
    canEditAll: false,
    canReview: true,
    canAssign: false,
    canDecideOverlap: false,
    description: "Authorized reviewer for Public Grievance Redressal Cell. Scrutinizes evidence, requests clarifications, confirms priority, and manages hearings."
  },
  {
    id: "reviewer_rb",
    name: "Er. Rajesh Verma",
    role: "Reviewer",
    roleName: "Compliance Reviewer (Regulation Bureau)",
    bureau: "Regulation Bureau (RB)",
    complainantId: null,
    identifier: "REV-RB-11",
    canEditAll: false,
    canReview: true,
    canAssign: false,
    canDecideOverlap: false,
    description: "Reviewer for institutional regulatory compliance, fee ceiling adherence, and trust norms inspection."
  },
  {
    id: "complainant_student",
    name: "Priya Nair",
    role: "Complainant",
    roleName: "Institutional Complainant (Student)",
    bureau: "Complainant Portal",
    complainantId: "1DS22CS089",
    identifier: "1DS22CS089",
    affiliation: "Student",
    institution: "Dayananda Sagar College of Engineering",
    canEditAll: false,
    canReview: false,
    canAssign: false,
    canDecideOverlap: false,
    description: "Student at DSCE. Submits grievances, uploads receipts/evidence, tracks private status, sees assigned bureau contact, and downloads acknowledgement slip."
  },
  {
    id: "complainant_parent",
    name: "Suresh Menon",
    role: "Complainant",
    roleName: "External Complainant (Parent)",
    bureau: "Complainant Portal",
    complainantId: "PAR-984501",
    identifier: "+91-9845012345",
    affiliation: "Parent / Guardian",
    institution: "Dayananda Sagar College of Engineering",
    canEditAll: false,
    canReview: false,
    canAssign: false,
    canDecideOverlap: false,
    description: "External complainant without college USN. Verified via phone/email OTP. Tracks ward's grievance and responds to officer queries."
  },
  {
    id: "viewer",
    name: "Shri Rameshwar Gupta",
    role: "Viewer",
    roleName: "Independent Audit Observer",
    bureau: "Ministry Audit Division",
    complainantId: null,
    identifier: "AUD-99",
    canEditAll: false,
    canReview: false,
    canAssign: false,
    canDecideOverlap: false,
    readOnly: true,
    description: "Read-only scrutiny access to statistical metrics, disposal rates, and regional audit indices."
  }
];

export const OVERLAP_DECISION_ACTIONS = [
  {
    id: "JOINT_INVESTIGATION",
    label: "Joint Investigation",
    badge: "Joint Investigation",
    color: "indigo",
    description: "Form an inter-bureau joint panel (e.g. PGRC + Regulation Bureau) to investigate related violations together."
  },
  {
    id: "TRANSFER_BUREAU",
    label: "Transfer to Single Bureau",
    badge: "Consolidated Transfer",
    color: "blue",
    description: "Consolidate jurisdiction under a single primary bureau to eliminate duplicate proceedings."
  },
  {
    id: "SEPARATE_INVESTIGATION",
    label: "Separate Inquiries",
    badge: "Separate Proceeding",
    color: "amber",
    description: "Keep both cases active independently as the subject matter or policy mandates differ."
  },
  {
    id: "CONFIRM_DUPLICATE",
    label: "Confirm Duplicate",
    badge: "Duplicate Linked",
    color: "purple",
    description: "Mark case as an identical duplicate and link it to the primary parent case for unified resolution."
  },
  {
    id: "CONFIRM_LINK",
    label: "Confirm Linked Overlap",
    badge: "Confirmed Linked",
    color: "emerald",
    description: "Confirm genuine cross-bureau overlap and maintain active bilateral cross-reference."
  },
  {
    id: "DISMISS_FALSE_POSITIVE",
    label: "Dismiss False Positive",
    badge: "Dismissed False Positive",
    color: "slate",
    description: "Dismiss algorithmic match as a false positive. Both cases continue independently without linkage."
  }
];

// AICTE Approval Process Handbook (APH) Statutory Clause Reference Mapping
export const APH_CLAUSE_MAP = {
  "Fee Overcharging / Capitation": "Clause 6.35",
  "Withholding Original Certificates": "Clause 6.38",
  "Faculty Non-Payment & Understaffing": "Clause 7.12",
  "Infrastructure & Laboratory Deficit": "Clause 4.5",
  "Unapproved Courses & Excess Intake": "Clause 2.14",
  "Ragging & Student Harassment": "Clause 6.1",
  "Misappropriation of Grant Funds": "Clause 8.4",
  "Admissions & Affiliation Irregularities": "Clause 3.7",
  "Governance Malpractice & Retaliation": "Clause 6.20"
};

export function getAphClause(category) {
  if (!category) return "No relevant clause identified.";
  return APH_CLAUSE_MAP[category] || "No relevant clause identified.";
}
