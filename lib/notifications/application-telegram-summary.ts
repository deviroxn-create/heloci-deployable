export function sanitizeApplicationData(value: unknown, key = ""): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeApplicationData(item, key));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeApplicationData(entryValue, entryKey),
      ])
    );
  }

  const normalizedKey = key.toLowerCase();
  if (normalizedKey.includes("fileurl") || normalizedKey.includes("file_url") || normalizedKey.includes("token") || normalizedKey.includes("secret") || normalizedKey.includes("password") || normalizedKey.includes("credential")) {
    return "[REDACTED]";
  }

  if (normalizedKey.includes("ssn")) {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits.length >= 4 ? `***-**-${digits.slice(-4)}` : "[REDACTED]";
  }

  if (normalizedKey.includes("account") || normalizedKey.includes("routing") || normalizedKey.includes("bankaccount")) {
    return value ? "Provided" : undefined;
  }

  return value;
}
