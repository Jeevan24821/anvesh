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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0D0D14] rounded-2xl shadow-[0_0_30px_rgba(147,18,255,0.25)] border border-[#232234] w-full max-w-2xl overflow-hidden text-[#F7F7F8]">
        {/* Modal Header */}
        <div className="bg-[#13131E] border-b border-[#232234] p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#9312FF]/20 border border-[#9312FF]/40 flex items-center justify-center text-[#D8B4FE]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-[#F7F7F8]">Identity Verification & Access Portal</h3>
                <p className="text-xs text-[#D8B4FE]">AICTE Grievance Monitoring Platform • ANVESH</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#8B8988] hover:text-[#F7F7F8] hover:bg-[#1A1926] rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Prototype Demo Banner */}
          <div className="mt-4 p-2.5 bg-[#F59E0B]/15 border border-[#F59E0B]/30 rounded-lg flex items-center space-x-2 text-xs text-[#FBBF24]">
            <svg className="w-4 h-4 flex-shrink-0 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>Smart India Hackathon Prototype Mode:</strong> Uses simulated OTP (<strong>123456</strong>) and synthetic test accounts.
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#232234] bg-[#0D0D14] px-6 pt-3 space-x-2">
          <button
            onClick={() => { setActiveTab('institutional'); setError(''); setMessage(''); }}
            className={`pb-3 px-4 font-medium text-sm transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'institutional'
                ? 'border-[#9312FF] text-[#D8B4FE] bg-[#13131E] rounded-t-lg'
                : 'border-transparent text-[#8B8988] hover:text-[#F7F7F8]'
            }`}
          >
            <span>Institutional Complainant</span>
          </button>

          <button
            onClick={() => { setActiveTab('external'); setError(''); setMessage(''); }}
            className={`pb-3 px-4 font-medium text-sm transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'external'
                ? 'border-[#9312FF] text-[#D8B4FE] bg-[#13131E] rounded-t-lg'
                : 'border-transparent text-[#8B8988] hover:text-[#F7F7F8]'
            }`}
          >
            <span>External (Parent / Citizen)</span>
          </button>

          <button
            onClick={() => { setActiveTab('officials'); setError(''); setMessage(''); }}
            className={`pb-3 px-4 font-medium text-sm transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'officials'
                ? 'border-[#9312FF] text-[#D8B4FE] bg-[#13131E] rounded-t-lg'
                : 'border-transparent text-[#8B8988] hover:text-[#F7F7F8]'
            }`}
          >
            <span>Official AICTE Roles</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {message && (
            <div className="mb-4 p-3 bg-[#45B558]/10 border border-[#45B558]/30 text-[#45B558] rounded-lg text-sm flex items-center space-x-2">
              <svg className="w-5 h-5 text-[#45B558] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-[#F03B2A]/10 border border-[#F03B2A]/30 text-[#F03B2A] rounded-lg text-sm flex items-center space-x-2">
              <svg className="w-5 h-5 text-[#F03B2A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: Institutional Login */}
          {activeTab === 'institutional' && (
            <div>
              <p className="text-xs text-[#8B8988] mb-4">
                Students, faculty, and institutional personnel can authenticate using their college USN/Application Number and receive a simulated institutional verification OTP.
              </p>
              <form onSubmit={instOtpSent ? handleVerifyInstOtp : handleSendInstOtp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#8B8988] uppercase tracking-wider mb-1">
                      Institutional USN / Roll No
                    </label>
                    <input
                      type="text"
                      value={instId}
                      onChange={(e) => setInstId(e.target.value)}
                      placeholder="e.g. 1DS22CS089"
                      required
                      className="w-full px-3 py-2 bg-[#13131E] border border-[#232234] rounded-lg text-sm text-[#F7F7F8] focus:border-[#9312FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#8B8988] uppercase tracking-wider mb-1">
                      Institutional Email Address
                    </label>
                    <input
                      type="email"
                      value={instEmail}
                      onChange={(e) => setInstEmail(e.target.value)}
                      placeholder="e.g. priya.nair@dsce.edu.in"
                      required
                      className="w-full px-3 py-2 bg-[#13131E] border border-[#232234] rounded-lg text-sm text-[#F7F7F8] focus:border-[#9312FF] focus:outline-none"
                    />
                  </div>
                </div>

                {instOtpSent ? (
                  <div className="p-4 bg-[#13131E] border border-[#9312FF]/30 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-[#D8B4FE] uppercase">
                        Enter 6-Digit Verification OTP
                      </label>
                      <span className="text-xs text-[#D8B4FE] bg-[#9312FF]/20 px-2 py-0.5 rounded font-mono font-medium">
                        Demo OTP: 123456
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={instOtp}
                      onChange={(e) => setInstOtp(e.target.value)}
                      placeholder="Enter 123456"
                      className="w-full px-4 py-2 text-center tracking-widest text-lg font-mono font-bold border border-[#9312FF]/50 rounded-lg focus:border-[#9312FF] bg-[#0D0D14] text-[#F7F7F8]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:brightness-110 text-white font-medium rounded-lg text-sm transition shadow-[0_0_15px_rgba(147,18,255,0.3)]"
                    >
                      Verify OTP & Access Complainant Portal
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:brightness-110 text-white font-medium rounded-lg text-sm transition shadow-[0_0_15px_rgba(147,18,255,0.3)] flex items-center justify-center space-x-2"
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
              <p className="text-xs text-[#8B8988] mb-4">
                Parents, legal guardians, and citizens without an institutional login can authenticate via contact verification to file and monitor grievances.
              </p>
              <form onSubmit={extOtpSent ? handleVerifyExtOtp : handleSendExtOtp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#8B8988] uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={extName}
                      onChange={(e) => setExtName(e.target.value)}
                      placeholder="e.g. Suresh Menon"
                      required
                      className="w-full px-3 py-2 bg-[#13131E] border border-[#232234] rounded-lg text-sm text-[#F7F7F8] focus:border-[#9312FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#8B8988] uppercase tracking-wider mb-1">
                      Affiliation / Relationship
                    </label>
                    <select
                      value={extRelation}
                      onChange={(e) => setExtRelation(e.target.value)}
                      className="w-full px-3 py-2 bg-[#13131E] border border-[#232234] rounded-lg text-sm text-[#F7F7F8] focus:border-[#9312FF] focus:outline-none"
                    >
                      <option value="Parent / Guardian">Parent / Legal Guardian</option>
                      <option value="Concerned Citizen">Concerned Citizen / Public</option>
                      <option value="Alumni">Alumni</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8B8988] uppercase tracking-wider mb-1">
                    Mobile Phone Number / Email
                  </label>
                  <input
                    type="text"
                    value={extContact}
                    onChange={(e) => setExtContact(e.target.value)}
                    placeholder="+91-9845012345"
                    required
                    className="w-full px-3 py-2 bg-[#13131E] border border-[#232234] rounded-lg text-sm text-[#F7F7F8] focus:border-[#9312FF] focus:outline-none"
                  />
                </div>

                {extOtpSent ? (
                  <div className="p-4 bg-[#13131E] border border-[#9312FF]/30 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-[#D8B4FE] uppercase">
                        Enter 6-Digit Verification OTP
                      </label>
                      <span className="text-xs text-[#D8B4FE] bg-[#9312FF]/20 px-2 py-0.5 rounded font-mono font-medium">
                        Demo OTP: 123456
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={extOtp}
                      onChange={(e) => setExtOtp(e.target.value)}
                      placeholder="Enter 123456"
                      className="w-full px-4 py-2 text-center tracking-widest text-lg font-mono font-bold border border-[#9312FF]/50 rounded-lg focus:border-[#9312FF] bg-[#0D0D14] text-[#F7F7F8]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:brightness-110 text-white font-medium rounded-lg text-sm transition shadow-[0_0_15px_rgba(147,18,255,0.3)]"
                    >
                      Verify OTP & Sign In as External Complainant
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:brightness-110 text-white font-medium rounded-lg text-sm transition shadow-[0_0_15px_rgba(147,18,255,0.3)] flex items-center justify-center space-x-2"
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
              <p className="text-xs text-[#8B8988] mb-2">
                Select an authorized AICTE administrative persona to evaluate role-specific dashboards, verification scrutiny panels, and overlap decisions:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DEMO_ROLES.filter(r => r.role !== 'Complainant').map((roleItem) => (
                  <div
                    key={roleItem.id}
                    onClick={() => handleSelectOfficial(roleItem)}
                    className="p-3.5 border border-[#232234] rounded-xl hover:border-[#9312FF] hover:shadow-[0_0_15px_rgba(147,18,255,0.2)] cursor-pointer transition bg-[#13131E] group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${
                          roleItem.role === 'Administrator'
                            ? 'bg-[#9312FF]/20 text-[#D8B4FE] border-[#9312FF]/30'
                            : roleItem.role === 'Reviewer'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-[#0D0D14] text-[#8B8988] border-[#232234]'
                        }`}>
                          {roleItem.role}
                        </span>
                        <h4 className="font-semibold text-[#F7F7F8] mt-1 text-sm group-hover:text-[#D8B4FE] transition">
                          {roleItem.name}
                        </h4>
                        <p className="text-xs text-[#8B8988]">{roleItem.roleName}</p>
                      </div>
                      <span className="text-[#8B8988] group-hover:text-[#D8B4FE] transition">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-xs text-[#8B8988] mt-2 line-clamp-2">{roleItem.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#13131E] px-6 py-3 border-t border-[#232234] flex items-center justify-between text-xs text-[#8B8988]">
          <span>AICTE ANVESH National Platform</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[#8B8988] hover:text-[#F7F7F8] hover:bg-[#1A1926] rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
