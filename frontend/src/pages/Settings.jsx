import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  BookOpen, 
  GitMerge, 
  Cpu, 
  Bell, 
  User, 
  CheckCircle2, 
  Building2, 
  Scale, 
  Sliders, 
  ExternalLink,
  Layers,
  Lock
} from 'lucide-react';
import { APH_CLAUSE_MAP } from '../utils/constants';

export function Settings() {
  const { currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState('regulatory');
  const [similarityThreshold, setSimilarityThreshold] = useState(75);
  const [autoSlaAlerts, setAutoSlaAlerts] = useState(true);
  const [compactTableMode, setCompactTableMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const tabs = [
    { id: 'regulatory', label: 'Statutory Regulations & APH Clauses', icon: Scale },
    { id: 'routing', label: 'Inter-Bureau Routing Matrix', icon: GitMerge },
    { id: 'nlp', label: 'Overlap Intelligence Parameters', icon: Cpu },
    { id: 'profile', label: 'Profile & Session Security', icon: User },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#0D9488]" />
            Platform Configuration & Regulatory Framework
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Review statutory AICTE Approval Process Handbook (APH) governance clauses, SLA rules, inter-bureau routing parameters, and active session configurations.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Preferences Updated</span>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-white text-[#0D9488] border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-[#0D9488]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Statutory Regulations & APH Clauses */}
      {activeTab === 'regulatory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0D9488]" />
                <h2 className="text-sm font-bold text-[#0F172A]">
                  AICTE Approval Process Handbook (APH 2024-27) Statutory Clauses
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                Legal Redressal Framework
              </span>
            </div>

            <p className="text-xs text-[#64748B] mb-4">
              All grievances registered in ANVESH are mapped against statutory clauses defined in the AICTE Establishment of Mechanism for Grievance Redressal Regulations (2019) and Approval Process Handbook.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(APH_CLAUSE_MAP).map(([category, clause]) => (
                <div key={category} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 transition shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                      {clause}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">AICTE Mandated</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#0F172A] mb-1">{category}</h3>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Mandatory redressal under statutory standards. Penal provisions apply to non-compliant institutions upon confirmed finding.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#0D9488]" />
              Statutory Resolution Timelines (SLA Mandates)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-3">
              <div className="p-3 rounded-lg border border-red-200 bg-red-50/40">
                <div className="text-[10px] font-bold text-red-700 uppercase">Anti-Ragging / Safety (ARC)</div>
                <div className="text-base font-extrabold text-red-900 mt-1">15 Calendar Days</div>
                <div className="text-[11px] text-red-700 mt-0.5">Zero-tolerance urgent fast-track investigation.</div>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                <div className="text-[10px] font-bold text-amber-700 uppercase">Fee & Certificate Withholding (RB)</div>
                <div className="text-base font-extrabold text-amber-900 mt-1">30 Calendar Days</div>
                <div className="text-[11px] text-amber-700 mt-0.5">High-priority career detriment protection.</div>
              </div>

              <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/40">
                <div className="text-[10px] font-bold text-teal-700 uppercase">Standard Academic & Administrative (PGRC)</div>
                <div className="text-base font-extrabold text-teal-900 mt-1">45 Calendar Days</div>
                <div className="text-[11px] text-teal-700 mt-0.5">Standard inquiry, hearing, and ATR cycle.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inter-Bureau Routing Matrix */}
      {activeTab === 'routing' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-[#0D9488]" />
              <h2 className="text-sm font-bold text-[#0F172A]">AICTE Inter-Bureau Jurisdictional Routing Matrix</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              5 Dedicated Bureaus
            </span>
          </div>

          <p className="text-xs text-[#64748B]">
            ANVESH automates initial grievance routing based on category, statutory severity, and AICTE administrative divisions:
          </p>

          <div className="divide-y divide-slate-100 text-xs">
            {[
              {
                bureau: 'PGRC (Public Grievance Redressal Cell)',
                code: 'PGRC',
                scope: 'General academic disputes, examination evaluations, faculty conduct, and student council grievances.',
                sla: '45 Days',
                lead: 'Advisor (PGRC), AICTE HQ New Delhi'
              },
              {
                bureau: 'RB (Regulation Bureau)',
                code: 'RB',
                scope: 'Capitation fee demands, excess tuition fees, caution deposit non-refunds, and original document withholding.',
                sla: '30 Days',
                lead: 'Director (Regulations), AICTE'
              },
              {
                bureau: 'ARC (Anti-Ragging Cell)',
                code: 'ARC',
                scope: 'Physical, psychological, or cyber harassment, ragging incidents, and campus safety breaches.',
                sla: '15 Days',
                lead: 'National Anti-Ragging Monitoring Committee'
              },
              {
                bureau: 'AB (Approval Bureau)',
                code: 'AB',
                scope: 'Infrastructure deficiencies, unapproved course branches, faculty-to-student ratio violations, and false accreditation claims.',
                sla: '45 Days',
                lead: 'Advisor (Approval Bureau), AICTE'
              },
              {
                bureau: 'VIG (Vigilance Bureau)',
                code: 'VIG',
                scope: 'Financial graft, forged AICTE approvals, corrupt administrative practices, and severe statutory violations.',
                sla: '30 Days',
                lead: 'Chief Vigilance Officer (CVO), AICTE'
              },
            ].map((item) => (
              <div key={item.code} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1 md:max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0F172A]">{item.bureau}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">{item.code}</span>
                  </div>
                  <p className="text-[#64748B] text-[11px]">{item.scope}</p>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Default SLA</span>
                    <span className="font-bold text-[#0F172A]">{item.sla}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Oversight</span>
                    <span className="font-semibold text-slate-700">{item.lead}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Overlap Intelligence Parameters */}
      {activeTab === 'nlp' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#0D9488]" />
              <h2 className="text-sm font-bold text-[#0F172A]">Semantic Similarity & Cross-Bureau Overlap Parameters</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              NLP Engine: Active
            </span>
          </div>

          <p className="text-xs text-[#64748B]">
            Configure the mathematical thresholds used by the ANVESH NLP intelligence cluster to discover duplicate, syndicated, or systemic grievances across departments:
          </p>

          <div className="space-y-4 max-w-xl text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5 font-semibold text-slate-700">
                <span>Minimum Confidence Score Threshold:</span>
                <span className="font-mono font-bold text-[#0D9488] text-sm">{similarityThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseInt(e.target.value))}
                className="w-full accent-[#0D9488] cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Cases with semantic similarity &ge; {similarityThreshold}% will trigger automated flag in the Overlap Intelligence queue.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSlaAlerts}
                  onChange={(e) => setAutoSlaAlerts(e.target.checked)}
                  className="w-4 h-4 text-[#0D9488] rounded focus:ring-[#0D9488]"
                />
                <span className="font-semibold text-[#0F172A]">Enable Automated SLA Breach Warnings in Inspect Queue</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={compactTableMode}
                  onChange={(e) => setCompactTableMode(e.target.checked)}
                  className="w-4 h-4 text-[#0D9488] rounded focus:ring-[#0D9488]"
                />
                <span className="font-semibold text-[#0F172A]">Compact Table Display Mode (High-Density View)</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0b7c72] text-white font-bold text-xs shadow-xs transition"
              >
                Save Intelligence Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Profile & Session Security */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#0D9488]" />
              <h2 className="text-sm font-bold text-[#0F172A]">Authenticated Session & Role Traceability</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified Session
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Active Name</span>
              <span className="font-bold text-[#0F172A] mt-0.5 block">{currentRole?.name || 'Administrator'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Assigned Role</span>
              <span className="font-bold text-[#0F172A] mt-0.5 block">{currentRole?.role || 'Admin'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Bureau Jurisdiction</span>
              <span className="font-bold text-[#0F172A] mt-0.5 block">{currentRole?.bureau || 'Central AICTE Administration'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Security Protocol</span>
              <span className="font-bold text-[#0D9488] mt-0.5 block">PBKDF2 HMAC-SHA256</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
              <Lock className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>Immutable Audit Trail Compliance</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Every status change, official remark, evidence review, and SLA escalation is cryptographically signed and stamped into the central server audit log with actor timestamp and role permissions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
export default Settings;
