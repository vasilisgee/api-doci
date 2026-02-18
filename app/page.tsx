import { redirect } from "next/navigation";
import { SessionActivityGuard } from "@/components/auth/session-activity-guard";
import { TopBar } from "@/components/auth/top-bar";
import { RedocViewer } from "@/components/redoc/redoc-viewer";
import { authConfig } from "@/lib/auth/config";
import { readActiveServerSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await readActiveServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <SessionActivityGuard inactivityMinutes={authConfig.inactivityMinutes} />
      <TopBar user={session.user} />
      <main className="app-main">
        <RedocViewer />
      </main>
    </>
  );
}
