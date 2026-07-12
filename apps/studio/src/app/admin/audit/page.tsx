import { AdminAuditPanel } from "@/components/AdminAuditPanel";

export const metadata = {
  title: "Audit Logs - Admin",
  description: "View and filter audit logs",
};

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <AdminAuditPanel />
      </div>
    </div>
  );
}
