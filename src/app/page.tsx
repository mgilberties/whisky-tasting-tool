"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession, joinSession } from "@/lib/supabase";

export default function Home() {
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [hostName, setHostName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) return;

    setLoading(true);
    setError("");

    try {
      const session = await createSession(hostName.trim());
      router.push(`/host/${session.id}`);
    } catch (err) {
      setError("Failed to create session. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim() || !sessionCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      const { session, participant } = await joinSession(
        sessionCode.toUpperCase(),
        participantName.trim()
      );
      router.push(`/participant/${session.id}?participantId=${participant.id}`);
    } catch (err) {
      setError("Failed to join session. Please check the code and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label
                htmlFor="hostName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Name
              </label>
              <input
                type="text"
                id="hostName"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              {loading ? "Creating..." : "Create Session"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSession} className="space-y-4">
            <div>
              <label
                htmlFor="participantName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Name
              </label>
              <input
                type="text"
                id="participantName"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>
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
        )}
      </div>
    </div>
  );
}
