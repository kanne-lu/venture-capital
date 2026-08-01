import VentureDemo from "./venture-demo";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRoleHomePath, roleLabels } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const currentUser = await getCurrentUser();
  const role = currentUser?.profile.role;

  return (
    <VentureDemo
      initialAuthUser={currentUser && role ? {
        subjectName: currentUser.profile.subject_name,
        role,
        roleLabel: roleLabels[role],
        homePath: getRoleHomePath(role),
      } : null}
    />
  );
}
