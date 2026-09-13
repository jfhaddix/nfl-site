import { loadEligibleSundaySlate } from "../../../lib/nfl/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await loadEligibleSundaySlate();
  return Response.json(result, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=1800" },
  });
}
