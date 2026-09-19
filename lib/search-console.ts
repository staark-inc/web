import { google } from "googleapis";

import { prisma } from "@/lib/prisma";

const SITE_URL =
  process.env.SEARCH_CONSOLE_SITE_URL;

export type SearchConsoleOverview = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;

  dailyTraffic: {
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];

  topQueries: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];

  topPages: {
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
};

function formatDate(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLast30Days() {
  const endDate = new Date();

  endDate.setHours(
    12,
    0,
    0,
    0
  );

  const startDate =
    new Date(endDate);

  startDate.setDate(
    endDate.getDate() - 29
  );

  return {
    startDate:
      formatDate(startDate),

    endDate:
      formatDate(endDate),
  };
}

function fillLast30Days(
  traffic: SearchConsoleOverview["dailyTraffic"]
) {
  const map =
    new Map(
      traffic.map((item) => [
        item.date,
        item,
      ])
    );

  const result:
    SearchConsoleOverview["dailyTraffic"] =
      [];

  const today =
    new Date();

  today.setHours(
    12,
    0,
    0,
    0
  );

  for (
    let daysAgo = 29;
    daysAgo >= 0;
    daysAgo--
  ) {
    const date =
      new Date(today);

    date.setDate(
      today.getDate() -
        daysAgo
    );

    const key =
      formatDate(date);

    const existing =
      map.get(key);

    result.push(
      existing ?? {
        date: key,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      }
    );
  }

  return result;
}

async function getSearchConsoleClient() {
  if (!SITE_URL) {
    throw new Error(
      "SEARCH_CONSOLE_SITE_URL is missing."
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

  if (
    !settings?.ga4RefreshToken
  ) {
    throw new Error(
      "Google account is not connected."
    );
  }

  const clientId =
    process.env
      .GOOGLE_OAUTH_CLIENT_ID;

  const clientSecret =
    process.env
      .GOOGLE_OAUTH_CLIENT_SECRET;

  const redirectUri =
    process.env
      .GOOGLE_OAUTH_REDIRECT_URI;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
    throw new Error(
      "Google OAuth configuration is missing."
    );
  }

  const auth =
    new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

  auth.setCredentials({
    refresh_token:
      settings.ga4RefreshToken,
  });

  return google.searchconsole({
    version: "v1",
    auth,
  });
}

export async function getSearchConsoleOverview(): Promise<SearchConsoleOverview> {
  if (!SITE_URL) {
    throw new Error(
      "SEARCH_CONSOLE_SITE_URL is missing."
    );
  }

  const searchConsole =
    await getSearchConsoleClient();

  const {
    startDate,
    endDate,
  } = getLast30Days();

  /*
   * -------------------------------------------------------
   * OVERVIEW
   * -------------------------------------------------------
   */

  const overviewPromise =
    searchConsole.searchanalytics.query({
      siteUrl: SITE_URL,

      requestBody: {
        startDate,
        endDate,

        type: "web",

        rowLimit: 1,
      },
    });

  /*
   * -------------------------------------------------------
   * DAILY TRAFFIC
   * -------------------------------------------------------
   */

  const dailyPromise =
    searchConsole.searchanalytics.query({
      siteUrl: SITE_URL,

      requestBody: {
        startDate,
        endDate,

        type: "web",

        dimensions: [
          "date",
        ],

        rowLimit: 1000,
      },
    });

  /*
   * -------------------------------------------------------
   * TOP SEARCH QUERIES
   * -------------------------------------------------------
   */

  const queriesPromise =
    searchConsole.searchanalytics.query({
      siteUrl: SITE_URL,

      requestBody: {
        startDate,
        endDate,

        type: "web",

        dimensions: [
          "query",
        ],

        rowLimit: 10,
      },
    });

  /*
   * -------------------------------------------------------
   * TOP PAGES
   * -------------------------------------------------------
   */

  const pagesPromise =
    searchConsole.searchanalytics.query({
      siteUrl: SITE_URL,

      requestBody: {
        startDate,
        endDate,

        type: "web",

        dimensions: [
          "page",
        ],

        rowLimit: 10,
      },
    });

  const [
    overviewResponse,
    dailyResponse,
    queriesResponse,
    pagesResponse,
  ] =
    await Promise.all([
      overviewPromise,
      dailyPromise,
      queriesPromise,
      pagesPromise,
    ]);

  /*
   * -------------------------------------------------------
   * OVERVIEW VALUES
   * -------------------------------------------------------
   */

  const overviewRow =
    overviewResponse.data
      .rows?.[0];

  const clicks =
    Number(
      overviewRow?.clicks ??
        0
    );

  const impressions =
    Number(
      overviewRow?.impressions ??
        0
    );

  const ctr =
    Number(
      overviewRow?.ctr ??
        0
    );

  const position =
    Number(
      overviewRow?.position ??
        0
    );

  /*
   * -------------------------------------------------------
   * DAILY TRAFFIC
   * -------------------------------------------------------
   */

  const rawDailyTraffic =
    dailyResponse.data.rows?.map(
      (row) => ({
        date:
          row.keys?.[0] ??
          "",

        clicks:
          Number(
            row.clicks ??
              0
          ),

        impressions:
          Number(
            row.impressions ??
              0
          ),

        ctr:
          Number(
            row.ctr ??
              0
          ),

        position:
          Number(
            row.position ??
              0
          ),
      })
    ) ?? [];

  const dailyTraffic =
    fillLast30Days(
      rawDailyTraffic
    );

  /*
   * -------------------------------------------------------
   * TOP QUERIES
   * -------------------------------------------------------
   */

  const topQueries =
    queriesResponse.data.rows?.map(
      (row) => ({
        query:
          row.keys?.[0] ??
          "Unknown",

        clicks:
          Number(
            row.clicks ??
              0
          ),

        impressions:
          Number(
            row.impressions ??
              0
          ),

        ctr:
          Number(
            row.ctr ??
              0
          ),

        position:
          Number(
            row.position ??
              0
          ),
      })
    ) ?? [];

  /*
   * -------------------------------------------------------
   * TOP PAGES
   * -------------------------------------------------------
   */

  const topPages =
    pagesResponse.data.rows?.map(
      (row) => ({
        page:
          row.keys?.[0] ??
          "/",

        clicks:
          Number(
            row.clicks ??
              0
          ),

        impressions:
          Number(
            row.impressions ??
              0
          ),

        ctr:
          Number(
            row.ctr ??
              0
          ),

        position:
          Number(
            row.position ??
              0
          ),
      })
    ) ?? [];

  return {
    clicks,
    impressions,
    ctr,
    position,
    dailyTraffic,
    topQueries,
    topPages,
  };
}