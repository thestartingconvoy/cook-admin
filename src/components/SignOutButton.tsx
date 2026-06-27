import { signOut } from "@/auth";
import { FormSubmitButton } from "./FormSubmitButton";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <FormSubmitButton
        pendingText="Signing out..."
        className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
      >
        Sign out
      </FormSubmitButton>
    </form>
  );
}
