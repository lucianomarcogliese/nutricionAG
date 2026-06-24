const isProd = process.env.NODE_ENV === "production"

function serialize(args: unknown[]): string {
  const [first, ...rest] = args
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    message: typeof first === "string" ? first : JSON.stringify(first),
  }
  if (rest.length === 1) entry.data = rest[0]
  else if (rest.length > 1) entry.data = rest
  return JSON.stringify(entry)
}

export const logger = {
  error: (...args: unknown[]) => {
    if (isProd) console.error(serialize(args))
    else console.error("[ERROR]", ...args)
  },
  warn: (...args: unknown[]) => {
    if (isProd) console.warn(serialize(args))
    else console.warn("[WARN]", ...args)
  },
  info: (...args: unknown[]) => {
    if (isProd) console.log(serialize(args))
    else console.log("[INFO]", ...args)
  },
}
