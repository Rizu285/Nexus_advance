import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useVideoCall } from '../../context/VideoCallContext';
import { findUserById } from '../../data/users';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  MonitorOff 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';

export const VideoCallPage: React.FC = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
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
  } = useVideoCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Initialize media and start call on mount
  useEffect(() => {
    if (!partnerId || !user) return;

    const initializeCall = async () => {
      await initializeMedia();
      await startCall(partnerId, 'Participant');
    };

    initializeCall();

    return () => {
      endCall();
    };
  }, [partnerId, user, initializeMedia, startCall, endCall]);

  const handleEndCall = () => {
    endCall();
    navigate(-1);
  };

  const partner = findUserById(partnerId || '');
  const callDuration = currentCall
    ? Math.floor((new Date().getTime() - currentCall.startTime.getTime()) / 1000)
    : 0;

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return null;
  }

  if (!isCallActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] bg-gray-900 p-4">
        <div className="text-center">
          <Phone className="mx-auto mb-6 text-gray-400" size={64} />
          <h1 className="text-3xl font-bold text-white mb-2">Ready to call?</h1>
          <p className="text-gray-400 mb-8">Click below to start connecting with {partner?.name || 'participant'}</p>
          <Button 
            onClick={() => partnerId && startCall(partnerId, partner?.name || 'Participant')}
            size="lg"
          >
            Start Call
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-[calc(100vh-4rem)] text-white overflow-hidden">
      {/* Main video grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-8rem)] p-4">
        {/* Remote video (main) */}
        <div className="lg:col-span-3 relative bg-black rounded-lg overflow-hidden">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
              <Monitor size={64} className="text-gray-600 mb-4" />
              <p className="text-gray-400">Waiting for {partner?.name || 'participant'}...</p>
            </div>
          )}

          {/* Call duration */}
          <div className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-lg text-sm font-medium">
            {formatDuration(callDuration)}
          </div>

          {/* Screen share indicator */}
          {isScreenSharing && (
            <div className="absolute top-4 right-4 bg-red-500 px-4 py-2 rounded-lg text-sm font-medium flex items-center">
              <Monitor size={16} className="mr-2" />
              Sharing screen
            </div>
          )}
        </div>

        {/* Local video (sidebar) and controls */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Local video preview */}
          <Card className="flex-1 bg-black overflow-hidden">
            <CardBody className="p-0 h-full">
              {localStream ? (
                <video
                  ref={localVideoRef}
                  className="w-full h-full object-cover mirror"
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Video size={48} className="text-gray-600" />
                </div>
              )}
            </CardBody>
          </Card>

          {/* Call controls */}
          <div className="flex flex-col gap-3 bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Call Controls</h3>

            {/* Microphone toggle */}
            <Button
              onClick={toggleMicrophone}
              variant={isMicEnabled ? 'primary' : 'error'}
              fullWidth
              leftIcon={isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              className="justify-center"
            >
              {isMicEnabled ? 'Mic On' : 'Mic Off'}
            </Button>

            {/* Camera toggle */}
            <Button
              onClick={toggleCamera}
              variant={isVideoEnabled ? 'primary' : 'error'}
              fullWidth
              leftIcon={isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
              className="justify-center"
            >
              {isVideoEnabled ? 'Camera On' : 'Camera Off'}
            </Button>

            {/* Screen share toggle */}
            <Button
              onClick={toggleScreenShare}
              variant={isScreenSharing ? 'accent' : 'outline'}
              fullWidth
              leftIcon={isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
              className="justify-center"
            >
              {isScreenSharing ? 'Stop Share' : 'Share Screen'}
            </Button>

            {/* End call button */}
            <Button
              onClick={handleEndCall}
              variant="error"
              fullWidth
              leftIcon={<PhoneOff size={18} />}
              className="justify-center mt-2"
            >
              End Call
            </Button>
          </div>

          {/* Participant info */}
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400">Connected with</p>
            <p className="font-semibold text-white mt-1">{partner?.name || 'Unknown'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
