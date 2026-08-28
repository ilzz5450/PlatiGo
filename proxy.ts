import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"])
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(
      new URL(userId ? "/dashboard" : "/sign-up", req.url)
    )
  }

  if (isAuthRoute(req) && userId) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isDashboardRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
