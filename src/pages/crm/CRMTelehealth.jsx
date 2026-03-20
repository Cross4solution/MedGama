import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import ProTeaser from '../../components/crm/ProTeaser';
import useTelehealth from '../../hooks/useTelehealth';
import {
  Video, VideoOff, Mic, MicOff, Monitor, PhoneOff, Captions,
  CaptionsOff, Clock, Shield, Wifi, WifiOff, User, Stethoscope,
  Maximize2, Minimize2, Settings, MessageCircle, ChevronRight,
  AlertCircle, Loader2, Phone,
} from 'lucide-react';

function CRMTelehealth() {
  const { t } = useTranslation();
  const { user, isPro } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('id');

  const {
    session, loading, error, meetingStatus,
    transcripts, isTranscribing, formattedElapsed,
    startSession, endSession, startTranscription, stopTranscription,
  } = useTelehealth(appointmentId);

  // Local UI states
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Scroll transcript to bottom
  const transcriptRef = React.useRef(null);
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Pro gate
  if (user?.role_id === 'doctor' && !isPro) return <ProTeaser page="telehealth" />;

  // No appointment ID
  if (!appointmentId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">{t('telehealth.noAppointment', 'No Appointment Selected')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('telehealth.noAppointmentHint', 'Please select an appointment to start a telehealth session.')}</p>
          <button
            onClick={() => navigate('/crm/appointments')}
            className="mt-4 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
          >
            {t('telehealth.goToAppointments', 'Go to Appointments')}
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t('telehealth.loading', 'Preparing telehealth room...')}</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">{t('telehealth.error', 'Connection Error')}</h2>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
          >
            {t('telehealth.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  const doctor = session?.doctor;
  const patient = session?.patient;
  const room = session?.room;
  const isDoctor = user?.id === doctor?.id;
  const otherParticipant = isDoctor ? patient : doctor;
  const isDev = room?.mode === 'development';
  const isActive = meetingStatus === 'in_progress';
  const isCompleted = meetingStatus === 'completed';

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/80 backdrop-blur border-b border-gray-800 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-gray-200">
              {t('telehealth.title', 'Telehealth Session')}
            </span>
          </div>
          {isDev && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              DEV MODE
            </span>
          )}
          {isActive && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-800 px-2.5 py-1 rounded-lg">
              <Clock className="w-3 h-3" />
              <span className="font-mono">{formattedElapsed}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {isDev ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isDev ? 'Simulated' : 'Connected'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span>{t('telehealth.encrypted', 'E2E Encrypted')}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Main Video Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Main Video */}
          <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
            {/* Mock video placeholder */}
            {isCompleted ? (
              <div className="text-center">
                <Phone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-300">{t('telehealth.sessionEnded', 'Session Ended')}</h3>
                <p className="text-sm text-gray-500 mt-2">{t('telehealth.sessionEndedHint', 'The telehealth session has been completed.')}</p>
                <button
                  onClick={() => navigate('/crm/appointments')}
                  className="mt-4 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
                >
                  {t('telehealth.backToAppointments', 'Back to Appointments')}
                </button>
              </div>
            ) : !isActive ? (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center mx-auto mb-4">
                  {otherParticipant?.avatar ? (
                    <img src={otherParticipant.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-200">{otherParticipant?.fullname || 'Participant'}</h3>
                <p className="text-sm text-gray-500 mt-1">{t('telehealth.waitingToJoin', 'Waiting to start the session...')}</p>
                <button
                  onClick={() => { startSession(); startTranscription(); }}
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-sm font-bold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 mx-auto"
                >
                  <Video className="w-5 h-5" />
                  {t('telehealth.startCall', 'Start Call')}
                </button>
              </div>
            ) : (
              <>
                {/* Simulated active video */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 flex items-center justify-center">
                  {videoOn ? (
                    <div className="text-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border-2 border-teal-500/30 flex items-center justify-center mx-auto">
                        {otherParticipant?.avatar ? (
                          <img src={otherParticipant.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Stethoscope className="w-12 h-12 text-teal-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-3">{otherParticipant?.fullname || 'Participant'}</p>
                      <p className="text-[10px] text-teal-400 mt-0.5">{t('telehealth.videoSimulation', 'Video simulation active')}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">{t('telehealth.cameraOff', 'Camera is off')}</p>
                    </div>
                  )}
                </div>

                {/* Self-view (picture-in-picture) */}
                <div className="absolute bottom-4 right-4 w-40 h-28 rounded-xl bg-gray-900 border border-gray-700 overflow-hidden shadow-2xl">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                  <div className="absolute bottom-1.5 left-2 text-[10px] text-gray-400 font-medium bg-black/50 px-1.5 py-0.5 rounded">
                    {t('telehealth.you', 'You')}
                  </div>
                </div>
              </>
            )}

            {/* Live Translation Subtitle Bar */}
            {isActive && transcripts.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-4 pointer-events-none">
                <div
                  ref={transcriptRef}
                  className="max-h-24 overflow-y-auto bg-black/70 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/5 pointer-events-auto"
                >
                  {transcripts.slice(-5).map((tr, i) => (
                    <p key={i} className={`text-sm leading-relaxed ${i === transcripts.slice(-5).length - 1 ? 'text-white font-medium' : 'text-gray-400'}`}>
                      {tr.text}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  <Captions className="w-3 h-3 text-teal-400" />
                  <span className="text-[10px] text-teal-400 font-medium">
                    {t('telehealth.liveTranslation', 'Live Translation')} — {isDev ? 'Simulation' : 'Deepgram'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          {!isCompleted && (
            <div className="flex items-center justify-center gap-3 px-4 py-4 bg-gray-900/90 backdrop-blur border-t border-gray-800">
              {/* Mic */}
              <button
                onClick={() => setMicOn(!micOn)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  micOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
                title={micOn ? t('telehealth.muteMic', 'Mute') : t('telehealth.unmuteMic', 'Unmute')}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Video */}
              <button
                onClick={() => setVideoOn(!videoOn)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  videoOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
                title={videoOn ? t('telehealth.stopVideo', 'Stop Video') : t('telehealth.startVideo', 'Start Video')}
              >
                {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Screen Share */}
              <button
                onClick={() => setScreenShare(!screenShare)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  screenShare ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title={t('telehealth.screenShare', 'Share Screen')}
              >
                <Monitor className="w-5 h-5" />
              </button>

              {/* Captions toggle */}
              <button
                onClick={() => isTranscribing ? stopTranscription() : startTranscription()}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isTranscribing ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title={t('telehealth.captions', 'Live Captions')}
              >
                {isTranscribing ? <Captions className="w-5 h-5" /> : <CaptionsOff className="w-5 h-5" />}
              </button>

              {/* Fullscreen */}
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen?.();
                    setFullscreen(true);
                  } else {
                    document.exitFullscreen?.();
                    setFullscreen(false);
                  }
                }}
                className="w-12 h-12 rounded-2xl bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-all"
                title={t('telehealth.fullscreen', 'Fullscreen')}
              >
                {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>

              {/* Chat */}
              <button
                onClick={() => setShowChat(!showChat)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  showChat ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title={t('telehealth.chat', 'Chat')}
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              {/* Settings */}
              <button
                className="w-12 h-12 rounded-2xl bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-all"
                title={t('telehealth.settings', 'Settings')}
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* End Call */}
              {isActive && (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="w-14 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/25 ml-2"
                  title={t('telehealth.endCall', 'End Call')}
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Participants + Transcript History */}
        <div className="w-80 border-l border-gray-800 bg-gray-900/50 flex flex-col hidden lg:flex">
          {/* Participants */}
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              {t('telehealth.participants', 'Participants')} (2)
            </h3>
            <div className="space-y-2.5">
              {/* Doctor */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800/50">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center overflow-hidden">
                    {doctor?.avatar ? (
                      <img src={doctor.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Stethoscope className="w-4 h-4 text-teal-400" />
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    Dr. {doctor?.fullname || 'Doctor'}
                  </p>
                  <p className="text-[10px] text-teal-400">{t('telehealth.doctor', 'Doctor')}</p>
                </div>
                {user?.id === doctor?.id && (
                  <span className="text-[9px] bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded font-medium">
                    {t('telehealth.you', 'You')}
                  </span>
                )}
              </div>

              {/* Patient */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800/50">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center overflow-hidden">
                    {patient?.avatar ? (
                      <img src={patient.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {patient?.fullname || 'Patient'}
                  </p>
                  <p className="text-[10px] text-blue-400">{t('telehealth.patient', 'Patient')}</p>
                </div>
                {user?.id === patient?.id && (
                  <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium">
                    {t('telehealth.you', 'You')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Appointment Info */}
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {t('telehealth.appointmentInfo', 'Appointment')}
            </h3>
            <div className="space-y-1.5 text-xs text-gray-400">
              <p><span className="text-gray-500">{t('telehealth.date', 'Date')}:</span> {session?.appointment?.appointment_date || '—'}</p>
              <p><span className="text-gray-500">{t('telehealth.time', 'Time')}:</span> {session?.appointment?.appointment_time || '—'}</p>
              <p><span className="text-gray-500">{t('telehealth.type', 'Type')}:</span> {session?.appointment?.appointment_type || 'Online'}</p>
              <p><span className="text-gray-500">{t('telehealth.status', 'Status')}:</span>{' '}
                <span className={`font-medium ${
                  meetingStatus === 'in_progress' ? 'text-emerald-400' :
                  meetingStatus === 'completed' ? 'text-gray-400' : 'text-amber-400'
                }`}>
                  {meetingStatus === 'in_progress' ? t('telehealth.inProgress', 'In Progress') :
                   meetingStatus === 'completed' ? t('telehealth.completed', 'Completed') :
                   t('telehealth.waiting', 'Waiting')}
                </span>
              </p>
            </div>
          </div>

          {/* Transcript History */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {t('telehealth.transcriptHistory', 'Transcript')}
              </h3>
              {isTranscribing && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-red-400 font-medium">{t('telehealth.recording', 'REC')}</span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {transcripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Captions className="w-8 h-8 text-gray-700 mb-2" />
                  <p className="text-xs text-gray-600">{t('telehealth.noTranscripts', 'Transcripts will appear here when the session starts.')}</p>
                </div>
              ) : (
                transcripts.map((tr, i) => (
                  <div key={i} className="rounded-lg bg-gray-800/50 px-3 py-2">
                    <p className="text-xs text-gray-300 leading-relaxed">{tr.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-gray-600">
                        {new Date(tr.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[9px] text-teal-600">{Math.round(tr.confidence * 100)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* End Call Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <PhoneOff className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white text-center">{t('telehealth.endCallConfirm', 'End Call?')}</h3>
            <p className="text-sm text-gray-400 text-center mt-2">
              {t('telehealth.endCallHint', 'This will end the telehealth session for all participants.')}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-600 text-gray-300 text-sm font-semibold hover:bg-gray-800 transition"
              >
                {t('telehealth.cancel', 'Cancel')}
              </button>
              <button
                onClick={() => { setShowEndConfirm(false); endSession(); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
              >
                {t('telehealth.endCall', 'End Call')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CRMTelehealth;
