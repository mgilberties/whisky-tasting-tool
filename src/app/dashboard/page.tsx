"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Session = Database["public"]["Tables"]["sessions"]["Row"];

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [hostedSessions, setHostedSessions] = useState<Session[]>([]);
    const [participatedSessions, setParticipatedSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
            router.push("/");
            return;
        }
        setUser(session.user);
        await loadSessions(session.user.id);
    };

    const loadSessions = async (userId: string) => {
        try {
            // Load hosted sessions
            const { data: hosted } = await supabase
                .from("sessions")
                .select("*")
                .eq("host_user_id", userId)
                .order("created_at", { ascending: false });

            // Load participated sessions
            const { data: participants } = await supabase
                .from("participants")
                .select("session_id")
                .eq("user_id", userId);

            if (participants && participants.length > 0) {
                const sessionIds = participants.map((p) => p.session_id);
                const { data: participated } = await supabase
                    .from("sessions")
                    .select("*")
                    .in("id", sessionIds)
                    .order("created_at", { ascending: false });

                setParticipatedSessions(participated || []);
            }

            setHostedSessions(hosted || []);
        } catch (err) {
            console.error("Failed to load sessions:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                My Dashboard
                            </h1>
                            <p className="text-gray-600">{user?.email}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push("/")}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                            >
                                Host New Session
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Hosted Sessions */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Hosted Sessions ({hostedSessions.length})
                        </h2>
                        {hostedSessions.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                You haven't hosted any sessions yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {hostedSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/host/${session.id}`)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium text-gray-900">
                                                {session.host_name}'s Tasting
                                            </h3>
                                            <span
                                                className={`px-2 py-1 text-xs rounded ${session.status === "waiting"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : session.status === "collecting"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : session.status === "reviewing"
                                                                ? "bg-purple-100 text-purple-800"
                                                                : "bg-green-100 text-green-800"
                                                    }`}
                                            >
                                                {session.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span>Code: {session.code}</span>
                                            <span>
                                                {new Date(session.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Participated Sessions */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            My Tastings ({participatedSessions.length})
                        </h2>
                        {participatedSessions.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                You haven't participated in any sessions yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {participatedSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => {
                                            // Find participant ID for this session
                                            router.push(`/participant/${session.id}`);
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium text-gray-900">
                                                {session.host_name}'s Tasting
                                            </h3>
                                            <span
                                                className={`px-2 py-1 text-xs rounded ${session.status === "waiting"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : session.status === "collecting"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : session.status === "reviewing"
                                                                ? "bg-purple-100 text-purple-800"
                                                                : "bg-green-100 text-green-800"
                                                    }`}
                                            >
                                                {session.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span>Code: {session.code}</span>
                                            <span>
                                                {new Date(session.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

