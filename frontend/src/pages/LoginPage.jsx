import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { 
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
  Send,
  ShieldCheck,
  Phone,
  Mail,
  UserPlus,
  LogIn,
  School,
  Info,
  Sparkles
} from 'lucide-react';

export function LoginPage() {
  const { login, loginWithOtp } = useAuth();
  const { t, language, setLanguage, toggleLanguage } = useLanguage();

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
  // CARD 2: Student / Faculty State
  // ----------------------------------------------------
  const [studentMode, setStudentMode] = useState('password');
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
  const [parentMode, setParentMode] = useState('password');
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
  const [signupRole, setSignupRole] = useState('Student');
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
      setOfficialError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setOfficialLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handlers: Student / Faculty
  // ----------------------------------------------------
  const handleStudentRequestOtp = async () => {
    if (!studentId.trim()) {
      setStudentError('Please enter your Student USN or Faculty ID first.');
      return;
    }
    setStudentOtpLoading(true);
    setStudentError(null);
    setStudentSuccessMsg(null);
    try {
      const res = await api.requestOtp(studentId.trim());
      setStudentSuccessMsg(res.message || 'OTP successfully dispatched to registered email/phone.');
      if (res.demo_otp) {
        setStudentOtp(res.demo_otp);
      }
      setStudentOtpCooldown(30);
    } catch (err) {
      setStudentError(err.message || 'Failed to dispatch OTP. Please check your identifier.');
    } finally {
      setStudentOtpLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setStudentError('Please enter your Student USN or Faculty ID.');
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
      setParentError('Please enter your Parent ID or Registered Mobile number.');
      return;
    }
    setParentOtpLoading(true);
    setParentError(null);
    setParentSuccessMsg(null);
    try {
      const res = await api.requestOtp(parentId.trim());
      setParentSuccessMsg(res.message || 'OTP dispatched to registered mobile number.');
      if (res.demo_otp) {
        setParentOtp(res.demo_otp);
      }
      setParentOtpCooldown(30);
    } catch (err) {
      setParentError(err.message || 'Failed to dispatch OTP.');
    } finally {
      setParentOtpLoading(false);
    }
  };

  const handleParentSubmit = async (e) => {
    e.preventDefault();
    if (!parentId.trim()) {
      setParentError('Please enter your Parent ID or Registered Mobile number.');
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

      if (signupRole === 'Student' || signupRole === 'Institution User') {
        setStudentId(signupIdentifier.trim());
        setStudentMode('password');
        setStudentPassword(signupPassword);
      } else {
        setParentId(signupIdentifier.trim());
        setParentMode('password');
        setParentPassword(signupPassword);
      }

      setSignupName('');
      setSignupEmail('');
      setSignupPhone('');
      setSignupInstitution('');
      setSignupPassword('');
      setSignupConfirmPassword('');

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
      const res = await api.resetPassword({
        token: resetToken.trim(),
        new_password: newPassword
      });
      setForgotSuccess(res.message);
      setOfficialPassword(newPassword);
      setTimeout(() => {
        setIsForgotOpen(false);
      }, 2000);
    } catch (err) {
      setForgotError(err.message || 'Failed to update password.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handlers: {t('account_recovery_link', 'Account Recovery')} Workflow
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
    <div className="min-h-screen bg-[#F3F5F8] flex flex-col justify-between text-[#172033] relative overflow-hidden">
      
      {/* Ambient Violet Radial Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[radial-gradient(ellipse_90%_50%_at_50%_-15%,rgba(6,69,168,0.06),transparent_75%)] pointer-events-none" />

      {/* Top Government Portal Header Bar */}
      <header className="bg-white/95 backdrop-blur-md text-[#172033] px-6 py-3 border-b border-[#DCE3EC] shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg p-0.5 bg-[#EAF3FF] border border-[#BBD5F8] shadow-xs flex items-center justify-center">
              <img 
                src="/anvesh_logo.png" 
                alt="ANVESH" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wide text-[#0645A8]">
                  ANVESH
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8] uppercase tracking-wider">
                  {t('auth_national_portal', 'National Portal')}
                </span>
              </div>
              <p className="text-[11px] text-[#687386] font-medium">
                AICTE Inter-Bureau Grievance Intelligence & Resolution Platform • Ministry of Education
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#687386]">
            <div className="flex items-center bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-[#0645A8] text-white shadow-xs'
                    : 'text-[#687386] hover:text-[#172033] hover:bg-white'
                }`}
                title="Switch to English"
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'hi'
                    ? 'bg-[#0645A8] text-white shadow-xs'
                    : 'text-[#687386] hover:text-[#172033] hover:bg-white'
                }`}
                title="हिन्दी में बदलें"
              >
                हिन्दी
              </button>
            </div>
            <div className="hidden md:flex items-center gap-1.5 font-medium bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#DCE3EC]">
              <ShieldCheck className="w-4 h-4 text-[#0645A8]" />
              <span>{t('auth_gateway_badge', 'Multi-Stakeholder Secure Authentication Gateway')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full flex-1 flex flex-col justify-center relative z-10">
        
        {/* Portal Introduction & Branding Banner */}
        <div className="text-center mb-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#EAF3FF] border border-[#BBD5F8] mb-3 shadow-xs p-1.5">
            <img src="/anvesh_logo.png" alt="ANVESH" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            {t('auth_portal_title', 'ANVESH Authentication Portal')}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#0645A8] mt-1">
            {t('auth_portal_subtitle', 'Analytics-Driven Network for Verifying, Evaluating, and Synchronizing Higher-Education Grievances')}
          </p>
          <p className="text-xs text-[#687386] mt-1 italic">
            {t('auth_portal_tagline', 'Discover Connections. Drive Resolution. Strengthen Accountability.')}
          </p>
        </div>

        {/* PRIMARY NAVIGATION SWITCH: LOGIN vs SIGN UP */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1.5 rounded-xl border border-[#DCE3EC] flex items-center gap-1.5 max-w-md w-full">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setSignupError(null);
                setSignupSuccess(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-[#0645A8] hover:bg-[#1769D2] text-white shadow-xs'
                  : 'text-[#687386] hover:text-[#172033]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{t('login_to_existing', 'Login to Existing Account')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setOfficialError(null);
                setStudentError(null);
                setParentError(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
                activeTab === 'signup'
                  ? 'bg-[#0645A8] hover:bg-[#1769D2] text-white shadow-xs'
                  : 'text-[#687386] hover:text-[#172033]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('signup_create_account', 'Sign Up / Create Account')}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: THREE ROLE-SPECIFIC LOGIN CARDS                                   */}
        {/* ========================================================================= */}
        {activeTab === 'login' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* CARD 1: BUREAU OFFICER / ADMIN */}
            <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-xs hover:border-[#BBD5F8] hover:shadow-md transition flex flex-col justify-between overflow-hidden animate-fade-rise">
              <div>
                {/* Card Header */}
                <div className="p-5 border-b border-[#DCE3EC] bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8] flex items-center justify-center shadow-xs">
                      <Building2 className="w-4 h-4 text-[#0645A8]" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#0645A8] border border-[#DCE3EC] uppercase tracking-wider">
                      {t('card_officer_badge', 'Official Access')}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-[#172033] tracking-tight">
                    {t('card_officer_title', 'Bureau Officer / Admin')}
                  </h2>
                  <p className="text-xs text-[#687386] mt-1">
                    {t('card_officer_desc', 'Central HQ Administrators, Bureau Reviewers (PGRC, RB, AB), and Scrutiny Officers.')}
                  </p>
                </div>

                {/* Form Body */}
                <form onSubmit={handleOfficialSubmit} className="p-5 space-y-4 text-xs">
                  {officialError && (
                    <div className="p-3 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/30 text-[#DC3545] flex items-start gap-2 shadow-xs">
                      <AlertCircle className="w-4 h-4 text-[#DC3545] flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{officialError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                      {t('officer_username_label', 'Official Username *')}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={officialUsername}
                        onChange={(e) => {
                          setOfficialUsername(e.target.value);
                          setOfficialError(null);
                        }}
                        placeholder={t('officer_username_placeholder', 'e.g. admin or reviewer_pgrc')}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium transition"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                      {t('officer_password_label', 'Password *')}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showOfficialPassword ? 'text' : 'password'}
                        value={officialPassword}
                        onChange={(e) => {
                          setOfficialPassword(e.target.value);
                          setOfficialError(null);
                        }}
                        placeholder={t('officer_password_placeholder', 'Enter password')}
                        className="w-full pl-9 pr-10 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium transition"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOfficialPassword(!showOfficialPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687386] hover:text-[#172033] p-0.5 transition"
                        title={showOfficialPassword ? 'Hide password' : 'Show password'}
                      >
                        {showOfficialPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Sub-row: Forgot Password link */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-[#687386]">{t('server_audited_session', 'Server Audited Session')}</span>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-[#0645A8] hover:text-[#0645A8] font-bold text-xs hover:underline transition"
                    >
                      {t('forgot_password_link', 'Forgot Password?')}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={officialLoading}
                    className="w-full py-2.5 px-4 bg-[#0645A8] hover:bg-[#1769D2] transition text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <span>{officialLoading ? t('authenticating_officer', 'Authenticating Official Session...') : t('signin_officer_btn', 'Sign In as Officer / Admin')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#DCE3EC] text-[11px] text-[#687386] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A765] flex-shrink-0" />
                <span>{t('officer_footer_note', 'Privileged role; account issued strictly by AICTE Administration.')}</span>
              </div>
            </div>

            {/* CARD 2: STUDENT / FACULTY */}
            <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-xs hover:border-[#BBD5F8] hover:shadow-md transition flex flex-col justify-between overflow-hidden animate-fade-rise">
              <div>
                {/* Card Header */}
                <div className="p-5 border-b border-[#DCE3EC] bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8] flex items-center justify-center shadow-xs">
                      <GraduationCap className="w-4 h-4 text-[#0645A8]" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#0645A8] border border-[#DCE3EC] uppercase tracking-wider">
                      {t('card_student_badge', 'Student & Faculty')}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-[#172033] tracking-tight">
                    {t('card_student_title', 'Student / Faculty')}
                  </h2>
                  <p className="text-xs text-[#687386] mt-1">
                    {t('card_student_desc', 'Enrolled students, alumni, and verified faculty / institutional members.')}
                  </p>

                  {/* Mode Selector Toggle: Password vs OTP */}
                  <div className="mt-3.5 flex bg-[#F8FAFC] p-1 rounded-xl border border-[#DCE3EC]">
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode('password');
                        setStudentError(null);
                        setStudentSuccessMsg(null);
                      }}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                        studentMode === 'password'
                          ? 'bg-[#0645A8] hover:bg-[#1769D2] text-white shadow-xs'
                          : 'text-[#687386] hover:text-[#172033]'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>{t('mode_password_login', 'Password Login')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode('otp');
                        setStudentError(null);
                        setStudentSuccessMsg(null);
                      }}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                        studentMode === 'otp'
                          ? 'bg-[#0645A8] hover:bg-[#1769D2] text-white shadow-xs'
                          : 'text-[#687386] hover:text-[#172033]'
                      }`}
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>{t('mode_otp_login', 'OTP Verification')}</span>
                    </button>
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleStudentSubmit} className="p-5 space-y-4 text-xs">
                  {studentError && (
                    <div className="p-3 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/30 text-[#DC3545] flex items-start gap-2 shadow-xs">
                      <AlertCircle className="w-4 h-4 text-[#DC3545] flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{studentError}</span>
                    </div>
                  )}

                  {studentSuccessMsg && (
                    <div className="p-3 rounded-xl bg-[#16A765]/10 border border-[#16A765]/30 text-[#16A765] flex items-start gap-2 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#16A765] flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{studentSuccessMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                      {t('student_id_label', 'Student USN / Roll No or Faculty ID *')}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => {
                          setStudentId(e.target.value);
                          setStudentError(null);
                        }}
                        placeholder={t('student_id_placeholder', 'e.g. 1DS22CS089 or FAC-8891')}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium transition"
                      />
                    </div>
                  </div>

                  {studentMode === 'otp' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#687386] uppercase tracking-wider">
                          {t('student_otp_label', 'Verification OTP *')}
                        </label>
                        <button
                          type="button"
                          disabled={studentOtpLoading || !studentId.trim() || studentOtpCooldown > 0}
                          onClick={handleStudentRequestOtp}
                          className="text-[11px] font-bold text-[#0645A8] hover:text-[#0645A8] disabled:opacity-40 disabled:cursor-not-allowed hover:underline flex items-center gap-1 transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>
                            {studentOtpLoading
                              ? t('dispatching_otp', 'Dispatching...')
                              : studentOtpCooldown > 0
                              ? `${t('resend_in_seconds', 'Resend in')} ${studentOtpCooldown}s`
                              : t('request_otp_btn', 'Request / Resend OTP')}
                          </span>
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentOtp}
                          onChange={(e) => {
                            setStudentOtp(e.target.value);
                            setStudentError(null);
                          }}
                          placeholder={t('student_otp_placeholder', 'Enter 6-digit OTP code')}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] font-mono font-bold tracking-widest focus:outline-none focus:border-[#0645A8] transition"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showStudentPassword ? 'text' : 'password'}
                          value={studentPassword}
                          onChange={(e) => {
                            setStudentPassword(e.target.value);
                            setStudentError(null);
                          }}
                          placeholder="Enter password"
                          className="w-full pl-9 pr-10 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium transition"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStudentPassword(!showStudentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687386] hover:text-[#172033] p-0.5 transition"
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
                      className="text-[11px] text-[#687386] hover:text-[#0645A8] font-semibold transition"
                    >
                      {t('new_user_question', 'New user?')} <span className="font-bold text-[#0645A8] underline">{t('signup_link', 'Sign Up')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openAccountRecovery('Student')}
                      className="text-[#0645A8] hover:text-[#0645A8] font-bold text-xs hover:underline transition"
                    >
                      {t('need_help_recovery', 'Need Help / Recovery?')}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={studentLoading}
                    className="w-full py-2.5 px-4 bg-[#0645A8] hover:bg-[#1769D2] transition text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <span>
                      {studentLoading
                        ? t('verifying_student', 'Verifying Student Identity...')
                        : studentMode === 'otp'
                        ? t('signin_student_otp', 'Sign In / Verify OTP')
                        : t('signin_student_pwd', 'Sign In with Password')}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#DCE3EC] text-[11px] text-[#687386] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A765] flex-shrink-0" />
                <span>{t('student_footer_note', 'Confidential stakeholder filing protected under AICTE norms.')}</span>
              </div>
            </div>

            {/* CARD 3: PARENT / GUARDIAN */}
            <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-xs hover:border-[#BBD5F8] hover:shadow-md transition flex flex-col justify-between overflow-hidden animate-fade-rise">
              <div>
                {/* Card Header */}
                <div className="p-5 border-b border-[#DCE3EC] bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8] flex items-center justify-center shadow-xs">
                      <Users className="w-4 h-4 text-[#0645A8]" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#0645A8] border border-[#DCE3EC] uppercase tracking-wider">
                      Parent / Guardian
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-[#172033] tracking-tight">
                    {t('card_parent_title', 'Parent / Guardian')}
                  </h2>
                  <p className="text-xs text-[#687386] mt-1">
                    {t('card_parent_desc', 'Parents and legal guardians tracking ward grievance petitions.')}
                  </p>

                  {/* Mode Selector Toggle: Password vs OTP */}
                  <div className="mt-3.5 flex bg-[#F8FAFC] p-1 rounded-xl border border-[#DCE3EC]">
                    <button
                      type="button"
                      onClick={() => {
                        setParentMode('password');
                        setParentError(null);
                        setParentSuccessMsg(null);
                      }}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                        parentMode === 'password'
                          ? 'bg-[#0645A8] hover:bg-[#1769D2] text-white shadow-xs'
                          : 'text-[#687386] hover:text-[#172033]'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Password Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setParentMode('otp');
                        setParentError(null);
                        setParentSuccessMsg(null);
                      }}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                        parentMode === 'otp'
                          ? 'bg-[#0645A8] hover:bg-[#1769D2] text-white shadow-xs'
                          : 'text-[#687386] hover:text-[#172033]'
                      }`}
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>OTP Verification</span>
                    </button>
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleParentSubmit} className="p-5 space-y-4 text-xs">
                  {parentError && (
                    <div className="p-3 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/30 text-[#DC3545] flex items-start gap-2 shadow-xs">
                      <AlertCircle className="w-4 h-4 text-[#DC3545] flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{parentError}</span>
                    </div>
                  )}

                  {parentSuccessMsg && (
                    <div className="p-3 rounded-xl bg-[#16A765]/10 border border-[#16A765]/30 text-[#16A765] flex items-start gap-2 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#16A765] flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{parentSuccessMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                      {t('parent_id_label', 'Parent ID or Registered Mobile *')}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={parentId}
                        onChange={(e) => {
                          setParentId(e.target.value);
                          setParentError(null);
                        }}
                        placeholder={t('parent_id_placeholder', 'e.g. PAR-984501 or Mobile')}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium transition"
                      />
                    </div>
                  </div>

                  {parentMode === 'otp' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#687386] uppercase tracking-wider">
                          Verification OTP *
                        </label>
                        <button
                          type="button"
                          disabled={parentOtpLoading || !parentId.trim() || parentOtpCooldown > 0}
                          onClick={handleParentRequestOtp}
                          className="text-[11px] font-bold text-[#0645A8] hover:text-[#0645A8] disabled:opacity-40 disabled:cursor-not-allowed hover:underline flex items-center gap-1 transition"
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
                        <KeyRound className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={parentOtp}
                          onChange={(e) => {
                            setParentOtp(e.target.value);
                            setParentError(null);
                          }}
                          placeholder="Enter 6-digit OTP code"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] font-mono font-bold tracking-widest focus:outline-none focus:border-[#0645A8] transition"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showParentPassword ? 'text' : 'password'}
                          value={parentPassword}
                          onChange={(e) => {
                            setParentPassword(e.target.value);
                            setParentError(null);
                          }}
                          placeholder="Enter password"
                          className="w-full pl-9 pr-10 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium transition"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowParentPassword(!showParentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687386] hover:text-[#172033] p-0.5 transition"
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
                      className="text-[11px] text-[#687386] hover:text-[#0645A8] font-semibold transition"
                    >
                      {t('new_parent_question', 'New parent?')} <span className="font-bold text-[#0645A8] underline">{t('signup_link', 'Sign Up')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openAccountRecovery('Parent')}
                      className="text-[#0645A8] hover:text-[#0645A8] font-bold text-xs hover:underline transition"
                    >
                      Account Recovery
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={parentLoading}
                    className="w-full py-2.5 px-4 bg-[#0645A8] hover:bg-[#1769D2] transition text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <span>
                      {parentLoading
                        ? t('verifying_parent', 'Verifying Parent Credentials...')
                        : parentMode === 'otp'
                        ? t('signin_parent_otp', 'Sign In / Verify OTP')
                        : t('signin_parent_pwd', 'Sign In with Password')}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#DCE3EC] text-[11px] text-[#687386] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A765] flex-shrink-0" />
                <span>{t('parent_footer_note', 'Secure legal guardian tracking and notification service.')}</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: FUNCTIONAL SIGN UP / CREATE ACCOUNT PORTAL                        */}
        {/* ========================================================================= */}
        {activeTab === 'signup' && (
          <div className="max-w-2xl mx-auto w-full bg-white rounded-xl border border-[#DCE3EC] shadow-xs overflow-hidden">
            
            {/* Header */}
            <div className="p-6 bg-[#F8FAFC] border-b border-[#DCE3EC] text-[#172033]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF3FF] border border-[#BBD5F8] flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-[#0645A8]" />
                  </div>
                  <h2 className="text-lg font-black tracking-wide text-[#172033]">
                    {t('signup_heading', 'Create New Stakeholder Account')}
                  </h2>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8] uppercase tracking-wider">
                  {t('signup_badge', 'Self-Service Registration')}
                </span>
              </div>
              <p className="text-xs text-[#687386]">
                {t('signup_desc', 'Register as an enrolled Student, Faculty Member, or Legal Parent/Guardian to submit and track grievances.')}
              </p>
            </div>

            {/* Official Access Policy Notice */}
            <div className="px-6 py-3.5 bg-white border-b border-[#DCE3EC] flex items-start gap-2.5 text-xs text-[#687386]">
              <Info className="w-4 h-4 text-[#0645A8] flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="text-[#172033]">{t('aicte_policy_title', 'AICTE Governance Policy:')}</strong> {t('aicte_policy_desc', 'Bureau Officers and Central Administrators cannot be registered publicly. Official administrative credentials are issued strictly by AICTE Central Administration.')}
              </div>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSignUpSubmit} className="p-6 space-y-5 text-xs">
              
              {signupError && (
                <div className="p-3.5 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/30 text-[#DC3545] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#DC3545] flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">{signupError}</span>
                </div>
              )}

              {signupSuccess && (
                <div className="p-3.5 rounded-xl bg-[#16A765]/10 border border-[#16A765]/30 text-[#16A765] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A765] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{signupSuccess}</p>
                    <p className="text-[11px] text-[#16A765]/80 mt-1">{t('redirecting_login', 'Redirecting to Login view in a moment...')}</p>
                  </div>
                </div>
              )}

              {/* Stakeholder Role Picker */}
              <div>
                <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-2">
                  {t('select_role_label', 'Select Stakeholder Role *')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSignupRole('Student')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      signupRole === 'Student'
                        ? 'border-[#0645A8] bg-[#EAF3FF] text-[#172033] ring-2 ring-[#0645A8]/20 shadow-xs'
                        : 'border-[#DCE3EC] hover:border-[#BBD5F8] bg-[#F8FAFC] text-[#687386]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <GraduationCap className={`w-4 h-4 ${signupRole === 'Student' ? 'text-[#0645A8]' : 'text-[#687386]'}`} />
                      {signupRole === 'Student' && <span className="w-2 h-2 rounded-full bg-[#0645A8]" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#172033]">{t('role_student', 'Student')}</div>
                      <div className="text-[10px] text-[#687386]">{t('role_student_sub', 'Enrolled student / alumni')}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole('Institution User')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      signupRole === 'Institution User'
                        ? 'border-[#0645A8] bg-[#EAF3FF] text-[#172033] ring-2 ring-[#0645A8]/20 shadow-xs'
                        : 'border-[#DCE3EC] hover:border-[#BBD5F8] bg-[#F8FAFC] text-[#687386]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <School className={`w-4 h-4 ${signupRole === 'Institution User' ? 'text-[#0645A8]' : 'text-[#687386]'}`} />
                      {signupRole === 'Institution User' && <span className="w-2 h-2 rounded-full bg-[#0645A8]" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#172033]">{t('role_faculty', 'Faculty')}</div>
                      <div className="text-[10px] text-[#687386]">{t('role_faculty_sub', 'Faculty / College Staff')}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole('Parent / Guardian')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      signupRole === 'Parent / Guardian'
                        ? 'border-[#0645A8] bg-[#EAF3FF] text-[#172033] ring-2 ring-[#0645A8]/20 shadow-xs'
                        : 'border-[#DCE3EC] hover:border-[#BBD5F8] bg-[#F8FAFC] text-[#687386]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Users className={`w-4 h-4 ${signupRole === 'Parent / Guardian' ? 'text-[#0645A8]' : 'text-[#687386]'}`} />
                      {signupRole === 'Parent / Guardian' && <span className="w-2 h-2 rounded-full bg-[#0645A8]" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#172033]">{t('role_parent', 'Parent / Guardian')}</div>
                      <div className="text-[10px] text-[#687386]">{t('role_parent_sub', 'Legal ward advocate')}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Form Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                    {signupRole === 'Institution User' ? t('name_label_faculty', 'Faculty / Staff Full Name *') : t('name_label_general', 'Full Name *')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder={t('name_placeholder', 'e.g. Dr. Priya Nair')}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Identifier */}
                <div>
                  <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                    {signupRole === 'Student' 
                      ? t('id_label_student', 'Student USN / Roll No *') 
                      : signupRole === 'Institution User' 
                      ? t('id_label_faculty', 'Faculty ID / Employee Code *') 
                      : t('id_label_parent', 'Student Ward USN / ID *')}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupIdentifier}
                      onChange={(e) => setSignupIdentifier(e.target.value)}
                      placeholder={
                        signupRole === 'Student' 
                          ? 'e.g. 1RV23CS045' 
                          : signupRole === 'Institution User' 
                          ? 'e.g. FAC-8891' 
                          : 'e.g. 1RV23CS045'
                      }
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium uppercase"
                      required
                    />
                  </div>
                </div>

                {/* Institution Name (for Student and Institution) */}
                {signupRole !== 'Parent / Guardian' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                      {t('institution_label', 'Institution Name *')}
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={signupInstitution}
                        onChange={(e) => setSignupInstitution(e.target.value)}
                        placeholder={t('institution_placeholder', 'e.g. R.V. College of Engineering, Bengaluru')}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Registered Email */}
                <div>
                  <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                    {t('email_label', 'Registered Email Address *')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder={t('email_placeholder', 'e.g. user@college.edu.in')}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                    {signupRole === 'Parent / Guardian' ? t('mobile_label_req', 'Mobile Number *') : t('mobile_label_opt', 'Mobile Number (Optional)')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="+91-9845012345"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
                      required={signupRole === 'Parent / Guardian'}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                    {t('create_password_label', 'Create Password (min. 6 characters) *')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Enter strong password"
                      className="w-full pl-9 pr-10 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687386] hover:text-[#172033] p-0.5"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                    {t('confirm_password_label', 'Confirm Password *')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
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
                  className="w-full sm:flex-1 py-3 px-6 bg-[#0645A8] hover:bg-[#1769D2] transition text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{signupLoading ? t('creating_account', 'Creating Verified Account...') : t('submit_registration_btn', 'Complete Registration & Create Account')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="w-full sm:w-auto py-3 px-6 bg-[#F8FAFC] hover:bg-[#F3F5F8] border border-[#DCE3EC] text-[#687386] hover:text-[#172033] font-bold rounded-xl transition text-xs"
                >
                  {t('already_have_account_btn', 'Already have an account? Sign In')}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* MODAL: FORGOT PASSWORD (OFFICIAL / ADMIN) */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title={t('modal_forgot_title', 'Official Account Password Recovery')}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          {forgotError && (
            <div className="p-3 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/30 text-[#DC3545] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC3545] flex-shrink-0 mt-0.5" />
              <span>{forgotError}</span>
            </div>
          )}

          {forgotSuccess && (
            <div className="p-3 rounded-xl bg-[#16A765]/10 border border-[#16A765]/30 text-[#16A765] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A765] flex-shrink-0 mt-0.5" />
              <span>{forgotSuccess}</span>
            </div>
          )}

          {forgotStep === 1 ? (
            <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
              <p className="text-[#687386]">
                {t('forgot_step1_desc', 'Enter your registered official username or government email address. A cryptographically signed reset token will be generated to re-authenticate your workspace.')}
              </p>

              <div>
                <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                  {t('forgot_identifier_label', 'Official Username or Email *')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder={t('forgot_identifier_placeholder', 'e.g. admin or official email')}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE3EC]">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#687386] hover:text-[#172033] bg-[#F8FAFC] border border-[#DCE3EC] font-semibold transition"
                >
                  {t('cancel_action', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2 rounded-xl bg-[#0645A8] hover:bg-[#1769D2] transition text-white font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <span>{forgotLoading ? t('issuing_instructions', 'Issuing Instructions...') : t('request_reset_token', 'Request Reset Token')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <p className="text-[#687386]">
                {t('forgot_step2_desc', 'Authorized identity confirmed. Create your new secure password below to complete account recovery.')}
              </p>

              <div>
                <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                  {t('new_password_label', 'New Password *')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687386] hover:text-[#172033] p-0.5"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
                  {t('confirm_new_password_label', 'Confirm New Password *')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE3EC]">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#687386] hover:text-[#172033] bg-[#F8FAFC] border border-[#DCE3EC] font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2 rounded-xl bg-[#0645A8] hover:bg-[#1769D2] transition text-white font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <span>{forgotLoading ? t('updating_hash', 'Updating Hash...') : t('update_password_btn', 'Update Password & Return to Login')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* MODAL: ACCOUNT RECOVERY (STUDENT & PARENT) */}
      <Modal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        title={t('modal_recovery_title', '{role} Account Assistance & Recovery').replace('{role}', recoveryRole === 'Student' ? t('role_student', 'Student') : t('role_parent', 'Parent'))}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecoverySubmit} className="space-y-4 text-xs">
          {recoveryError && (
            <div className="p-3 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/30 text-[#DC3545] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC3545] flex-shrink-0 mt-0.5" />
              <span>{recoveryError}</span>
            </div>
          )}

          {recoverySuccess && (
            <div className="p-3 rounded-xl bg-[#16A765]/10 border border-[#16A765]/30 text-[#16A765] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A765] flex-shrink-0 mt-0.5" />
              <span>{recoverySuccess}</span>
            </div>
          )}

          <p className="text-[#687386]">
            {t('recovery_help_desc', 'If you have lost access to your registered mobile number or need an institutional identity reassignment, submit an inquiry to the AICTE Redressal Helpdesk.')}
          </p>

          <div>
            <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
              {recoveryRole === 'Student' ? t('student_id_label', 'Student USN or Faculty ID *') : t('parent_id_label', 'Parent Identifier *')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recoveryIdentifier}
                onChange={(e) => setRecoveryIdentifier(e.target.value)}
                placeholder="e.g. 1DS22CS089 or PAR-984501"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
              {t('alt_contact_label', 'Alternative Contact Email or Mobile *')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#687386] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recoveryContact}
                onChange={(e) => setRecoveryContact(e.target.value)}
                placeholder="Where should helpdesk reach you?"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider mb-1.5">
              {t('reason_label', 'Reason / Issue Description (Optional)')}
            </label>
            <textarea
              value={recoveryReason}
              onChange={(e) => setRecoveryReason(e.target.value)}
              placeholder="e.g. Changed phone number or unable to receive OTP"
              rows={3}
              className="w-full p-3 bg-white border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE3EC]">
            <button
              type="button"
              onClick={() => setIsRecoveryOpen(false)}
              className="px-4 py-2 rounded-xl text-[#687386] hover:text-[#172033] bg-[#F8FAFC] border border-[#DCE3EC] font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recoveryLoading}
              className="px-5 py-2 rounded-xl bg-[#0645A8] hover:bg-[#1769D2] transition text-white font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <span>{recoveryLoading ? t('registering_ticket', 'Registering Ticket...') : t('submit_ticket_btn', 'Submit Recovery Ticket')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Government Portal Official Branding Footer */}
      <footer className="bg-white border-t border-[#DCE3EC] py-6 px-6 text-xs text-[#687386] shadow-inner relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <img 
              src="/aicte_logo.png" 
              alt="AICTE Official Seal" 
              className="h-12 w-auto object-contain"
            />
            <div className="h-10 w-px bg-[#DCE3EC] hidden sm:block" />
            <img 
              src="/digital_india_logo.png" 
              alt="Digital India" 
              className="h-10 w-auto object-contain"
            />
            <div className="h-10 w-px bg-[#DCE3EC] hidden sm:block" />
            <div className="w-11 h-11 rounded-lg p-0.5 bg-[#EAF3FF] border border-[#BBD5F8] shadow-xs flex items-center justify-center">
              <img 
                src="/anvesh_logo.png" 
                alt="ANVESH Platform Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
              <span className="font-extrabold text-[#172033] tracking-wide">ANVESH</span>
              <span>•</span>
              <span className="text-[#687386]">{t('footer_portal_desc', 'AICTE Inter-Bureau Grievance Intelligence Platform')}</span>
              <span>•</span>
              <span className="text-[#16A765] font-bold inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A765] animate-pulse" />
                {t('footer_active_gateway', 'Active National Gateway')}
              </span>
            </div>
            <p className="text-[11px] text-[#687386]">
              Analytics-Driven Network for Verifying, Evaluating, and Synchronizing Higher-Education Grievances
            </p>
            <p className="text-[10px] text-[#687386]/60">
              {t('footer_ministry', 'All India Council for Technical Education (AICTE) • Ministry of Education, Government of India')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default LoginPage;
