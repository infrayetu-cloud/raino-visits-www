"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, Snowflake } from "lucide-react";

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
    <main className="min-h-screen  flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-[#494395] p-3">
            <Snowflake className="h-6 w-6 text-[#2EC4B6]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2E2A5E] ">
            Security and Visitor Management system
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Sign in to manage visitor entries
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-2xl shadow-black/30 overflow-hidden">
          <div className="h-1.5 bg-[#2EC4B6] w-full" />

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
            <div>
              <Label
                htmlFor="username"
                className="text-sm font-semibold text-[#2E2A5E]"
              >
                Username
              </Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-3 h-5 w-5 text-[#7A759A]" />
                <Input
                  id="username"
                  placeholder="Enter your username"
                  className="pl-10 border-[#E4E1F0] focus:border-[#494395]"
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
                className="text-sm font-semibold text-[#2E2A5E]"
              >
                Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-[#7A759A]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10 border-[#E4E1F0] focus:border-[#494395]"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-[#494395] hover:bg-[#3A3578] text-white font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
