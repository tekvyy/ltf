"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Building2, Lock, Save, Phone, Mail, MapPin, FileText, Shield, Calendar, Eye, EyeOff, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { DeveloperHeader } from "@/components/developer/developer-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { developerProfileService, authService } from "@/lib/api";
import type { DeveloperProfile } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().max(20).optional().nullable(),
  company_name: z.string().max(255).optional(),
  company_registration_number: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Password form schema
const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirmation: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

// KYB Status configuration
const kybStatusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  not_started: { label: "Not Started", icon: <AlertCircle className="h-5 w-5" />, color: "text-muted-foreground", bgColor: "bg-muted" },
  pending: { label: "Pending", icon: <Clock className="h-5 w-5" />, color: "text-amber-600", bgColor: "bg-amber-100" },
  under_review: { label: "Under Review", icon: <Clock className="h-5 w-5" />, color: "text-blue-600", bgColor: "bg-blue-100" },
  approved: { label: "Approved", icon: <CheckCircle2 className="h-5 w-5" />, color: "text-green-600", bgColor: "bg-green-100" },
  rejected: { label: "Rejected", icon: <XCircle className="h-5 w-5" />, color: "text-red-600", bgColor: "bg-red-100" },
};

export default function DeveloperSettingsPage() {
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
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
      company_registration_number: "",
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
        const response = await developerProfileService.getProfile();
        if (response.data?.success && response.data.data) {
          const profileData = response.data.data;
          setProfile(profileData);

          // Set form values
          profileForm.reset({
            name: profileData.user?.name || "",
            phone: profileData.user?.phone || "",
            company_name: profileData.company_name || "",
            company_registration_number: profileData.company_registration_number || "",
            address: profileData.address || profileData.company_address || "",
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
      const response = await developerProfileService.updateProfile({
        name: data.name,
        phone: data.phone || undefined,
        company_name: data.company_name || undefined,
        company_registration_number: data.company_registration_number || undefined,
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

  const kybStatus = profile?.kyb_status || "not_started";
  const kybConfig = kybStatusConfig[kybStatus] || kybStatusConfig.not_started;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DeveloperHeader title="Settings" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DeveloperHeader title="Settings" />

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">KYB Status</p>
                <div className={`mt-1 flex items-center gap-2 ${kybConfig.color}`}>
                  {kybConfig.icon}
                  <span className="font-semibold">{kybConfig.label}</span>
                </div>
              </div>
              <div className={`rounded-full p-3 ${kybConfig.bgColor}`}>
                <Shield className={`h-5 w-5 ${kybConfig.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projects</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {profile?.total_projects_completed || 0}
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Years in Business</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {profile?.years_in_business || 0}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {profile?.created_at
                    ? format(new Date(profile.created_at), "MMM yyyy")
                    : "N/A"}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <User className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Form - Single form wrapping both cards */}
      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary p-2">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    {...profileForm.register("name")}
                    placeholder="Enter your name"
                    className="pl-10"
                  />
                </div>
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile?.user?.email || ""}
                    disabled
                    className="bg-muted pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    {...profileForm.register("phone")}
                    placeholder="Enter phone number"
                    className="pl-10"
                  />
                </div>
                {profileForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {profileForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-600 p-2">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Update your company details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="company_name"
                    {...profileForm.register("company_name")}
                    placeholder="Enter company name"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_registration_number">Registration Number</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="company_registration_number"
                    {...profileForm.register("company_registration_number")}
                    placeholder="Enter registration number"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Company Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="address"
                    {...profileForm.register("address")}
                    placeholder="Enter company address"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
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
      <Card>
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-foreground p-2">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                  <p className="text-sm text-red-500">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSavingPassword}
                variant="outline"
                className="border-border"
              >
                {isSavingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
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
        </CardContent>
      </Card>
    </div>
  );
}
