import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 3001),
  valseaApiKey: process.env.VALSEA_API_KEY ?? "",
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmBaseUrl: (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
  llmModel: process.env.LLM_MODEL ?? "gpt-4o-mini",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};

export function assertValseaKey(): void {
  if (!env.valseaApiKey) throw new Error("VALSEA_API_KEY is not set");
}

export function assertLlmKey(): void {
  if (!env.llmApiKey) throw new Error("LLM_API_KEY is not set");
}
