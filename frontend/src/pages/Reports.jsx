import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BUREAUS, STATUS_OPTIONS, PRIORITY_OPTIONS } from '../utils/constants';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  Download, 
  FileSpreadsheet
} from 'lucide-react';

const REGION_COLORS = ['#9312FF', '#A020FF', '#7A1CF8', '#3B82F6', '#06B6D4', '#45B558', '#F59E0B', '#EC4899'];

export function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // CSV Export Filter State
  const [exportBureau, setExportBureau] = useState('All');
  const [exportStatus, setExportStatus] = useState('All');
  const [exportPriority, setExportPriority] = useState('All');
  const [exportOverdueOnly, setExportOverdueOnly] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReportsSummary();
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleExportCsv = async () => {
    try {
      setDownloading(true);
      await api.downloadReportCsv({
        bureau: exportBureau,
        status: exportStatus,
        priority: exportPriority,
        is_overdue: exportOverdueOnly ? 'true' : undefined
      });
    } catch (e) {
      alert(e.message || 'Failed to initiate CSV download');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Computing regional analytics and disposal trends..." />;
  if (error) return <div className="p-8 text-center text-[#F03B2A] bg-[#F03B2A]/10 border border-[#F03B2A]/30 rounded-xl">{error}</div>;

  const ageingData = [
    { name: '< 15 Days', count: summary?.ageing?.under_15_days || 0, fill: '#45B558' },
    { name: '15 - 30 Days', count: summary?.ageing?.['15_to_30_days'] || 0, fill: '#9312FF' },
    { name: '31 - 60 Days', count: summary?.ageing?.['31_to_60_days'] || 0, fill: '#F59E0B' },
    { name: '> 60 Days', count: summary?.ageing?.over_60_days || 0, fill: '#F03B2A' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-white/95 border border-[#3A3854] shadow-xs flex items-center justify-center flex-shrink-0">
            <img 
              src="/aicte_logo.png" 
              alt="AICTE Official Seal" 
              className="h-10 w-auto object-contain" 
            />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#F7F7F8] tracking-tight">AICTE Executive Analytics & Regulatory Reports</h1>
            <p className="text-xs text-[#8B8988] mt-0.5">
              Bureau disposal velocity, case ageing distribution, regional trends, and exportable datasets.
            </p>
          </div>
        </div>

        {/* Live Export CSV Button */}
        <button
          onClick={handleExportCsv}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(147,18,255,0.3)] transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Preparing CSV...' : 'Export Filtered CSV'}
        </button>
      </div>

      {/* CSV Filter Preset Toolbar */}
      <div className="bg-[#0D0D14] border border-[#232234] p-4 rounded-xl shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#F7F7F8] mr-2">
          <FileSpreadsheet className="w-4 h-4 text-[#D8B4FE]" />
          <span>Export Scope:</span>
        </div>

        <select
          value={exportBureau}
          onChange={(e) => setExportBureau(e.target.value)}
          className="bg-[#13131E] border border-[#232234] text-[#F7F7F8] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#9312FF]"
        >
          {BUREAUS.map((b) => (
            <option key={b} value={b}>Bureau: {b}</option>
          ))}
        </select>

        <select
          value={exportStatus}
          onChange={(e) => setExportStatus(e.target.value)}
          className="bg-[#13131E] border border-[#232234] text-[#F7F7F8] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#9312FF]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>Status: {s}</option>
          ))}
        </select>

        <select
          value={exportPriority}
          onChange={(e) => setExportPriority(e.target.value)}
          className="bg-[#13131E] border border-[#232234] text-[#F7F7F8] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#9312FF]"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>Priority: {p}</option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-[#8B8988] hover:text-[#F7F7F8] ml-auto cursor-pointer transition">
          <input
            type="checkbox"
            checked={exportOverdueOnly}
            onChange={(e) => setExportOverdueOnly(e.target.checked)}
            className="w-4 h-4 rounded text-[#9312FF] border-[#232234] bg-[#13131E] focus:ring-[#9312FF] accent-[#9312FF]"
          />
          <span className="font-medium text-xs">Overdue Cases Only</span>
        </label>
      </div>

      {/* Bureau Disposal Rates Table */}
      <div className="bg-[#0D0D14] border border-[#232234] rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-[#F7F7F8] tracking-wide mb-1">
          Bureau Disposal Rates & Regulatory Throughput
        </h3>
        <p className="text-xs text-[#8B8988] mb-4">
          Statutory resolution percentage of complaints closed with formal orders
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#13131E] text-[#8B8988] uppercase text-[10px] tracking-wider border-b border-[#232234]">
              <tr>
                <th className="py-2.5 px-3">AICTE Bureau / Cell</th>
                <th className="py-2.5 px-3">Total Registered</th>
                <th className="py-2.5 px-3">Disposed Cases</th>
                <th className="py-2.5 px-3">Disposal Efficiency Rate</th>
                <th className="py-2.5 px-3">Performance Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232234] text-[#F7F7F8]">
              {summary?.bureau_disposals?.map((b) => (
                <tr key={b.bureau} className="hover:bg-[#181826] transition">
                  <td className="py-3 px-3 font-semibold text-[#F7F7F8]">{b.bureau}</td>
                  <td className="py-3 px-3 font-mono text-[#8B8988]">{b.total}</td>
                  <td className="py-3 px-3 font-mono text-[#45B558] font-semibold">{b.disposed}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#F7F7F8]">
                    {b.disposal_rate_pct}%
                  </td>
                  <td className="py-3 px-3 w-48">
                    <div className="w-full bg-[#13131E] border border-[#232234] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] h-full rounded-full transition-all duration-500"
                        style={{ width: `${b.disposal_rate_pct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Ageing Analysis & Regional Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Ageing Analysis */}
        <div className="bg-[#0D0D14] border border-[#232234] rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#F7F7F8] tracking-wide mb-1">
            Active Case Ageing Profile
          </h3>
          <p className="text-xs text-[#8B8988] mb-4">
            Duration elapsed since formal complaint registration
          </p>
          <div className="h-64 w-full min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={240} minWidth={100}>
              <BarChart data={ageingData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1E2E" vertical={false} />
                <XAxis dataKey="name" stroke="#8B8988" fontSize={11} tickLine={false} />
                <YAxis stroke="#8B8988" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D0D14',
                    borderColor: '#2A293E',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F7F7F8',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}
                />
                <Bar dataKey="count" name="Active Cases" radius={[6, 6, 0, 0]}>
                  {ageingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="bg-[#0D0D14] border border-[#232234] rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#F7F7F8] tracking-wide mb-1">
            Regional Grievance Concentration
          </h3>
          <p className="text-xs text-[#8B8988] mb-4">
            Complaints distributed across AICTE Zonal Regional Offices
          </p>
          <div className="h-64 w-full min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={240} minWidth={100}>
              <PieChart>
                <Pie
                  data={(summary?.region_distribution || []).filter(r => Number(r.count) > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  nameKey="region"
                >
                  {(summary?.region_distribution || []).filter(r => Number(r.count) > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={REGION_COLORS[index % REGION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D0D14',
                    borderColor: '#2A293E',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F7F7F8',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#8B8988' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Reports;
