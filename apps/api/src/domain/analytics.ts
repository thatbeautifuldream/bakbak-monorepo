export const analyticsRanges = ["1d", "7d", "14d"] as const;

export type AnalyticsRange = (typeof analyticsRanges)[number];

export type AnalyticsEventRecord = {
  installationHash: string;
  visitId: string;
  eventType: string;
  domain: string;
  category: string;
  language: string;
  browser: string;
  countryCode: string | null;
  regionCode: string | null;
  activeSeconds: number;
  occurredAt: Date;
};

type DomainMetadata = {
  category: string;
  language: string;
};

const domainCatalog: Record<string, DomainMetadata> = {
  "ajitjalandhar.com": { category: "News & media", language: "Punjabi" },
  "bhaskar.com": { category: "News & media", language: "Hindi" },
  "anandabazar.com": { category: "News & media", language: "Bengali" },
  "dinamalar.com": { category: "News & media", language: "Tamil" },
  "manoramaonline.com": { category: "News & media", language: "Malayalam" },
  "sakshi.com": { category: "News & media", language: "Telugu" },
  "lokmat.com": { category: "News & media", language: "Marathi" },
  "sambad.in": { category: "News & media", language: "Odia" },
  "urdu.siasat.com": { category: "News & media", language: "Urdu" },
};

const languageNames: Record<string, string> = {
  as: "Assamese",
  bn: "Bengali",
  en: "English",
  gu: "Gujarati",
  hi: "Hindi",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  ne: "Nepali",
  od: "Odia",
  or: "Odia",
  pa: "Punjabi",
  ta: "Tamil",
  te: "Telugu",
  ur: "Urdu",
};

const indianRegions: Record<string, string> = {
  AP: "Andhra Pradesh",
  AS: "Assam",
  BR: "Bihar",
  DL: "Delhi",
  GJ: "Gujarat",
  KA: "Karnataka",
  KL: "Kerala",
  MH: "Maharashtra",
  PB: "Punjab",
  RJ: "Rajasthan",
  TN: "Tamil Nadu",
  TS: "Telangana",
  UP: "Uttar Pradesh",
  WB: "West Bengal",
};

const tones = ["coral", "red", "violet", "blue", "amber", "graphite"] as const;

type Tone = (typeof tones)[number];

export type AnalyticsSnapshot = {
  range: AnalyticsRange;
  updatedAt: string;
  metrics: Array<{
    label: string;
    value: string;
    detail: string;
    change: string;
  }>;
  chart: {
    change: string;
    points: string;
    labels: string[];
  };
  categories: Array<{
    label: string;
    value: number;
    tone: Tone;
  }>;
  sites: Array<{
    domain: string;
    language: string;
    visits: string;
    time: string;
    share: number;
    trend: string;
    tone: Tone;
  }>;
  locations: Array<{
    label: string;
    value: string;
  }>;
  browsers: Array<{
    label: string;
    value: string;
  }>;
};

const rangeMilliseconds: Record<AnalyticsRange, number> = {
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "14d": 14 * 24 * 60 * 60 * 1000,
};

const rangeLabels: Record<AnalyticsRange, string> = {
  "1d": "the last 24 hours",
  "7d": "the last 7 days",
  "14d": "the last 14 days",
};

const normaliseDomain = (domain: string) =>
  domain.trim().toLowerCase().replace(/^www\./, "");

export const getDomainMetadata = (
  domain: string,
  language: string,
): DomainMetadata => {
  const metadata = domainCatalog[normaliseDomain(domain)];
  return metadata ?? { category: "Other", language: getLanguageLabel(language) };
};

export const getLanguageLabel = (language: string) => {
  const primary = language.trim().toLowerCase().split("-")[0] ?? "";
  return languageNames[primary] ?? "Unspecified";
};

const isWithin = (date: Date, start: Date, end: Date) =>
  date >= start && date < end;

const unique = <T>(values: T[]) => new Set(values).size;

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

const formatShare = (value: number) =>
  `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value)}%`;

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return minutes > 0 ? `${minutes}m ${String(remainder).padStart(2, "0")}s` : `${remainder}s`;
};

const percentChange = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? "0%" : "—";
  const value = ((current - previous) / previous) * 100;
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
};

