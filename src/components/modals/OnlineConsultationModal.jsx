import React, { useState } from 'react';
import { X, Video, Clock, Shield, CheckCircle2, Loader2, Wifi, Monitor, Mic } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OnlineConsultationModal({ open, onClose, targetId, targetName, targetType = 'doctor' }) {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');

  const [step, setStep] = useState(1); // 1 = info, 2 = device check, 3 = queue
  const [checkingDevices, setCheckingDevices] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({ camera: null, mic: null, internet: null });
  const [joining, setJoining] = useState(false);

  const handleDeviceCheck = () => {
    setStep(2);
    setCheckingDevices(true);
    // Simulate device checks
    setTimeout(() => setDeviceStatus(prev => ({ ...prev, internet: true })), 600);
    setTimeout(() => setDeviceStatus(prev => ({ ...prev, mic: true })), 1200);
    setTimeout(() => {
      setDeviceStatus(prev => ({ ...prev, camera: true }));
      setCheckingDevices(false);
    }, 1800);
  };

  const handleJoin = () => {
    setJoining(true);
    setStep(3);
    // Simulate joining queue
    setTimeout(() => {
      setJoining(false);
    }, 2000);
  };

  const handleClose = () => {
    setStep(1);
    setDeviceStatus({ camera: null, mic: null, internet: null });
    setJoining(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
        {/* Header */}
        <div className="border-b border-gray-100 px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Video className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{isTr ? 'Görüntülü Görüşme' : 'Telehealth'}</h2>
              <p className="text-xs text-gray-500">{targetName}</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-5">
          {/* Step 1: Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-100">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{isTr ? 'Güvenli Video Görüşme' : 'Secure Video Call'}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {isTr
                        ? 'Uçtan uca şifreli görüşme. Verileriniz KVKK ve GDPR uyumlu olarak korunur.'
                        : 'End-to-end encrypted session. Your data is protected and GDPR compliant.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{isTr ? 'Ortalama süre: 15-30 dakika' : 'Average duration: 15-30 minutes'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Monitor className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{isTr ? 'Kamera ve mikrofon gerekli' : 'Camera and microphone required'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Wifi className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{isTr ? 'Kararlı internet bağlantısı önerilir' : 'Stable internet connection recommended'}</span>
                </div>
              </div>

              <button
                onClick={handleDeviceCheck}
                className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                {isTr ? 'Cihaz Kontrolüne Başla' : 'Start Device Check'}
              </button>
            </div>
          )}

          {/* Step 2: Device Check */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">{isTr ? 'Cihaz Kontrolü' : 'Device Check'}</h3>

              <div className="space-y-2.5">
                {[
                  { key: 'internet', icon: Wifi, label: isTr ? 'İnternet Bağlantısı' : 'Internet Connection' },
                  { key: 'mic', icon: Mic, label: isTr ? 'Mikrofon' : 'Microphone' },
                  { key: 'camera', icon: Monitor, label: isTr ? 'Kamera' : 'Camera' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </div>
                    {deviceStatus[item.key] === null ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : deviceStatus[item.key] ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                ))}
              </div>

              {!checkingDevices && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                    {isTr ? 'Geri' : 'Back'}
                  </button>
                  <button
                    onClick={handleJoin}
                    className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    {isTr ? 'Görüşmeye Katıl' : 'Join Call'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Waiting Room / Queue */}
          {step === 3 && (
            <div className="py-6 text-center space-y-4">
              {joining ? (
                <>
                  <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
                  <p className="text-sm text-gray-600 font-medium">{isTr ? 'Bağlanılıyor...' : 'Connecting...'}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Video className="w-8 h-8 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{isTr ? 'Bekleme Odasında' : 'In Waiting Room'}</h3>
                    <p className="text-sm text-gray-500">
                      {isTr
                        ? `${targetName} sizi kısa süre içinde kabul edecek.`
                        : `${targetName} will accept you shortly.`}
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-700 font-medium">
                      {isTr ? 'Tahmini bekleme süresi: 2-5 dakika' : 'Estimated wait time: 2-5 minutes'}
                    </p>
                  </div>
                  <button onClick={handleClose} className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                    {isTr ? 'Görüşmeden Ayrıl' : 'Leave Call'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
