"use client";

import { useState, useTransition } from "react";
import { updateProfile, uploadAvatar } from "@/app/actions/profile";
import { logout, resetPassword } from "@/app/actions/auth";
import { Loader2, Upload, LogOut, User, MapPin, Calendar, Phone, AlignLeft, ShieldCheck, Lock, Eye, EyeOff, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

type Profile = {
  avatar_url?: string;
  full_name?: string;
  username?: string;
  age?: number | string;
  address?: string;
  phone?: string;
  bio?: string;
};

export default function ProfileForm({ 
  profile, 
  user 
}: { 
  profile: Profile | null; 
  user: any;
}) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || user.user_metadata?.avatar_url || "");
  const [fullName, setFullName] = useState(profile?.full_name || user.user_metadata?.full_name || "");
  const [age, setAge] = useState(profile?.age || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [bio, setBio] = useState(profile?.bio || "");
  
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityError, setSecurityError] = useState("");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const router = useRouter();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError("");
      
      const formData = new FormData();
      formData.append("file", file);
      
      const { publicUrl } = await uploadAvatar(formData);
      const newAvatarUrl = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(newAvatarUrl);
      
      await updateProfile({
        full_name: fullName,
        avatar_url: newAvatarUrl,
        age,
        address,
        phone,
        bio
      });
      
      setMessage("Avatar updated successfully!");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const data = {
      full_name: fullName,
      avatar_url: avatarUrl,
      age: age ? parseInt(age.toString()) : undefined,
      address,
      phone,
      bio
    };

    startTransition(async () => {
      setMessage("");
      setError("");
      try {
        await updateProfile(data);
        setMessage("Profile updated successfully!");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update profile");
      }
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    
    if (newPassword !== confirmPassword) {
      setSecurityError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setSecurityError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsChangingPassword(true);
      setSecurityMessage("");
      setSecurityError("");
      
      const formData = new FormData();
      formData.append("password", newPassword);
      
      const result = await resetPassword(formData);
      
      if (result.error) {
        setSecurityError(result.error);
      } else {
        setSecurityMessage("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <div className="bg-text-primary/5 backdrop-blur-lg border border-border-color rounded-[2.5rem] p-8 sm:p-12 mt-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-text-primary/10 flex items-center justify-center text-text-primary border border-border-color shadow-lg">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black text-text-primary tracking-tight">Edit Profile</h2>
        </div>
        
        {message && <div className="p-4 mb-8 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-4">{message}</div>}
        {error && <div className="p-4 mb-8 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 mb-4 block">Avatar</label>
            <div className="flex flex-col sm:flex-row items-center gap-8 bg-text-primary/5 p-6 rounded-[2rem] border border-white/5">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-border-color/20 shadow-2xl" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-background/50 border border-border-color flex items-center justify-center shadow-inner">
                  <User className="w-10 h-10 text-text-primary/10" />
                </div>
              )}
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload}
                  disabled={isUploading || isPending}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <button 
                  type="button" 
                  disabled={isUploading || isPending}
                  className="bg-text-primary text-background px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-text-primary/90 flex items-center gap-2 disabled:opacity-50 transition-all shadow-xl"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? "Uploading..." : "Update Image"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label htmlFor="full_name" className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/20" />
                <input 
                  type="text" 
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-background/40 border border-border-color rounded-2xl pl-12 pr-6 py-4 text-text-primary focus:outline-none focus:border-white/30 transition-all disabled:opacity-50 font-bold"
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="email" className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/20" />
                <input 
                  type="email" 
                  id="email"
                  value={user?.email || ""}
                  disabled={true}
                  readOnly
                  className="w-full bg-background/20 border border-border-color rounded-2xl pl-12 pr-6 py-4 text-text-primary/60 cursor-not-allowed transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="age" className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 block">Age</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/20" />
                <input 
                  type="number" 
                  id="age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-background/40 border border-border-color rounded-2xl pl-12 pr-6 py-4 text-text-primary focus:outline-none focus:border-white/30 transition-all disabled:opacity-50 font-bold"
                  placeholder="e.g. 25"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="phone" className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/20" />
                <input 
                  type="tel" 
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-background/40 border border-border-color rounded-2xl pl-12 pr-6 py-4 text-text-primary focus:outline-none focus:border-white/30 transition-all disabled:opacity-50 font-bold"
                  placeholder="+91 1234567890"
                />
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label htmlFor="address" className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 block">Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-4 h-4 text-text-primary/20" />
                <textarea 
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isPending}
                  rows={2}
                  className="w-full bg-background/40 border border-border-color rounded-2xl pl-12 pr-6 py-4 text-text-primary focus:outline-none focus:border-white/30 transition-all disabled:opacity-50 font-bold resize-none"
                  placeholder="Your residential address"
                />
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label htmlFor="bio" className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 block">About Me / Bio</label>
              <div className="relative">
                <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-text-primary/20" />
                <textarea 
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={isPending}
                  rows={3}
                  className="w-full bg-background/40 border border-border-color rounded-2xl pl-12 pr-6 py-4 text-text-primary focus:outline-none focus:border-white/30 transition-all disabled:opacity-50 font-bold resize-none"
                  placeholder="Tell us about your style..."
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border-color mt-10">
            <button 
              type="submit" 
              disabled={isPending || isUploading}
              className="flex-1 bg-text-primary text-background px-8 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-text-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
            </button>
            
            <button 
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              disabled={isPending}
              className="sm:w-auto bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </form>
      </div>

      {/* Security Section */}
      <div className="bg-text-primary/5 backdrop-blur-lg border border-border-color rounded-[2.5rem] p-8 sm:p-12 mt-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-text-primary/10 flex items-center justify-center text-text-primary border border-border-color shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black text-text-primary tracking-tight">Security</h2>
        </div>

        {securityMessage && <div className="p-4 mb-8 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-4">{securityMessage}</div>}
        {securityError && <div className="p-4 mb-8 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-4">{securityError}</div>}

        <form onSubmit={handlePasswordChange} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label htmlFor="new_password" className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/20" />
                <input 
                  type={showNewPassword ? "text" : "password"}
                  id="new_password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPassword}
                  className="w-full bg-background/40 border border-border-color rounded-2xl pl-12 pr-12 py-4 text-text-primary focus:outline-none focus:border-white/30 transition-all disabled:opacity-50 font-bold"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-primary/20 hover:text-text-primary transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="confirm_password" className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/20" />
                <input 
                  type="password"
                  id="confirm_password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isChangingPassword}
                  className="w-full bg-background/40 border border-border-color rounded-2xl pl-12 pr-6 py-4 text-text-primary focus:outline-none focus:border-white/30 transition-all disabled:opacity-50 font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isChangingPassword || !newPassword}
              className="w-full sm:w-auto bg-text-primary/10 border border-border-color text-text-primary px-8 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-text-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 shadow-2xl"
            >
              {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-xl p-4 animate-in fade-in zoom-in-95">
          <div className="bg-card-background border border-border-color rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl relative text-center">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <LogOut className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-text-primary mb-3 tracking-tighter">Ready to leave?</h3>
            <p className="text-text-muted mb-10 text-lg font-medium leading-relaxed">Are you sure you want to log out of your account?</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => {
                  startTransition(() => {
                    logout();
                  });
                }}
                disabled={isPending}
                className="w-full bg-red-500 text-text-primary font-black text-xs uppercase tracking-[0.2em] rounded-2xl py-5 hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Out"}
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isPending}
                className="w-full bg-text-primary/5 text-text-primary font-black text-xs uppercase tracking-[0.2em] rounded-2xl py-5 hover:bg-text-primary/10 transition-all border border-white/5"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
