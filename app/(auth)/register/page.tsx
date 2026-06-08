import { Logo } from "@/components/shared/logo";
import { RegisterForm } from "@/components/forms/register-form";
import { AuthLayout } from "@/components/layout/auth-layout";

export default function RegisterPage() {
  return (
    <AuthLayout imageSrc="/images/signup_image.jpg">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Logo width={70} height={70} />
          <div className="pt-4 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight tracking-tight">Create an account</h1>
            <p className="text-foreground">
              Please enter the fields below to get started
            </p>
          </div>
        </div>
        <RegisterForm />
      </div>
    </AuthLayout>
  );
}
