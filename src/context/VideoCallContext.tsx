import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface CallSession {
  id: string;
  participantId: string;
  participantName: string;
  startTime: Date;
  isActive: boolean;
}

export interface VideoCallContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  currentCall: CallSession | null;
  initializeMedia: () => Promise<void>;
  startCall: (participantId: string, participantName: string) => Promise<void>;
  endCall: () => void;
  toggleMicrophone: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  cleanupMedia: () => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

const createCallId = (): string => {
  return `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);

  const cleanupMedia = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
  }, [localStream, remoteStream]);

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      setLocalStream(stream);

      // Apply initial settings to the stream
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMicEnabled;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoEnabled;
      });
    } catch (error) {
      console.error('Failed to access media devices:', error);
    }
  }, [isMicEnabled, isVideoEnabled]);

  const startCall = useCallback(
    async (participantId: string, participantName: string) => {
      try {
        // Ensure media is initialized
        if (!localStream) {
          await initializeMedia();
        }

        // Create call session
        const session: CallSession = {
          id: createCallId(),
          participantId,
          participantName,
          startTime: new Date(),
          isActive: true,
        };

        setCurrentCall(session);
        setIsCallActive(true);

        // In a real implementation, we would:
        // 1. Create a PeerConnection
        // 2. Add local stream to peer connection
        // 3. Send offer to remote peer via signaling server
        // For now, this is a mock that simulates the UI
      } catch (error) {
        console.error('Failed to start call:', error);
      }
    },
    [localStream, initializeMedia]
  );

  const endCall = useCallback(() => {
    setIsCallActive(false);
    setCurrentCall(null);
    setIsScreenSharing(false);
    cleanupMedia();
  }, [cleanupMedia]);

  const toggleMicrophone = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicEnabled(!isMicEnabled);
    }
  }, [localStream, isMicEnabled]);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [localStream, isVideoEnabled]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
        }
        // Restart camera/microphone
        await initializeMedia();
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        // Handle screen share stop event
        screenStream.getVideoTracks()[0].onended = async () => {
          setIsScreenSharing(false);
          await initializeMedia();
        };

        // Replace video track with screen share
        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          const screenVideoTrack = screenStream.getVideoTracks()[0];

          // In a real implementation, we would replace the track in the PeerConnection
          // For now, we just update the local stream
          localStream.removeTrack(videoTrack);
          localStream.addTrack(screenVideoTrack);

          videoTrack.stop();
        }

        setIsScreenSharing(true);
      }
    } catch (error) {
      if ((error as DOMException).name !== 'NotAllowedError') {
        console.error('Failed to toggle screen share:', error);
      }
    }
  }, [isScreenSharing, localStream, initializeMedia]);

  const value: VideoCallContextType = {
    localStream,
    remoteStream,
    isCallActive,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    currentCall,
    initializeMedia,
    startCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    cleanupMedia,
  };

  return <VideoCallContext.Provider value={value}>{children}</VideoCallContext.Provider>;
};

export const useVideoCall = (): VideoCallContextType => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within VideoCallProvider');
  }
  return context;
};
