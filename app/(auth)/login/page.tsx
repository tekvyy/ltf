import { Logo } from "@/components/shared/logo";
import { LoginForm } from "@/components/forms/login-form";
import { AuthLayout } from "@/components/layout/auth-layout";

export default function LoginPage() {
  return (
    <AuthLayout imageSrc="/images/login_image.jpg">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Logo width={70} height={70} />
          <div className="pt-4 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight tracking-tight">Welcome back</h1>
            <p className="text-foreground">
              Please enter your details
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </AuthLayout>
  );
}
