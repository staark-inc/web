import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

export type Ga4Overview = {
  visitors: number;
  sessions: number;
  pageViews: number;
  onlineNow: number;

  dailyTraffic: {
    date: string;
    visitors: number;
    sessions: number;
    pageViews: number;
  }[];

  topPages: {
    path: string;
    title: string;
    views: number;
  }[];
};

/**
 * Exclude Staark Hub from public website analytics.
 *
 * Hub tracking is also disabled on the frontend,
 * but we keep this filter to exclude historical Hub data.
 */
const PUBLIC_SITE_FILTER = {
  notExpression: {
    filter: {
      fieldName: "pagePath",
      stringFilter: {
        matchType: "BEGINS_WITH" as const,
        value: "/hub",
      },
    },
  },
};

/**
 * Converts a Date to the same YYYYMMDD format
 * returned by the GA4 "date" dimension.
 */
function formatGa4Date(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * Fill the traffic report with exactly the last
 * 30 calendar days.
 *
 * GA4 normally returns only dates that contain data.
 * Missing dates therefore need to be added manually
 * with zero values.
 */
function fillLast30Days(
  traffic: Ga4Overview["dailyTraffic"]
): Ga4Overview["dailyTraffic"] {
  const trafficMap = new Map(
    traffic.map((item) => [
      item.date,
      item,
    ])
  );

  const result: Ga4Overview["dailyTraffic"] = [];

  const today = new Date();

  today.setHours(12, 0, 0, 0);

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);

    date.setDate(
      today.getDate() - daysAgo
    );

    const key = formatGa4Date(date);

    const existing = trafficMap.get(key);

    result.push(
      existing ?? {
        date: key,
        visitors: 0,
        sessions: 0,
        pageViews: 0,
      }
    );
  }

  return result;
}

async function getAnalyticsClient() {
  if (!PROPERTY_ID) {
    throw new Error(
      "GA4_PROPERTY_ID is missing."
    );
  }

  const settings =
    await prisma.settings.findUnique({
      where: {
        id: "default",
      },

      select: {
        ga4RefreshToken: true,
      },
    });

  if (!settings?.ga4RefreshToken) {
    throw new Error(
      "Google Analytics is not connected."
    );
  }

  const clientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID;

  const clientSecret =
    process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
    throw new Error(
      "Google OAuth configuration is missing."
    );
  }

  const auth = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  auth.setCredentials({
    refresh_token:
      settings.ga4RefreshToken,
  });

  return google.analyticsdata({
    version: "v1beta",
    auth,
  });
}

