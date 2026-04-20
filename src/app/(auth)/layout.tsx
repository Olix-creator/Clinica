import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSession();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-gray-50 to-gray-100 px-4">
      {children}
    </div>
  );
}
