import { supabase } from './supabase';

// WebRTC configuration with STUN and TURN servers
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Free TURN server for NAT traversal
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

export interface Participant {
  odId: string;
  odName: string;
  odAvatar: string;
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
  private makingOffer: Map<string, boolean> = new Map();
  private ignoreOffer: Map<string, boolean> = new Map();

  constructor(
    odId: string,
    odName: string,
    odAvatar: string,
    roomId: string,
    onParticipantsChange: ParticipantHandler
  ) {
    this.odId = odId;
    this.odName = odName;
    this.odAvatar = odAvatar;
    this.roomId = roomId;
    this.onParticipantsChange = onParticipantsChange;
  }

  async join(stream: MediaStream | null) {
    this.localStream = stream;
    
    this.channel = supabase.channel(`room:${this.roomId}`, {
      config: { presence: { key: this.odId } }
    });

    // When presence syncs, we know who's in the room
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel.presenceState();
      this.handlePresenceSync(state);
    });

    // When someone joins, initiate connection if we have higher ID (to avoid both calling)
    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
      if (key !== this.odId && newPresences.length > 0) {
        console.log('User joined:', key);
        // Only the peer with higher ID initiates to avoid collision
        if (this.odId > key) {
          this.createPeerConnection(key, newPresences[0], true);
        }
      }
    });

    this.channel.on('presence', { event: 'leave' }, ({ key }: any) => {
      console.log('User left:', key);
      this.removePeer(key);
    });

    // Handle signaling
    this.channel.on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
      if (payload.target === this.odId) {
        await this.handleSignal(payload);
      }
    });

    // Handle media state broadcasts
    this.channel.on('broadcast', { event: 'mediaState' }, ({ payload }: any) => {
      if (payload.odId !== this.odId) {
        const p = this.participants.get(payload.odId);
        if (p) {
          p.isMuted = payload.isMuted;
          p.isVideoOn = payload.isVideoOn;
          this.participants.set(payload.odId, p);
          this.onParticipantsChange(new Map(this.participants));
        }
      }
    });

    await this.channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await this.channel.track({
          odId: this.odId,
          odName: this.odName,
          odAvatar: this.odAvatar,
          isMuted: true,
          isVideoOn: false
        });
      }
    });
  }

  private handlePresenceSync(state: any) {
    const users = Object.keys(state);
    
    users.forEach(odId => {
      if (odId !== this.odId) {
        const userData = state[odId][0];
        
        if (!this.participants.has(odId)) {
          // Add new participant
          this.participants.set(odId, {
            odId,
            odName: userData.odName || 'User',
            odAvatar: userData.odAvatar || '🎓',
            userId: odId,
            userName: userData.odName || 'User',
            userAvatar: userData.odAvatar || '🎓',
            isMuted: userData.isMuted !== false,
            isVideoOn: userData.isVideoOn === true
          });
          
          // Create connection if we have higher ID
          if (this.odId > odId && !this.peerConnections.has(odId)) {
            this.createPeerConnection(odId, userData, true);
          }
        }
      }
    });

    // Remove users who left
    this.participants.forEach((_, odId) => {
      if (!users.includes(odId)) {
        this.removePeer(odId);
      }
    });

    this.onParticipantsChange(new Map(this.participants));
  }

  private createPeerConnection(targetId: string, userData: any, createOffer: boolean) {
    if (this.peerConnections.has(targetId)) {
      const existing = this.peerConnections.get(targetId)!;
      if (existing.connectionState !== 'closed' && existing.connectionState !== 'failed') {
        return existing;
      }
      existing.close();
    }

    console.log('Creating peer connection to:', targetId, 'createOffer:', createOffer);
    const pc = new RTCPeerConnection(rtcConfig);
    this.peerConnections.set(targetId, pc);
    this.makingOffer.set(targetId, false);
    this.ignoreOffer.set(targetId, false);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle negotiation needed - this fires when tracks are added
    pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer.set(targetId, true);
        await pc.setLocalDescription();
        this.sendSignal(targetId, { type: 'offer', sdp: pc.localDescription });
      } catch (err) {
        console.error('Error in negotiation:', err);
      } finally {
        this.makingOffer.set(targetId, false);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.sendSignal(targetId, { type: 'candidate', candidate });
      }
    };

    // Handle incoming tracks
    pc.ontrack = ({ streams }) => {
      console.log('Received track from:', targetId);
      const p = this.participants.get(targetId);
      if (p) {
        p.stream = streams[0];
        this.participants.set(targetId, p);
        this.onParticipantsChange(new Map(this.participants));
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection to ${targetId}:`, pc.connectionState);
      if (pc.connectionState === 'failed') {
        this.removePeer(targetId);
      }
    };

    // Ensure participant exists
    if (!this.participants.has(targetId)) {
      this.participants.set(targetId, {
        odId: targetId,
        odName: userData?.odName || 'User',
        odAvatar: userData?.odAvatar || '🎓',
        userId: targetId,
        userName: userData?.odName || 'User',
        userAvatar: userData?.odAvatar || '🎓',
        isMuted: true,
        isVideoOn: false
      });
      this.onParticipantsChange(new Map(this.participants));
    }

    return pc;
  }

  private async handleSignal(payload: any) {
    const { sender, data } = payload;
    
    let pc = this.peerConnections.get(sender);
    if (!pc) {
      pc = this.createPeerConnection(sender, {}, false);
    }

    try {
      if (data.type === 'offer') {
        // Perfect negotiation pattern
        const offerCollision = this.makingOffer.get(sender) || pc.signalingState !== 'stable';
        const polite = this.odId < sender; // Lower ID is polite
        
        this.ignoreOffer.set(sender, !polite && offerCollision);
        if (this.ignoreOffer.get(sender)) {
          console.log('Ignoring colliding offer from:', sender);
          return;
        }

        await pc.setRemoteDescription(data);
        
        // Add tracks if we have them
        if (this.localStream) {
          const senders = pc.getSenders();
          this.localStream.getTracks().forEach(track => {
            if (!senders.find(s => s.track === track)) {
              pc!.addTrack(track, this.localStream!);
            }
          });
        }
        
        await pc.setLocalDescription();
        this.sendSignal(sender, { type: 'answer', sdp: pc.localDescription });
        
      } else if (data.type === 'answer') {
        await pc.setRemoteDescription(data);
        
      } else if (data.type === 'candidate' && data.candidate) {
        await pc.addIceCandidate(data.candidate);
      }
    } catch (err) {
      console.error('Signal handling error:', err);
    }
  }

  private sendSignal(targetId: string, data: any) {
    this.channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { sender: this.odId, target: targetId, data }
    });
  }

  private removePeer(odId: string) {
    const pc = this.peerConnections.get(odId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(odId);
    }
    this.participants.delete(odId);
    this.makingOffer.delete(odId);
    this.ignoreOffer.delete(odId);
    this.onParticipantsChange(new Map(this.participants));
  }

  updateStream(stream: MediaStream | null) {
    const oldStream = this.localStream;
    this.localStream = stream;

    this.peerConnections.forEach((pc, _odId) => {
      const senders = pc.getSenders();
      
      if (stream) {
        stream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        });
      } else {
        // Remove tracks
        senders.forEach(sender => {
          if (sender.track) {
            pc.removeTrack(sender);
          }
        });
      }
    });

    // Stop old tracks
    if (oldStream && oldStream !== stream) {
      oldStream.getTracks().forEach(t => t.stop());
    }
  }

  async broadcastMediaState(isMuted: boolean, isVideoOn: boolean) {
    await this.channel?.send({
      type: 'broadcast',
      event: 'mediaState',
      payload: { odId: this.odId, isMuted, isVideoOn }
    });
    
    await this.channel?.track({
      odId: this.odId,
      odName: this.odName,
      odAvatar: this.odAvatar,
      isMuted,
      isVideoOn
    });
  }

  async leave() {
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    this.participants.clear();

    if (this.channel) {
      await this.channel.untrack();
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    this.onParticipantsChange(new Map());
  }

  getParticipants(): Map<string, Participant> {
    return new Map(this.participants);
  }
}
