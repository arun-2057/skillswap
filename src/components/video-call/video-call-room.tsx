'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { 
  Phone, 
  Video, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  ScreenShare,
  ScreenShareOff,
  PhoneOff,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';

interface VideoCallRoomProps {
  roomId: string;
  sessionId: string;
  onEndCall: () => void;
  className?: string;
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

interface PeerConnectionState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionState: ConnectionState;
}

export function VideoCallRoom({ roomId, sessionId, onEndCall, className }: VideoCallRoomProps) {
  const [state, setState] = useState<PeerConnectionState>({
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    connectionState: 'disconnected',
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState(1);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isInitiatorRef = useRef(false);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (state.localStream) {
      const audioTrack = state.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({ ...prev, isAudioEnabled: audioTrack.enabled }));
      }
    }
  }, [state.localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (state.localStream) {
      const videoTrack = state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  }, [state.localStream]);

  // Handle screen sharing end using a ref to avoid closure issues
  const handleScreenShareEnd = useCallback(() => {
    // We'll use a simple approach to stop screen sharing
    if (state.isScreenSharing) {
      // This will be called when screen sharing ends
      setState(prev => ({ ...prev, isScreenSharing: false }));
    }
  }, [state.isScreenSharing]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (state.isScreenSharing) {
      // Stop screen sharing and return to camera
      if (state.localStream && peerConnectionRef.current) {
        // Remove screen track
        const senders = peerConnectionRef.current.getSenders();
        const screenTrack = senders.find(sender => 
          sender.track && sender.track.kind === 'video' && sender.track.label.includes('screen')
        );
        
        if (screenTrack) {
          peerConnectionRef.current.removeTrack(screenTrack);
        }
        
        // Add camera track back
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
        
        cameraStream.getTracks().forEach(track => {
          peerConnectionRef.current!.addTrack(track, cameraStream);
        });
        
        setState(prev => ({ 
          ...prev, 
          localStream: cameraStream,
          isScreenSharing: false 
        }));
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
        }
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        
        if (state.localStream && peerConnectionRef.current) {
          // Remove camera track
          const senders = peerConnectionRef.current.getSenders();
          const cameraTrack = senders.find(sender => 
            sender.track && sender.track.kind === 'video' && !sender.track.label.includes('screen')
          );
          
          if (cameraTrack) {
            peerConnectionRef.current.removeTrack(cameraTrack);
          }
          
          // Add screen track
          screenStream.getTracks().forEach(track => {
            peerConnectionRef.current!.addTrack(track, screenStream);
          });
          
          setState(prev => ({ 
            ...prev, 
            localStream: screenStream,
            isScreenSharing: true 
          }));
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
        }
        
        // Handle screen sharing end
        screenStream.getVideoTracks()[0].onended = () => {
          handleScreenShareEnd();
        };
        
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    }
  }, [state.isScreenSharing, state.localStream]);

  // End call
  const endCall = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'video-call-ended',
        payload: { sessionId },
      });
    }

    // Clean up media streams
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }

    if (state.remoteStream) {
      state.remoteStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    onEndCall();
  }, [roomId, sessionId, state.localStream, state.remoteStream, onEndCall]);

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      // Get local media stream
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      setState(prev => ({ ...prev, localStream }));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];
        setState(prev => ({ ...prev, remoteStream }));
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setParticipants(2);
      };

// Handle ICE candidates - send minimal data to stay under 250kb limit
       peerConnection.onicecandidate = (event) => {
         if (event.candidate && channelRef.current) {
           // Send only essential fields to minimize payload
           channelRef.current.send({
             type: 'broadcast',
             event: 'video-ice-candidate',
             payload: {
               candidate: event.candidate.candidate,
               sdpMid: event.candidate.sdpMid,
               sdpMLineIndex: event.candidate.sdpMLineIndex,
             },
             sessionId,
           });
         }
       };

