const rtcConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"],
    },
  ],
};

class PeerService {
  peer: RTCPeerConnection | null = null;
  private screenShareSender: RTCRtpSender | null = null;

  private bindIceLogging(pc: RTCPeerConnection) {
    pc.oniceconnectionstatechange = () => {
      console.log("[webrtc] ICE connection state:", pc.iceConnectionState);
    };
  }

  private ensurePeerConnection() {
    if (!this.peer) {
      this.peer = new RTCPeerConnection(rtcConfig);
      this.bindIceLogging(this.peer);
    }
  }

  addScreenShareTrack(stream: MediaStream) {
    this.ensurePeerConnection();
    if (!this.peer) return;

    const track = stream.getVideoTracks()[0];
    if (!track) return;

    if (this.screenShareSender) {
      void this.screenShareSender.replaceTrack(track);
      return;
    }

    this.screenShareSender = this.peer.addTrack(track, stream);
  }

  removeScreenShareTrack() {
    if (!this.peer || !this.screenShareSender) return;
    try {
      this.peer.removeTrack(this.screenShareSender);
    } catch {
      // ignore removeTrack race when sender already detached
    }
    this.screenShareSender = null;
  }

  async attachLocalStream(stream: MediaStream) {
    this.ensurePeerConnection();
    if (!this.peer) return;

    for (const track of stream.getTracks()) {
      const sender = this.peer.getSenders().find((s) => s.track?.kind === track.kind);
      if (!sender) {
        this.peer.addTrack(track, stream);
        continue;
      }
      if (sender.track?.id === track.id) continue;
      await sender.replaceTrack(track);
    }
  }

  async getAnswer(offer: RTCSessionDescriptionInit) {
    this.ensurePeerConnection();
    if (!this.peer) return undefined;

    await this.peer.setRemoteDescription(offer);
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(new RTCSessionDescription(answer));
    return answer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    this.ensurePeerConnection();
    if (!this.peer) return;
    await this.peer.setRemoteDescription(new RTCSessionDescription(description));
  }

  async getOffer() {
    this.ensurePeerConnection();
    if (!this.peer) return undefined;

    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peer) return;
    await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
  }

  closeConnection() {
    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }
    this.screenShareSender = null;
  }
}

export const peer = new PeerService();
