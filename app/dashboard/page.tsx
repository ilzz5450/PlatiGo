import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { auth, currentUser } from "@clerk/nextjs/server"

export default async function DashboardPage() {
  const { userId, orgId } = await auth()
  const user = await currentUser()

  return (
    <div className="flex min-h-svh flex-col p-6">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-lg font-medium">Dashboard</h1>
        <div className="flex items-center gap-4">
          <OrganizationSwitcher />
          <UserButton />
        </div>
      </header>
      <div className="text-sm leading-loose">
        <p>Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!</p>
        <p>User ID: {userId}</p>
        {orgId && <p>Organization: {orgId}</p>}
      </div>
    </div>
  )
}
