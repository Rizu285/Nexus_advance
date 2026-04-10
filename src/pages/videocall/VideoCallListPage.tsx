import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { entrepreneurs, investors } from '../../data/users';
import { Video, Phone } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';

export const VideoCallListPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Show opposite role users (entrepreneurs see investors and vice versa)
  const contacts = user.role === 'entrepreneur' ? investors : entrepreneurs;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Calls</h1>
          <p className="text-gray-600">Start a video call with your network</p>
        </div>

        <div className="flex items-center gap-2 text-sm px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <Phone size={16} className="text-blue-600" />
          <span className="text-blue-700 font-medium">WebRTC-ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-lg transition-shadow">
            <CardBody className="p-0">
              <div className="aspect-video bg-gray-200 relative overflow-hidden flex items-center justify-center">
                <Avatar
                  src={contact.avatarUrl}
                  alt={contact.name}
                  size="xl"
                />
                {contact.isOnline && (
                  <div className="absolute bottom-3 right-3 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
            </CardBody>

            <CardHeader>
              <h3 className="font-semibold text-gray-900">{contact.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {contact.role === 'entrepreneur'
                  ? contact.startupName
                  : contact.investmentInterests?.[0] || 'Investor'}
              </p>
            </CardHeader>

            <CardBody>
              <Link to={`/videocall/${contact.id}`}>
                <Button
                  fullWidth
                  leftIcon={<Video size={18} />}
                  className="justify-center"
                >
                  Start Call
                </Button>
              </Link>
            </CardBody>
          </Card>
        ))}
      </div>

      {contacts.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <Video size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-lg font-medium text-gray-900">No contacts available</h2>
            <p className="text-gray-600 mt-2">Connect with others to start video calls</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
