import type { Database } from "@/types/database";

export type AppRole = Database["public"]["Tables"]["users"]["Row"]["role"];

export function getRolePath(role: AppRole | null | undefined) {
  if (role === "admin") return "/admin";
  if (role === "doctor") return "/doctor";
  if (role === "secretary") return "/secretary";
  if (role === "patient") return "/patient";
  return "/login";
}
