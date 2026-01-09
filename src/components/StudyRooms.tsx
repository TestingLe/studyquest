import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playAmbientSound, stopAmbientSound, AmbientType } from '../utils/ambientSounds';

interface StudyRoom {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  maxParticipants: number;
}

interface StudyRoomsProps {
  userName?: string;
  userAvatar?: string;
}

const availableRooms: StudyRoom[] = [
  { id: 'library', name: 'Silent Library', description: 'Quiet study space', icon: '📚', color: 'from-blue-500 to-indigo-600', maxParticipants: 25 },
  { id: 'cafe', name: 'Coffee Shop', description: 'Cozy vibes with ambient sounds', icon: '☕', color: 'from-amber-500 to-orange-600', maxParticipants: 20 },
  { id: 'forest', name: 'Nature Retreat', description: 'Peaceful forest ambiance', icon: '🌲', color: 'from-green-500 to-emerald-600', maxParticipants: 15 },
  { id: 'space', name: 'Space Station', description: 'Futuristic ambient sounds', icon: '🚀', color: 'from-purple-500 to-pink-600', maxParticipants: 12 },
  { id: 'lofi', name: 'Lo-Fi Room', description: 'Chill beats to study to', icon: '🎧', color: 'from-pink-500 to-rose-600', maxParticipants: 30 },
  { id: 'pomodoro', name: 'Pomodoro Group', description: 'Synchronized study sessions', icon: '🍅', color: 'from-red-500 to-orange-600', maxParticipants: 10 }
];

