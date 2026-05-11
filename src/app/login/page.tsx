"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { login } from "@/app/actions/auth";
import { useUIStore } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-text-primary">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { setLoading, toast } = useUIStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam) {
      toast(decodeURIComponent(errorParam), "error");
    }
  }, [errorParam, toast]);

  // Controlled inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true, "Verifying your credentials", "Logging In");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const result = await login(formData);

      if (result?.error) {
        toast(result.error, "error");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      toast("An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden text-text-primary">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 text-text-muted hover:text-text-primary flex items-center gap-2 transition-colors z-10">
        <ArrowLeft className="w-5 h-5" />
        Back
      </Link>

      <div className="w-full max-w-md p-10 rounded-3xl bg-text-primary/5 backdrop-blur-xl border border-border-color shadow-2xl animate-in fade-in zoom-in-95 z-10 relative">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Welcome Back</h1>
          <p className="text-text-muted mt-2">Log in to your digital wardrobe</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-text-secondary ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background/80 border border-border-color rounded-xl py-4 pl-12 pr-5 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                placeholder="Enter Your Email"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-semibold text-text-secondary">Password</label>
              <Link href="/forgot-password" title="Forgot Password" className="text-sm text-text-muted hover:text-text-primary transition-colors">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background/80 border border-border-color rounded-xl py-4 pl-12 pr-14 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                placeholder="Enter Your Password"
                required
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
            className="w-full rounded-xl px-4 py-4 bg-text-primary text-background font-bold text-lg flex items-center justify-center hover:bg-text-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 mt-8 shadow-[var(--shadow-custom)]"
          >
            Login
          </button>
        </form>

        <div className="mt-10 text-center text-sm text-text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
