"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
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

type Submission = Database["public"]["Tables"]["submissions"]["Insert"];
type SubmissionUpdate = Database["public"]["Tables"]["submissions"]["Update"];

export default function ParticipantView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const participantId = searchParams.get("participantId");

  const [session, setSession] = useState<Session | null>(null);
  const [participant, setParticipant] = useState<
    Database["public"]["Tables"]["participants"]["Row"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentWhiskyIndex, setCurrentWhiskyIndex] = useState(0);
  const [submissions, setSubmissions] = useState<{
    [whiskyId: string]: Partial<Submission>;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState<string | null>(null);
  const [regions, setRegions] = useState<
    Database["public"]["Tables"]["regions"]["Row"][]
  >([]);
  const [distilleries, setDistilleries] = useState<{
    [whiskyId: string]: Database["public"]["Tables"]["distilleries"]["Row"][];
  }>({});
  const [selectedRegionIds, setSelectedRegionIds] = useState<{
    [whiskyId: string]: string;
  }>({});

  useEffect(() => {
    if (!participantId) {
      setError("No participant ID provided");
      setLoading(false);
      return;
    }

    loadSession();
    loadRegions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("participant-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old?.status;
          if (newStatus !== oldStatus) {
            if (newStatus === "collecting") {
              setStatusUpdate(
                "🚀 Tasting has started! You can now submit your guesses."
              );
            } else if (newStatus === "reviewing") {
              setStatusUpdate("⏰ Host is reviewing submissions...");
            } else if (newStatus === "revealed") {
              setStatusUpdate("🎉 Results are now revealed!");
            }
            setTimeout(() => setStatusUpdate(null), 5000);
          }
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
        (payload) => {
          setStatusUpdate(`🥃 Host added a new whisky: ${payload.new.name}`);
          setTimeout(() => setStatusUpdate(null), 4000);
          loadSession();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new.id !== participantId) {
            setStatusUpdate(`👋 ${payload.new.name} joined the session`);
            setTimeout(() => setStatusUpdate(null), 3000);
          }
          loadSession();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, participantId]);

  const loadSession = async () => {
    if (!participantId) return;

    try {
      const sessionData = await getSessionWithParticipants(sessionId);
      setSession(sessionData as Session);

      // Find participant
      const participantData = (sessionData as Session).participants.find(
        (p) => p.id === participantId
      );
      if (!participantData) {
        setError("Participant not found");
        return;
      }
      setParticipant(participantData);

      // Initialize submissions state
      const existingSubmissions: { [whiskyId: string]: Partial<Submission> } =
        {};
      sessionData.submissions.forEach((sub) => {
        if (sub.participant_id === participantId) {
          existingSubmissions[sub.whisky_id] = sub;
        }
      });
      setSubmissions(existingSubmissions);

      // Load region IDs and distilleries for existing submissions
      // This needs to happen after regions are loaded
      if (regions.length > 0) {
        const regionIds: { [whiskyId: string]: string } = {};
        Object.entries(existingSubmissions).forEach(([whiskyId, sub]) => {
          if (sub.guessed_region) {
            const region = regions.find((r) => r.name === sub.guessed_region);
            if (region) {
              regionIds[whiskyId] = region.id;
              loadDistilleriesForWhisky(whiskyId, region.id);
            }
          }
        });
        setSelectedRegionIds((prev) => ({ ...prev, ...regionIds }));
      }
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
      // After loading regions, initialize region IDs for existing submissions
      if (session) {
        const regionIds: { [whiskyId: string]: string } = {};
        Object.entries(submissions).forEach(([whiskyId, sub]) => {
          if (sub.guessed_region) {
            const region = regionsData.find((r) => r.name === sub.guessed_region);
            if (region) {
              regionIds[whiskyId] = region.id;
              loadDistilleriesForWhisky(whiskyId, region.id);
            }
          }
        });
        setSelectedRegionIds((prev) => ({ ...prev, ...regionIds }));
      }
    } catch (err) {
      console.error("Failed to load regions:", err);
    }
  };

  const loadDistilleriesForWhisky = async (
    whiskyId: string,
    regionId: string
  ) => {
    try {
      const distilleriesData = await getDistilleriesByRegion(regionId);
      setDistilleries((prev) => ({
        ...prev,
        [whiskyId]: distilleriesData,
      }));
    } catch (err) {
      console.error("Failed to load distilleries:", err);
    }
  };

  const updateSubmission = (whiskyId: string, field: string, value: any) => {
    setSubmissions((prev) => ({
      ...prev,
      [whiskyId]: {
        ...prev[whiskyId],
        [field]: value,
      },
    }));

    // If region changes, load distilleries and reset distillery
    if (field === "guessed_region") {
      const selectedRegion = regions.find((r) => r.name === value);
      if (selectedRegion) {
        setSelectedRegionIds((prev) => ({
          ...prev,
          [whiskyId]: selectedRegion.id,
        }));
        loadDistilleriesForWhisky(whiskyId, selectedRegion.id);
        setSubmissions((prev) => ({
          ...prev,
          [whiskyId]: {
            ...prev[whiskyId],
            guessed_distillery: "",
          },
        }));
      }
    }
  };

  const submitGuess = async (whiskyId: string) => {
    if (!participant || !session) return;

    const submission = submissions[whiskyId];
    if (
      !submission?.guessed_name ||
      !submission?.guessed_score ||
      !submission?.guessed_abv ||
      !submission?.guessed_region ||
      !submission?.guessed_distillery
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Check if submission already exists
      const existingSubmission = session.submissions.find(
        (s) => s.participant_id === participantId && s.whisky_id === whiskyId
      );

      if (existingSubmission) {
        // Update existing submission
        const updateData: SubmissionUpdate = {
          guessed_name: submission.guessed_name,
          guessed_score: submission.guessed_score,
          guessed_age: submission.guessed_age ?? null,
          guessed_abv: submission.guessed_abv,
          guessed_region: submission.guessed_region,
          guessed_distillery: submission.guessed_distillery,
          guessed_category: submission.guessed_category || "",
          guessed_bottling_type: (submission.guessed_bottling_type || "OB") as "IB" | "OB",
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase
          .from("submissions")
          // @ts-expect-error - Supabase type inference issue with Database type
          .update(updateData)
          .eq("id", existingSubmission.id);

        if (error) throw error;
      } else {
        // Create new submission
        const insertData: Submission = {
          session_id: sessionId,
          participant_id: participantId!,
          whisky_id: whiskyId,
          guessed_name: submission.guessed_name,
          guessed_score: submission.guessed_score,
          guessed_age: submission.guessed_age ?? null,
          guessed_abv: submission.guessed_abv,
          guessed_region: submission.guessed_region,
          guessed_distillery: submission.guessed_distillery,
          guessed_category: submission.guessed_category || "",
          guessed_bottling_type: (submission.guessed_bottling_type || "OB") as "IB" | "OB",
        };
        // @ts-expect-error - Supabase type inference issue with Database type
        const { error } = await supabase.from("submissions").insert(insertData);

        if (error) throw error;
      }

      loadSession();

      // Move to next whisky if available
      if (currentWhiskyIndex < session.whiskies.length - 1) {
        setCurrentWhiskyIndex(currentWhiskyIndex + 1);
      }
    } catch (err) {
      console.error("Failed to submit guess:", err);
      alert("Failed to submit guess. Please try again.");
    } finally {
      setSubmitting(false);
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

  if (error || !session || !participant) {
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

  if (session.status === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          {statusUpdate && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg text-sm animate-bounce">
              {statusUpdate}
            </div>
          )}
          <h1 className="text-3xl font-bold text-amber-900 mb-2">🥃</h1>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {participant.name}!
          </h1>
          <p className="text-gray-600 mb-4">
            You've joined the tasting session.
          </p>
          <div className="bg-amber-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-2">Session Code:</p>
            <div className="text-2xl font-mono font-bold text-amber-600">
              {session.code}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="animate-pulse">⏳</div>
            <p>Waiting for the host to start the tasting...</p>
          </div>
        </div>
      </div>
    );
  }

  if (session.status === "revealed" || session.status === "finished") {
    const sortedWhiskies = session.whiskies.sort(
      (a, b) => a.order_index - b.order_index
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Results Revealed!
            </h1>
            <p className="text-gray-600">
              Here are the actual whiskies and everyone's guesses:
            </p>
          </div>

          <div className="space-y-6">
            {sortedWhiskies.map((whisky, index) => {
              const mySubmission = session.submissions.find(
                (s) =>
                  s.participant_id === participantId &&
                  s.whisky_id === whisky.id
              );
              const allSubmissions = session.submissions.filter(
                (s) => s.whisky_id === whisky.id
              );

              return (
                <div
                  key={whisky.id}
                  className="bg-white rounded-2xl shadow-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      Whisky #{index + 1}: {whisky.name}
                    </h2>
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${whisky.bottling_type === "IB"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                        }`}
                    >
                      {whisky.bottling_type}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-6 p-4 bg-amber-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-700">Age:</span>
                      <div className="text-lg">
                        {whisky.age
                          ? `${whisky.age} years`
                          : "No Age Statement"}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">ABV:</span>
                      <div className="text-lg">{whisky.abv}%</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Region:</span>
                      <div className="text-lg">{whisky.region}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Distillery:
                      </span>
                      <div className="text-lg">{whisky.distillery}</div>
                    </div>
                  </div>

                  {whisky.category && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">
                        Category:
                      </span>{" "}
                      {whisky.category}
                    </div>
                  )}

                  {mySubmission && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <h3 className="font-medium text-blue-900 mb-2">
                        Your Guess:
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Name:</span>{" "}
                          {mySubmission.guessed_name}
                        </div>
                        <div>
                          <span className="font-medium">Score:</span>{" "}
                          {mySubmission.guessed_score}/5
                        </div>
                        <div>
                          <span className="font-medium">Age:</span>{" "}
                          {mySubmission.guessed_age
                            ? `${mySubmission.guessed_age}y`
                            : "NAS"}
                        </div>
                        <div>
                          <span className="font-medium">ABV:</span>{" "}
                          {mySubmission.guessed_abv}%
                        </div>
                        <div>
                          <span className="font-medium">Region:</span>{" "}
                          {mySubmission.guessed_region}
                        </div>
                        <div>
                          <span className="font-medium">Distillery:</span>{" "}
                          {mySubmission.guessed_distillery}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">
                      All Participants' Guesses:
                    </h3>
                    {allSubmissions.map((submission) => {
                      const submittingParticipant = session.participants.find(
                        (p) => p.id === submission.participant_id
                      );
                      const isMySubmission =
                        submission.participant_id === participantId;

                      return (
                        <div
                          key={submission.id}
                          className={`p-3 rounded-lg ${isMySubmission
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-gray-50"
                            }`}
                        >
                          <div className="font-medium mb-2">
                            {submittingParticipant?.name}{" "}
                            {isMySubmission && "(You)"}
                          </div>
                          <div className="grid md:grid-cols-3 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Guess:</span>{" "}
                              {submission.guessed_name}
                            </div>
                            <div>
                              <span className="font-medium">Score:</span>{" "}
                              {submission.guessed_score}/5
                            </div>
                            <div>
                              <span className="font-medium">Age:</span>{" "}
                              {submission.guessed_age
                                ? `${submission.guessed_age}y`
                                : "NAS"}
                            </div>
                            <div>
                              <span className="font-medium">ABV:</span>{" "}
                              {submission.guessed_abv}%
                            </div>
                            <div>
                              <span className="font-medium">Region:</span>{" "}
                              {submission.guessed_region}
                            </div>
                            <div>
                              <span className="font-medium">Distillery:</span>{" "}
                              {submission.guessed_distillery}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (session.status !== "collecting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Session Not Ready
          </h1>
          <p className="text-gray-600 mb-4">
            The host is reviewing submissions. Please wait...
          </p>
        </div>
      </div>
    );
  }

  const sortedWhiskies = session.whiskies.sort(
    (a, b) => a.order_index - b.order_index
  );
  const currentWhisky = sortedWhiskies[currentWhiskyIndex];
  const currentSubmission = submissions[currentWhisky?.id] || {};
  const hasSubmittedForCurrent = session.submissions.some(
    (s) =>
      s.participant_id === participantId && s.whisky_id === currentWhisky?.id
  );

  if (!currentWhisky) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No Whiskies Available
          </h1>
          <p className="text-gray-600">
            The host hasn't added any whiskies yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-2xl mx-auto">
        {statusUpdate && (
          <div className="mb-4 p-4 bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-sm font-medium animate-pulse">
            {statusUpdate}
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Hello, {participant.name}!
            </h1>
            <div className="text-right">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="text-lg font-bold text-amber-600">
                {currentWhiskyIndex + 1} / {sortedWhiskies.length}
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentWhiskyIndex + 1) / sortedWhiskies.length) * 100
                  }%`,
              }}
            ></div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Whisky #{currentWhiskyIndex + 1}
          </h2>
          <p className="text-gray-600">
            Taste this whisky and provide your best guesses below.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitGuess(currentWhisky.id);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Whisky Name *
              </label>
              <input
                type="text"
                value={currentSubmission.guessed_name || ""}
                onChange={(e) =>
                  updateSubmission(
                    currentWhisky.id,
                    "guessed_name",
                    e.target.value
                  )
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Your best guess for the whisky name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score (0-5) *
              </label>
              <select
                value={currentSubmission.guessed_score ?? ""}
                onChange={(e) =>
                  updateSubmission(
                    currentWhisky.id,
                    "guessed_score",
                    parseFloat(e.target.value)
                  )
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="">Select a score</option>
                {[0, 1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentSubmission.guessed_age || ""}
                  onChange={(e) =>
                    updateSubmission(
                      currentWhisky.id,
                      "guessed_age",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Age in years"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ABV (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={currentSubmission.guessed_abv || ""}
                  onChange={(e) =>
                    updateSubmission(
                      currentWhisky.id,
                      "guessed_abv",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="40.0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region *
              </label>
              <select
                value={currentSubmission.guessed_region || ""}
                onChange={(e) =>
                  updateSubmission(
                    currentWhisky.id,
                    "guessed_region",
                    e.target.value
                  )
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="">Select a region</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.name}>
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
                value={currentSubmission.guessed_distillery || ""}
                onChange={(e) =>
                  updateSubmission(
                    currentWhisky.id,
                    "guessed_distillery",
                    e.target.value
                  )
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
                disabled={
                  !selectedRegionIds[currentWhisky.id] ||
                  !distilleries[currentWhisky.id] ||
                  distilleries[currentWhisky.id].length === 0
                }
              >
                <option value="">
                  {selectedRegionIds[currentWhisky.id]
                    ? distilleries[currentWhisky.id]?.length === 0
                      ? "Loading..."
                      : "Select a distillery"
                    : "Select a region first"}
                </option>
                {distilleries[currentWhisky.id]?.map((distillery) => (
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
                value={currentSubmission.guessed_category || ""}
                onChange={(e) =>
                  updateSubmission(
                    currentWhisky.id,
                    "guessed_category",
                    e.target.value
                  )
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., Single Malt, Blend, Bourbon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bottling Type
              </label>
              <select
                value={currentSubmission.guessed_bottling_type || "OB"}
                onChange={(e) =>
                  updateSubmission(
                    currentWhisky.id,
                    "guessed_bottling_type",
                    e.target.value
                  )
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="OB">Official Bottling (OB)</option>
                <option value="IB">Independent Bottling (IB)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              {currentWhiskyIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentWhiskyIndex(currentWhiskyIndex - 1)}
                  className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Previous
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-6 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold rounded-lg transition-colors"
              >
                {submitting
                  ? "Saving..."
                  : hasSubmittedForCurrent
                    ? "Update Guess"
                    : "Submit Guess"}
              </button>
              {currentWhiskyIndex < sortedWhiskies.length - 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentWhiskyIndex(currentWhiskyIndex + 1)}
                  className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Navigation between whiskies */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">All Whiskies</h3>
          <div className="flex flex-wrap gap-2">
            {sortedWhiskies.map((whisky, index) => {
              const hasSubmission = session.submissions.some(
                (s) =>
                  s.participant_id === participantId &&
                  s.whisky_id === whisky.id
              );
              const isCurrent = index === currentWhiskyIndex;

              return (
                <button
                  key={whisky.id}
                  onClick={() => setCurrentWhiskyIndex(index)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isCurrent
                    ? "bg-amber-600 text-white"
                    : hasSubmission
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  #{index + 1} {hasSubmission && "✓"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
