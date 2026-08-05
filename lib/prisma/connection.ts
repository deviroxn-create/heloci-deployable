export function buildPrismaConnectionUrl(rawUrl: string, poolSize = "25") {
  if (!rawUrl) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    const params = url.searchParams;

    if (!params.has("connection_limit")) {
      params.set("connection_limit", poolSize);
      url.search = params.toString();
      return url.toString();
    }
  } catch {
    // Fallback for non-URL values; preserve the original input.
  }

  return rawUrl;
}