const durationChange = (current: number, previous: number) => {
  const value = Math.round(current - previous);
  if (value === 0) return "0s";
  return `${value > 0 ? "+" : ""}${formatDuration(value)}`;
};

const getVisitStarts = (events: AnalyticsEventRecord[]) =>
  events.filter((event) => event.eventType === "visit_started");

const getAverageActiveSeconds = (
  events: AnalyticsEventRecord[],
  visits: AnalyticsEventRecord[],
) => {
  if (visits.length === 0) return 0;
  const visitIds = new Set(visits.map((visit) => visit.visitId));
  const seconds = events
    .filter(
      (event) =>
        event.eventType === "active_time" && visitIds.has(event.visitId),
    )
    .reduce((sum, event) => sum + event.activeSeconds, 0);
  return seconds / visits.length;
};

const getLocationLabel = (event: AnalyticsEventRecord) => {
  if (!event.countryCode) return "Location unavailable";
  if (event.countryCode !== "IN") return "Outside India";
  const region = event.regionCode?.replace(/^IN-/, "").toUpperCase();
  return (region && indianRegions[region]) || "India";
};

const getTrend = (
  visits: AnalyticsEventRecord[],
  range: AnalyticsRange,
  end: Date,
) => {
  const bucketCount = range === "1d" ? 24 : Number.parseInt(range, 10);
  const bucketMilliseconds = range === "1d" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const start = new Date(end.getTime() - bucketCount * bucketMilliseconds);
  const buckets = Array.from({ length: bucketCount }, () => 0);

  for (const visit of visits) {
    const index = Math.floor(
      (visit.occurredAt.getTime() - start.getTime()) / bucketMilliseconds,
    );
    if (index >= 0 && index < buckets.length) buckets[index] += 1;
  }

  const displayBuckets = 7;
  const values = Array.from({ length: displayBuckets }, (_, index) => {
    const from = Math.floor((index * buckets.length) / displayBuckets);
    const to = Math.floor(((index + 1) * buckets.length) / displayBuckets);
    return buckets.slice(from, to).reduce((sum, value) => sum + value, 0);
  });
  const max = Math.max(...values, 1);
  const labels = values.map((_, index) => {
    const bucketIndex = Math.min(
      buckets.length - 1,
      Math.floor(((index + 1) * buckets.length) / displayBuckets) - 1,
    );
    const bucketEnd = new Date(start.getTime() + (bucketIndex + 1) * bucketMilliseconds);
    return range === "1d"
      ? new Intl.DateTimeFormat("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "UTC",
        }).format(bucketEnd)
      : new Intl.DateTimeFormat("en-IN", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(bucketEnd);
  });
  const points = values
    .map((value, index) => {
      const x = Math.round((index * 720) / (values.length - 1));
      const y = Math.round(160 - (value / max) * 130);
      return `${x},${y}`;
    })
    .join(" ");

  return { points, labels };
};

const getLatestByInstallation = (events: AnalyticsEventRecord[]) => {
  const latest = new Map<string, AnalyticsEventRecord>();
  for (const event of events) {
    const current = latest.get(event.installationHash);
    if (!current || event.occurredAt > current.occurredAt) {
      latest.set(event.installationHash, event);
    }
  }
  return [...latest.values()];
};

const getTone = (index: number): Tone => tones[index % tones.length] ?? "graphite";

