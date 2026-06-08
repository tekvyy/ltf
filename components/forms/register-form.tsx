"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { authService } from "@/lib/api";

const accountTypes = [
  { value: "lender", label: "Lender" },
  { value: "developer", label: "Developer" },
];

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      password: "",
      accountType: "",
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setApiError(null);

    const response = await authService.register({
      name: data.name,
      company_name: data.companyName,
      email: data.email,
      password: data.password,
      password_confirmation: data.password,
      type: data.accountType,
    });

    if (response.error) {
      setApiError(response.error);
      return;
    }

    if (!response.data?.success) {
      setApiError("Registration failed. Please try again.");
      return;
    }

    // Registration successful, redirect to login page
    router.push("/login");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {apiError && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
          {apiError}
        </div>
      )}

        <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                disabled={isSubmitting}
                autoComplete="organization"
                className="py-6"
                {...register("name")}
            />
            {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
        </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          type="text"
          placeholder="Create Company name"
          disabled={isSubmitting}
          autoComplete="organization"
          className="py-6"
          {...register("companyName")}
        />
        {errors.companyName && (
          <p className="text-sm text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          disabled={isSubmitting}
          autoComplete="email"
          className="py-6"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create password"
            disabled={isSubmitting}
            autoComplete="new-password"
            className="py-6"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountType">Account Type</Label>
        <Controller
          name="accountType"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={isSubmitting}
            >
              <SelectTrigger id="accountType" className="w-full py-6">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.accountType && (
          <p className="text-sm text-destructive">{errors.accountType.message}</p>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="space-y-4 pt-2">
        <Controller
          name="acceptTerms"
          control={control}
          render={({ field }) => (
            <div className="flex gap-3">
              <Checkbox
                id="acceptTerms"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
                className="mt-1 shrink-0"
              />
              <label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
                I understand Credelit AU&apos;s{" "}
                <Link href="/terms" className="font-medium underline underline-offset-2 hover:text-primary">
                  Terms & Conditions
                </Link>
                ,{" "}
                <Link href="/disclosure" className="font-medium underline underline-offset-2 hover:text-primary">
                  Product Disclosure Statement
                </Link>
                {" "}and{" "}
                <Link href="/financial-services" className="font-medium underline underline-offset-2 hover:text-primary">
                  Financial Service Guide
                </Link>
                {" "}(ASIC Regulated)
              </label>
            </div>
          )}
        />
        {errors.acceptTerms && (
          <p className="text-sm text-destructive ml-7">{errors.acceptTerms.message}</p>
        )}

        <Controller
          name="acceptPrivacy"
          control={control}
          render={({ field }) => (
            <div className="flex gap-3">
              <Checkbox
                id="acceptPrivacy"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
                className="mt-1 shrink-0"
              />
              <label htmlFor="acceptPrivacy" className="text-sm leading-relaxed cursor-pointer">
                I acknowledge that my information will be used in accordance with the{" "}
                <Link href="/privacy" className="font-medium underline underline-offset-2 hover:text-primary">
                  Privacy Policy
                </Link>
                {" "}and{" "}
                <Link href="/cookies" className="font-medium underline underline-offset-2 hover:text-primary">
                  Cookie Policy
                </Link>
              </label>
            </div>
          )}
        />
        {errors.acceptPrivacy && (
          <p className="text-sm text-destructive ml-7">{errors.acceptPrivacy.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full rounded-full py-6" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Sign up"}
      </Button>

      <p className="text-center text-sm text-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-foreground hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
