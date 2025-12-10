import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Generate a random string for the keep-alive query
const generateRandomString = (length: number = 12): string => {
    const alphabetOffset = "a".charCodeAt(0);
    let newString = "";

    for (let i = 0; i < length; i++) {
        newString += String.fromCharCode(
            alphabetOffset + Math.floor(Math.random() * 26)
        );
    }

    return newString;
};

export async function GET() {
    try {
        const randomString = generateRandomString();

        // Make a database call to keep Supabase active
        // This query will return an empty array if no match, which is fine
        const { data, error } = await supabase
            .from("keep_alive")
            .select("name")
            .eq("name", randomString);

        if (error) {
            console.error("Keep-alive error:", error);
            return NextResponse.json(
                { error: "Keep-alive failed", details: error.message },
                { status: 500 }
            );
        }

        const result = {
            success: true,
            message: `Keep-alive successful - queried for '${randomString}'`,
            found: data?.length || 0,
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Keep-alive exception:", error);
        return NextResponse.json(
            {
                error: "Keep-alive failed",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

