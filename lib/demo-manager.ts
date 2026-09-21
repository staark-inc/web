const BASE_URL =
  process.env.DEMO_MANAGER_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8181"
    : "http://staark-demo-manager:8080");

const SECRET =
  process.env.DEMO_MANAGER_SECRET;

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!SECRET) {
    throw new Error(
      "DEMO_MANAGER_SECRET is not configured"
    );
  }

  const response = await fetch(
    `${BASE_URL}${path}`,
    {
      ...options,
      cache: "no-store",

      headers: {
        Authorization: `Bearer ${SECRET}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Demo Manager ${response.status}: ${text}`
    );
  }

  return text
    ? JSON.parse(text)
    : ({} as T);
}

export type DemoStatus = {
  slug: string;
  status: string;
  url?: string;
};

export function getDemoStatus(
  slug: string
) {
  return request<DemoStatus>(
    `/status/${encodeURIComponent(slug)}`
  );
}

export function deployDemo(input: {
  slug: string;
  image: string;
  port: number;
}) {
  return request("/deploy", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function startDemo(
  slug: string
) {
  return request(
    `/start/${encodeURIComponent(slug)}`,
    {
      method: "POST",
    }
  );
}

export function stopDemo(
  slug: string
) {
  return request(
    `/stop/${encodeURIComponent(slug)}`,
    {
      method: "POST",
    }
  );
}

export function removeDemo(
  slug: string
) {
  return request(
    `/demo/${encodeURIComponent(slug)}`,
    {
      method: "DELETE",
    }
  );
}

export function getDemoLogs(
  slug: string
) {
  return request<{
    slug: string;
    logs: string;
  }>(
    `/logs/${encodeURIComponent(slug)}`
  );
}
