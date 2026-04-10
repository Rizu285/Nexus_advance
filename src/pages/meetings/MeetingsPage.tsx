import React, { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay, parseISO } from 'date-fns';
import { CalendarDays, Check, Clock3, PlusCircle, Trash2, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useScheduling } from '../../context/SchedulingContext';
import { entrepreneurs, findUserById } from '../../data/users';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

const toLocalDateTimeInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoFromInput = (value: string): string => {
  return new Date(value).toISOString();
};

const formatSlotRange = (startIso: string, endIso: string): string => {
  const start = parseISO(startIso);
  const end = parseISO(endIso);

  return `${format(start, 'EEE, MMM d')} • ${format(start, 'p')} - ${format(end, 'p')}`;
};

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    availabilitySlots,
    meetingRequests,
    getAvailabilityForUser,
    getRequestsForUser,
    getConfirmedMeetingsForUser,
    addAvailabilitySlot,
    updateAvailabilitySlot,
    removeAvailabilitySlot,
    sendMeetingRequest,
    respondToMeetingRequest,
  } = useScheduling();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEntrepreneurId, setSelectedEntrepreneurId] = useState<string>(entrepreneurs[0]?.id ?? '');
  const [startInput, setStartInput] = useState<string>('');
  const [endInput, setEndInput] = useState<string>('');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [requestNotes, setRequestNotes] = useState<Record<string, string>>({});

  if (!user) {
    return null;
  }

  const userSlots = getAvailabilityForUser(user.id);
  const userRequests = getRequestsForUser(user.id);
  const userConfirmedMeetings = getConfirmedMeetingsForUser(user.id).filter(
    (meeting) => new Date(meeting.start).getTime() >= Date.now()
  );

  const incomingRequests = userRequests.filter((request) => request.recipientId === user.id);
  const outgoingRequests = userRequests.filter((request) => request.senderId === user.id);

  const selectedEntrepreneurSlots = useMemo(() => {
    if (!selectedEntrepreneurId) {
      return [];
    }

    const meetingSlotIds = new Set(
      availabilitySlots
        .filter((slot) => slot.userId === selectedEntrepreneurId)
        .map((slot) => slot.id)
    );

    const bookedSlotIds = new Set(
      meetingRequests
        .filter((request) => request.status === 'accepted' && meetingSlotIds.has(request.slotId))
        .map((request) => request.slotId)
    );

    return getAvailabilityForUser(selectedEntrepreneurId)
      .filter((slot) => !bookedSlotIds.has(slot.id))
      .filter((slot) => new Date(slot.start).getTime() > Date.now());
  }, [availabilitySlots, meetingRequests, getAvailabilityForUser, selectedEntrepreneurId]);

  const daySlots = useMemo(() => {
    const sourceSlots = user.role === 'entrepreneur' ? userSlots : selectedEntrepreneurSlots;

    return sourceSlots.filter((slot) => isSameDay(parseISO(slot.start), selectedDate));
  }, [selectedDate, selectedEntrepreneurSlots, user.role, userSlots]);

  const handleAddOrUpdateSlot = () => {
    if (!startInput || !endInput) {
      return;
    }

    const start = new Date(startInput);
    const end = new Date(endInput);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return;
    }

    if (editingSlotId) {
      updateAvailabilitySlot(editingSlotId, toIsoFromInput(startInput), toIsoFromInput(endInput));
      setEditingSlotId(null);
    } else {
      addAvailabilitySlot(user.id, toIsoFromInput(startInput), toIsoFromInput(endInput));
    }

    setStartInput('');
    setEndInput('');
  };

  const handleEditSlot = (slotId: string) => {
    const slot = userSlots.find((candidate) => candidate.id === slotId);
    if (!slot) {
      return;
    }

    setEditingSlotId(slot.id);
    setStartInput(toLocalDateTimeInput(parseISO(slot.start)));
    setEndInput(toLocalDateTimeInput(parseISO(slot.end)));
  };

  const handleSendRequest = (slotId: string, recipientId: string) => {
    const message = requestNotes[slotId] ?? 'Interested in a quick intro meeting.';
    sendMeetingRequest(user.id, recipientId, slotId, message.trim());
    setRequestNotes((prev) => ({ ...prev, [slotId]: '' }));
  };

  const selectedEntrepreneur = entrepreneurs.find((entrepreneur) => entrepreneur.id === selectedEntrepreneurId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meeting Scheduling</h1>
          <p className="text-gray-600">
            {user.role === 'entrepreneur'
              ? 'Manage your availability and respond to investor meeting requests.'
              : 'Browse founder availability and send requests for meeting slots.'}
          </p>
        </div>

        <Badge variant="secondary" className="w-fit">
          <CalendarDays size={14} className="mr-1" />
          {userConfirmedMeetings.length} upcoming confirmed
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-gray-900">Calendar</h2>
            {user.role === 'investor' && (
              <div className="w-full sm:w-72">
                <label className="mb-1 block text-sm font-medium text-gray-700">Select Entrepreneur</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  value={selectedEntrepreneurId}
                  onChange={(event) => setSelectedEntrepreneurId(event.target.value)}
                >
                  {entrepreneurs.map((entrepreneur) => (
                    <option key={entrepreneur.id} value={entrepreneur.id}>
                      {entrepreneur.name} - {entrepreneur.startupName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardHeader>

          <CardBody className="space-y-4">
            <Calendar
              value={selectedDate}
              onChange={(value) => {
                if (value instanceof Date) {
                  setSelectedDate(value);
                }
              }}
            />

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Slots for {format(selectedDate, 'EEEE, MMMM d')}
              </h3>

              {daySlots.length === 0 ? (
                <p className="text-sm text-gray-500">No slots available on this date.</p>
              ) : (
                <div className="space-y-3">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-md border border-gray-200 bg-white p-3"
                    >
                      <p className="text-sm font-medium text-gray-800">{formatSlotRange(slot.start, slot.end)}</p>

                      {user.role === 'entrepreneur' ? (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditSlot(slot.id)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="error"
                            leftIcon={<Trash2 size={14} />}
                            onClick={() => removeAvailabilitySlot(slot.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          <Input
                            value={requestNotes[slot.id] ?? ''}
                            onChange={(event) =>
                              setRequestNotes((prev) => ({ ...prev, [slot.id]: event.target.value }))
                            }
                            placeholder="Optional note for this meeting request"
                            fullWidth
                          />
                          <Button
                            size="sm"
                            leftIcon={<PlusCircle size={14} />}
                            onClick={() => handleSendRequest(slot.id, slot.userId)}
                          >
                            Request this slot
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {user.role === 'investor' && selectedEntrepreneur && (
              <div className="rounded-md border border-secondary-100 bg-secondary-50 p-3 text-sm text-secondary-800">
                Viewing availability for <span className="font-semibold">{selectedEntrepreneur.name}</span> from{' '}
                <span className="font-semibold">{selectedEntrepreneur.startupName}</span>.
              </div>
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          {user.role === 'entrepreneur' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Add / Modify Availability</h2>
              </CardHeader>
              <CardBody className="space-y-3">
                <Input
                  label="Start"
                  type="datetime-local"
                  value={startInput}
                  onChange={(event) => setStartInput(event.target.value)}
                  fullWidth
                />
                <Input
                  label="End"
                  type="datetime-local"
                  value={endInput}
                  onChange={(event) => setEndInput(event.target.value)}
                  fullWidth
                />
                <Button fullWidth onClick={handleAddOrUpdateSlot}>
                  {editingSlotId ? 'Update Slot' : 'Add Slot'}
                </Button>
                {editingSlotId && (
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      setEditingSlotId(null);
                      setStartInput('');
                      setEndInput('');
                    }}
                  >
                    Cancel Editing
                  </Button>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">
                {user.role === 'entrepreneur' ? 'Incoming Requests' : 'Your Requests'}
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {(user.role === 'entrepreneur' ? incomingRequests : outgoingRequests).length === 0 ? (
                <p className="text-sm text-gray-500">No meeting requests yet.</p>
              ) : (
                (user.role === 'entrepreneur' ? incomingRequests : outgoingRequests).map((request) => {
                  const counterpartId = user.role === 'entrepreneur' ? request.senderId : request.recipientId;
                  const counterpart = findUserById(counterpartId);
                  const slot = availabilitySlots.find((candidate) => candidate.id === request.slotId);

                  return (
                    <div key={request.id} className="rounded-md border border-gray-200 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">
                          {counterpart?.name ?? 'Unknown user'}
                        </p>
                        <Badge
                          variant={
                            request.status === 'accepted'
                              ? 'success'
                              : request.status === 'declined'
                                ? 'error'
                                : 'warning'
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600">{request.message}</p>
                      {slot && <p className="mt-1 text-xs text-gray-500">{formatSlotRange(slot.start, slot.end)}</p>}

                      {user.role === 'entrepreneur' && request.status === 'pending' && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            leftIcon={<Check size={14} />}
                            onClick={() => respondToMeetingRequest(request.id, 'accepted')}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="error"
                            leftIcon={<X size={14} />}
                            onClick={() => respondToMeetingRequest(request.id, 'declined')}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Confirmed Meetings</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {userConfirmedMeetings.length === 0 ? (
                <p className="text-sm text-gray-500">No confirmed meetings yet.</p>
              ) : (
                userConfirmedMeetings.map((meeting) => {
                  const counterpartId = meeting.entrepreneurId === user.id ? meeting.investorId : meeting.entrepreneurId;
                  const counterpart = findUserById(counterpartId);

                  return (
                    <div key={meeting.id} className="rounded-md border border-gray-200 p-3">
                      <p className="text-sm font-semibold text-gray-800">
                        <UserRound size={14} className="mr-1 inline-block" />
                        {counterpart?.name ?? 'Unknown user'}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        <Clock3 size={14} className="mr-1 inline-block" />
                        {formatSlotRange(meeting.start, meeting.end)}
                      </p>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
