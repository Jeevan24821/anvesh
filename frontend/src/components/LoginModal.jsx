import React, { useState } from 'react';
import { DEMO_ROLES } from '../utils/constants';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('institutional'); // 'institutional', 'external', 'officials'

  // Institutional form state
  const [instId, setInstId] = useState('1DS22CS089');
  const [instEmail, setInstEmail] = useState('priya.nair@dsce.edu.in');
  const [instOtp, setInstOtp] = useState('');
  const [instOtpSent, setInstOtpSent] = useState(false);

  // External form state
  const [extName, setExtName] = useState('Suresh Menon');
  const [extRelation, setExtRelation] = useState('Parent / Guardian');
  const [extContact, setExtContact] = useState('+91-9845012345');
  const [extOtp, setExtOtp] = useState('');
  const [extOtpSent, setExtOtpSent] = useState(false);

  // Error / Message
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSendInstOtp = (e) => {
    e.preventDefault();
    if (!instId.trim()) {
      setError('Please provide a valid Institutional USN or ID');
      return;
    }
    setError('');
    setInstOtpSent(true);
    setMessage('Simulated 6-digit OTP sent to institutional email: 123456');
  };

  const handleVerifyInstOtp = (e) => {
    e.preventDefault();
    if (instOtp !== '123456' && instOtp !== '1234') {
      setError('Invalid OTP. Please enter the simulated demo OTP: 123456');
      return;
    }
    setError('');
    const studentRole = DEMO_ROLES.find(r => r.id === 'complainant_student') || DEMO_ROLES[3];
    onLoginSuccess(studentRole);
    onClose();
  };

  const handleSendExtOtp = (e) => {
    e.preventDefault();
    if (!extName.trim() || !extContact.trim()) {
      setError('Please provide full name and contact number');
      return;
    }
    setError('');
    setExtOtpSent(true);
    setMessage('Simulated 6-digit OTP sent to phone/email: 123456');
  };

  const handleVerifyExtOtp = (e) => {
    e.preventDefault();
    if (extOtp !== '123456' && extOtp !== '1234') {
      setError('Invalid OTP. Please enter the simulated demo OTP: 123456');
      return;
    }
    setError('');
    const parentRole = DEMO_ROLES.find(r => r.id === 'complainant_parent') || DEMO_ROLES[4];
    onLoginSuccess(parentRole);
    onClose();
  };

  const handleSelectOfficial = (roleObj) => {
    setError('');
    onLoginSuccess(roleObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Identity Verification & Access Portal</h3>
                <p className="text-xs text-blue-200">AICTE Grievance Monitoring Platform • ANVESH</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Prototype Demo Banner */}
          <div className="mt-4 p-2.5 bg-amber-500/20 border border-amber-300/30 rounded-lg flex items-center space-x-2 text-xs text-amber-100">
            <svg className="w-4 h-4 flex-shrink-0 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>Smart India Hackathon Prototype Mode:</strong> Uses simulated OTP (<strong>123456</strong>) and synthetic test accounts. No external SMS/telecom gateways required.
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 space-x-2">
          <button
            onClick={() => { setActiveTab('institutional'); setError(''); setMessage(''); }}
            className={`pb-3 px-4 font-medium text-sm transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'institutional'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            <span>Institutional Complainant</span>
          </button>

          <button
            onClick={() => { setActiveTab('external'); setError(''); setMessage(''); }}
            className={`pb-3 px-4 font-medium text-sm transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'external'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>External (Parent / Citizen)</span>
          </button>

          <button
            onClick={() => { setActiveTab('officials'); setError(''); setMessage(''); }}
            className={`pb-3 px-4 font-medium text-sm transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'officials'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Official AICTE Roles</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {message && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center space-x-2">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center space-x-2">
              <svg className="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: Institutional Login */}
          {activeTab === 'institutional' && (
            <div>
              <p className="text-xs text-slate-500 mb-4">
                Students, faculty, and institutional personnel can authenticate using their college USN/Application Number and receive a simulated institutional verification OTP.
              </p>
              <form onSubmit={instOtpSent ? handleVerifyInstOtp : handleSendInstOtp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Institutional USN / Roll No
                    </label>
                    <input
                      type="text"
                      value={instId}
                      onChange={(e) => setInstId(e.target.value)}
                      placeholder="e.g. 1DS22CS089"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Institutional Email Address
                    </label>
                    <input
                      type="email"
                      value={instEmail}
                      onChange={(e) => setInstEmail(e.target.value)}
                      placeholder="e.g. priya.nair@dsce.edu.in"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {instOtpSent ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-blue-900 uppercase">
                        Enter 6-Digit Verification OTP
                      </label>
                      <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono font-medium">
                        Demo OTP: 123456
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={instOtp}
                      onChange={(e) => setInstOtp(e.target.value)}
                      placeholder="Enter 123456"
                      className="w-full px-4 py-2 text-center tracking-widest text-lg font-mono font-bold border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg text-sm transition shadow-sm"
                    >
                      Verify OTP & Access Complainant Portal
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg text-sm transition shadow-sm flex items-center justify-center space-x-2"
                  >
                    <span>Send Verification OTP</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: External Complainant Login */}
          {activeTab === 'external' && (
            <div>
              <p className="text-xs text-slate-500 mb-4">
                Parents, legal guardians, and citizens without an institutional login can authenticate via contact verification to file and monitor grievances.
              </p>
              <form onSubmit={extOtpSent ? handleVerifyExtOtp : handleSendExtOtp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={extName}
                      onChange={(e) => setExtName(e.target.value)}
                      placeholder="e.g. Suresh Menon"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Affiliation / Relationship
                    </label>
                    <select
                      value={extRelation}
                      onChange={(e) => setExtRelation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Parent / Guardian">Parent / Legal Guardian</option>
                      <option value="Concerned Citizen">Concerned Citizen / Public</option>
                      <option value="Alumni">Alumni</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Phone Number / Email
                  </label>
                  <input
                    type="text"
                    value={extContact}
                    onChange={(e) => setExtContact(e.target.value)}
                    placeholder="+91-9845012345"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {extOtpSent ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-emerald-900 uppercase">
                        Enter 6-Digit Verification OTP
                      </label>
                      <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono font-medium">
                        Demo OTP: 123456
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={extOtp}
                      onChange={(e) => setExtOtp(e.target.value)}
                      placeholder="Enter 123456"
                      className="w-full px-4 py-2 text-center tracking-widest text-lg font-mono font-bold border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-600 bg-white"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg text-sm transition shadow-sm"
                    >
                      Verify OTP & Sign In as External Complainant
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg text-sm transition shadow-sm flex items-center justify-center space-x-2"
                  >
                    <span>Generate Verification Code</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
              </form>
            </div>
          )}

          {/* TAB 3: Officials Demo Quick Switch */}
          {activeTab === 'officials' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Select an authorized AICTE administrative persona to evaluate role-specific dashboards, verification scrutiny panels, and overlap decisions:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DEMO_ROLES.filter(r => r.role !== 'Complainant').map((roleItem) => (
                  <div
                    key={roleItem.id}
                    onClick={() => handleSelectOfficial(roleItem)}
                    className="p-3.5 border border-slate-200 rounded-xl hover:border-blue-600 hover:shadow-md cursor-pointer transition bg-white group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                          roleItem.role === 'Administrator'
                            ? 'bg-purple-100 text-purple-800'
                            : roleItem.role === 'Reviewer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {roleItem.role}
                        </span>
                        <h4 className="font-semibold text-slate-900 mt-1 text-sm group-hover:text-blue-700 transition">
                          {roleItem.name}
                        </h4>
                        <p className="text-xs text-slate-500">{roleItem.roleName}</p>
                      </div>
                      <span className="text-slate-300 group-hover:text-blue-600 transition">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{roleItem.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>AICTE ANVESH National Platform</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
