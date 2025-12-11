"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSession, joinSession, supabase } from "@/lib/supabase";
import AuthForm from "@/components/AuthForm";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [hostName, setHostName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check for existing session and verify account is not disabled
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Verify account is not disabled
        const { checkIfUserDisabled } = await import("@/lib/supabase");
        try {
          const isDisabled = await checkIfUserDisabled(session.user.id);
          if (isDisabled) {
            await supabase.auth.signOut();
            setError("Your account has been disabled. Please contact support.");
            setUser(null);
            return;
          }
        } catch (err) {
          console.error("Error checking user status:", err);
        }
      }
      setUser(session?.user ?? null);
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Verify account is not disabled
        const { checkIfUserDisabled } = await import("@/lib/supabase");
        try {
          const isDisabled = await checkIfUserDisabled(session.user.id);
          if (isDisabled) {
            await supabase.auth.signOut();
            setError("Your account has been disabled. Please contact support.");
            setUser(null);
            return;
          }
        } catch (err) {
          console.error("Error checking user status:", err);
        }
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCreateSession = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      setShowAuth(true);
      setIsHost(true);
      return;
    }

    // Get user's name from metadata or email
    const userName = (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "Host";

    setLoading(true);
    setError("");

    try {
      const session = await createSession(userName, user.id);
      router.push(`/host/${session.id}`);
    } catch (err) {
      setError("Failed to create session. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuth(true);
      setIsHost(false);
      return;
    }
    if (!sessionCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Get user's name from metadata or email
      const userName = (user.user_metadata?.name as string) ||
        user.email?.split("@")[0] ||
        "Participant";

      const { session, participant } = await joinSession(
        sessionCode.toUpperCase(),
        userName,
        user.id
      );
      router.push(`/participant/${session.id}?participantId=${participant.id}`);
    } catch (err) {
      setError("Failed to join session. Please check the code and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => {
              setShowAuth(false);
              setIsHost(null);
            }}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
          <AuthForm
            onSuccess={() => {
              setShowAuth(false);
              if (isHost && hostName) {
                handleCreateSession({ preventDefault: () => { } } as React.FormEvent);
              }
            }}
            defaultMode="signin"
          />
        </div>
      </div>
    );
  }

  // If not authenticated, show auth form
  if (!user && !showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-amber-900 mb-2">🥃</h1>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Whisky Tasting Tool
            </h1>
            <p className="text-gray-600">
              Please sign in to continue
            </p>
          </div>
          <AuthForm
            onSuccess={() => {
              // User will be set via auth state change
            }}
            defaultMode="signin"
          />
        </div>
      </div>
    );
  }

  if (isHost === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-amber-900 mb-2">🥃</h1>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Whisky Tasting Tool
            </h1>
            <p className="text-gray-600">
              Host or join a blind tasting session
            </p>
          </div>

          {user && (
            <div className="mb-6 p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                Signed in as <strong>{user.email}</strong>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors"
                >
                  My Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => setIsHost(true)}
              className="w-full py-4 px-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors duration-200 shadow-lg"
            >
              Host a Tasting
            </button>
            <button
              onClick={() => setIsHost(false)}
              className="w-full py-4 px-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors duration-200 shadow-lg"
            >
              Join a Tasting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <button
            onClick={() => setIsHost(null)}
            className="text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-amber-900 mb-2">🥃</h1>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isHost ? "Host a Tasting" : "Join a Tasting"}
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isHost ? (
          <div className="space-y-4">
            {user ? (
              <>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Creating session as: <strong>
                      {(user.user_metadata?.name as string) || user.email?.split("@")[0] || "Host"}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={() => handleCreateSession()}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  {loading ? "Creating..." : "Create Session"}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Please sign in to host a session</p>
                <button
                  onClick={() => setShowAuth(true)}
                  className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  Sign In / Sign Up
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {user ? (
              <>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    Joining as: <strong>
                      {(user.user_metadata?.name as string) || user.email?.split("@")[0] || "Participant"}
                    </strong>
                  </p>
                </div>
                <form onSubmit={handleJoinSession} className="space-y-4">
                  <div>
                    <label
                      htmlFor="sessionCode"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Session Code
                    </label>
                    <input
                      type="text"
                      id="sessionCode"
                      value={sessionCode}
                      onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-center text-lg tracking-wider"
                      placeholder="ABCD12"
                      maxLength={6}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    {loading ? "Joining..." : "Join Session"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Please sign in to join a session</p>
                <button
                  onClick={() => setShowAuth(true)}
                  className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  Sign In / Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
