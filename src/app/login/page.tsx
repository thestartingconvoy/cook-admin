import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/FormSubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const { callbackUrl, error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-white text-lg font-semibold text-black">
          C
        </div>
        <h1 className="text-3xl font-semibold">Cook Admin</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Sign in to write, review, and publish menus.
        </p>
        {error && (
          <p className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
            That account isn&apos;t on the allow-list.
          </p>
        )}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl || "/" });
          }}
        >
          <FormSubmitButton
            pendingText="Opening Google..."
            className="mt-7 w-full rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-70"
          >
            Continue with Google
          </FormSubmitButton>
        </form>
      </div>
    </main>
  );
}
