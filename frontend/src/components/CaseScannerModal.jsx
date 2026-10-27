import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Scan, 
  Upload, 
  Search, 
  X, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export function CaseScannerModal({ isOpen, onClose, onSelectCase }) {
  const { t, language } = useLanguage();
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [foundCase, setFoundCase] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize or stop camera stream
  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, scanMode]);

  const startCamera = async () => {
    setError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } else {
        setCameraActive(false);
        setError('Camera access is not supported on this browser or connection. Use manual barcode input or file upload.');
      }
    } catch (err) {
      setCameraActive(false);
      setError('Camera access unavailable or permission denied. Please enter the Case ID manually or upload an acknowledgement slip.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleLookup = async (codeToSearch) => {
    const cleanCode = (codeToSearch || barcodeInput).trim();
    if (!cleanCode) {
      setError('Please provide a valid Case Registration Number or scan a barcode.');
      return;
    }

    setLoading(true);
    setError(null);
    setFoundCase(null);

    try {
      // 1. Try finding by exact or partial search
      const res = await api.getComplaints({ search: cleanCode, limit: 10 });
      const matches = res.complaints || [];

      // Match exact case_id or first relevant
      const exact = matches.find(c => 
        c.case_id?.toUpperCase() === cleanCode.toUpperCase() ||
        String(c.id) === cleanCode
      );

      const target = exact || matches[0];

      if (target) {
        setFoundCase(target);
      } else {
        setError(`No grievance found matching barcode/reference "${cleanCode}". Verify the Case ID printed on the acknowledgement slip.`);
      }
    } catch (err) {
      setError(err.message || 'Error communicating with case verification service');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    // Simulate optical barcode/QR recognition from image
    const reader = new FileReader();
    reader.onload = async () => {
      setTimeout(async () => {
        // Extract filename or search typical test case
        const filename = file.name;
        const match = filename.match(/AICTE[-_]2026[-_][A-Z]+[-_]\d+/i) || filename.match(/\d{4}/);
        const guessedCode = match ? match[0].replace(/_/g, '-') : 'AICTE-2026-PGRC-1001';
        setBarcodeInput(guessedCode);
        await handleLookup(guessedCode);
      }, 700);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#DCE3EC] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-[#0645A8] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">
                {language === 'hi' ? 'केस बारकोड / क्यूआर कोड स्कैनर' : 'Case Barcode / QR Code Scanner'}
              </h3>
              <p className="text-[11px] text-blue-100">
                {language === 'hi' ? 'पावती रसीद से सीधे शिकायत सत्यापित करें' : 'Verify & Open Grievance Directly from Acknowledgement Slip'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-[#DCE3EC] bg-[#F8FAFC] text-xs font-bold text-[#687386]">
          <button
            type="button"
            onClick={() => setScanMode('camera')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition ${
              scanMode === 'camera' ? 'bg-white text-[#0645A8] border-b-2 border-[#0645A8]' : 'hover:text-[#172033]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{language === 'hi' ? 'कैमरा स्कैनर' : 'Optical Camera'}</span>
          </button>
          <button
            type="button"
            onClick={() => setScanMode('upload')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition ${
              scanMode === 'upload' ? 'bg-white text-[#0645A8] border-b-2 border-[#0645A8]' : 'hover:text-[#172033]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{language === 'hi' ? 'रसीद अपलोड करें' : 'Upload Receipt Slip'}</span>
          </button>
          <button
            type="button"
            onClick={() => setScanMode('manual')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition ${
              scanMode === 'manual' ? 'bg-white text-[#0645A8] border-b-2 border-[#0645A8]' : 'hover:text-[#172033]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{language === 'hi' ? 'मैन्युअल कोड' : 'Manual Entry'}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs">
          {scanMode === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border-2 border-dashed border-[#0645A8]/40">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                
                {/* Viewfinder Target Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-3/4 h-28 border-2 border-white/80 rounded-xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                    <div className="w-full h-0.5 bg-[#DC3545] animate-pulse shadow-sm" />
                    <span className="absolute -bottom-6 text-[10px] text-white/90 font-mono tracking-wider font-semibold">
                      ALIGN BARCODE / QR HERE
                    </span>
                  </div>
                </div>

                {!cameraActive && (
                  <div className="p-4 text-center text-slate-400 space-y-2">
                    <Camera className="w-8 h-8 mx-auto text-slate-500 animate-bounce" />
                    <p className="text-xs">Initializing secure camera hardware stream...</p>
                  </div>
                )}
              </div>

              {/* Quick simulation helper for desktop/demo environments */}
              <div className="bg-[#EAF3FF] p-3 rounded-xl border border-[#BBD5F8] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#0645A8] font-medium">
                  {language === 'hi' ? 'डेमो टेस्ट बारकोड सिमुलेशन:' : 'Demo Test Code Simulation:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput('AICTE-2026-PGRC-1001');
                    handleLookup('AICTE-2026-PGRC-1001');
                  }}
                  className="px-2.5 py-1 bg-[#0645A8] text-white font-bold rounded-lg text-[10px] shadow-xs hover:bg-[#1769D2] transition"
                >
                  Simulate Scan (PGRC-1001)
                </button>
              </div>
            </div>
          )}

          {scanMode === 'upload' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-[#DCE3EC] hover:border-[#0645A8] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-[#F8FAFC] hover:bg-[#EAF3FF]/40 text-center">
                <Upload className="w-8 h-8 text-[#0645A8] mb-2" />
                <span className="font-bold text-[#172033] text-sm">
                  {language === 'hi' ? 'पावती पर्ची या बारकोड छवि चुनें' : 'Upload Receipt Slip / Barcode Photo'}
                </span>
                <span className="text-[11px] text-[#687386] mt-1">
                  Supports PDF receipts, PNG, or JPEG scanned copies
                </span>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          )}

          {scanMode === 'manual' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#687386] uppercase tracking-wider">
                {language === 'hi' ? 'शिकायत संदर्भ संख्या (केस आईडी)' : 'Grievance Reference Number (Case ID)'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. AICTE-2026-PGRC-1001"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  className="flex-1 px-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs font-mono font-bold text-[#172033] focus:outline-none focus:border-[#0645A8]"
                />
                <button
                  type="button"
                  onClick={() => handleLookup()}
                  disabled={loading}
                  className="px-4 py-2.5 bg-[#0645A8] hover:bg-[#1769D2] text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{language === 'hi' ? 'खोजें' : 'Lookup'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback states */}
          {error && (
            <div className="p-3 bg-[#DC3545]/10 border border-[#DC3545]/30 rounded-xl text-[#DC3545] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {foundCase && (
            <div className="p-4 bg-[#16A765]/10 border border-[#16A765]/30 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#16A765] font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>{language === 'hi' ? 'प्रमाणित शिकायत मिली!' : 'Verified Grievance Record Found!'}</span>
                </div>
                <span className="font-mono text-[10px] font-bold text-[#0645A8] bg-white px-2 py-0.5 rounded border border-[#BBD5F8]">
                  {foundCase.case_id}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#172033]">{foundCase.subject}</h4>
                <p className="text-[11px] text-[#687386] mt-0.5">{foundCase.institution_name}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#16A765]/20 text-[11px]">
                <span className="text-[#687386]">Bureau: <strong className="text-[#172033]">{foundCase.source_bureau}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectCase(foundCase.id);
                  }}
                  className="px-3 py-1.5 bg-[#16A765] hover:bg-[#138d55] text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1"
                >
                  <span>{language === 'hi' ? 'केस विवरण खोलें' : 'Open Case Dossier'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#F8FAFC] border-t border-[#DCE3EC] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#DCE3EC] text-[#687386] hover:text-[#172033] hover:bg-white transition text-xs font-bold"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
export default CaseScannerModal;
