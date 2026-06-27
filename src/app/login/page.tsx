import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const { callbackUrl, error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-2xl font-semibold">Cook Admin</h1>
        <p className="mt-2 text-sm text-white/60">
          Sign in with your owner Google account to manage menus.
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
          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:bg-white/90"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
