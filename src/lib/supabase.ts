import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const generateSessionCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createSession = async (hostName: string) => {
  const code = generateSessionCode();

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      code,
      host_name: hostName,
      status: "waiting",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const joinSession = async (code: string, participantName: string) => {
  // First check if session exists
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", code)
    .single();

  if (sessionError || !session) {
    throw new Error("Session not found");
  }

  // Add participant
  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .insert({
      session_id: session.id,
      name: participantName,
    })
    .select()
    .single();

  if (participantError) throw participantError;

  return { session, participant };
};

export const getSessionWithParticipants = async (sessionId: string) => {
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select(
      `
      *,
      participants (*),
      whiskies (*),
      submissions (*)
    `
    )
    .eq("id", sessionId)
    .single();

  if (sessionError) throw sessionError;
  return session;
};
