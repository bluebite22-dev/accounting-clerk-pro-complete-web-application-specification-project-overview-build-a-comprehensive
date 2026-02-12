"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type UserRole } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isLoading } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("clerk");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isRegister) {
      // Registration
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!firstName || !lastName || !email || !password) {
        setError("Please fill in all fields");
        return;
      }
      
      const success = await register(email, password, firstName, lastName, role);
      if (success) {
        setSuccess("Account created successfully! Please sign in.");
        setIsRegister(false);
        // Clear form
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFirstName("");
        setLastName("");
      } else {
        setError("Email already registered");
      }
    } else {
      // Login
      const success = await login(email, password);
      if (success) {
        router.push("/dashboard");
      } else {
        setError("Invalid email or password");
      }
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError("");
    setSuccess("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            {isRegister ? "Create Account" : "Accounting Clerk Pro"}
          </h1>
          <p className="mt-2 text-neutral-400">
            {isRegister ? "Register for access" : "Sign in to your account"}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-400">
                {success}
              </div>
            )}

            {isRegister && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-medium text-neutral-200">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required={isRegister}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-medium text-neutral-200">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required={isRegister}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="role" className="block text-sm font-medium text-neutral-200">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="clerk">Clerk - Basic data entry</option>
                    <option value="accountant">Accountant - Manage finances</option>
                    <option value="auditor">Auditor - View and review</option>
                    <option value="viewer">Viewer - Read-only</option>
                    <option value="admin">Admin - Full access</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-neutral-200">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-200">
                {isRegister ? "Create Password" : "Password"}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? "Create a password" : "Enter your password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-200">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required={isRegister}
                />
              </div>
            )}

            {!isRegister && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-neutral-400">Remember me</span>
                </label>
                <button type="button" className="text-sm text-blue-400 hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRegister ? "Creating account..." : "Signing in..."}
                </>
              ) : isRegister ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {!isRegister && (
            <>
              {/* Demo credentials */}
              <div className="mt-6 rounded-lg bg-neutral-800/50 p-4">
                <p className="mb-2 text-xs font-medium text-neutral-400">Demo Credentials:</p>
                <div className="space-y-1 text-xs text-neutral-500">
                  <p><span className="text-neutral-400">Admin:</span> admin@company.com / admin123</p>
                  <p><span className="text-neutral-400">Accountant:</span> accountant@company.com / acc123</p>
                  <p><span className="text-neutral-400">Clerk:</span> clerk@company.com / clerk123</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Social login */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-neutral-950 px-4 text-neutral-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button variant="outline" type="button">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM12.6 24H24V12.6H12.6V24zM0 11.4h11.4V0H0v11.4zm12.6 0H24V0H12.6v11.4z" />
              </svg>
              Microsoft
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-neutral-500">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button onClick={toggleMode} className="text-blue-400 hover:underline">
                Sign in
              </button>
            </>
          ) : (
            <>
              Do not have an account?{" "}
              <button onClick={toggleMode} className="text-blue-400 hover:underline">
                Create account
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
