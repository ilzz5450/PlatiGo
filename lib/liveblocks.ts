import { Liveblocks } from "@liveblocks/node";

if (!process.env.LIVEBLOCKS_SECRET_KEY) {
  throw new Error("Missing LIVEBLOCKS_SECRET_KEY in environment variables.");
}

export const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});
// i made it a reusable componenet here now 