"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, User, MapPin } from "lucide-react";

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { signin, token } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  // Already logged in — skip login page
  React.useEffect(() => {
    if (token) router.push("/");
  }, [token, router]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await signin(data);
      toast.success("Signed in successfully");
      router.push("/");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error("Login failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-full bg-blue-100 p-3">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Visitor Entry System
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to manage visitor entries
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="h-1 bg-blue-600 w-full" />

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
            <div>
              <Label
                htmlFor="username"
                className="text-sm font-semibold text-gray-700"
              >
                Username
              </Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  placeholder="Enter your username"
                  className="pl-10 border-gray-300 focus:border-blue-500"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-gray-700"
              >
                Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10 border-gray-300 focus:border-blue-500"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
