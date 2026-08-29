"use client";

import { ReactNode } from "react";
import { RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveblocksProvider } from "@liveblocks/react";
import { Loader2 } from "lucide-react";
import {Spinner} from "@/components/ui/spinner"

export function Room({
  children,
  roomId,
}: {
  children: ReactNode;
  roomId: string;
}) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks/auth"
      resolveUsers={async ({ userIds }) => {
        try {
          const res = await fetch("/api/liveblocks/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds }),
          });
          if (!res.ok) return undefined;
          return await res.json();
        } catch {
          return undefined;
        }
      }}
    >
      <RoomProvider id={roomId}>
        <ClientSideSuspense
          fallback={
            <div className="flex size-full items-center justify-center bg-background">
              <Spinner className="size-6 animate-spin text-muted-foreground" />
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
