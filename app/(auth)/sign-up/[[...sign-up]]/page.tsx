import { SignUp } from "@clerk/nextjs"
import { GalaxyBackground } from "@/components/galaxy-background"

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black overflow-hidden">
      <GalaxyBackground />
      <div className="relative z-10">
        <SignUp />
      </div>
    </div>
  )
}
