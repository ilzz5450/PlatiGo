import { auth, clerkClient } from "@clerk/nextjs/server"

type UserInfo = Liveblocks["UserMeta"]["info"]

export async function POST(request: Request) {
  // Get the currently authenticated user and their organization.
  const { userId, orgId } = await auth()

  // Only authenticated users who belong to an organization can use this endpoint.
  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }

  let userIds: unknown

  try {
    // Parse the request body and extract the user IDs.
    ({ userIds } = await request.json())
  } catch {
    // Return a bad request if the body is not valid JSON.
    return new Response("Invalid JSON body", { status: 400 })
  }

  // Validate that userIds exists, is an array, and contains only strings.
  if (
    !Array.isArray(userIds) ||
    userIds.some((id) => typeof id !== "string")
  ) {
    return new Response("Expected { userIds: string[] }", { status: 400 })
  }

  const ids = userIds as string[]

  // No users to resolve, so return an empty array immediately.
  if (ids.length === 0) {
    return Response.json([])
  }

  // Create a Clerk backend client to securely fetch user information.
  const client = await clerkClient()

  // Only fetch users who belong to the authenticated user's organization.
  // This prevents users from accessing profile information across tenants.
  const { data: users } = await client.users.getUserList({
    userId: ids,
    organizationId: [orgId],
    limit: ids.length,
  })

  // Store users in a map for fast lookup by their Clerk user ID.
  const usersById = new Map(users.map((user) => [user.id, user]))

  // Resolve every requested ID in the exact order provided.
  // Unknown users are represented by null.
  const resolved: (UserInfo | null)[] = ids.map((id) => {
    const user = usersById.get(id)

    // Return null when Clerk could not find the user in the organization.
    if (!user) {
      return null
    }

    // Return only the display information required by Liveblocks.
    return {
      name:
        user.fullName ??
        user.username ??
        user.primaryEmailAddress?.emailAddress ??
        "Anonymous",
      avatar: user.imageUrl,
    }
  })

  // Return the resolved user information as JSON.
  return Response.json(resolved)
}