import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const server = require("next/server.js");

export const NextResponse = server.NextResponse;
export const NextRequest = server.NextRequest;
export const ImageResponse = server.ImageResponse;
export const userAgent = server.userAgent;
export const userAgentFromString = server.userAgentFromString;
export const URLPattern = server.URLPattern;
export const after = server.after;
export const connection = server.connection;
