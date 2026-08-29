"use client";

import { ReactNode } from "react";
import { RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveblocksProvider } from "@liveblocks/react";
import { Loader2 } from "lucide-react";

export function Room({
  children,
  roomId,
}: {
  children: ReactNode;
  roomId: string;
}) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks/auth">
      <RoomProvider id={roomId}>
        <ClientSideSuspense
          fallback={
            <div className="flex size-full items-center justify-center bg-background">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          {() => children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
