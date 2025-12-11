"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  supabase,
  getSessionWithParticipants,
  getRegions,
  getDistilleriesByRegion,
} from "@/lib/supabase";
import { Database } from "@/types/database";

type Session = Database["public"]["Tables"]["sessions"]["Row"] & {
  participants: Database["public"]["Tables"]["participants"]["Row"][];
  whiskies: Database["public"]["Tables"]["whiskies"]["Row"][];
  submissions: Database["public"]["Tables"]["submissions"]["Row"][];
};

type Whisky = Database["public"]["Tables"]["whiskies"]["Row"];
type WhiskyInsert = Database["public"]["Tables"]["whiskies"]["Insert"];
type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];

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
    cask_type: null,
    host_score: null,
    whiskybase_link: null,
    tasting_reference: null,
  });
  const [showAddWhisky, setShowAddWhisky] = useState(false);
  const [editingWhisky, setEditingWhisky] = useState<Whisky | null>(null);
  const [regions, setRegions] = useState<
    Database["public"]["Tables"]["regions"]["Row"][]
  >([]);
  const [distilleries, setDistilleries] = useState<
    Database["public"]["Tables"]["distilleries"]["Row"][]
  >([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [editSelectedRegionId, setEditSelectedRegionId] = useState<string>("");
  const [isUpdatingWhisky, setIsUpdatingWhisky] = useState(false);

  useEffect(() => {
    loadSession();
    loadRegions();

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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whiskies",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          loadSession();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "whiskies",
          filter: `session_id=eq.${sessionId}`,
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

  useEffect(() => {
    if (selectedRegionId) {
      loadDistilleries(selectedRegionId);
    } else {
      setDistilleries([]);
      setNewWhisky({ ...newWhisky, distillery: "" });
    }
  }, [selectedRegionId]);

  useEffect(() => {
    if (editSelectedRegionId) {
      loadDistilleries(editSelectedRegionId);
    }
  }, [editSelectedRegionId]);

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

  const loadRegions = async () => {
    try {
      const regionsData = await getRegions();
      setRegions(regionsData);
    } catch (err) {
      console.error("Failed to load regions:", err);
    }
  };

  const loadDistilleries = async (regionId: string) => {
    try {
      const distilleriesData = await getDistilleriesByRegion(regionId);
      setDistilleries(distilleriesData);
    } catch (err) {
      console.error("Failed to load distilleries:", err);
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
      const whiskyData: WhiskyInsert = {
        session_id: sessionId,
        name: newWhisky.name,
        age: newWhisky.age ?? null,
        abv: newWhisky.abv,
        region: newWhisky.region,
        distillery: newWhisky.distillery,
        category: newWhisky.category || "",
        bottling_type: (newWhisky.bottling_type || "OB") as "IB" | "OB",
        cask_type: newWhisky.cask_type || null,
        host_score: newWhisky.host_score ?? null,
        whiskybase_link: newWhisky.whiskybase_link || null,
        tasting_reference: newWhisky.tasting_reference || null,
        order_index: session.whiskies.length,
      };
      // @ts-expect-error - Supabase type inference issue with Database type
      const { error } = await supabase.from("whiskies").insert(whiskyData);

      if (error) throw error;

      setNewWhisky({
        name: "",
        age: null,
        abv: 0,
        region: "",
        distillery: "",
        category: "",
        bottling_type: "OB",
        cask_type: null,
        host_score: null,
        whiskybase_link: null,
        tasting_reference: null,
      });
      setSelectedRegionId("");
      setDistilleries([]);
      setShowAddWhisky(false);
      loadSession();
    } catch (err) {
      console.error("Failed to add whisky:", err);
    }
  };

  const updateWhisky = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !session ||
      !editingWhisky ||
      !editingWhisky.name ||
      !editingWhisky.abv ||
      !editingWhisky.region ||
      !editingWhisky.distillery
    ) {
      console.error("Validation failed:", { session, editingWhisky });
      setError("Please fill in all required fields.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setIsUpdatingWhisky(true);
    try {
      const whiskyUpdate: Database["public"]["Tables"]["whiskies"]["Update"] = {
        name: editingWhisky.name,
        age: editingWhisky.age ?? null,
        abv: editingWhisky.abv,
        region: editingWhisky.region,
        distillery: editingWhisky.distillery,
        category: editingWhisky.category || "",
        bottling_type: (editingWhisky.bottling_type || "OB") as "IB" | "OB",
        cask_type: editingWhisky.cask_type || null,
        host_score: editingWhisky.host_score ?? null,
        whiskybase_link: editingWhisky.whiskybase_link || null,
        tasting_reference: editingWhisky.tasting_reference || null,
      };

      console.log("Updating whisky:", editingWhisky.id, whiskyUpdate);

      const { data, error } = await supabase
        .from("whiskies")
        // @ts-expect-error - Supabase type inference issue with Database type
        .update(whiskyUpdate)
        .eq("id", editingWhisky.id)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Whisky updated successfully:", data);

      setEditingWhisky(null);
      setEditSelectedRegionId("");
      setDistilleries([]);
      await loadSession();

      setLiveUpdate("Whisky updated successfully");
      setTimeout(() => setLiveUpdate(null), 3000);
    } catch (err) {
      console.error("Failed to update whisky:", err);
      setError("Failed to update whisky. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsUpdatingWhisky(false);
    }
  };

  const startEditingWhisky = (whisky: Whisky) => {
    setEditingWhisky({ ...whisky });
    // Find the region ID from the region name
    const region = regions.find((r) => r.name === whisky.region);
    if (region) {
      setEditSelectedRegionId(region.id);
      loadDistilleries(region.id);
    }
  };

  const reorderWhisky = async (whiskyId: string, direction: "up" | "down") => {
    if (!session) return;

    const sortedWhiskies = [...session.whiskies].sort(
      (a, b) => a.order_index - b.order_index
    );
    const currentIndex = sortedWhiskies.findIndex((w) => w.id === whiskyId);

    if (currentIndex === -1) return;

    const newIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= sortedWhiskies.length) return;

    const currentWhisky = sortedWhiskies[currentIndex];
    const targetWhisky = sortedWhiskies[newIndex];

    try {
      // Swap order indices
      await supabase
        .from("whiskies")
        // @ts-expect-error - Supabase type inference issue with Database type
        .update({ order_index: targetWhisky.order_index })
        .eq("id", currentWhisky.id);

      await supabase
        .from("whiskies")
        // @ts-expect-error - Supabase type inference issue with Database type
        .update({ order_index: currentWhisky.order_index })
        .eq("id", targetWhisky.id);

      await loadSession();
    } catch (err) {
      console.error("Failed to reorder whisky:", err);
    }
  };

  const updateSessionStatus = async (status: Session["status"]) => {
    try {
      const updateData: SessionUpdate = { status };
      const { error } = await supabase
        .from("sessions")
        // @ts-expect-error - Supabase type inference issue with Database type
        .update(updateData)
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
                        className={`px-2 py-1 text-xs rounded ${whisky.bottling_type === "IB"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                          }`}
                      >
                        {whisky.bottling_type}
                      </span>
                      <div className="flex items-center gap-2">
                        {session.status === "waiting" && (
                          <>

                            <button
                              onClick={() => startEditingWhisky(whisky)}
                              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            >
                              Edit
                            </button>
                          </>
                        )}

                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => reorderWhisky(whisky.id, "up")}
                            disabled={index === 0}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => reorderWhisky(whisky.id, "down")}
                            disabled={index === session.whiskies.length - 1}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
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
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mt-2">
                      {whisky.category && (
                        <div>
                          <span className="font-medium">Category:</span>{" "}
                          {whisky.category}
                        </div>
                      )}
                      {whisky.cask_type && (
                        <div>
                          <span className="font-medium">Cask Type:</span>{" "}
                          {whisky.cask_type}
                        </div>
                      )}
                      {session.status === "revealed" && whisky.host_score !== null && (
                        <div>
                          <span className="font-medium">My Score:</span>{" "}
                          <span className="font-bold text-amber-600">
                            {whisky.host_score}/5
                          </span>
                        </div>
                      )}
                      {whisky.whiskybase_link && (
                        <div>
                          <span className="font-medium">WhiskyBase:</span>{" "}
                          <a
                            href={whisky.whiskybase_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View on WhiskyBase
                          </a>
                        </div>
                      )}
                      {whisky.tasting_reference && (
                        <div>
                          <span className="font-medium">Tasting Reference:</span>{" "}
                          {whisky.tasting_reference}
                        </div>
                      )}
                    </div>

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
                  <select
                    value={selectedRegionId}
                    onChange={(e) => {
                      const regionId = e.target.value;
                      setSelectedRegionId(regionId);
                      const selectedRegion = regions.find((r) => r.id === regionId);
                      setNewWhisky({
                        ...newWhisky,
                        region: selectedRegion?.name || "",
                        distillery: "", // Reset distillery when region changes
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a region</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distillery *
                  </label>
                  <select
                    value={newWhisky.distillery || ""}
                    onChange={(e) =>
                      setNewWhisky({ ...newWhisky, distillery: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                    disabled={!selectedRegionId || distilleries.length === 0}
                  >
                    <option value="">
                      {selectedRegionId
                        ? distilleries.length === 0
                          ? "Loading..."
                          : "Select a distillery"
                        : "Select a region first"}
                    </option>
                    {distilleries.map((distillery) => (
                      <option key={distillery.id} value={distillery.name}>
                        {distillery.name}
                      </option>
                    ))}
                  </select>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cask Type
                  </label>
                  <input
                    type="text"
                    value={newWhisky.cask_type || ""}
                    onChange={(e) =>
                      setNewWhisky({ ...newWhisky, cask_type: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Bourbon, Sherry, Port"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    My Score
                  </label>
                  <select
                    value={newWhisky.host_score ?? ""}
                    onChange={(e) =>
                      setNewWhisky({
                        ...newWhisky,
                        host_score: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Not scored yet</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhiskyBase Link
                  </label>
                  <input
                    type="url"
                    value={newWhisky.whiskybase_link || ""}
                    onChange={(e) =>
                      setNewWhisky({ ...newWhisky, whiskybase_link: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="https://www.whiskybase.com/whiskies/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tasting Reference
                  </label>
                  <input
                    type="text"
                    value={newWhisky.tasting_reference || ""}
                    onChange={(e) =>
                      setNewWhisky({ ...newWhisky, tasting_reference: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Book name, website, notes"
                  />
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

        {/* Edit Whisky Modal */}
        {editingWhisky && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Edit Whisky
              </h2>
              <form onSubmit={updateWhisky} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingWhisky.name || ""}
                    onChange={(e) =>
                      setEditingWhisky({ ...editingWhisky, name: e.target.value })
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
                      value={editingWhisky.age || ""}
                      onChange={(e) =>
                        setEditingWhisky({
                          ...editingWhisky,
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
                      value={editingWhisky.abv || ""}
                      onChange={(e) =>
                        setEditingWhisky({
                          ...editingWhisky,
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
                  <select
                    value={editSelectedRegionId}
                    onChange={(e) => {
                      const regionId = e.target.value;
                      const selectedRegion = regions.find((r) => r.id === regionId);
                      const previousRegion = regions.find((r) => r.id === editSelectedRegionId);

                      setEditSelectedRegionId(regionId);

                      // Only reset distillery if region actually changed
                      setEditingWhisky({
                        ...editingWhisky,
                        region: selectedRegion?.name || "",
                        distillery: previousRegion?.id !== regionId ? "" : editingWhisky.distillery,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a region</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distillery *
                  </label>
                  <select
                    value={editingWhisky.distillery || ""}
                    onChange={(e) =>
                      setEditingWhisky({ ...editingWhisky, distillery: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                    disabled={!editSelectedRegionId || distilleries.length === 0}
                  >
                    <option value="">
                      {editSelectedRegionId
                        ? distilleries.length === 0
                          ? "Loading..."
                          : "Select a distillery"
                        : "Select a region first"}
                    </option>
                    {distilleries.map((distillery) => (
                      <option key={distillery.id} value={distillery.name}>
                        {distillery.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editingWhisky.category || ""}
                    onChange={(e) =>
                      setEditingWhisky({ ...editingWhisky, category: e.target.value })
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
                    value={editingWhisky.bottling_type || "OB"}
                    onChange={(e) =>
                      setEditingWhisky({
                        ...editingWhisky,
                        bottling_type: e.target.value as "IB" | "OB",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="OB">Official Bottling (OB)</option>
                    <option value="IB">Independent Bottling (IB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cask Type
                  </label>
                  <input
                    type="text"
                    value={editingWhisky.cask_type || ""}
                    onChange={(e) =>
                      setEditingWhisky({ ...editingWhisky, cask_type: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Bourbon, Sherry, Port"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    My Score
                  </label>
                  <select
                    value={editingWhisky.host_score ?? ""}
                    onChange={(e) =>
                      setEditingWhisky({
                        ...editingWhisky,
                        host_score: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Not scored yet</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhiskyBase Link
                  </label>
                  <input
                    type="url"
                    value={editingWhisky.whiskybase_link || ""}
                    onChange={(e) =>
                      setEditingWhisky({ ...editingWhisky, whiskybase_link: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="https://www.whiskybase.com/whiskies/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tasting Reference
                  </label>
                  <input
                    type="text"
                    value={editingWhisky.tasting_reference || ""}
                    onChange={(e) =>
                      setEditingWhisky({ ...editingWhisky, tasting_reference: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Red dot, yellow dot etc"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWhisky(null);
                      setEditSelectedRegionId("");
                      setDistilleries([]);
                    }}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingWhisky}
                    className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingWhisky ? "Saving..." : "Save Changes"}
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
