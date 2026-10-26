import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  BookOpen, 
  GitMerge, 
  Cpu, 
  User, 
  CheckCircle2, 
  Scale, 
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
          <h1 className="text-xl font-extrabold text-[#F7F7F8] tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#D8B4FE]" />
            Platform Configuration & Regulatory Framework
          </h1>
          <p className="text-xs text-[#8B8988] mt-1">
            Review statutory AICTE Approval Process Handbook (APH) governance clauses, SLA rules, inter-bureau routing parameters, and active session configurations.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#45B558]/15 border border-[#45B558]/30 text-[#45B558] text-xs font-bold shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-[#45B558]" />
            <span>Preferences Updated</span>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-2 border-b border-[#232234] pb-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-[#13131E] text-[#D8B4FE] border border-[#9312FF]/50 shadow-[0_0_10px_rgba(147,18,255,0.2)]'
                  : 'text-[#8B8988] hover:text-[#F7F7F8] hover:bg-[#13131E]'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-[#D8B4FE]' : 'text-[#8B8988]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Statutory Regulations & APH Clauses */}
      {activeTab === 'regulatory' && (
        <div className="space-y-6">
          <div className="bg-[#0D0D14] rounded-xl border border-[#232234] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#232234]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#D8B4FE]" />
                <h2 className="text-sm font-bold text-[#F7F7F8]">
                  AICTE Approval Process Handbook (APH 2024-27) Statutory Clauses
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#9312FF]/15 text-[#D8B4FE] border border-[#9312FF]/30 uppercase">
                Legal Redressal Framework
              </span>
            </div>

            <p className="text-xs text-[#8B8988] mb-4">
              All grievances registered in ANVESH are mapped against statutory clauses defined in the AICTE Establishment of Mechanism for Grievance Redressal Regulations (2019) and Approval Process Handbook.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(APH_CLAUSE_MAP).map(([category, clause]) => (
                <div key={category} className="p-3.5 rounded-xl border border-[#232234] bg-[#13131E] hover:border-[#3A3854] transition shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#9312FF]/15 text-[#D8B4FE] border border-[#9312FF]/30 font-mono">
                      {clause}
                    </span>
                    <span className="text-[10px] text-[#8B8988] uppercase font-semibold">AICTE Mandated</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#F7F7F8] mb-1">{category}</h3>
                  <p className="text-[11px] text-[#8B8988] leading-relaxed">
                    Mandatory redressal under statutory standards. Penal provisions apply to non-compliant institutions upon confirmed finding.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0D0D14] rounded-xl border border-[#232234] p-5 shadow-xs">
            <h2 className="text-sm font-bold text-[#F7F7F8] mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#D8B4FE]" />
              <span>Statutory Resolution Timelines (SLA Mandates)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-3">
              <div className="p-3 rounded-lg border border-[#F03B2A]/30 bg-[#F03B2A]/10">
                <div className="text-[10px] font-bold text-[#F03B2A] uppercase">Anti-Ragging / Safety (ARC)</div>
                <div className="text-base font-extrabold text-[#F7F7F8] mt-1">15 Calendar Days</div>
                <div className="text-[11px] text-[#8B8988] mt-0.5">Zero-tolerance urgent fast-track investigation.</div>
              </div>

              <div className="p-3 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10">
                <div className="text-[10px] font-bold text-[#FBBF24] uppercase">Fee & Certificate Withholding (RB)</div>
                <div className="text-base font-extrabold text-[#F7F7F8] mt-1">30 Calendar Days</div>
                <div className="text-[11px] text-[#8B8988] mt-0.5">High-priority career detriment protection.</div>
              </div>

              <div className="p-3 rounded-lg border border-[#9312FF]/30 bg-[#9312FF]/10">
                <div className="text-[10px] font-bold text-[#D8B4FE] uppercase">Standard Academic & Administrative (PGRC)</div>
                <div className="text-base font-extrabold text-[#F7F7F8] mt-1">45 Calendar Days</div>
                <div className="text-[11px] text-[#8B8988] mt-0.5">Standard inquiry, hearing, and ATR cycle.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inter-Bureau Routing Matrix */}
      {activeTab === 'routing' && (
        <div className="bg-[#0D0D14] rounded-xl border border-[#232234] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#232234]">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-[#D8B4FE]" />
              <h2 className="text-sm font-bold text-[#F7F7F8]">AICTE Inter-Bureau Jurisdictional Routing Matrix</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#13131E] text-[#D8B4FE] border border-[#232234]">
              5 Dedicated Bureaus
            </span>
          </div>

          <p className="text-xs text-[#8B8988]">
            ANVESH automates initial grievance routing based on category, statutory severity, and AICTE administrative divisions:
          </p>

          <div className="divide-y divide-[#232234] text-xs">
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
                    <span className="font-bold text-[#F7F7F8]">{item.bureau}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#13131E] text-[#D8B4FE] border border-[#232234]">{item.code}</span>
                  </div>
                  <p className="text-[#8B8988] text-[11px]">{item.scope}</p>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[#8B8988]">
                  <div>
                    <span className="text-[#8B8988] block text-[10px] uppercase">Default SLA</span>
                    <span className="font-bold text-[#F7F7F8]">{item.sla}</span>
                  </div>
                  <div>
                    <span className="text-[#8B8988] block text-[10px] uppercase">Oversight</span>
                    <span className="font-semibold text-[#8B8988]">{item.lead}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Overlap Intelligence Parameters */}
      {activeTab === 'nlp' && (
        <div className="bg-[#0D0D14] rounded-xl border border-[#232234] p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#232234]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#D8B4FE]" />
              <h2 className="text-sm font-bold text-[#F7F7F8]">Semantic Similarity & Cross-Bureau Overlap Parameters</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#9312FF]/15 text-[#D8B4FE] border border-[#9312FF]/30">
              NLP Engine: Active
            </span>
          </div>

          <p className="text-xs text-[#8B8988]">
            Configure the mathematical thresholds used by the ANVESH NLP intelligence cluster to discover duplicate, syndicated, or systemic grievances across departments:
          </p>

          <div className="space-y-4 max-w-xl text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5 font-semibold text-[#8B8988]">
                <span>Minimum Confidence Score Threshold:</span>
                <span className="font-mono font-bold text-[#D8B4FE] text-sm">{similarityThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseInt(e.target.value))}
                className="w-full accent-[#9312FF] cursor-pointer"
              />
              <p className="text-[11px] text-[#8B8988] mt-1">
                Cases with semantic similarity &ge; {similarityThreshold}% will trigger automated flag in the Overlap Intelligence queue.
              </p>
            </div>

            <div className="pt-3 border-t border-[#232234] space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSlaAlerts}
                  onChange={(e) => setAutoSlaAlerts(e.target.checked)}
                  className="w-4 h-4 text-[#9312FF] bg-[#13131E] border-[#232234] rounded focus:ring-[#9312FF] accent-[#9312FF]"
                />
                <span className="font-semibold text-[#F7F7F8]">Enable Automated SLA Breach Warnings in Inspect Queue</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={compactTableMode}
                  onChange={(e) => setCompactTableMode(e.target.checked)}
                  className="w-4 h-4 text-[#9312FF] bg-[#13131E] border-[#232234] rounded focus:ring-[#9312FF] accent-[#9312FF]"
                />
                <span className="font-semibold text-[#F7F7F8]">Compact Table Display Mode (High-Density View)</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:brightness-110 text-white font-bold text-xs shadow-[0_0_15px_rgba(147,18,255,0.3)] transition"
              >
                Save Intelligence Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Profile & Session Security */}
      {activeTab === 'profile' && (
        <div className="bg-[#0D0D14] rounded-xl border border-[#232234] p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#232234]">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#D8B4FE]" />
              <h2 className="text-sm font-bold text-[#F7F7F8]">Authenticated Session & Role Traceability</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#45B558]/15 text-[#45B558] border border-[#45B558]/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#45B558]" />
              Verified Session
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-[#13131E] rounded-xl border border-[#232234]">
              <span className="text-[10px] font-semibold text-[#8B8988] uppercase block">Active Name</span>
              <span className="font-bold text-[#F7F7F8] mt-0.5 block">{currentRole?.name || 'Administrator'}</span>
            </div>

            <div className="p-3 bg-[#13131E] rounded-xl border border-[#232234]">
              <span className="text-[10px] font-semibold text-[#8B8988] uppercase block">Assigned Role</span>
              <span className="font-bold text-[#F7F7F8] mt-0.5 block">{currentRole?.role || 'Admin'}</span>
            </div>

            <div className="p-3 bg-[#13131E] rounded-xl border border-[#232234]">
              <span className="text-[10px] font-semibold text-[#8B8988] uppercase block">Bureau Jurisdiction</span>
              <span className="font-bold text-[#F7F7F8] mt-0.5 block">{currentRole?.bureau || 'Central AICTE Administration'}</span>
            </div>

            <div className="p-3 bg-[#13131E] rounded-xl border border-[#232234]">
              <span className="text-[10px] font-semibold text-[#8B8988] uppercase block">Security Protocol</span>
              <span className="font-bold text-[#D8B4FE] mt-0.5 block">PBKDF2 HMAC-SHA256</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#13131E] rounded-xl border border-[#232234] text-xs space-y-1.5 text-[#8B8988]">
            <div className="flex items-center gap-1.5 font-bold text-[#F7F7F8]">
              <Lock className="w-3.5 h-3.5 text-[#D8B4FE]" />
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