export async function getGa4Overview(): Promise<Ga4Overview> {
  if (!PROPERTY_ID) {
    throw new Error(
      "GA4_PROPERTY_ID is missing."
    );
  }

  const analytics =
    await getAnalyticsClient();

  /**
   * ---------------------------------------------------------
   * 1. PUBLIC WEBSITE OVERVIEW
   * ---------------------------------------------------------
   *
   * Last 30 calendar days.
   * /hub is excluded.
   */
  const overviewPromise =
    analytics.properties.runReport({
      property: `properties/${PROPERTY_ID}`,

      requestBody: {
        dateRanges: [
          {
            startDate: "29daysAgo",
            endDate: "today",
          },
        ],

        dimensionFilter:
          PUBLIC_SITE_FILTER,

        metrics: [
          {
            name: "activeUsers",
          },
          {
            name: "sessions",
          },
          {
            name: "screenPageViews",
          },
        ],
      },
    });

  /**
   * ---------------------------------------------------------
   * 2. DAILY TRAFFIC
   * ---------------------------------------------------------
   *
   * Exactly 30 calendar days:
   * today + previous 29 days.
   *
   * Missing dates will later be filled with zeros.
   */
  const dailyPromise =
    analytics.properties.runReport({
      property: `properties/${PROPERTY_ID}`,

      requestBody: {
        dateRanges: [
          {
            startDate: "29daysAgo",
            endDate: "today",
          },
        ],

        dimensionFilter:
          PUBLIC_SITE_FILTER,

        dimensions: [
          {
            name: "date",
          },
        ],

        metrics: [
          {
            name: "activeUsers",
          },
          {
            name: "sessions",
          },
          {
            name: "screenPageViews",
          },
        ],

        orderBys: [
          {
            dimension: {
              dimensionName: "date",
            },
          },
        ],
      },
    });

  /**
   * ---------------------------------------------------------
   * 3. TOP PUBLIC PAGES
   * ---------------------------------------------------------
   */
  const topPagesPromise =
    analytics.properties.runReport({
      property: `properties/${PROPERTY_ID}`,

      requestBody: {
        dateRanges: [
          {
            startDate: "29daysAgo",
            endDate: "today",
          },
        ],

        dimensionFilter:
          PUBLIC_SITE_FILTER,

        dimensions: [
          {
            name: "pagePath",
          },
          {
            name: "pageTitle",
          },
        ],

        metrics: [
          {
            name: "screenPageViews",
          },
        ],

        orderBys: [
          {
            metric: {
              metricName:
                "screenPageViews",
            },
            desc: true,
          },
        ],

        limit: "8",
      },
    });

  /**
   * Run the standard reports together.
   */
  const [
    overviewResponse,
    dailyResponse,
    topPagesResponse,
  ] = await Promise.all([
    overviewPromise,
    dailyPromise,
    topPagesPromise,
  ]);

  /**
   * ---------------------------------------------------------
   * 4. REALTIME
   * ---------------------------------------------------------
   */
  let onlineNow = 0;

  try {
    const realtimeResponse =
      await analytics.properties.runRealtimeReport(
        {
          property: `properties/${PROPERTY_ID}`,

          requestBody: {
            metrics: [
              {
                name: "activeUsers",
              },
            ],
          },
        }
      );

    onlineNow = Number(
      realtimeResponse.data.rows?.[0]
        ?.metricValues?.[0]?.value ?? 0
    );
  } catch (error) {
    console.error(
      "GA4 realtime report failed:",
      error
    );

    onlineNow = 0;
  }

  /**
   * ---------------------------------------------------------
   * PARSE OVERVIEW
   * ---------------------------------------------------------
   */
  const overviewValues =
    overviewResponse.data.rows?.[0]
      ?.metricValues ?? [];

  const visitors = Number(
    overviewValues[0]?.value ?? 0
  );

  const sessions = Number(
    overviewValues[1]?.value ?? 0
  );

  const pageViews = Number(
    overviewValues[2]?.value ?? 0
  );

  /**
   * ---------------------------------------------------------
   * PARSE DAILY TRAFFIC FROM GA4
   * ---------------------------------------------------------
   */
  const rawDailyTraffic =
    dailyResponse.data.rows?.map(
      (row) => ({
        date:
          row.dimensionValues?.[0]
            ?.value ?? "",

        visitors: Number(
          row.metricValues?.[0]
            ?.value ?? 0
        ),

        sessions: Number(
          row.metricValues?.[1]
            ?.value ?? 0
        ),

        pageViews: Number(
          row.metricValues?.[2]
            ?.value ?? 0
        ),
      })
    ) ?? [];

  /**
   * GA4 omits empty dates.
   *
   * Convert:
   *
   * Sep 18 -> missing
   * Sep 19 -> 9
   *
   * into:
   *
   * Sep 18 -> 0
   * Sep 19 -> 9
   */
  const dailyTraffic =
    fillLast30Days(
      rawDailyTraffic
    );

  /**
   * ---------------------------------------------------------
   * PARSE TOP PAGES
   * ---------------------------------------------------------
   */
  const topPages =
    topPagesResponse.data.rows?.map(
      (row) => ({
        path:
          row.dimensionValues?.[0]
            ?.value ?? "/",

        title:
          row.dimensionValues?.[1]
            ?.value ?? "Untitled",

        views: Number(
          row.metricValues?.[0]
            ?.value ?? 0
        ),
      })
    ) ?? [];

  /**
   * ---------------------------------------------------------
   * FINAL RESULT
   * ---------------------------------------------------------
   */
  return {
    visitors,
    sessions,
    pageViews,
    onlineNow,
    dailyTraffic,
    topPages,
  };
}