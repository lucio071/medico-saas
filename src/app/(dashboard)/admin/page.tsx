import { requireRole } from "@/lib/auth/server";

export default async function AdminPage() {
  await requireRole(["admin"]);

  return <h1>Admin</h1>;
}
