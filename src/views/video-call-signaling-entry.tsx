'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type InitResponse = {
  roomId: string;
  videoCallId: string;
  status: string;
};

export function VideoCallSignalingEntry({
  sessionId,
}: {
  sessionId: string;
}) {
  const [initializing, setInitializing] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setInitializing(true);
    setError(null);
    try {
      const res = await fetch(`/api/video-call?sessionId=${sessionId}`, {
        method: 'GET',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? 'Failed to init video call');
      }

      const data = json.data as InitResponse;
      setRoomId(data.roomId || sessionId);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start video call');
    } finally {
      setInitializing(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleStart} disabled={initializing || !sessionId}>
        {initializing ? 'Starting…' : roomId ? 'Re-join video call' : 'Start video call'}
      </Button>

      {roomId && (
        <div className="text-sm text-muted-foreground">
          Signaling room:{' '}
          <span className="font-medium">{`video:${roomId}`}</span>
        </div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
