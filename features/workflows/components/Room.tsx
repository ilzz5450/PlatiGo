"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";

export function Room({ children,roomId }: { children: ReactNode; roomId: string }) {
  return (
    <LiveblocksProvider publicApiKey={"pk_dev_QikpsEAj4hVIw5UCxHk1j-T83j2Qu5-a4JSuyquVE6-4kS6L_bkJKO8L6zzbUWHI"}>
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}