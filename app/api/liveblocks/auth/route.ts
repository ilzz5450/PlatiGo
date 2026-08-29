import { liveblocks } from "@/lib/liveblocks";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  const { userId, orgId } = await auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await currentUser();

  const groupIds = orgId ? [orgId] : [];

  const { status, body } = await liveblocks.identifyUser(
    {
      userId,
      groupIds,
      organizationId: orgId,
    },
    {
      userInfo: {
        name: user?.fullName || user?.firstName || "Anonymous",
        avatar: user?.imageUrl || "",
      },
    }
  );

  return new Response(body, { status });
}
//logic for the live blocks authentication i have added here 