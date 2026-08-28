import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-background">
          <div className="flex items-center justify-end gap-3 border-b border-border px-4 py-2 md:hidden">
            <OrganizationSwitcher
              hidePersonal={false}
              afterCreateOrganizationUrl="/choose-organization"
              afterSelectOrganizationUrl="/"
              afterLeaveOrganizationUrl="/choose-organization"
              appearance={{
                elements: {
                  rootBox: "w-auto",
                  organizationSwitcherTrigger: "py-1.5 px-2 text-sidebar-foreground",
                },
              }}
            />
            <UserButton appearance={{ elements: { userButtonAvatarBox: "size-8" } }} />
          </div>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
