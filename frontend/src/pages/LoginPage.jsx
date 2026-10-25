import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { 
  Shield, 
  Building2, 
  GraduationCap, 
  Users, 
  User, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle, 
  ArrowRight, 
  RefreshCw, 
  Send,
  ShieldCheck,
  Phone,
  Mail,
  FileText,
  UserPlus,
  LogIn,
  School,
  Info,
  Sparkles,
  BookOpen
} from 'lucide-react';

export function LoginPage() {
  const { login, loginWithOtp } = useAuth();

  // Top navigation: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState('login');

  // ----------------------------------------------------
  // CARD 1: Bureau Officer / Admin State
  // ----------------------------------------------------
  const [officialUsername, setOfficialUsername] = useState('');
  const [officialPassword, setOfficialPassword] = useState('');
  const [showOfficialPassword, setShowOfficialPassword] = useState(false);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialError, setOfficialError] = useState(null);

  // ----------------------------------------------------
  // CARD 2: Student / Institution State
  // ----------------------------------------------------
  const [studentMode, setStudentMode] = useState('otp'); // 'otp' | 'password'
  const [studentId, setStudentId] = useState('');
  const [studentOtp, setStudentOtp] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentOtpLoading, setStudentOtpLoading] = useState(false);
  const [studentOtpCooldown, setStudentOtpCooldown] = useState(0);
  const [studentError, setStudentError] = useState(null);
  const [studentSuccessMsg, setStudentSuccessMsg] = useState(null);

  // ----------------------------------------------------
  // CARD 3: Parent / Guardian State
  // ----------------------------------------------------
  const [parentMode, setParentMode] = useState('otp'); // 'otp' | 'password'
  const [parentId, setParentId] = useState('');
  const [parentOtp, setParentOtp] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [parentLoading, setParentLoading] = useState(false);
  const [parentOtpLoading, setParentOtpLoading] = useState(false);
  const [parentOtpCooldown, setParentOtpCooldown] = useState(0);
  const [parentError, setParentError] = useState(null);
  const [parentSuccessMsg, setParentSuccessMsg] = useState(null);

  // ----------------------------------------------------
  // SIGN UP / CREATE ACCOUNT STATE
  // ----------------------------------------------------
  const [signupRole, setSignupRole] = useState('Student'); // 'Student' | 'Institution User' | 'Parent / Guardian'
  const [signupName, setSignupName] = useState('');
  const [signupIdentifier, setSignupIdentifier] = useState('');
  const [signupInstitution, setSignupInstitution] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(null);

  // ----------------------------------------------------
  // MODALS
  // ----------------------------------------------------
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryRole, setRecoveryRole] = useState('Student');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryContact, setRecoveryContact] = useState('');
  const [recoveryReason, setRecoveryReason] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState(null);
  const [recoverySuccess, setRecoverySuccess] = useState(null);


  // ----------------------------------------------------
  // OTP Cooldown Timers
  // ----------------------------------------------------
  useEffect(() => {
    let timer;
    if (studentOtpCooldown > 0) {
      timer = setInterval(() => {
        setStudentOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [studentOtpCooldown]);

  useEffect(() => {
    let timer;
    if (parentOtpCooldown > 0) {
      timer = setInterval(() => {
        setParentOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [parentOtpCooldown]);

  // ----------------------------------------------------
  // Handlers: Official / Admin
  // ----------------------------------------------------
  const handleOfficialSubmit = async (e) => {
    e.preventDefault();
    if (!officialUsername.trim() || !officialPassword) {
      setOfficialError('Please enter both your official username and password.');
      return;
    }
    setOfficialLoading(true);
    setOfficialError(null);
    try {
      await login(officialUsername.trim(), officialPassword, 'admin');
    } catch (err) {
      setOfficialError(err.message || 'Authentication failed. Please verify your official credentials.');
    } finally {
      setOfficialLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handlers: Student / Institution
  // ----------------------------------------------------
  const handleStudentRequestOtp = async () => {
    if (!studentId.trim()) {
      setStudentError('Please enter your Student USN, Roll Number, or Institution ID first.');
      setStudentSuccessMsg(null);
      return;
    }
    setStudentOtpLoading(true);
    setStudentError(null);
    setStudentSuccessMsg(null);
    try {
      const res = await api.requestOtp({ identifier: studentId.trim(), role_type: 'Student' });
      setStudentSuccessMsg(res.message || 'OTP dispatched to registered contact.');
      setStudentOtpCooldown(15);
    } catch (err) {
      setStudentError(err.message || 'Unable to dispatch OTP. Please verify your identifier.');
    } finally {
      setStudentOtpLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setStudentError('Please enter your Student USN, Roll Number, or Institution ID.');
      return;
    }

    setStudentLoading(true);
    setStudentError(null);
    try {
      if (studentMode === 'otp') {
        if (!studentOtp.trim()) {
          setStudentError('Please enter the verification OTP.');
          setStudentLoading(false);
          return;
        }
        await loginWithOtp(studentId.trim(), studentOtp.trim(), 'student');
      } else {
        if (!studentPassword) {
          setStudentError('Please enter your account password.');
          setStudentLoading(false);
          return;
        }
        await login(studentId.trim(), studentPassword, 'student');
      }
    } catch (err) {
      setStudentError(err.message || (studentMode === 'otp' ? 'OTP verification failed. Please verify the code or request a new OTP.' : 'Authentication failed. Please verify your identifier and password.'));
    } finally {
      setStudentLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handlers: Parent / Guardian
  // ----------------------------------------------------
  const handleParentRequestOtp = async () => {
    if (!parentId.trim()) {
      setParentError('Please enter your Parent Identifier or Registered Mobile Number first.');
      setParentSuccessMsg(null);
      return;
    }
    setParentOtpLoading(true);
    setParentError(null);
    setParentSuccessMsg(null);
    try {
      const res = await api.requestOtp({ identifier: parentId.trim(), role_type: 'Parent' });
      setParentSuccessMsg(res.message || 'OTP dispatched to registered mobile number.');
      setParentOtpCooldown(15);
    } catch (err) {
      setParentError(err.message || 'Unable to dispatch OTP. Please verify your registered contact.');
    } finally {
      setParentOtpLoading(false);
    }
  };

  const handleParentSubmit = async (e) => {
    e.preventDefault();
    if (!parentId.trim()) {
      setParentError('Please enter your Parent Identifier or Registered Mobile Number.');
      return;
    }

    setParentLoading(true);
    setParentError(null);
    try {
      if (parentMode === 'otp') {
        if (!parentOtp.trim()) {
          setParentError('Please enter the verification OTP.');
          setParentLoading(false);
          return;
        }
        await loginWithOtp(parentId.trim(), parentOtp.trim(), 'parent');
      } else {
        if (!parentPassword) {
          setParentError('Please enter your account password.');
          setParentLoading(false);
          return;
        }
        await login(parentId.trim(), parentPassword, 'parent');
      }
    } catch (err) {
      setParentError(err.message || (parentMode === 'otp' ? 'OTP verification failed. Please verify the code or request a new OTP.' : 'Authentication failed. Please verify your identifier and password.'));
    } finally {
      setParentLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handlers: Sign Up / Registration
  // ----------------------------------------------------
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);

    if (!signupName.trim()) {
      setSignupError('Please enter your Full Name.');
      return;
    }
    if (!signupIdentifier.trim()) {
      setSignupError(
        signupRole === 'Student' 
          ? 'Please enter your Student USN / Roll Number.' 
          : signupRole === 'Institution User' 
          ? 'Please enter the AICTE Permanent Institute ID.' 
          : 'Please enter your Student Ward USN / ID.'
      );
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@') || !signupEmail.includes('.')) {
      setSignupError('Please enter a valid email address.');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters in length.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match. Please re-enter.');
      return;
    }

    setSignupLoading(true);
    try {
      const payload = {
        role_type: signupRole,
        full_name: signupName.trim(),
        email: signupEmail.trim(),
        phone: signupPhone.trim() || null,
        identifier: signupIdentifier.trim(),
        password: signupPassword,
        institution_name: signupInstitution.trim() || null,
      };

      const res = await api.register(payload);
      setSignupSuccess(res.message || 'Account successfully created! You may now sign in.');

      // Prefill appropriate login card identifier
      if (signupRole === 'Student' || signupRole === 'Institution User') {
        setStudentId(signupIdentifier.trim());
        setStudentMode('password');
        setStudentPassword(signupPassword);
      } else {
        setParentId(signupIdentifier.trim());
        setParentMode('password');
        setParentPassword(signupPassword);
      }

      // Reset signup form
      setSignupName('');
      setSignupEmail('');
      setSignupPhone('');
      setSignupInstitution('');
      setSignupPassword('');
      setSignupConfirmPassword('');

      // Auto-switch to login tab after 2.5s
      setTimeout(() => {
        setActiveTab('login');
      }, 2500);

    } catch (err) {
      setSignupError(err.message || 'Registration failed. Please check your entries and try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handlers: Forgot Password Workflow
  // ----------------------------------------------------
  const openForgotPassword = () => {
    setForgotStep(1);
    setForgotIdentifier(officialUsername || '');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError(null);
    setForgotSuccess(null);
    setIsForgotOpen(true);
  };

  const handleForgotRequestSubmit = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your official username or registered email.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      const res = await api.forgotPassword({ username_or_email: forgotIdentifier.trim() });
      setForgotSuccess(res.message);
      if (res.token) {
        setResetToken(res.token);
        setForgotStep(2);
      }
    } catch (err) {
      setForgotError(err.message || 'Unable to process reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetToken.trim()) {
      setForgotError('Password reset token is missing or invalid.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters in length.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await api.resetPassword({ token: resetToken.trim(), new_password: newPassword });
      setForgotSuccess(res.message);
      if (forgotIdentifier) {
        setOfficialUsername(forgotIdentifier.trim());
      }
      setTimeout(() => {
        setIsForgotOpen(false);
      }, 2000);
    } catch (err) {
      setForgotError(err.message || 'Password reset failed. Token may have expired.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handlers: Account Recovery Workflow
  // ----------------------------------------------------
  const openAccountRecovery = (roleName) => {
    setRecoveryRole(roleName);
    setRecoveryIdentifier(roleName === 'Student' ? studentId : parentId);
    setRecoveryContact('');
    setRecoveryReason('');
    setRecoveryError(null);
    setRecoverySuccess(null);
    setIsRecoveryOpen(true);
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    if (!recoveryIdentifier.trim()) {
      setRecoveryError('Please provide your identifier (USN / Registration No / Parent ID).');
      return;
    }
    if (!recoveryContact.trim()) {
      setRecoveryError('Please provide a valid contact email or phone number.');
      return;
    }
    setRecoveryLoading(true);
    setRecoveryError(null);
    try {
      const res = await api.accountRecovery({
        identifier: recoveryIdentifier.trim(),
        contact_info: recoveryContact.trim(),
        role_type: recoveryRole,
        reason: recoveryReason.trim()
      });
      setRecoverySuccess(res.message);
      setTimeout(() => {
        setIsRecoveryOpen(false);
      }, 2500);
    } catch (err) {
      setRecoveryError(err.message || 'Recovery request submission failed.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-100 flex flex-col justify-between text-slate-800">
      
      {/* Top Government Portal Header Bar */}
      <header className="bg-[#0845A8] text-white px-6 py-3 border-b-4 border-[#FF9933] shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="/anvesh_logo.png" 
              alt="ANVESH" 
              className="w-10 h-10 object-contain rounded-lg p-0.5 bg-white shadow-xs" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wide text-white">ANVESH</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-400 text-slate-900 font-bold uppercase">
                  National Portal
                </span>
              </div>
              <p className="text-[11px] text-blue-100/90 font-medium">
                AICTE Inter-Bureau Grievance Intelligence & Resolution Platform • Ministry of Education
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-blue-100">
            <div className="flex items-center gap-1.5 font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/15">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Multi-Stakeholder Secure Authentication Gateway</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col justify-center">
        
        {/* Portal Introduction & Branding Banner */}
        <div className="text-center mb-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-blue-200 mb-3 shadow-sm p-1.5">
            <img src="/anvesh_logo.png" alt="ANVESH" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ANVESH Authentication Portal
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#0845A8] mt-1">
            Analytics-Driven Network for Verifying, Evaluating, and Synchronizing Higher-Education Grievances
          </p>
          <p className="text-xs text-slate-500 mt-1 italic">
            Discover Connections. Drive Resolution. Strengthen Accountability.
          </p>
        </div>

        {/* PRIMARY NAVIGATION SWITCH: LOGIN vs SIGN UP */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300 shadow-inner flex items-center gap-1.5 max-w-md w-full">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setSignupError(null);
                setSignupSuccess(null);
              }}
              className={`flex-1 py-2.5 px-5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-[#0845A8] text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Existing Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setOfficialError(null);
                setStudentError(null);
                setParentError(null);
              }}
              className={`flex-1 py-2.5 px-5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
                activeTab === 'signup'
                  ? 'bg-[#0845A8] text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up / Create Account</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: THREE ROLE-SPECIFIC LOGIN CARDS                                   */}
        {/* ========================================================================= */}
        {activeTab === 'login' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* ==================================================== */}
            {/* CARD 1: BUREAU OFFICER / ADMIN                       */}
            {/* ==================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
              <div>
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-blue-50/70 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0845A8] border border-blue-200 flex items-center justify-center shadow-xs">
                      <Building2 className="w-5 h-5 text-[#0845A8]" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0845A8] border border-blue-200 uppercase tracking-wider">
                      Official Access
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Bureau Officer / Admin
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Central HQ Administrators, Bureau Reviewers (PGRC, RB, AB), and Scrutiny Officers.
                  </p>
                </div>

                {/* Form Body */}
                <form onSubmit={handleOfficialSubmit} className="p-5 space-y-4 text-xs">
                  {officialError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2 shadow-2xs">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{officialError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Official Username *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={officialUsername}
                        onChange={(e) => {
                          setOfficialUsername(e.target.value);
                          setOfficialError(null);
                        }}
                        placeholder="e.g. admin or reviewer_pgrc"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium transition"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showOfficialPassword ? 'text' : 'password'}
                        value={officialPassword}
                        onChange={(e) => {
                          setOfficialPassword(e.target.value);
                          setOfficialError(null);
                        }}
                        placeholder="Enter password"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium transition"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOfficialPassword(!showOfficialPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 transition"
                        title={showOfficialPassword ? 'Hide password' : 'Show password'}
                      >
                        {showOfficialPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Sub-row: Forgot Password link */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-slate-400">Server Audited Session</span>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-[#0845A8] hover:text-[#063784] font-bold text-xs hover:underline transition"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={officialLoading}
                    className="w-full py-2.5 px-4 bg-[#0845A8] hover:bg-[#063784] text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <span>{officialLoading ? 'Authenticating Official Session...' : 'Sign In as Officer / Admin'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>Privileged role; account issued strictly by AICTE Administration.</span>
              </div>
            </div>


            {/* ==================================================== */}
            {/* CARD 2: STUDENT / INSTITUTION                        */}
            {/* ==================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
              <div>
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-indigo-50/70 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center shadow-xs">
                      <GraduationCap className="w-5 h-5 text-indigo-700" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                      Student & College
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Student / Institution
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enrolled students, alumni, and authorized technical institutions.
                  </p>

                  {/* Mode Selector Toggle: OTP vs Password */}
                  <div className="mt-3.5 flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode('otp');
                        setStudentError(null);
                        setStudentSuccessMsg(null);
                      }}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                        studentMode === 'otp'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>OTP Verification</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode('password');
                        setStudentError(null);
                        setStudentSuccessMsg(null);
                      }}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                        studentMode === 'password'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Password Login</span>
                    </button>
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleStudentSubmit} className="p-5 space-y-4 text-xs">
                  {studentError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2 shadow-2xs">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{studentError}</span>
                    </div>
                  )}

                  {studentSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{studentSuccessMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Student USN / Roll No or Institution ID *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => {
                          setStudentId(e.target.value);
                          setStudentError(null);
                        }}
                        placeholder="e.g. 1DS22CS089 or 1-3349102801"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium transition"
                      />
                    </div>
                  </div>

                  {studentMode === 'otp' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Verification OTP *
                        </label>
                        <button
                          type="button"
                          disabled={studentOtpLoading || !studentId.trim() || studentOtpCooldown > 0}
                          onClick={handleStudentRequestOtp}
                          className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 disabled:opacity-40 disabled:cursor-not-allowed hover:underline flex items-center gap-1 transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>
                            {studentOtpLoading
                              ? 'Dispatching...'
                              : studentOtpCooldown > 0
                              ? `Resend in ${studentOtpCooldown}s`
                              : 'Request / Resend OTP'}
                          </span>
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentOtp}
                          onChange={(e) => {
                            setStudentOtp(e.target.value);
                            setStudentError(null);
                          }}
                          placeholder="Enter 6-digit OTP code"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-bold tracking-widest focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showStudentPassword ? 'text' : 'password'}
                          value={studentPassword}
                          onChange={(e) => {
                            setStudentPassword(e.target.value);
                            setStudentError(null);
                          }}
                          placeholder="Enter password"
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium transition"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStudentPassword(!showStudentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 transition"
                          title={showStudentPassword ? 'Hide password' : 'Show password'}
                        >
                          {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sub-row: Recovery and Sign Up link */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSignupRole('Student');
                        setActiveTab('signup');
                      }}
                      className="text-[11px] text-slate-500 hover:text-indigo-700 font-semibold transition"
                    >
                      New user? <span className="font-bold text-indigo-700 underline">Sign Up</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openAccountRecovery('Student')}
                      className="text-indigo-700 hover:text-indigo-900 font-bold text-xs hover:underline transition"
                    >
                      Need Help / Recovery?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={studentLoading}
                    className="w-full py-2.5 px-4 bg-[#0845A8] hover:bg-[#063784] text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <span>
                      {studentLoading
                        ? 'Verifying Student Identity...'
                        : studentMode === 'otp'
                        ? 'Sign In / Verify OTP'
                        : 'Sign In with Password'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Confidential student filing protected under AICTE norms.</span>
              </div>
            </div>


            {/* ==================================================== */}
            {/* CARD 3: PARENT / GUARDIAN                            */}
            {/* ==================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
              <div>
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-teal-50/70 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 border border-teal-200 flex items-center justify-center shadow-xs">
                      <Users className="w-5 h-5 text-teal-700" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200 uppercase tracking-wider">
                      Parent / Guardian
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Parent / Guardian
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Parents and legal guardians tracking ward grievance petitions.
                  </p>

                  {/* Mode Selector Toggle: OTP vs Password */}
                  <div className="mt-3.5 flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setParentMode('otp');
                        setParentError(null);
                        setParentSuccessMsg(null);
                      }}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                        parentMode === 'otp'
                          ? 'bg-white text-teal-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>OTP Verification</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setParentMode('password');
                        setParentError(null);
                        setParentSuccessMsg(null);
                      }}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                        parentMode === 'password'
                          ? 'bg-white text-teal-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Password Login</span>
                    </button>
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleParentSubmit} className="p-5 space-y-4 text-xs">
                  {parentError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2 shadow-2xs">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{parentError}</span>
                    </div>
                  )}

                  {parentSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{parentSuccessMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Parent ID or Registered Mobile *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={parentId}
                        onChange={(e) => {
                          setParentId(e.target.value);
                          setParentError(null);
                        }}
                        placeholder="e.g. PAR-984501 or Mobile"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium transition"
                      />
                    </div>
                  </div>

                  {parentMode === 'otp' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Verification OTP *
                        </label>
                        <button
                          type="button"
                          disabled={parentOtpLoading || !parentId.trim() || parentOtpCooldown > 0}
                          onClick={handleParentRequestOtp}
                          className="text-[11px] font-bold text-teal-700 hover:text-teal-900 disabled:opacity-40 disabled:cursor-not-allowed hover:underline flex items-center gap-1 transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>
                            {parentOtpLoading
                              ? 'Dispatching...'
                              : parentOtpCooldown > 0
                              ? `Resend in ${parentOtpCooldown}s`
                              : 'Request / Resend OTP'}
                          </span>
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={parentOtp}
                          onChange={(e) => {
                            setParentOtp(e.target.value);
                            setParentError(null);
                          }}
                          placeholder="Enter 6-digit OTP code"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-bold tracking-widest focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showParentPassword ? 'text' : 'password'}
                          value={parentPassword}
                          onChange={(e) => {
                            setParentPassword(e.target.value);
                            setParentError(null);
                          }}
                          placeholder="Enter password"
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium transition"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowParentPassword(!showParentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 transition"
                          title={showParentPassword ? 'Hide password' : 'Show password'}
                        >
                          {showParentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sub-row: Recovery and Sign Up link */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSignupRole('Parent / Guardian');
                        setActiveTab('signup');
                      }}
                      className="text-[11px] text-slate-500 hover:text-teal-700 font-semibold transition"
                    >
                      New parent? <span className="font-bold text-teal-700 underline">Sign Up</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openAccountRecovery('Parent')}
                      className="text-teal-700 hover:text-teal-900 font-bold text-xs hover:underline transition"
                    >
                      Account Recovery
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={parentLoading}
                    className="w-full py-2.5 px-4 bg-[#0845A8] hover:bg-[#063784] text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <span>
                      {parentLoading
                        ? 'Verifying Parent Credentials...'
                        : parentMode === 'otp'
                        ? 'Sign In / Verify OTP'
                        : 'Sign In with Password'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                <span>Secure legal guardian tracking and notification service.</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: FUNCTIONAL SIGN UP / CREATE ACCOUNT PORTAL                        */}
        {/* ========================================================================= */}
        {activeTab === 'signup' && (
          <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 via-[#0845A8] to-indigo-900 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-black tracking-wide">
                    Create New Stakeholder Account
                  </h2>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 uppercase">
                  Self-Service Registration
                </span>
              </div>
              <p className="text-xs text-blue-100/90">
                Register as an enrolled Student, Technical Institution Representative, or Legal Parent/Guardian to submit and track grievances.
              </p>
            </div>

            {/* Official Access Policy Notice */}
            <div className="px-6 py-3.5 bg-blue-50/70 border-b border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-[#0845A8] flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>AICTE Governance Policy:</strong> Bureau Officers and Central Administrators cannot be registered publicly. Official administrative credentials are issued strictly by AICTE Central Administration.
              </div>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSignUpSubmit} className="p-6 space-y-5 text-xs">
              
              {signupError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">{signupError}</span>
                </div>
              )}

              {signupSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{signupSuccess}</p>
                    <p className="text-[11px] text-emerald-700 mt-1">Redirecting to Login view in a moment...</p>
                  </div>
                </div>
              )}

              {/* Stakeholder Role Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Stakeholder Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSignupRole('Student')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      signupRole === 'Student'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <GraduationCap className={`w-4 h-4 ${signupRole === 'Student' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      {signupRole === 'Student' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs">Student</div>
                      <div className="text-[10px] text-slate-500">Enrolled student / alumni</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole('Institution User')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      signupRole === 'Institution User'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <School className={`w-4 h-4 ${signupRole === 'Institution User' ? 'text-blue-600' : 'text-slate-400'}`} />
                      {signupRole === 'Institution User' && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs">Institution</div>
                      <div className="text-[10px] text-slate-500">College Nodal Officer</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole('Parent / Guardian')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      signupRole === 'Parent / Guardian'
                        ? 'border-teal-600 bg-teal-50/70 text-teal-950 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Users className={`w-4 h-4 ${signupRole === 'Parent / Guardian' ? 'text-teal-600' : 'text-slate-400'}`} />
                      {signupRole === 'Parent / Guardian' && <span className="w-2 h-2 rounded-full bg-teal-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs">Parent / Guardian</div>
                      <div className="text-[10px] text-slate-500">Legal ward advocate</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Form Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {signupRole === 'Institution User' ? 'Nodal Officer / Principal Name *' : 'Full Name *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Priya Nair"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Identifier */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {signupRole === 'Student' 
                      ? 'Student USN / Roll No *' 
                      : signupRole === 'Institution User' 
                      ? 'AICTE Permanent Institute ID *' 
                      : 'Student Ward USN / ID *'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupIdentifier}
                      onChange={(e) => setSignupIdentifier(e.target.value)}
                      placeholder={
                        signupRole === 'Student' 
                          ? 'e.g. 1RV23CS045' 
                          : signupRole === 'Institution User' 
                          ? 'e.g. 1-3349102801' 
                          : 'e.g. 1RV23CS045'
                      }
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium uppercase"
                      required
                    />
                  </div>
                </div>

                {/* Institution Name (for Student and Institution) */}
                {signupRole !== 'Parent / Guardian' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Institution Name *
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={signupInstitution}
                        onChange={(e) => setSignupInstitution(e.target.value)}
                        placeholder="e.g. R.V. College of Engineering, Bengaluru"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Registered Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. student@college.edu.in"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number {signupRole === 'Parent / Guardian' ? '*' : '(Optional)'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="+91-9845012345"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium"
                      required={signupRole === 'Parent / Guardian'}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Create Password (min. 6 characters) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Enter strong password"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full sm:flex-1 py-3 px-6 bg-[#0845A8] hover:bg-[#063784] text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{signupLoading ? 'Creating Verified Account...' : 'Complete Registration & Create Account'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="w-full sm:w-auto py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Informative Evaluation Footer Link (Strictly No Exposed Quick-Fill Buttons) */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setIsEvalAccountsOpen(true)}
            className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-[#0845A8] hover:underline transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#0845A8]" />
            <span>SIH Evaluation Reference: Predefined Local Test Accounts</span>
          </button>
        </div>
      </main>

      {/* ==================================================== */}
      {/* MODAL: FORGOT PASSWORD (OFFICIAL / ADMIN)            */}
      {/* ==================================================== */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title="Official Account Password Recovery"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          {forgotError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{forgotError}</span>
            </div>
          )}

          {forgotSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{forgotSuccess}</span>
            </div>
          )}

          {forgotStep === 1 ? (
            <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
              <p className="text-slate-600">
                Enter your registered official username or government email address. A cryptographically signed reset token will be generated to re-authenticate your workspace.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Username or Email *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="e.g. admin or official email"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2 rounded-xl bg-[#0845A8] hover:bg-[#063784] text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{forgotLoading ? 'Issuing Instructions...' : 'Request Reset Token'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <p className="text-slate-600">
                Authorized identity confirmed. Create your new secure password below to complete account recovery.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0845A8]/20 focus:border-[#0845A8] font-medium"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2 rounded-xl bg-[#0845A8] hover:bg-[#063784] text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{forgotLoading ? 'Updating Hash...' : 'Update Password & Return to Login'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL: ACCOUNT RECOVERY (STUDENT & PARENT)           */}
      {/* ==================================================== */}
      <Modal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        title={`${recoveryRole} Account Assistance & Recovery`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecoverySubmit} className="space-y-4 text-xs">
          {recoveryError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{recoveryError}</span>
            </div>
          )}

          {recoverySuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{recoverySuccess}</span>
            </div>
          )}

          <p className="text-slate-600">
            If you have lost access to your registered mobile number or need an institutional identity reassignment, submit an inquiry to the AICTE Redressal Helpdesk.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {recoveryRole === 'Student' ? 'Student USN or Institution ID *' : 'Parent Identifier *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recoveryIdentifier}
                onChange={(e) => setRecoveryIdentifier(e.target.value)}
                placeholder="e.g. 1DS22CS089 or PAR-984501"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Alternative Contact Email or Mobile *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recoveryContact}
                onChange={(e) => setRecoveryContact(e.target.value)}
                placeholder="Where should helpdesk reach you?"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason / Issue Description (Optional)
            </label>
            <textarea
              value={recoveryReason}
              onChange={(e) => setRecoveryReason(e.target.value)}
              placeholder="e.g. Changed phone number or unable to receive OTP"
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRecoveryOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recoveryLoading}
              className="px-5 py-2 rounded-xl bg-[#0845A8] hover:bg-[#063784] text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{recoveryLoading ? 'Registering Ticket...' : 'Submit Recovery Ticket'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Government Portal Official Branding Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 text-xs text-slate-600 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <img 
              src="/aicte_logo.png" 
              alt="AICTE Official Seal" 
              className="h-12 w-auto object-contain"
            />
            <div className="h-10 w-px bg-slate-300 hidden sm:block" />
            <img 
              src="/digital_india_logo.png" 
              alt="Digital India" 
              className="h-10 w-auto object-contain"
            />
            <div className="h-10 w-px bg-slate-300 hidden sm:block" />
            <img 
              src="/anvesh_logo.png" 
              alt="ANVESH Platform Logo" 
              className="h-11 w-auto object-contain rounded"
            />
          </div>

          <div className="text-center md:text-right space-y-1">
            <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
              <span className="font-extrabold text-slate-800 tracking-wide">ANVESH</span>
              <span>•</span>
              <span className="text-slate-600">AICTE Inter-Bureau Grievance Intelligence Platform</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active National Gateway
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Analytics-Driven Network for Verifying, Evaluating, and Synchronizing Higher-Education Grievances
            </p>
            <p className="text-[10px] text-slate-400">
              All India Council for Technical Education (AICTE) • Ministry of Education, Government of India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
