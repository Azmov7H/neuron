// app/(platform)/dashboard/layout.tsx
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>;
}