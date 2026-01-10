import { supabase } from './supabase';

// WebRTC configuration with STUN and free TURN servers
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Free TURN servers from Open Relay Project
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

export interface Participant {
  odId: string;
  odName: string;
  odAvatar: string;
  // Aliases for consistent naming
  userId: string;
  userName: string;
  userAvatar: string;
  stream?: MediaStream;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isVideoOn?: boolean;
}

type ParticipantHandler = (participants: Map<string, Participant>) => void;

export class WebRTCManager {
  private odId: string;
  private odName: string;
  private odAvatar: string;
  private roomId: string;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private participants: Map<string, Participant> = new Map();
  private channel: any = null;
  private onParticipantsChange: ParticipantHandler;
  private pendingCandidates: Map<string, RTCIceCandidate[]> = new Map();
  private isNegotiating: Map<string, boolean> = new Map();

  constructor(
    userId: string,
    userName: string,
    userAvatar: string,
    roomId: string,
    onParticipantsChange: ParticipantHandler
  ) {
    this.odId = userId;
    this.odName = userName;
    this.odAvatar = userAvatar;
    this.roomId = roomId;
    this.onParticipantsChange = onParticipantsChange;
  }

  async join(stream: MediaStream | null) {
    this.localStream = stream;

    // Subscribe to room channel for signaling
    this.channel = supabase.channel(`room:${this.roomId}`, {
      config: { 
        presence: { key: this.odId },
        broadcast: { self: false, ack: true }
      }
    });

    // Handle presence (who's in the room)
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel.presenceState();
      this.handlePresenceSync(state);
    });

    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
      console.log('User joined:', key, newPresences);
      if (key !== this.odId && newPresences.length > 0) {
        this.initiateCall(key, newPresences[0]);
      }
    });

    this.channel.on('presence', { event: 'leave' }, ({ key }: any) => {
      console.log('User left:', key);
      this.handleUserLeft(key);
    });

    // Handle WebRTC signaling messages
    this.channel.on('broadcast', { event: 'signal' }, ({ payload }: any) => {
      console.log('Received signal broadcast:', payload.from, '->', payload.to, payload.data?.type);
      if (payload.to === this.odId) {
        this.handleSignal(payload);
      }
    });

    // Handle media state updates (mute/video toggle)
    this.channel.on('broadcast', { event: 'mediaState' }, ({ payload }: any) => {
      console.log('Received mediaState broadcast:', payload);
      if (payload.odId !== this.odId) {
        this.handleMediaStateUpdate(payload);
      }
    });

    await this.channel.subscribe(async (status: string) => {
      console.log('Channel subscription status:', status);
      if (status === 'SUBSCRIBED') {
        await this.channel.track({
          odId: this.odId,
          odName: this.odName,
          odAvatar: this.odAvatar,
          isMuted: true,
          isVideoOn: false,
          joinedAt: new Date().toISOString()
        });
      }
    });
  }

  private handleMediaStateUpdate(payload: { odId: string; isMuted: boolean; isVideoOn: boolean }) {
    console.log('Media state update from:', payload.odId, 'muted:', payload.isMuted, 'video:', payload.isVideoOn);
    const participant = this.participants.get(payload.odId);
    if (participant) {
      console.log('Updating participant:', payload.odId, 'old muted:', participant.isMuted, 'new muted:', payload.isMuted);
      participant.isMuted = payload.isMuted;
      participant.isVideoOn = payload.isVideoOn;
      this.participants.set(payload.odId, participant);
      this.onParticipantsChange(new Map(this.participants));
    } else {
      console.log('Participant not found for media state update:', payload.odId, 'known participants:', Array.from(this.participants.keys()));
      // Create participant if not exists
      this.participants.set(payload.odId, {
        odId: payload.odId,
        odName: 'User',
        odAvatar: '🎓',
        userId: payload.odId,
        userName: 'User',
        userAvatar: '🎓',
        isMuted: payload.isMuted,
        isVideoOn: payload.isVideoOn
      });
      this.onParticipantsChange(new Map(this.participants));
    }
  }

  // Broadcast local media state to all participants
  async broadcastMediaState(isMuted: boolean, isVideoOn: boolean) {
    console.log('Broadcasting media state - muted:', isMuted, 'video:', isVideoOn);
    
    // Send broadcast message
    const result = await this.channel?.send({
      type: 'broadcast',
      event: 'mediaState',
      payload: {
        odId: this.odId,
        isMuted,
        isVideoOn
      }
    });
    console.log('Broadcast result:', result);
    
    // Also update presence so new joiners get the state
    await this.channel?.track({
      odId: this.odId,
      odName: this.odName,
      odAvatar: this.odAvatar,
      isMuted,
      isVideoOn,
      joinedAt: new Date().toISOString()
    });
  }

  private handlePresenceSync(state: any) {
    const currentUsers = Object.keys(state);
    
    // Add new participants only - don't update existing ones from presence
    // Media state updates come from broadcast which is more reliable
    currentUsers.forEach(odId => {
      if (odId !== this.odId && !this.participants.has(odId)) {
        const userData = state[odId][0];
        const name = userData.odName || userData.userName || 'User';
        const avatar = userData.odAvatar || userData.userAvatar || '🎓';
        this.participants.set(odId, {
          odId,
          odName: name,
          odAvatar: avatar,
          userId: odId,
          userName: name,
          userAvatar: avatar,
          isMuted: userData.isMuted !== false, // Default to muted
          isVideoOn: userData.isVideoOn === true
        });
      }
      // Don't update existing participants from presence - use broadcast instead
    });

    // Remove left participants
    this.participants.forEach((_, odId) => {
      if (!currentUsers.includes(odId)) {
        this.handleUserLeft(odId);
      }
    });

    this.onParticipantsChange(new Map(this.participants));
  }

  private async initiateCall(targetId: string, userData: any) {
    console.log('Initiating call to:', targetId);
    
    // Check if we already have an active connection
    const existingPc = this.peerConnections.get(targetId);
    if (existingPc && existingPc.connectionState !== 'closed' && existingPc.connectionState !== 'failed') {
      console.log('Already have connection to:', targetId, 'state:', existingPc.connectionState);
      return;
    }
    
    const pc = this.createPeerConnection(targetId, userData);
    
    // Check if this is a reused connection that already has transceivers
    if (pc.getTransceivers().length > 0) {
      console.log('Connection already has transceivers, skipping offer');
      return;
    }
    
    // Always add both audio and video transceivers as sendrecv
    // This allows either party to start sending at any time without renegotiation
    const audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
    const videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });
    
    // Add local tracks to transceivers if available
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      const videoTrack = this.localStream.getVideoTracks()[0];
      
      if (audioTrack) {
        await audioTransceiver.sender.replaceTrack(audioTrack);
      }
      if (videoTrack) {
        await videoTransceiver.sender.replaceTrack(videoTrack);
      }
    }

    // Create and send offer
    try {
      this.isNegotiating.set(targetId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('Sending offer to:', targetId);
      this.sendSignal(targetId, { type: 'offer', sdp: offer.sdp });
    } catch (err) {
      console.error('Error creating offer:', err);
      this.isNegotiating.set(targetId, false);
    }
  }

  private createPeerConnection(targetId: string, userData: any): RTCPeerConnection {
    // Check if existing connection is still usable
    const existingPc = this.peerConnections.get(targetId);
    if (existingPc && existingPc.connectionState !== 'closed' && existingPc.connectionState !== 'failed') {
      console.log('Reusing existing peer connection for:', targetId, 'state:', existingPc.connectionState);
      return existingPc;
    }
    
    // Close existing connection if it's in a bad state
    if (existingPc) {
      console.log('Closing old peer connection for:', targetId, 'state:', existingPc.connectionState);
      existingPc.close();
    }

    console.log('Creating new peer connection for:', targetId);
    const pc = new RTCPeerConnection(rtcConfig);
    this.peerConnections.set(targetId, pc);
    this.pendingCandidates.set(targetId, []);
    this.isNegotiating.set(targetId, false);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to:', targetId);
        this.sendSignal(targetId, { type: 'ice', candidate: event.candidate.toJSON() });
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log(`ICE gathering state with ${targetId}:`, pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${targetId}:`, pc.iceConnectionState);
    };

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received track from:', targetId, 'kind:', event.track.kind, 'enabled:', event.track.enabled);
      const participant = this.participants.get(targetId);
      if (participant) {
        // Use the first stream or create one from the track
        const stream = event.streams[0] || new MediaStream([event.track]);
        participant.stream = stream;
        
        // Check actual track states
        const hasVideo = stream.getVideoTracks().length > 0 && stream.getVideoTracks().some(t => t.enabled);
        const hasAudio = stream.getAudioTracks().length > 0;
        
        participant.isVideoOn = hasVideo;
        // Don't override isMuted from track state - use broadcast state instead
        // participant.isMuted is controlled by broadcastMediaState
        
        this.participants.set(targetId, participant);
        console.log('Updated participant stream:', targetId, 'hasVideo:', hasVideo, 'hasAudio:', hasAudio);
        this.onParticipantsChange(new Map(this.participants));
      } else {
        console.log('Participant not found for track:', targetId);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetId}:`, pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('Peer connection established with:', targetId);
      }
      if (pc.connectionState === 'failed') {
        console.log('Connection failed with:', targetId, '- attempting restart');
        pc.restartIce();
      }
      if (pc.connectionState === 'disconnected') {
        // Give it a moment to reconnect before removing
        setTimeout(() => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            this.handleUserLeft(targetId);
          }
        }, 5000);
      }
    };

    pc.onnegotiationneeded = async () => {
      console.log('Negotiation needed event with:', targetId);
      // We handle renegotiation manually in updateStream, so just log here
    };

    // Initialize participant if not exists
    if (!this.participants.has(targetId)) {
      const name = userData?.odName || userData?.userName || 'User';
      const avatar = userData?.odAvatar || userData?.userAvatar || '🎓';
      this.participants.set(targetId, {
        odId: targetId,
        odName: name,
        odAvatar: avatar,
        userId: targetId,
        userName: name,
        userAvatar: avatar,
        isMuted: true,
        isVideoOn: false
      });
    }

    return pc;
  }

  private async handleSignal(payload: any) {
    const { from, data } = payload;
    console.log('Received signal from:', from, 'type:', data.type);

    let pc = this.peerConnections.get(from);

    if (data.type === 'offer') {
      // Create peer connection if doesn't exist
      if (!pc) {
        pc = this.createPeerConnection(from, {});
      }

      // Handle glare - if we're also trying to send an offer, use "polite peer" pattern
      // The peer with the higher ID is "impolite" and ignores incoming offers when negotiating
      const isPolite = this.odId < from;
      const offerCollision = this.isNegotiating.get(from) || pc.signalingState !== 'stable';
      
      if (offerCollision && !isPolite) {
        console.log('Ignoring offer due to glare (we are impolite peer)');
        return;
      }

      try {
        // If we have a local description pending, rollback first
        if (pc.signalingState === 'have-local-offer') {
          console.log('Rolling back local offer to accept remote offer');
          await pc.setLocalDescription({ type: 'rollback' });
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
        
        // Set all transceivers to sendrecv and add local tracks if available
        const transceivers = pc.getTransceivers();
        for (const transceiver of transceivers) {
          // Ensure direction allows sending
          if (transceiver.direction === 'recvonly') {
            transceiver.direction = 'sendrecv';
          }
          
          if (this.localStream) {
            const kind = transceiver.receiver.track?.kind;
            if (kind === 'audio') {
              const audioTrack = this.localStream.getAudioTracks()[0];
              if (audioTrack && !transceiver.sender.track) {
                await transceiver.sender.replaceTrack(audioTrack);
              }
            } else if (kind === 'video') {
              const videoTrack = this.localStream.getVideoTracks()[0];
              if (videoTrack && !transceiver.sender.track) {
                await transceiver.sender.replaceTrack(videoTrack);
              }
            }
          }
        }
        
        // Add any pending ICE candidates
        const pending = this.pendingCandidates.get(from) || [];
        for (const candidate of pending) {
          await pc.addIceCandidate(candidate);
        }
        this.pendingCandidates.set(from, []);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('Sending answer to:', from);
        this.sendSignal(from, { type: 'answer', sdp: answer.sdp });
      } catch (err) {
        console.error('Error handling offer:', err);
      }

    } else if (data.type === 'answer') {
      if (!pc) {
        console.log('No peer connection for answer from:', from);
        return;
      }
      
      // Only accept answer if we're expecting one
      if (pc.signalingState !== 'have-local-offer') {
        console.log('Ignoring answer - not in have-local-offer state, current state:', pc.signalingState);
        return;
      }
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
        this.isNegotiating.set(from, false);
        
        // Add any pending ICE candidates
        const pending = this.pendingCandidates.get(from) || [];
        for (const candidate of pending) {
          await pc.addIceCandidate(candidate);
        }
        this.pendingCandidates.set(from, []);
        console.log('Answer processed from:', from);
      } catch (err) {
        console.error('Error handling answer:', err);
        this.isNegotiating.set(from, false);
      }

    } else if (data.type === 'ice') {
      try {
        const candidate = new RTCIceCandidate(data.candidate);
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(candidate);
          console.log('Added ICE candidate from:', from);
        } else {
          // Queue the candidate if remote description not set yet
          console.log('Queuing ICE candidate from:', from);
          const pending = this.pendingCandidates.get(from) || [];
          pending.push(candidate);
          this.pendingCandidates.set(from, pending);
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  }

  private sendSignal(targetId: string, data: any) {
    this.channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { from: this.odId, to: targetId, data }
    });
  }

  private handleUserLeft(odId: string) {
    console.log('Handling user left:', odId);
    const pc = this.peerConnections.get(odId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(odId);
    }
    this.pendingCandidates.delete(odId);
    this.isNegotiating.delete(odId);
    this.participants.delete(odId);
    this.onParticipantsChange(new Map(this.participants));
  }

  updateStream(stream: MediaStream | null) {
    console.log('Updating stream:', stream ? `${stream.getTracks().length} tracks` : 'null');
    this.localStream = stream;
    
    // Update all peer connections with new tracks using existing transceivers
    // Since we always create sendrecv transceivers, we just need to replaceTrack
    // No renegotiation needed!
    this.peerConnections.forEach(async (pc, odId) => {
      const transceivers = pc.getTransceivers();
      console.log(`Updating peer ${odId}, transceivers:`, transceivers.length, 'state:', pc.connectionState);
      
      for (const transceiver of transceivers) {
        const kind = transceiver.receiver.track?.kind;
        
        if (kind === 'audio') {
          const audioTrack = stream?.getAudioTracks()[0] || null;
          console.log(`Setting audio track for ${odId}:`, audioTrack ? 'has track' : 'null');
          try {
            await transceiver.sender.replaceTrack(audioTrack);
          } catch (err) {
            console.error('Error setting audio track:', err);
          }
        } else if (kind === 'video') {
          const videoTrack = stream?.getVideoTracks()[0] || null;
          console.log(`Setting video track for ${odId}:`, videoTrack ? 'has track' : 'null');
          try {
            await transceiver.sender.replaceTrack(videoTrack);
          } catch (err) {
            console.error('Error setting video track:', err);
          }
        }
      }
    });
  }

  async leave() {
    console.log('Leaving room');
    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    this.participants.clear();
    this.pendingCandidates.clear();
    this.isNegotiating.clear();

    // Unsubscribe from channel
    if (this.channel) {
      await this.channel.untrack();
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }

    this.onParticipantsChange(new Map());
  }

  getParticipants(): Map<string, Participant> {
    return new Map(this.participants);
  }
}
