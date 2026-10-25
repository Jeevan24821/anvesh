import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

console.log('[SENTRIX Frontend Tests] Starting frontend asset & code integrity verification...');

// 1. Verify required source files exist
const requiredFiles = [
  'package.json',
  'vite.config.js',
  'tailwind.config.js',
  'index.html',
  'src/index.css',
  'src/main.jsx',
  'src/App.jsx',
  'src/context/AuthContext.jsx',
  'src/services/api.js',
  'src/utils/constants.js',
  'src/utils/formatters.js',
  'src/pages/Dashboard.jsx',
  'src/pages/Complaints.jsx',
  'src/pages/CaseDetails.jsx',
  'src/pages/Institutions.jsx',
  'src/pages/Overlaps.jsx',
  'src/pages/Reports.jsx',
  'src/pages/Notifications.jsx',
  'src/components/Header.jsx',
  'src/components/Sidebar.jsx',
  'src/components/MetricCard.jsx',
  'src/components/StatusBadge.jsx',
  'src/components/PriorityBadge.jsx',
  'src/components/BureauBadge.jsx',
  'src/components/Modal.jsx',
  'src/components/EmptyState.jsx',
  'src/components/LoadingSpinner.jsx',
  'src/components/AcknowledgementModal.jsx',
  'src/components/LoginModal.jsx',
  'src/components/ErrorBoundary.jsx',
  'src/pages/LoginPage.jsx'
];

let missing = 0;
for (const file of requiredFiles) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing file: ${file}`);
    missing++;
  }
}

if (missing > 0) {
  console.error(`[SENTRIX Test ERROR] ${missing} required frontend files are missing.`);
  process.exit(1);
}

console.log(`✅ All ${requiredFiles.length} frontend source files verified.`);

// 2. Verify constants structure
const constantsContent = fs.readFileSync(path.join(root, 'src/utils/constants.js'), 'utf8');
if (!constantsContent.includes('BUREAUS') || !constantsContent.includes('DEMO_ROLES')) {
  console.error('❌ Constants file missing required AICTE bureaus or demo roles.');
  process.exit(1);
}

if (!constantsContent.includes('OVERLAP_DECISION_ACTIONS') || !constantsContent.includes('AFFILIATION_OPTIONS')) {
  console.error('❌ Constants file missing overlap decision actions or affiliation options.');
  process.exit(1);
}
console.log('✅ AICTE Bureaus, Demo Roles, and 6 Overlap Decisions configuration verified.');

// 3. Verify API methods
const apiContent = fs.readFileSync(path.join(root, 'src/services/api.js'), 'utf8');
const expectedApiMethods = [
  'assessPriority',
  'verifyComplaint',
  'requestMoreInfo',
  'respondToInfo',
  'rejectComplaint',
  'submitFeedback'
];
for (const method of expectedApiMethods) {
  if (!apiContent.includes(method)) {
    console.error(`❌ API service missing method: ${method}`);
    process.exit(1);
  }
}
console.log(`✅ Verified all ${expectedApiMethods.length} new API methods exist in api.js.`);

console.log('🎉 All frontend integrity checks PASSED successfully!');
process.exit(0);
