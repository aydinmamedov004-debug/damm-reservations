import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/auth";
import AdminLoginForm from "@/components/AdminLoginForm";
import ThemeToggle from "@/components/ThemeToggle";

export default async function AdminLoginPage() {
  if (await isAdminAuthed()) {
    redirect("/admin");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-serif text-2xl font-bold text-foreground">damm.</p>
          <p className="eyebrow mt-2">Staff Login</p>
        </div>
        <div className="card p-8">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
