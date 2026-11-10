const root = new URL("../", import.meta.url);

export async function resolve(
  specifier,
  context,
  nextResolve
) {
  if (specifier === "next/server") {
    return nextResolve(
      new URL(
        "./next-server-shim.mjs",
        import.meta.url
      ).href,
      context
    );
  }

  if (specifier.startsWith("@/")) {
    const relative = specifier.slice(2);

    for (const candidate of [
      relative,
      `${relative}.ts`,
      `${relative}.tsx`,
      `${relative}.json`,
      `${relative}/index.ts`,
      `${relative}/index.tsx`,
    ]) {
      try {
        return await nextResolve(
          new URL(candidate, root).href,
          context
        );
      } catch {
        // Try the next extension.
      }
    }
  }

  if (
    specifier.startsWith(".") &&
    !/\.[a-z0-9]+$/i.test(specifier)
  ) {
    const base = new URL(
      specifier,
      context.parentURL
    ).href;

    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}/index.ts`,
      `${base}/index.tsx`,
    ]) {
      try {
        return await nextResolve(
          candidate,
          context
        );
      } catch {
        // Try the next extension.
      }
    }
  }

  return nextResolve(specifier, context);
}