export const buildAnalyticsSnapshot = (
  allEvents: AnalyticsEventRecord[],
  range: AnalyticsRange,
  now = new Date(),
): AnalyticsSnapshot => {
  const rangeMs = rangeMilliseconds[range];
  const currentStart = new Date(now.getTime() - rangeMs);
  const previousStart = new Date(currentStart.getTime() - rangeMs);
  const current = allEvents.filter((event) => isWithin(event.occurredAt, currentStart, now));
  const previous = allEvents.filter((event) =>
    isWithin(event.occurredAt, previousStart, currentStart),
  );
  const currentVisits = getVisitStarts(current);
  const previousVisits = getVisitStarts(previous);
  const currentActiveExtensions = unique(
    current.map((event) => event.installationHash),
  );
  const previousActiveExtensions = unique(
    previous.map((event) => event.installationHash),
  );
  const currentAverageSeconds = getAverageActiveSeconds(current, currentVisits);
  const previousAverageSeconds = getAverageActiveSeconds(previous, previousVisits);
  const currentVoiceVisits = unique(
    current
      .filter((event) => event.eventType === "voice_started")
      .map((event) => event.visitId),
  );
  const previousVoiceVisits = unique(
    previous
      .filter((event) => event.eventType === "voice_started")
      .map((event) => event.visitId),
  );

  const categoryCounts = new Map<string, number>();
  for (const visit of currentVisits) {
    categoryCounts.set(
      visit.category,
      (categoryCounts.get(visit.category) ?? 0) + 1,
    );
  }
  const categories = [...categoryCounts.entries()]
    .sort(([, left], [, right]) => right - left)
    .map(([label, count], index) => ({
      label,
      value: currentVisits.length ? Number(((count / currentVisits.length) * 100).toFixed(1)) : 0,
      tone: getTone(index),
    }));

  const activeSecondsByVisit = new Map<string, number>();
  for (const event of current) {
    if (event.eventType !== "active_time") continue;
    activeSecondsByVisit.set(
      event.visitId,
      (activeSecondsByVisit.get(event.visitId) ?? 0) + event.activeSeconds,
    );
  }
  const previousVisitsByDomain = new Map<string, number>();
  for (const visit of previousVisits) {
    previousVisitsByDomain.set(
      visit.domain,
      (previousVisitsByDomain.get(visit.domain) ?? 0) + 1,
    );
  }
  const sitesByDomain = new Map<
    string,
    { visits: number; seconds: number; language: string; category: string }
  >();
  for (const visit of currentVisits) {
    const site = sitesByDomain.get(visit.domain) ?? {
      visits: 0,
      seconds: 0,
      language: visit.language,
      category: visit.category,
    };
    site.visits += 1;
    site.seconds += activeSecondsByVisit.get(visit.visitId) ?? 0;
    sitesByDomain.set(visit.domain, site);
  }
  const sites = [...sitesByDomain.entries()]
    .sort(([, left], [, right]) => right.visits - left.visits)
    .slice(0, 12)
    .map(([domain, site], index) => ({
      domain,
      language: site.language,
      visits: formatNumber(site.visits),
      time: formatDuration(site.visits ? site.seconds / site.visits : 0),
      share: currentVisits.length
        ? Number(((site.visits / currentVisits.length) * 100).toFixed(1))
        : 0,
      trend: percentChange(site.visits, previousVisitsByDomain.get(domain) ?? 0),
      tone: getTone(index),
    }));

  const locationCounts = new Map<string, number>();
  const browserCounts = new Map<string, number>();
  for (const event of getLatestByInstallation(current)) {
    const location = getLocationLabel(event);
    locationCounts.set(location, (locationCounts.get(location) ?? 0) + 1);
    browserCounts.set(event.browser, (browserCounts.get(event.browser) ?? 0) + 1);
  }
  const formatDistribution = (counts: Map<string, number>) =>
    [...counts.entries()]
      .sort(([, left], [, right]) => right - left)
      .map(([label, count]) => ({
        label,
        value: formatShare(
          currentActiveExtensions ? (count / currentActiveExtensions) * 100 : 0,
        ),
      }));

  return {
    range,
    updatedAt: now.toISOString(),
    metrics: [
      {
        label: "Observed visits",
        value: formatNumber(currentVisits.length),
        detail: `Across ${rangeLabels[range]}`,
        change: percentChange(currentVisits.length, previousVisits.length),
      },
      {
        label: "Active extensions",
        value: formatNumber(currentActiveExtensions),
        detail: "With at least one recorded event",
        change: percentChange(currentActiveExtensions, previousActiveExtensions),
      },
      {
        label: "Average active time",
        value: formatDuration(currentAverageSeconds),
        detail: "Per observed visit",
        change: durationChange(currentAverageSeconds, previousAverageSeconds),
      },
      {
        label: "Voice-assisted visits",
        value: formatNumber(currentVoiceVisits),
        detail: currentVisits.length
          ? `${formatShare((currentVoiceVisits / currentVisits.length) * 100)} of observed visits`
          : "No observed visits yet",
        change: percentChange(currentVoiceVisits, previousVoiceVisits),
      },
    ],
    chart: {
      change: percentChange(currentVisits.length, previousVisits.length),
      ...getTrend(currentVisits, range, now),
    },
    categories,
    sites,
    locations: formatDistribution(locationCounts),
    browsers: formatDistribution(browserCounts),
  };
};
