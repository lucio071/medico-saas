"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptInvitationLogin,
  acceptInvitationRegister,
} from "@/app/actions/invitations";
import { createClient } from "@/lib/supabase/client";

interface InviteFormProps {
  invitationId: string;
  email: string;
  doctorName: string;
  hasAccount: boolean;
}

export function InviteForm({
  invitationId,
  email,
  doctorName,
  hasAccount,
}: InviteFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const inp =
    "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const lbl = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // First sign in via Supabase auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        return;
      }

      // Then accept invitation on server
      const res = await acceptInvitationLogin(invitationId, email, password);
      if (res.error) {
        setError(res.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.replace("/secretary");
        router.refresh();
      }, 1500);
    });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    startTransition(async () => {
      const res = await acceptInvitationRegister(
        invitationId,
        fullName,
        phone,
        password,
      );
      if (res.error) {
        setError(res.error);
        return;
      }

      // Auto login
      await supabase.auth.signInWithPassword({ email, password });

      setSuccess(true);
      setTimeout(() => {
        router.replace("/secretary");
        router.refresh();
      }, 1500);
    });
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Invitación aceptada. Redirigiendo al panel...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        El Dr. <strong className="text-zinc-900 dark:text-zinc-100">{doctorName}</strong> te
        invitó a gestionar su agenda.
      </p>

      <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
        Email: <strong>{email}</strong>
      </div>

      {hasAccount ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Ya tenés cuenta. Ingresá tu contraseña para aceptar.
          </p>
          <div className="space-y-1">
            <label className={lbl}>Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inp}
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isPending ? "Aceptando..." : "Iniciar sesión y aceptar"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Creá tu cuenta para aceptar la invitación.
          </p>
          <div className="space-y-1">
            <label className={lbl}>Nombre completo *</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inp}
              placeholder="María López"
            />
          </div>
          <div className="space-y-1">
            <label className={lbl}>Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inp}
              placeholder="+595 981 123456"
            />
          </div>
          <div className="space-y-1">
            <label className={lbl}>Contraseña *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inp}
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isPending ? "Creando cuenta..." : "Crear cuenta y aceptar"}
          </button>
        </form>
      )}
    </div>
  );
}
