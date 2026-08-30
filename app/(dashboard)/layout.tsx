import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { cookies } from "next/headers"

const SIDEBAR_COOKIE_NAME = "sidebar_state"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get(SIDEBAR_COOKIE_NAME)
  const defaultOpen = sidebarCookie?.value !== "false"

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-background">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 md:hidden">
            <SidebarTrigger className="h-9 w-9 border border-border bg-card hover:bg-accent text-foreground" />
            <div className="flex items-center gap-3">
              <OrganizationSwitcher
                hidePersonal={false}
                afterCreateOrganizationUrl="/choose-organization"
                afterSelectOrganizationUrl="/"
                afterLeaveOrganizationUrl="/choose-organization"
                appearance={{
                  elements: {
                    rootBox: "w-auto",
                    organizationSwitcherTrigger:
                      "py-1.5 px-2 text-sidebar-foreground",
                  },
                }}
              />
              <UserButton
                appearance={{ elements: { userButtonAvatarBox: "size-8" } }}
              />
            </div>
          </div>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
