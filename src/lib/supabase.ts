import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During build time, allow the build to proceed with placeholder values
// The actual error will be thrown at runtime when the client is used
const url = supabaseUrl || (typeof window === "undefined" ? "https://placeholder.supabase.co" : "");
const key = supabaseAnonKey || (typeof window === "undefined" ? "placeholder-key" : "");

if (!url || !key) {
  if (typeof window !== "undefined") {
    // Only throw error in browser/runtime, not during build
    throw new Error("Missing Supabase environment variables");
  }
}

export const supabase = createClient<Database>(url, key);

// Helper functions for common operations
export const generateSessionCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createSession = async (
  hostName: string
): Promise<Database["public"]["Tables"]["sessions"]["Row"]> => {
  const code = generateSessionCode();

  const { data, error } = await supabase
    .from("sessions")
    // @ts-expect-error - Supabase type inference issue with Database type
    .insert({
      code,
      host_name: hostName,
      status: "waiting",
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create session");
  return data;
};

export const joinSession = async (
  code: string,
  participantName: string
): Promise<{
  session: Database["public"]["Tables"]["sessions"]["Row"];
  participant: Database["public"]["Tables"]["participants"]["Row"];
}> => {
  // First check if session exists
  const { data: sessionData, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", code)
    .single();

  if (sessionError || !sessionData) {
    throw new Error("Session not found");
  }

  const session = sessionData as Database["public"]["Tables"]["sessions"]["Row"];

  // Add participant
  const { data: participant, error: participantError } = await supabase
    .from("participants")
    // @ts-expect-error - Supabase type inference issue with Database type
    .insert({
      session_id: session.id,
      name: participantName,
    })
    .select()
    .single();

  if (participantError) throw participantError;
  if (!participant) throw new Error("Failed to create participant");

  return { session, participant };
};

export const getSessionWithParticipants = async (
  sessionId: string
): Promise<
  Database["public"]["Tables"]["sessions"]["Row"] & {
    participants: Database["public"]["Tables"]["participants"]["Row"][];
    whiskies: Database["public"]["Tables"]["whiskies"]["Row"][];
    submissions: Database["public"]["Tables"]["submissions"]["Row"][];
  }
> => {
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
  if (!session) throw new Error("Session not found");
  return session as Database["public"]["Tables"]["sessions"]["Row"] & {
    participants: Database["public"]["Tables"]["participants"]["Row"][];
    whiskies: Database["public"]["Tables"]["whiskies"]["Row"][];
    submissions: Database["public"]["Tables"]["submissions"]["Row"][];
  };
};

// Helper functions for regions and distilleries
export const getRegions = async (): Promise<
  Database["public"]["Tables"]["regions"]["Row"][]
> => {
  const { data, error } = await supabase
    .from("regions")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as Database["public"]["Tables"]["regions"]["Row"][]) || [];
};

export const getDistilleriesByRegion = async (
  regionId: string
): Promise<
  Database["public"]["Tables"]["distilleries"]["Row"][]
> => {
  const { data, error } = await supabase
    .from("distilleries")
    .select("*")
    .eq("region_id", regionId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as Database["public"]["Tables"]["distilleries"]["Row"][]) || [];
};
