import React from 'react';
import { CaseBarcodeQR } from './CaseBarcodeQR';

export default function AcknowledgementModal({ isOpen, onClose, complaint }) {
  if (!isOpen || !complaint) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = complaint.received_date
    ? new Date(complaint.received_date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const formattedDueDate = complaint.due_date
    ? new Date(complaint.due_date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Within 30 Calendar Days';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      {/* Container with print-specific visibility */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 print:m-0 print:border-none print:shadow-none print:w-full animate-fade-rise">
        {/* Printable Section with Watermark */}
        <div id="printable-receipt" className="relative overflow-hidden p-8 print:p-6 text-slate-900 bg-white">
          
          {/* Subtle AICTE Watermark Behind Content (Center Positioned & High Readability) */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden print:flex" 
            aria-hidden="true"
          >
            <img 
              src="/aicte_logo.png" 
              alt="" 
              className="w-96 h-96 max-w-[70%] max-h-[70%] object-contain opacity-[0.06] grayscale contrast-125 select-none print:opacity-[0.08]" 
            />
          </div>

          {/* Foreground Printable Receipt Content */}
          <div className="relative z-10">
            {/* Header with Centred AICTE Official Seal */}
            <div className="border-b-2 border-slate-800 pb-4 text-center relative">
              <div className="flex justify-center mb-2">
                <img 
                  src="/aicte_logo.png" 
                  alt="AICTE Official Seal" 
                  className="h-16 w-auto object-contain mx-auto" 
                />
              </div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900">
                All India Council for Technical Education
              </h2>
              <p className="text-xs text-slate-600">
                (Statutory Body under the Ministry of Education, Govt. of India)
              </p>
              <p className="text-xs text-slate-500">
                Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 • www.aicte-india.org
              </p>
              <div className="mt-3 inline-block bg-slate-100 border border-slate-300 px-4 py-1 rounded text-xs font-bold uppercase tracking-widest text-slate-800">
                Grievance Intake Acknowledgement Receipt
              </div>
            </div>

            {/* Barcode & Reference Block */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/90 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Grievance Registration Number (Case ID)
                </div>
                <div className="text-xl font-mono font-extrabold text-[#0645A8] tracking-tight mt-0.5">
                  {complaint.case_id || 'AICTE-2026-REG-PENDING'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Filing Timestamp: {formattedDate}
                </div>
              </div>

              {/* Functional High-Definition Barcode & QR Code */}
              <div className="mt-3 md:mt-0 flex flex-col items-center">
                <CaseBarcodeQR caseId={complaint.case_id || 'AICTE-2026-REG-PENDING'} />
                <span className="text-[10px] font-mono text-[#0645A8] mt-1 font-bold tracking-wider">
                  VERIFIED AUTHENTIC • AICTE ANVESH
                </span>
              </div>
            </div>

            {/* Details Table */}
            <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden text-sm bg-white/95">
              <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/90">
                <div className="p-3 text-xs font-semibold text-slate-500 uppercase col-span-1">Target Institution</div>
                <div className="p-3 font-semibold text-slate-900 col-span-2">
                  {complaint.institution_name || 'Technical Educational Institution'}
                  {complaint.institution_aicte_id && (
                    <span className="block text-xs font-normal text-slate-500">
                      AICTE Permanent ID: {complaint.institution_aicte_id}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-slate-200">
                <div className="p-3 text-xs font-semibold text-slate-500 uppercase col-span-1">Complainant Name</div>
                <div className="p-3 text-slate-900 col-span-2">
                  {complaint.is_anonymous ? (
                    <span className="text-amber-800 font-medium">Confidential / Protected Anonymous Submission</span>
                  ) : (
                    <>
                      <span className="font-semibold">{complaint.complainant_name || 'Complainant'}</span>
                      <span className="text-xs text-slate-500 block">
                        Affiliation: {complaint.complainant_affiliation || complaint.complainant_type || 'Student'}
                        {complaint.complainant_id_number && ` • ID: ${complaint.complainant_id_number}`}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/90">
                <div className="p-3 text-xs font-semibold text-slate-500 uppercase col-span-1">Grievance Category</div>
                <div className="p-3 font-semibold text-slate-900 col-span-2">
                  {complaint.category}
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-slate-200">
                <div className="p-3 text-xs font-semibold text-slate-500 uppercase col-span-1">Subject Summary</div>
                <div className="p-3 text-slate-800 col-span-2">
                  {complaint.subject}
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/90">
                <div className="p-3 text-xs font-semibold text-slate-500 uppercase col-span-1">Assigned Bureau</div>
                <div className="p-3 text-slate-900 col-span-2 font-medium">
                  {complaint.source_bureau}
                  {complaint.routing_reason && (
                    <span className="block text-xs font-normal text-slate-500 mt-0.5">
                      Routing Basis: {complaint.routing_reason}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3">
                <div className="p-3 text-xs font-semibold text-slate-500 uppercase col-span-1">Statutory SLA Target</div>
                <div className="p-3 text-slate-900 col-span-2">
                  <span className="font-semibold text-[#0645A8]">{formattedDueDate}</span>
                  <span className="text-xs text-slate-500 block">
                    (Assigned Priority Level: {complaint.priority || 'Standard'})
                  </span>
                </div>
              </div>
            </div>

            {/* AI-Assisted Duplicate & Overlap Intelligence Scorecard */}
            <div className="mt-6 p-4 bg-[#EAF3FF]/90 border border-[#BBD5F8] rounded-xl text-xs text-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0645A8] uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0645A8] animate-pulse"></span>
                  AI-Assisted Cross-Bureau Overlap Correlation Assessment
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#0645A8] text-white">
                  {complaint.overlap_similarity_score != null
                    ? `${complaint.overlap_similarity_score <= 1.0 ? Math.round(complaint.overlap_similarity_score * 100) : Math.round(complaint.overlap_similarity_score)}% Potential Correlation`
                    : 'Independent Grievance (0% Overlap)'}
                </span>
              </div>
              <p className="text-[11px] text-[#172033] leading-relaxed">
                {complaint.overlap_similarity_score
                  ? `ANVESH automated intelligence evaluated this submission against active institution proceedings. Classification: ${complaint.overlap_type || 'Institution Correlation'}.`
                  : 'ANVESH verified no concurrent duplicate or identical multi-bureau filings for this institution.'}
              </p>
              {complaint.match_reasons && complaint.match_reasons.length > 0 && (
                <ul className="list-disc list-inside text-[10px] text-[#0645A8] space-y-0.5 pt-1">
                  {complaint.match_reasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              )}
              <p className="text-[10px] text-slate-500 italic pt-1 border-t border-[#BBD5F8]/60">
                * Note: Similarity analysis assists AICTE Bureau Officers in synchronizing related proceedings and does not impede independent complaint resolution.
              </p>
            </div>

            {/* Official Bureau Helpdesk / Direct Contact Information */}
            <div className="mt-6 p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-slate-700 space-y-1.5">
              <div className="font-semibold text-[#0645A8] uppercase tracking-wide flex items-center space-x-1.5">
                <svg className="w-4 h-4 text-[#0645A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Authorized Bureau Helpdesk & Official Communication Desk</span>
              </div>
              <p>
                For updates regarding this grievance, quote your Case ID <strong>{complaint.case_id}</strong> when contacting:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-medium text-slate-800">
                <div>• Email: <strong>grievance-support@aicte-india.org</strong></div>
                <div>• Helpline: <strong>011-29581000 / 1800-180-5522</strong></div>
              </div>
            </div>

            {/* Legal Notice Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-500 text-center leading-relaxed">
              This is a computer-generated acknowledgement receipt registered on ANVESH (Analytics-Driven Network for Verifying, Evaluating, and Synchronizing Higher-Education Grievances — AICTE Inter-Bureau Redressal Platform).
              Pursuant to the AICTE (Establishment of Mechanism for Grievance Redressal) Regulations 2019, internal scrutiny notes and reviewer deliberations are confidential and exempt from public disclosure.
            </div>
          </div>
        </div>

        {/* Modal Controls - Hidden during Print */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex items-center justify-between print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition"
          >
            Close Receipt
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#0645A8] hover:bg-[#1769D2] text-white font-semibold text-sm rounded-xl transition shadow-xs flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
