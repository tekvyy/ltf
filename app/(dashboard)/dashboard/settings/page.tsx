"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  User,
  Building2,
  Lock,
  Save,
  Shield,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lenderProfileService, authService } from "@/lib/api";
import type { LenderProfile } from "@/lib/types/lender";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().max(20).optional().nullable(),
  company_name: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Password form schema
const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

// KYB Status config
const kybStatusConfig: Record<
  string,
  { label: string; icon: React.ElementType; className: string; bgClass: string }
> = {
  not_started: {
    label: "Not Started",
    icon: AlertCircle,
    className: "text-muted-foreground",
    bgClass: "bg-muted",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "text-amber-600",
    bgClass: "bg-amber-50",
  },
  under_review: {
    label: "Under Review",
    icon: Clock,
    className: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "text-green-600",
    bgClass: "bg-green-50",
  },
  rejected: {
    label: "Rejected",
    icon: AlertCircle,
    className: "text-red-600",
    bgClass: "bg-red-50",
  },
};

export default function LenderSettingsPage() {
  const [profile, setProfile] = useState<LenderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      company_name: "",
      address: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const response = await lenderProfileService.getProfile();
        if (response.data?.success && response.data.data) {
          const profileData = response.data.data;
          setProfile(profileData);

          profileForm.reset({
            name: profileData.user?.name || "",
            phone: profileData.user?.phone || "",
            company_name: profileData.company_name || "",
            address: profileData.address || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSavingProfile(true);
    try {
      const response = await lenderProfileService.updateProfile({
        name: data.name,
        phone: data.phone || undefined,
        company_name: data.company_name || undefined,
        address: data.address || undefined,
      });

      if (response.data?.success) {
        toast.success("Profile updated successfully");
        setProfile(response.data.data);
      } else {
        toast.error(response.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsSavingPassword(true);
    try {
      const response = await authService.changePassword({
        current_password: data.current_password,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      if (response.data?.success) {
        toast.success("Password changed successfully");
        passwordForm.reset();
      } else {
        toast.error(response.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const kybConfig = kybStatusConfig[profile?.kyb_status || "not_started"];
  const KybIcon = kybConfig.icon;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      {/* Account Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className={cn("rounded-xl p-5 border", kybConfig.bgClass)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">KYB Status</p>
              <p className={cn("text-lg font-semibold mt-1", kybConfig.className)}>
                {kybConfig.label}
              </p>
            </div>
            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", kybConfig.bgClass)}>
              <KybIcon className={cn("h-6 w-6", kybConfig.className)} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5 border bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lender Type</p>
              <p className="text-lg font-semibold mt-1 text-blue-600 capitalize">
                {profile?.lender_type?.replace("_", " ") || "Not Set"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5 border bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account</p>
              <p className="text-lg font-semibold mt-1 text-purple-600">
                {profile?.is_active ? "Active" : "Inactive"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <User className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5 border bg-muted">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Member Since</p>
              <p className="text-lg font-semibold mt-1 text-foreground">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form - Single form wrapping both cards */}
      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
                  <p className="text-sm text-muted-foreground">Update your personal details</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    {...profileForm.register("name")}
                    placeholder="Enter your name"
                    className="pl-10"
                  />
                </div>
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    {...profileForm.register("phone")}
                    placeholder="Enter phone number"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile?.user?.email || ""}
                    disabled
                    className="pl-10 bg-muted text-muted-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Company Information</h2>
                  <p className="text-sm text-muted-foreground">Update your company details</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-sm font-medium">
                  Company Name
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_name"
                    {...profileForm.register("company_name")}
                    placeholder="Enter company name"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Business Address
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    {...profileForm.register("address")}
                    placeholder="Enter business address"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button - Full Width */}
        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={isSavingProfile}
            className="bg-primary hover:bg-primary/90"
          >
            {isSavingProfile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Change Password - Full Width */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
              <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
            </div>
          </div>
        </div>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-sm font-medium">
                Current Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="current_password"
                  type={showCurrentPassword ? "text" : "password"}
                  {...passwordForm.register("current_password")}
                  placeholder="Enter current password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.current_password && (
                <p className="text-sm text-red-500">
                  {passwordForm.formState.errors.current_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showNewPassword ? "text" : "password"}
                  {...passwordForm.register("password")}
                  placeholder="Enter new password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.password && (
                <p className="text-sm text-red-500">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation" className="text-sm font-medium">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  {...passwordForm.register("password_confirmation")}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.password_confirmation && (
                <p className="text-sm text-red-500">
                  {passwordForm.formState.errors.password_confirmation.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isSavingPassword} variant="outline" className="min-w-[200px]">
              {isSavingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
