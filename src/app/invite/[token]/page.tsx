import { getInvitationData } from "@/app/actions/invitations";
import { InviteForm } from "@/components/invite/invite-form";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const result = await getInvitationData(token);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Invitación a MedicoSaaS
            </h1>
          </div>

          {result.error ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {result.error}
              </div>
              <a
                href="/login"
                className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                Ir al login
              </a>
            </div>
          ) : result.data ? (
            <InviteForm
              invitationId={result.data.invitationId}
              email={result.data.email}
              doctorName={result.data.doctorName}
              hasAccount={result.data.hasAccount}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
