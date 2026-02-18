import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { authConfig } from "@/lib/auth/config";
import { readActiveServerSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await readActiveServerSession();

  if (session) {
    redirect("/");
  }

  return <LoginForm minSubmitMs={authConfig.loginMinSubmitMs} />;
}
