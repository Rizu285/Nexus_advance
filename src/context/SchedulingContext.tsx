import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ConfirmedMeeting,
  MeetingAvailabilitySlot,
  MeetingRequest,
  SchedulingContextType,
} from '../types';
import { findUserById } from '../data/users';

interface SchedulingState {
  availabilitySlots: MeetingAvailabilitySlot[];
  meetingRequests: MeetingRequest[];
  confirmedMeetings: ConfirmedMeeting[];
}

const SCHEDULING_STORAGE_KEY = 'business_nexus_scheduling';

const createId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const seedSchedulingState = (): SchedulingState => {
  const seededSlot: MeetingAvailabilitySlot = {
    id: 'slot_seed_1',
    userId: 'e1',
    start: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
    createdAt: new Date().toISOString(),
  };

  const seededRequest: MeetingRequest = {
    id: 'mreq_seed_1',
    slotId: seededSlot.id,
    senderId: 'i1',
    recipientId: 'e1',
    message: 'Would like to discuss your product roadmap and go-to-market strategy.',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const confirmedStart = new Date();
  confirmedStart.setDate(confirmedStart.getDate() + 1);
  confirmedStart.setHours(11, 0, 0, 0);

  const confirmedEnd = new Date(confirmedStart);
  confirmedEnd.setHours(12, 0, 0, 0);

  const confirmedSlot: MeetingAvailabilitySlot = {
    id: 'slot_seed_2',
    userId: 'e1',
    start: confirmedStart.toISOString(),
    end: confirmedEnd.toISOString(),
    createdAt: new Date().toISOString(),
  };

  const confirmedRequest: MeetingRequest = {
    id: 'mreq_seed_2',
    slotId: confirmedSlot.id,
    senderId: 'i2',
    recipientId: 'e1',
    message: 'Let us connect and review pilot opportunities.',
    status: 'accepted',
    createdAt: new Date().toISOString(),
    respondedAt: new Date().toISOString(),
  };

  const confirmedMeeting: ConfirmedMeeting = {
    id: 'meet_seed_1',
    slotId: confirmedSlot.id,
    entrepreneurId: 'e1',
    investorId: 'i2',
    requestId: confirmedRequest.id,
    start: confirmedSlot.start,
    end: confirmedSlot.end,
    createdAt: new Date().toISOString(),
  };

  return {
    availabilitySlots: [seededSlot, confirmedSlot],
    meetingRequests: [seededRequest, confirmedRequest],
    confirmedMeetings: [confirmedMeeting],
  };
};

const loadSchedulingState = (): SchedulingState => {
  try {
    const stored = localStorage.getItem(SCHEDULING_STORAGE_KEY);
    if (!stored) {
      return seedSchedulingState();
    }

    const parsed = JSON.parse(stored) as SchedulingState;

    return {
      availabilitySlots: parsed.availabilitySlots ?? [],
      meetingRequests: parsed.meetingRequests ?? [],
      confirmedMeetings: parsed.confirmedMeetings ?? [],
    };
  } catch {
    return seedSchedulingState();
  }
};

const SchedulingContext = createContext<SchedulingContextType | undefined>(undefined);

export const SchedulingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SchedulingState>(() => loadSchedulingState());

  useEffect(() => {
    localStorage.setItem(SCHEDULING_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<SchedulingContextType>(() => {
    const getAvailabilityForUser = (userId: string): MeetingAvailabilitySlot[] => {
      return state.availabilitySlots
        .filter((slot) => slot.userId === userId)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    };

    const getRequestsForUser = (userId: string): MeetingRequest[] => {
      return state.meetingRequests
        .filter((request) => request.senderId === userId || request.recipientId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const getConfirmedMeetingsForUser = (userId: string): ConfirmedMeeting[] => {
      return state.confirmedMeetings
        .filter((meeting) => meeting.entrepreneurId === userId || meeting.investorId === userId)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    };

    const addAvailabilitySlot = (userId: string, start: string, end: string): MeetingAvailabilitySlot => {
      const newSlot: MeetingAvailabilitySlot = {
        id: createId('slot'),
        userId,
        start,
        end,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        availabilitySlots: [...prev.availabilitySlots, newSlot],
      }));

      return newSlot;
    };

    const updateAvailabilitySlot = (slotId: string, start: string, end: string): MeetingAvailabilitySlot | null => {
      const existingSlot = state.availabilitySlots.find((slot) => slot.id === slotId);
      if (!existingSlot) {
        return null;
      }

      const updatedSlot: MeetingAvailabilitySlot = {
        ...existingSlot,
        start,
        end,
      };

      setState((prev) => ({
        ...prev,
        availabilitySlots: prev.availabilitySlots.map((slot) => (slot.id === slotId ? updatedSlot : slot)),
      }));

      return updatedSlot;
    };

    const removeAvailabilitySlot = (slotId: string): void => {
      setState((prev) => ({
        ...prev,
        availabilitySlots: prev.availabilitySlots.filter((slot) => slot.id !== slotId),
        meetingRequests: prev.meetingRequests.filter(
          (request) => request.slotId !== slotId || request.status !== 'pending'
        ),
      }));
    };

    const sendMeetingRequest = (
      senderId: string,
      recipientId: string,
      slotId: string,
      message: string
    ): MeetingRequest => {
      const newRequest: MeetingRequest = {
        id: createId('mreq'),
        slotId,
        senderId,
        recipientId,
        message,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        meetingRequests: [newRequest, ...prev.meetingRequests],
      }));

      return newRequest;
    };

    const respondToMeetingRequest = (
      requestId: string,
      status: 'accepted' | 'declined'
    ): MeetingRequest | null => {
      const targetRequest = state.meetingRequests.find((request) => request.id === requestId);
      if (!targetRequest || targetRequest.status !== 'pending') {
        return null;
      }

      const updatedRequest: MeetingRequest = {
        ...targetRequest,
        status,
        respondedAt: new Date().toISOString(),
      };

      setState((prev) => {
        const nextRequests = prev.meetingRequests.map((request) =>
          request.id === requestId ? updatedRequest : request
        );

        if (status === 'declined') {
          return {
            ...prev,
            meetingRequests: nextRequests,
          };
        }

        const acceptedSlot = prev.availabilitySlots.find((slot) => slot.id === targetRequest.slotId);
        if (!acceptedSlot) {
          return {
            ...prev,
            meetingRequests: nextRequests,
          };
        }

        const relatedSlotRequests = nextRequests.map((request) => {
          if (
            request.slotId === targetRequest.slotId &&
            request.id !== requestId &&
            request.status === 'pending'
          ) {
            return {
              ...request,
              status: 'declined' as const,
              respondedAt: new Date().toISOString(),
            };
          }

          return request;
        });

        const newMeeting: ConfirmedMeeting = {
          id: createId('meet'),
          slotId: acceptedSlot.id,
          entrepreneurId:
            findUserById(acceptedSlot.userId)?.role === 'entrepreneur'
              ? acceptedSlot.userId
              : targetRequest.senderId,
          investorId:
            findUserById(acceptedSlot.userId)?.role === 'investor'
              ? acceptedSlot.userId
              : targetRequest.senderId,
          requestId: targetRequest.id,
          start: acceptedSlot.start,
          end: acceptedSlot.end,
          createdAt: new Date().toISOString(),
        };

        return {
          availabilitySlots: prev.availabilitySlots,
          meetingRequests: relatedSlotRequests,
          confirmedMeetings: [...prev.confirmedMeetings, newMeeting],
        };
      });

      return updatedRequest;
    };

    return {
      availabilitySlots: state.availabilitySlots,
      meetingRequests: state.meetingRequests,
      confirmedMeetings: state.confirmedMeetings,
      getAvailabilityForUser,
      getRequestsForUser,
      getConfirmedMeetingsForUser,
      addAvailabilitySlot,
      updateAvailabilitySlot,
      removeAvailabilitySlot,
      sendMeetingRequest,
      respondToMeetingRequest,
    };
  }, [state]);

  return <SchedulingContext.Provider value={value}>{children}</SchedulingContext.Provider>;
};

export const useScheduling = (): SchedulingContextType => {
  const context = useContext(SchedulingContext);

  if (!context) {
    throw new Error('useScheduling must be used inside SchedulingProvider');
  }

  return context;
};
