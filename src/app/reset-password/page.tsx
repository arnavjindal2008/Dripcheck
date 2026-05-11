"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/app/actions/auth";
import { useUIStore } from "@/lib/store";

export default function ResetPassword() {
  const { setLoading } = useUIStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true, "Updating security credentials...", "Security");
    setError(null);

    const result = await resetPassword(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden text-text-primary">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md p-10 rounded-3xl bg-text-primary/5 backdrop-blur-xl border border-border-color shadow-2xl animate-in fade-in zoom-in-95 z-10 relative">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">New Password</h1>
          <p className="text-text-muted mt-2">Set a secure password for your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="w-16 h-16 text-green-400 animate-bounce" />
              <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl font-medium">
                Password updated successfully!
              </div>
            </div>
            <Link href="/login" className="block w-full bg-text-primary text-background py-4 rounded-xl font-bold mt-4 hover:bg-text-primary/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Log in with new password
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-text-secondary ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="w-full bg-background/80 border border-border-color rounded-xl py-4 pl-12 pr-14 text-text-primary placeholder-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all shadow-inner"
                  placeholder="Enter Your New Password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full rounded-xl px-4 py-4 bg-text-primary text-background font-bold text-lg flex items-center justify-center hover:bg-text-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 mt-8 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
