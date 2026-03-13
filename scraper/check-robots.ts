const robotsCache = new Map<string, string | null>();

async function fetchRobotsTxt(origin: string): Promise<string | null> {
  if (robotsCache.has(origin)) {
    return robotsCache.get(origin)!;
  }

  try {
    const response = await fetch(`${origin}/robots.txt`, {
      headers: {
        "User-Agent": "FifthSet/1.0 (https://fifthset.live; hello@fifthset.live)",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      robotsCache.set(origin, null);
      return null;
    }

    const text = await response.text();
    robotsCache.set(origin, text);
    return text;
  } catch {
    robotsCache.set(origin, null);
    return null;
  }
}

function isPathDisallowed(
  robotsTxt: string,
  path: string,
  userAgent: string
): boolean {
  const lines = robotsTxt.split("\n").map((l) => l.trim());
  const normalizedUA = userAgent.toLowerCase();

  let currentAgents: string[] = [];
  let inRelevantBlock = false;
  const disallowRules: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#") || line === "") {
      if (line === "" && currentAgents.length > 0) {
        inRelevantBlock = false;
        currentAgents = [];
      }
      continue;
    }

    const [directive, ...valueParts] = line.split(":");
    const key = directive.trim().toLowerCase();
    const value = valueParts.join(":").trim();

    if (key === "user-agent") {
      const agent = value.toLowerCase();
      currentAgents.push(agent);
      inRelevantBlock =
        agent === "*" ||
        normalizedUA.includes(agent) ||
        agent.includes("fifthset");
    } else if (key === "disallow" && inRelevantBlock && value) {
      disallowRules.push(value);
    }
  }

  for (const rule of disallowRules) {
    if (rule === "/") return true;
    if (path.startsWith(rule)) return true;
    if (rule.endsWith("*")) {
      const prefix = rule.slice(0, -1);
      if (path.startsWith(prefix)) return true;
    }
  }

  return false;
}

export async function isAllowedByRobots(
  url: string,
  userAgent: string
): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }

  const robotsTxt = await fetchRobotsTxt(parsed.origin);
  if (!robotsTxt) return true;

  return !isPathDisallowed(robotsTxt, parsed.pathname, userAgent);
}