export const StudyRooms: React.FC<StudyRoomsProps> = ({ userName = 'You', userAvatar = '🎓' }) => {
  const [activeRoom, setActiveRoom] = useState<StudyRoom | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{id: string; name: string; text: string; time: Date}[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ambientSound, setAmbientSound] = useState<AmbientType>('silence');
  const [ambientVolume, setAmbientVolume] = useState(30);
  const [ambientMinimized, setAmbientMinimized] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Check URL for room invite on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      // Extract room type from the room ID (e.g., "library-abc123" -> "library")
      const roomType = roomParam.split('-')[0];
      const room = availableRooms.find(r => r.id === roomType);
      if (room) {
        setRoomId(roomParam);
        setActiveRoom(room);
        const link = `${window.location.origin}${window.location.pathname}?room=${roomParam}`;
        setInviteLink(link);
        setChatMessages([
          { id: '1', name: 'System', text: `You joined ${room.name}! Others with the link will appear here.`, time: new Date() }
        ]);
        // Clear the URL param without reload
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Session timer
  useEffect(() => {
    if (activeRoom) {
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startVoiceDetection = useCallback((stream: MediaStream) => {
    try {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.4;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const checkAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        const voiceRange = Math.floor(bufferLength * 0.5);
        for (let i = 0; i < voiceRange; i++) sum += dataArray[i];
        setIsSpeaking(sum / voiceRange > 20);
        animationRef.current = requestAnimationFrame(checkAudio);
      };
      checkAudio();
    } catch (err) { console.error('Voice detection error:', err); }
  }, []);

  const stopVoiceDetection = useCallback(() => {
    if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    analyserRef.current = null;
    setIsSpeaking(false);
  }, []);

  const joinRoom = useCallback((room: StudyRoom) => {
    const newRoomId = `${room.id}-${Date.now().toString(36)}`;
    setRoomId(newRoomId);
    const link = `${window.location.origin}${window.location.pathname}?room=${newRoomId}`;
    setInviteLink(link);
    setActiveRoom(room);
    setSessionTime(0);
    setIsMuted(true);
    setIsVideoOn(false);
    setChatMessages([{ id: '1', name: 'System', text: `Welcome to ${room.name}! Share the invite link to study with friends.`, time: new Date() }]);
  }, []);

  const leaveRoom = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    stopVoiceDetection();
    stopAmbientSound();
    setActiveRoom(null);
    setRoomId('');
    setSessionTime(0);
    setIsVideoOn(false);
    setIsMuted(true);
    setShowChat(false);
    setInviteLink('');
    setIsSpeaking(false);
    setAmbientSound('silence');
  }, [stopVoiceDetection]);

  const toggleMute = useCallback(async () => {
    const newMutedState = !isMuted;
    if (!newMutedState && !streamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        startVoiceDetection(stream);
      } catch (err) {
        alert('Could not access microphone. Please allow microphone permissions.');
        return;
      }
    }
    if (streamRef.current) streamRef.current.getAudioTracks().forEach(track => { track.enabled = !newMutedState; });
    if (!newMutedState && streamRef.current) startVoiceDetection(streamRef.current);
    setIsMuted(newMutedState);
    if (newMutedState) setIsSpeaking(false);
  }, [isMuted, startVoiceDetection]);

  const toggleVideo = useCallback(async () => {
    if (!isVideoOn) {
      setIsVideoLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: true });
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = stream;
        stream.getAudioTracks().forEach(track => { track.enabled = !isMuted; });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play().catch(() => {}); };
        }
        startVoiceDetection(stream);
        setIsVideoOn(true);
      } catch (err: any) {
        alert(err.name === 'NotAllowedError' ? 'Camera permission denied.' : 'Could not access camera.');
      } finally { setIsVideoLoading(false); }
    } else {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => track.stop());
        const audioTracks = streamRef.current.getAudioTracks();
        streamRef.current = audioTracks.length > 0 ? new MediaStream(audioTracks) : null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsVideoOn(false);
    }
  }, [isVideoOn, isMuted, startVoiceDetection]);

  const toggleAmbientSound = useCallback((type: AmbientType) => {
    if (ambientSound === type) { stopAmbientSound(); setAmbientSound('silence'); }
    else { playAmbientSound(type, ambientVolume / 100); setAmbientSound(type); }
  }, [ambientSound, ambientVolume]);

  const copyInviteLink = useCallback(() => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteLink]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages(prev => [...prev, { id: Date.now().toString(), name: userName, text: newMessage.trim(), time: new Date() }]);
    setNewMessage('');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Room selection view
  if (!activeRoom) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Study Rooms</h2>
          <p className="text-gray-600">Create a room and invite friends to study together</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRooms.map(room => (
            <div key={room.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className={`bg-gradient-to-r ${room.color} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{room.icon}</span>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Up to {room.maxParticipants}</span>
                </div>
                <h3 className="text-xl font-bold mb-1">{room.name}</h3>
                <p className="text-white/80 text-sm">{room.description}</p>
              </div>
              <div className="p-4">
                <button onClick={() => joinRoom(room)} className="w-full py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-all">Create Room</button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Study Better Together 🤝</h3>
          <p className="text-indigo-100">Create a room and share the invite link with friends to study together in real-time.</p>
        </div>
      </div>
    );
  }

  // Active room view
  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{activeRoom.icon}</span>
          <div>
            <h2 className="text-white font-semibold">{activeRoom.name}</h2>
            <p className="text-gray-400 text-xs">Room: {roomId.slice(-8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-700 px-4 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-white font-mono text-sm">{formatTime(sessionTime)}</span>
          </div>
          <button onClick={() => setShowInviteModal(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
            <span>👥</span> Invite
          </button>
          <button onClick={() => setShowChat(!showChat)} className={`p-2 rounded-lg transition-colors ${showChat ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💬</button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 p-4 flex items-center justify-center ${showChat ? 'pr-0' : ''}`}>
          <div className={`relative w-full max-w-4xl aspect-video bg-gray-800 rounded-2xl overflow-hidden transition-all duration-150 ${isSpeaking && !isMuted ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/30' : ''}`}>
            {isVideoLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Starting camera...</p>
              </div>
            ) : isVideoOn ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className={`w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-5xl mb-4 transition-all duration-150 ${isSpeaking && !isMuted ? 'ring-4 ring-green-500 scale-110' : ''}`}>{userAvatar}</div>
                <p className="text-gray-400">{isMuted ? 'Click mic to unmute' : 'Camera is off'}</p>
              </div>
            )}
            {isSpeaking && !isMuted && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500 px-3 py-1.5 rounded-full animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                <span className="text-white text-sm font-medium">Speaking</span>
              </div>
            )}
            {!isMuted && !isSpeaking && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-full">
                <span className="text-white text-sm">🎤 Mic on</span>
              </div>
            )}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${isSpeaking && !isMuted ? 'bg-green-500 text-white' : 'bg-black/60 text-white'}`}>{userName}</span>
              {isMuted && <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs">🔇 Muted</span>}
            </div>

            {/* Ambient Sounds Panel - Minimizable */}
            <div className={`absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl transition-all ${ambientMinimized ? 'p-2' : 'p-4 max-w-xs'}`}>
              {ambientMinimized ? (
                <button onClick={() => setAmbientMinimized(false)} className="flex items-center gap-2 text-white hover:text-indigo-300 transition-colors">
                  <span className="text-xl">🎵</span>
                  {ambientSound !== 'silence' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white text-sm">🎵 Ambient Sounds</p>
                    <button onClick={() => setAmbientMinimized(true)} className="text-gray-400 hover:text-white text-lg">−</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { type: 'rain' as AmbientType, icon: '🌧️', label: 'Rain' },
                      { type: 'cafe' as AmbientType, icon: '☕', label: 'Cafe' },
                      { type: 'forest' as AmbientType, icon: '🌲', label: 'Forest' },
                      { type: 'space' as AmbientType, icon: '🚀', label: 'Space' },
                    ].map(({ type, icon, label }) => (
                      <button key={type} onClick={() => toggleAmbientSound(type)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${ambientSound === type ? 'bg-indigo-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                  {ambientSound !== 'silence' && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-white text-xs">🔊</span>
                      <input type="range" min="0" max="100" value={ambientVolume} onChange={(e) => { const vol = Number(e.target.value); setAmbientVolume(vol); playAmbientSound(ambientSound, vol / 100); }} className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  )}
                  <div className="border-t border-white/20 pt-3">
                    <button onClick={() => setShowInviteModal(true)} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">Get Invite Link</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 flex flex-col border-l border-gray-700">
            <div className="p-3 border-b border-gray-700"><h3 className="text-white font-semibold">Chat</h3></div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map(msg => (
                <div key={msg.id} className={msg.name === 'System' ? 'text-center' : ''}>
                  {msg.name === 'System' ? (
                    <span className="text-gray-500 text-sm">{msg.text}</span>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-sm font-medium ${msg.name === userName ? 'text-indigo-400' : 'text-white'}`}>{msg.name}</span>
                        <span className="text-gray-500 text-xs">{msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{msg.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="p-3 border-t border-gray-700">
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Send a message..." className="w-full bg-gray-700 text-white placeholder-gray-400 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </form>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="h-20 bg-gray-800 flex items-center justify-center gap-4 px-4">
        <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`} title={isMuted ? 'Unmute' : 'Mute'}>{isMuted ? '🔇' : '🎤'}</button>
        <button onClick={toggleVideo} disabled={isVideoLoading} className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${isVideoLoading ? 'bg-gray-500 text-white cursor-wait' : !isVideoOn ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`} title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}>{isVideoLoading ? '⏳' : isVideoOn ? '📹' : '📷'}</button>
        <button onClick={() => setShowChat(!showChat)} className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${showChat ? 'bg-indigo-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`} title="Chat">💬</button>
        <button onClick={() => setShowInviteModal(true)} className="w-14 h-14 rounded-full bg-gray-600 text-white hover:bg-gray-500 flex items-center justify-center text-xl transition-all" title="Invite">👥</button>
        <div className="w-px h-10 bg-gray-600 mx-2" />
        <button onClick={leaveRoom} className="px-8 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold flex items-center gap-2 transition-all text-lg">Leave</button>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Invite Friends</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <p className="text-gray-400 mb-4">Share this link with friends to invite them to your study room:</p>
            <div className="bg-gray-700 rounded-lg p-3 flex items-center gap-2 mb-4">
              <input type="text" value={inviteLink} readOnly className="flex-1 bg-transparent text-white text-sm outline-none" />
              <button onClick={copyInviteLink} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${copied ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}>{copied ? '✓ Copied!' : 'Copy'}</button>
            </div>
            <div className="text-center text-gray-500 text-sm">
              <p>🔒 Only people with the link can join</p>
              <p className="mt-2 text-xs">When they click the link, they'll join your room automatically!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
