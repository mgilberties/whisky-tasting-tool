"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthMode = "signin" | "signup" | "forgot";

interface AuthFormProps {
    onSuccess?: () => void;
    defaultMode?: AuthMode;
}

export default function AuthForm({ onSuccess, defaultMode = "signin" }: AuthFormProps) {
    const [mode, setMode] = useState<AuthMode>(defaultMode);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            // Check if account is disabled
            if (signInData.user) {
                const { data: profile, error: profileError } = await supabase
                    .from("user_profiles")
                    .select("is_disabled")
                    .eq("id", signInData.user.id)
                    .single();

                if (profileError && profileError.code !== "PGRST116") {
                    // PGRST116 is "not found" - profile might not exist yet, which is okay
                    console.error("Error checking user profile:", profileError);
                }

                if (profile && (profile as { is_disabled: boolean }).is_disabled) {
                    // Sign out immediately if account is disabled
                    await supabase.auth.signOut();
                    throw new Error("This account has been disabled. Please contact support.");
                }
            }

            onSuccess?.();
        } catch (err: any) {
            setError(err.message || "Failed to sign in");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            // Add timeout to prevent hanging on 504 errors
            const signUpPromise = supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        name: name.trim(),
                    },
                },
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Sign up request timed out. Please check your Supabase email configuration.")), 10000)
            );

            const { data, error } = await Promise.race([signUpPromise, timeoutPromise]) as any;

            if (error) {
                // Handle specific error cases
                if (error.message?.includes("timeout") || error.message?.includes("504")) {
                    throw new Error("Sign up timed out. This usually means email confirmation is enabled but email service isn't configured. Please disable email confirmation in Supabase Auth settings or configure SMTP.");
                }
                throw error;
            }

            // Check if email confirmation is required
            if (data.user && !data.session) {
                setMessage("Check your email to confirm your account! If you don't see the email, check your spam folder.");
            } else if (data.session) {
                setMessage("Account created successfully! Redirecting...");
                setTimeout(() => {
                    onSuccess?.();
                }, 1000);
            }
        } catch (err: any) {
            setError(err.message || "Failed to sign up. Please try again.");
            console.error("Sign up error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            // Add timeout to prevent hanging on 504 errors
            const resetPromise = supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("TIMEOUT")), 10000)
            );

            const result = await Promise.race([resetPromise, timeoutPromise]) as any;

            if (result?.error) {
                throw result.error;
            }

            // If we get here, the request succeeded (even if email might not send)
            setMessage("If an account exists with this email, you should receive password reset instructions. Check your spam folder. Note: On Supabase free tier, email delivery may be limited.");
        } catch (err: any) {
            if (err.message === "TIMEOUT" || err.message?.includes("504") || err.message?.includes("timeout")) {
                setError(
                    "Password reset request timed out. On Supabase free tier, email sending is limited. " +
                    "Options: 1) Verify SMTP is enabled in Authentication → Settings → SMTP Settings, " +
                    "2) Check that 'Enable Custom SMTP' is turned ON, " +
                    "3) Free tier only allows 2 emails/hour to non-org addresses. " +
                    "Consider upgrading or using a different email service."
                );
            } else {
                setError(err.message || "Failed to send reset email. Please try again.");
            }
            console.error("Password reset error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {mode === "signin" && "Sign In"}
                        {mode === "signup" && "Sign Up"}
                        {mode === "forgot" && "Reset Password"}
                    </h2>
                    <p className="text-gray-600">
                        {mode === "signin" && "Welcome back!"}
                        {mode === "signup" && "Create your account"}
                        {mode === "forgot" && "Enter your email to reset your password"}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
                        {message}
                    </div>
                )}

                <form
                    onSubmit={
                        mode === "signin"
                            ? handleSignIn
                            : mode === "signup"
                                ? handleSignUp
                                : handleForgotPassword
                    }
                    className="space-y-4"
                >
                    {mode === "signup" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="Your name"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    {mode !== "forgot" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold rounded-lg transition-colors duration-200"
                    >
                        {loading
                            ? "Loading..."
                            : mode === "signin"
                                ? "Sign In"
                                : mode === "signup"
                                    ? "Sign Up"
                                    : "Send Reset Email"}
                    </button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    {mode === "signin" && (
                        <>
                            <button
                                onClick={() => setMode("forgot")}
                                className="text-sm text-amber-600 hover:text-amber-700"
                            >
                                Forgot password?
                            </button>
                            <p className="text-sm text-gray-600">
                                Don't have an account?{" "}
                                <button
                                    onClick={() => setMode("signup")}
                                    className="text-amber-600 hover:text-amber-700 font-medium"
                                >
                                    Sign up
                                </button>
                            </p>
                        </>
                    )}

                    {mode === "signup" && (
                        <p className="text-sm text-gray-600">
                            Already have an account?{" "}
                            <button
                                onClick={() => setMode("signin")}
                                className="text-amber-600 hover:text-amber-700 font-medium"
                            >
                                Sign in
                            </button>
                        </p>
                    )}

                    {mode === "forgot" && (
                        <button
                            onClick={() => setMode("signin")}
                            className="text-sm text-amber-600 hover:text-amber-700"
                        >
                            Back to sign in
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

