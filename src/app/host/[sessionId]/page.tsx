"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase, getSessionWithParticipants } from "@/lib/supabase";
import { Database } from "@/types/database";

type Session = Database["public"]["Tables"]["sessions"]["Row"] & {
  participants: Database["public"]["Tables"]["participants"]["Row"][];
  whiskies: Database["public"]["Tables"]["whiskies"]["Row"][];
  submissions: Database["public"]["Tables"]["submissions"]["Row"][];
};

type Whisky = Database["public"]["Tables"]["whiskies"]["Row"];

export default function HostDashboard() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveUpdate, setLiveUpdate] = useState<string | null>(null);
  const [newWhisky, setNewWhisky] = useState<Partial<Whisky>>({
    name: "",
    age: null,
    abv: 0,
    region: "",
    distillery: "",
    category: "",
    bottling_type: "OB",
  });
  const [showAddWhisky, setShowAddWhisky] = useState(false);

  useEffect(() => {
    loadSession();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("session-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setLiveUpdate(`${payload.new.name} joined the session`);
          setTimeout(() => setLiveUpdate(null), 3000);
          loadSession();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "submissions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setLiveUpdate("New submission received");
          setTimeout(() => setLiveUpdate(null), 3000);
          loadSession();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "submissions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setLiveUpdate("Submission updated");
          setTimeout(() => setLiveUpdate(null), 3000);
          loadSession();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        () => {
          loadSession();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const sessionData = await getSessionWithParticipants(sessionId);
      setSession(sessionData as Session);
    } catch (err) {
      setError("Failed to load session");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addWhisky = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !session ||
      !newWhisky.name ||
      !newWhisky.abv ||
      !newWhisky.region ||
      !newWhisky.distillery
    )
      return;

    try {
      const { error } = await supabase.from("whiskies").insert({
        session_id: sessionId,
        name: newWhisky.name,
        age: newWhisky.age,
        abv: newWhisky.abv,
        region: newWhisky.region,
        distillery: newWhisky.distillery,
        category: newWhisky.category || "",
        bottling_type: newWhisky.bottling_type || "OB",
        order_index: session.whiskies.length,
      });

      if (error) throw error;

      setNewWhisky({
        name: "",
        age: null,
        abv: 0,
        region: "",
        distillery: "",
        category: "",
        bottling_type: "OB",
      });
      setShowAddWhisky(false);
      loadSession();
    } catch (err) {
      console.error("Failed to add whisky:", err);
    }
  };

  const updateSessionStatus = async (status: Session["status"]) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ status })
        .eq("id", sessionId);

      if (error) throw error;
      loadSession();
    } catch (err) {
      console.error("Failed to update session status:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || "Session not found"}</p>
          <a
            href="/"
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            ← Return to Home
          </a>
        </div>
      </div>
    );
  }

  const getSubmissionsForWhisky = (whiskyId: string) => {
    return session.submissions.filter((sub) => sub.whisky_id === whiskyId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          {liveUpdate && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm animate-pulse">
              🔴 Live: {liveUpdate}
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Host Dashboard
              </h1>
              <p className="text-gray-600">Welcome, {session.host_name}</p>
            </div>
            <div className="mt-4 md:mt-0 text-center">
              <p className="text-sm text-gray-600 mb-1">Session Code</p>
              <div className="text-3xl font-mono font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                {session.code}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {session.participants.length}
              </div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {session.whiskies.length}
              </div>
              <div className="text-sm text-gray-600">Whiskies</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {session.submissions.length}
              </div>
              <div className="text-sm text-gray-600">Submissions</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {session.status === "waiting" && (
              <>
                <button
                  onClick={() => setShowAddWhisky(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Add Whisky
                </button>
                {session.whiskies.length > 0 && (
                  <button
                    onClick={() => updateSessionStatus("collecting")}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                  >
                    Start Tasting
                  </button>
                )}
              </>
            )}
            {session.status === "collecting" && (
              <button
                onClick={() => updateSessionStatus("reviewing")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Review Submissions
              </button>
            )}
            {session.status === "reviewing" && (
              <button
                onClick={() => updateSessionStatus("revealed")}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Reveal Results
              </button>
            )}
          </div>
        </div>

        {/* Participants List */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Participants</h2>
          {session.participants.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No participants yet. Share the session code!
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {session.participants.map((participant) => (
                <div key={participant.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-900">
                    {participant.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Submissions:{" "}
                    {
                      session.submissions.filter(
                        (s) => s.participant_id === participant.id
                      ).length
                    }
                    /{session.whiskies.length}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Whiskies List */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Whiskies</h2>
          {session.whiskies.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No whiskies added yet.
            </p>
          ) : (
            <div className="space-y-4">
              {session.whiskies
                .sort((a, b) => a.order_index - b.order_index)
                .map((whisky, index) => (
                  <div
                    key={whisky.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        Whisky #{index + 1}: {whisky.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          whisky.bottling_type === "IB"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {whisky.bottling_type}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Age:</span>{" "}
                        {whisky.age ? `${whisky.age}y` : "NAS"}
                      </div>
                      <div>
                        <span className="font-medium">ABV:</span> {whisky.abv}%
                      </div>
                      <div>
                        <span className="font-medium">Region:</span>{" "}
                        {whisky.region}
                      </div>
                      <div>
                        <span className="font-medium">Distillery:</span>{" "}
                        {whisky.distillery}
                      </div>
                    </div>
                    {whisky.category && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Category:</span>{" "}
                        {whisky.category}
                      </div>
                    )}

                    {/* Show submissions for this whisky if in reviewing mode */}
                    {session.status === "reviewing" && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Submissions (
                          {getSubmissionsForWhisky(whisky.id).length}/
                          {session.participants.length})
                        </h4>
                        <div className="space-y-2">
                          {getSubmissionsForWhisky(whisky.id).map(
                            (submission) => {
                              const participant = session.participants.find(
                                (p) => p.id === submission.participant_id
                              );
                              return (
                                <div
                                  key={submission.id}
                                  className="bg-gray-50 p-3 rounded text-sm"
                                >
                                  <div className="font-medium mb-1">
                                    {participant?.name}
                                  </div>
                                  <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div>Guess: {submission.guessed_name}</div>
                                    <div>
                                      Score: {submission.guessed_score}/5
                                    </div>
                                    <div>
                                      Age:{" "}
                                      {submission.guessed_age
                                        ? `${submission.guessed_age}y`
                                        : "NAS"}
                                    </div>
                                    <div>ABV: {submission.guessed_abv}%</div>
                                    <div>
                                      Region: {submission.guessed_region}
                                    </div>
                                    <div>
                                      Distillery:{" "}
                                      {submission.guessed_distillery}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Add Whisky Modal */}
        {showAddWhisky && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Add Whisky
              </h2>
              <form onSubmit={addWhisky} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newWhisky.name || ""}
                    onChange={(e) =>
                      setNewWhisky({ ...newWhisky, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age (years)
                    </label>
                    <input
                      type="number"
                      value={newWhisky.age || ""}
                      onChange={(e) =>
                        setNewWhisky({
                          ...newWhisky,
                          age: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ABV (%) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newWhisky.abv || ""}
                      onChange={(e) =>
                        setNewWhisky({
                          ...newWhisky,
                          abv: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region *
                  </label>
                  <input
                    type="text"
                    value={newWhisky.region || ""}
                    onChange={(e) =>
                      setNewWhisky({ ...newWhisky, region: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distillery *
                  </label>
                  <input
                    type="text"
                    value={newWhisky.distillery || ""}
                    onChange={(e) =>
                      setNewWhisky({ ...newWhisky, distillery: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newWhisky.category || ""}
                    onChange={(e) =>
                      setNewWhisky({ ...newWhisky, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Single Malt, Blend, Bourbon"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bottling Type
                  </label>
                  <select
                    value={newWhisky.bottling_type || "OB"}
                    onChange={(e) =>
                      setNewWhisky({
                        ...newWhisky,
                        bottling_type: e.target.value as "IB" | "OB",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="OB">Official Bottling (OB)</option>
                    <option value="IB">Independent Bottling (IB)</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddWhisky(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                  >
                    Add Whisky
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
