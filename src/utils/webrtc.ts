import { supabase } from './supabase';

// WebRTC configuration with free STUN servers
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
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
      config: { presence: { key: this.odId } }
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
      if (payload.to === this.odId) {
        this.handleSignal(payload);
      }
    });

    await this.channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await this.channel.track({
          odId: this.odId,
          odName: this.odName,
          odAvatar: this.odAvatar,
          joinedAt: new Date().toISOString()
        });
      }
    });
  }

  private handlePresenceSync(state: any) {
    const currentUsers = Object.keys(state);
    
    // Add new participants
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
          isMuted: true,
          isVideoOn: false
        });
      }
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
    
    const pc = this.createPeerConnection(targetId, userData);
    
    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.sendSignal(targetId, { type: 'offer', sdp: offer.sdp });
  }

  private createPeerConnection(targetId: string, userData: any): RTCPeerConnection {
    const pc = new RTCPeerConnection(rtcConfig);
    this.peerConnections.set(targetId, pc);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(targetId, { type: 'ice', candidate: event.candidate });
      }
    };

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received track from:', targetId);
      const participant = this.participants.get(targetId);
      if (participant) {
        participant.stream = event.streams[0];
        participant.isVideoOn = event.streams[0].getVideoTracks().length > 0;
        this.participants.set(targetId, participant);
        this.onParticipantsChange(new Map(this.participants));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetId}:`, pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.handleUserLeft(targetId);
      }
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
    console.log('Received signal from:', from, data.type);

    let pc = this.peerConnections.get(from);

    if (data.type === 'offer') {
      // Create peer connection if doesn't exist
      if (!pc) {
        pc = this.createPeerConnection(from, {});
        
        // Add local tracks
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            pc!.addTrack(track, this.localStream!);
          });
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendSignal(from, { type: 'answer', sdp: answer.sdp });

    } else if (data.type === 'answer' && pc) {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));

    } else if (data.type === 'ice' && pc) {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
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
    const pc = this.peerConnections.get(odId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(odId);
    }
    this.participants.delete(odId);
    this.onParticipantsChange(new Map(this.participants));
  }

  updateStream(stream: MediaStream | null) {
    this.localStream = stream;
    
    // Update all peer connections with new tracks
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
      }
    });
  }

  async leave() {
    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    this.participants.clear();

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
