import { register } from "node:module";

process.env.AUTH_SECRET ??=
  "sec002-test-only-secret-0123456789abcdef";

register("./alias-loader.mjs", import.meta.url);
