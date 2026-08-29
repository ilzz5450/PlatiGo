import { SignIn } from "@clerk/nextjs"
import PlatigoScene from "@/components/galaxy-background"   // no curly braces

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black overflow-hidden">
      <PlatigoScene/>
      <div className="relative z-10">
        <SignIn />
      </div>
    </div>
  )
}