// Handle connection state changes
       peerConnection.onconnectionstatechange = () => {
         const state = peerConnection.connectionState;
         setState(prev => ({
           ...prev,
           connectionState: state as PeerConnectionState['connectionState'],
         }));
         if (state === 'disconnected' || state === 'failed') {
           setParticipants(1);
           setError(state === 'failed' ? 'Connection lost. Check your network.' : 'Peer disconnected');
         } else if (state === 'connecting') {
           setError(null);
         }
       };

      setState(prev => ({ ...prev, peerConnection, connectionState: 'connecting' }));

    } catch (err) {
      console.error('Error initializing WebRTC:', err);
      setError('Failed to access camera/microphone. Please check permissions.');
      setLoading(false);
    }
  }, [roomId, sessionId]);

  // Supabase Realtime video signaling
  useEffect(() => {
    const channel = supabase.channel(`video:${sessionId}`);

    channel.on('broadcast', { event: 'video-offer' }, async ({ payload }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);

          channel.send({
            type: 'broadcast',
            event: 'video-answer',
            payload: { sdp: peerConnectionRef.current!.localDescription, sessionId },
          });
        }
      } catch (err) {
        console.error('Error handling video offer:', err);
      }
    });

    channel.on('broadcast', { event: 'video-answer' }, async ({ payload }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        }
      } catch (err) {
        console.error('Error handling video answer:', err);
      }
    });

channel.on('broadcast', { event: 'video-ice-candidate' }, async ({ payload }) => {
       try {
         if (peerConnectionRef.current) {
           // Reconstruct RTCIceCandidate from minimal payload
           const candidate = new RTCIceCandidate({
             candidate: payload.candidate,
             sdpMid: payload.sdpMid,
             sdpMLineIndex: payload.sdpMLineIndex,
           });
           await peerConnectionRef.current.addIceCandidate(candidate);
         }
       } catch (err) {
         console.error('Error adding ICE candidate:', err);
       }
     });

    channel.on('broadcast', { event: 'video-call-ended' }, () => {
      console.log('[VideoCall] Call ended by remote user');
      endCall();
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[VideoCall] Signaling channel subscribed');
        // The first subscriber initiates the call
        if (!isInitiatorRef.current) {
          isInitiatorRef.current = true;
          await initializeWebRTC();
          channel.send({
            type: 'broadcast',
            event: 'video-call-init',
            payload: { sessionId },
          });
        }
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, sessionId, endCall, initializeWebRTC]);

  // Auto-end call when component unmounts
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  // Update loading state
  useEffect(() => {
    if (state.localStream) {
      setLoading(false);
    }
  }, [state.localStream]);

  const getConnectionStatusColor = () => {
    switch (state.connectionState) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-gray-500';
      case 'failed':
        return 'bg-red-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (state.connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'failed':
        return 'Connection Failed';
      case 'closed':
        return 'Call Ended';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
          <span className="text-sm font-medium">{getConnectionStatusText()}</span>
          <Badge variant="secondary" className="text-xs">
            {participants} participant{participants !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {error && (
          <div className="flex items-center gap-1 text-red-600 text-sm">
            <AlertCircle className="size-3" />
            {error}
          </div>
        )}
      </div>

      {/* Video area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 aspect-video">
        {/* Local video */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-0 h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Local video overlay */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              You
            </div>
            
            {/* Local video controls overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={toggleAudio}
                className="size-8"
              >
                {state.isAudioEnabled ? (
                  <Mic className="size-4" />
                ) : (
                  <MicOff className="size-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={toggleVideo}
                className="size-8"
              >
                {state.isVideoEnabled ? (
                  <Camera className="size-4" />
                ) : (
                  <CameraOff className="size-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={toggleScreenShare}
                className="size-8"
              >
                {state.isScreenSharing ? (
                  <ScreenShareOff className="size-4" />
                ) : (
                  <ScreenShare className="size-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Remote video */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-0 h-full">
            {loading || !state.remoteStream ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Users className="size-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Waiting for other participant...
                  </p>
                </div>
              </div>
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Remote video overlay */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Other Participant
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main controls */}
      <div className="flex justify-center gap-4">
        <Button
          size="icon"
          variant="destructive"
          onClick={endCall}
          className="size-12"
        >
          <PhoneOff className="size-5" />
        </Button>
      </div>

      {/* Additional info */}
      <div className="text-xs text-muted-foreground text-center">
        <p>Room ID: {roomId}</p>
        <p>Session ID: {sessionId}</p>
      </div>
    </div>
  );
}