import { SignIn } from "@clerk/nextjs"
import { GalaxyBackground } from "@/components/galaxy-background"

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black overflow-hidden">
      <GalaxyBackground />
      <div className="relative z-10">
        <SignIn />
      </div>
    </div>
  )
}
