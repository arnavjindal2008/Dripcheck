"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { forgotPassword } from "@/app/actions/auth";
import { useUIStore } from "@/lib/store";

export default function ForgotPassword() {
  const { setLoading } = useUIStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true, "Sending recovery link...", "Security");
    setError(null);

    const result = await forgotPassword(formData);

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

      <Link href="/login" className="absolute top-8 left-8 text-text-muted hover:text-text-primary flex items-center gap-2 transition-colors z-10">
        <ArrowLeft className="w-5 h-5" />
        Back to Login
      </Link>

      <div className="w-full max-w-md p-10 rounded-3xl bg-text-primary/5 backdrop-blur-xl border border-border-color shadow-2xl animate-in fade-in zoom-in-95 z-10 relative">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Reset Password</h1>
          <p className="text-text-muted mt-2">Enter your email to receive a recovery link</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl font-medium">
              Recovery link sent! Please check your email.
            </div>
            <Link href="/login" className="block w-full bg-text-primary text-background py-4 rounded-xl font-bold mt-4 hover:bg-text-primary/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Back to Login
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-text-secondary ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="email"
                  name="email"
                  className="w-full bg-background/80 border border-border-color rounded-xl py-4 pl-12 pr-5 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                  placeholder="Enter Your Email"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full rounded-xl px-4 py-4 bg-text-primary text-background font-bold text-lg flex items-center justify-center hover:bg-text-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 mt-8 shadow-[var(--shadow-custom)]"
            >
              Send Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
