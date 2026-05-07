import jwt from "jsonwebtoken"
import { PRIVATE_KEY, AI_SERVICE_URL } from "../config/env.js"

export type AIResponse = { type: "message", message: string }
    | { type: "action", action: "ASSIGN_TASK" | "CHANGE_STATUS" | "CREATE_TASK";
        payload: Record<string, string>;
        message: string;
    };

export async function callAIService(
    endpoint: string,
    body: Record<string, unknown>
): Promise<AIResponse> {
    if (!PRIVATE_KEY) throw new Error("Private key missing. AI features offline.");

    const token = jwt.sign(
        {service: "korix-backend"},
        PRIVATE_KEY,
        {algorithm: "RS256", expiresIn: "30s"}
    );

    const url=`${AI_SERVICE_URL??"http://localhost:8000"}/api/${endpoint}`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,   // Python reads this header
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI service error [${response.status}]: ${text}`);
    }
    return response.json() as Promise<AIResponse>;

}