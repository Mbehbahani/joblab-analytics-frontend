import { createServerClient } from "@/lib/supabase";

// Columns the dashboard and filter-options routes actually read.
const JOB_COLUMNS =
  "id, job_id, actual_role, company_name, country, location, job_type_filled, " +
  "job_level_std, job_function_std, company_industry_std, education_level, is_remote, " +
  "is_research, posted_date, platform, url, skills, tools, job_relevance_score, " +
  "has_url_duplicate, search_term";

const PAGE_SIZE = 1000;
// The scraper writes once a day, so a few minutes of staleness is invisible to users
// and turns every filter click into an in-memory aggregation instead of a full table pull.
const TTL_MS = Number(process.env.JOBS_CACHE_TTL_MS ?? 5 * 60 * 1000);

type CacheEntry = { rows: any[]; loadedAt: number };

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<any[]>>();

async function fetchAllJobs(excludeDuplicates: boolean): Promise<any[]> {
  const supabase = createServerClient();

  const page = (from: number, withCount: boolean) => {
    let q = supabase
      .from("jobs")
      .select(JOB_COLUMNS, withCount ? { count: "exact" } : undefined)
      .order("id", { ascending: true });
    if (excludeDuplicates) q = q.eq("has_url_duplicate", 0);
    return q.range(from, from + PAGE_SIZE - 1);
  };

  // First page also returns the total count, so the rest can be fetched in parallel.
  const first = await page(0, true);
  if (first.error) throw first.error;
  const rows: any[] = [...(first.data ?? [])];
  const total = first.count ?? rows.length;

  const offsets: number[] = [];
  for (let from = rows.length; from < total; from += PAGE_SIZE) offsets.push(from);

  const pages = await Promise.all(offsets.map(from => page(from, false)));
  for (const p of pages) {
    if (p.error) throw p.error;
    rows.push(...(p.data ?? []));
  }
  return rows;
}

/**
 * All job rows (optionally excluding URL duplicates), cached in process memory for TTL_MS.
 * Concurrent callers share one in-flight fetch.
 */
export async function getAllJobs(excludeDuplicates: boolean): Promise<any[]> {
  const key = excludeDuplicates ? "nodup" : "all";
  const hit = cache.get(key);
  if (hit && Date.now() - hit.loadedAt < TTL_MS) return hit.rows;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const load = fetchAllJobs(excludeDuplicates)
    .then(rows => {
      cache.set(key, { rows, loadedAt: Date.now() });
      return rows;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, load);
  return load;
}
