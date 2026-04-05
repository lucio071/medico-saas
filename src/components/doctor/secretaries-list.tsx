"use client";

import { useState, useTransition } from "react";
import { createInvitation, resendInvitation, deleteInvitation } from "@/app/actions/invitations";
import { removeSecretary, toggleSecretaryActive } from "@/app/actions/secretaries";

interface Secretary {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
}

interface Invitation {
  id: string;
  email: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: string;
  createdAt: string;
}

interface SecretariesListProps {
  secretaries: Secretary[];
  invitations: Invitation[];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  expired: "Expirada",
};

export function SecretariesList({ secretaries, invitations }: SecretariesListProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createInvitation(fd);
      if (res.error) {
        setError(res.error);
      } else {
        setEmail("");
        setSuccess("Invitación enviada correctamente.");
      }
    });
  }

  function handleResend(id: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await resendInvitation(id);
      if (res.error) setError(res.error);
      else setSuccess("Invitación reenviada.");
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta invitación?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteInvitation(id);
      if (res.error) setError(res.error);
      else setSuccess("Invitación eliminada.");
    });
  }

  function handleRemove(s: Secretary) {
    if (!confirm(`¿Desvincular a ${s.fullName} como secretaria? Ya no podrá acceder a tu agenda.`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await removeSecretary(s.id);
      if (res.error) setError(res.error);
      else setSuccess(`${s.fullName} fue desvinculada.`);
    });
  }

  function handleToggle(s: Secretary) {
    const action = s.isActive ? "desactivar" : "activar";
    if (!confirm(`¿${s.isActive ? "Desactivar" : "Activar"} a ${s.fullName}?`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await toggleSecretaryActive(s.id, !s.isActive);
      if (res.error) setError(res.error);
      else setSuccess(`${s.fullName} fue ${s.isActive ? "desactivada" : "activada"}.`);
    });
  }

  const inp =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

  const pendingInvitations = invitations.filter((i) => i.status !== "accepted");

  return (
    <div className="space-y-8">
      {/* Invite form */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Invitar secretaria
        </h3>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inp}
            placeholder="secretaria@email.com"
          />
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isPending ? "Enviando..." : "Enviar invitación"}
          </button>
        </form>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
            {success}
          </p>
        ) : null}
      </div>

      {/* Current secretaries */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Secretarias actuales ({secretaries.length})
        </h3>

        {secretaries.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No hay secretarias. Enviá una invitación por email.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Teléfono</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Estado</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {secretaries.map((s) => (
                  <tr key={s.id} className={!s.isActive ? "opacity-50" : ""}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{s.fullName}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{s.email}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{s.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.isActive ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"}`}>
                        {s.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(s)}
                          disabled={isPending}
                          className={`text-xs font-medium disabled:opacity-50 ${
                            s.isActive
                              ? "text-amber-600 hover:text-amber-800 dark:text-amber-400"
                              : "text-green-600 hover:text-green-800 dark:text-green-400"
                          }`}
                        >
                          {s.isActive ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(s)}
                          disabled={isPending}
                          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400"
                        >
                          Desvincular
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Invitaciones ({pendingInvitations.length})
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Expira</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {pendingInvitations.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{inv.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status]}`}>
                        {STATUS_LABEL[inv.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatDate(inv.expiresAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {inv.status === "pending" || inv.status === "expired" ? (
                          <button
                            type="button"
                            onClick={() => handleResend(inv.id)}
                            disabled={isPending}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {inv.status === "expired" ? "Reenviar" : "Reenviar email"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id)}
                          disabled={isPending}
                          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
