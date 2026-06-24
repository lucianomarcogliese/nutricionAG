import type { default as PusherType } from "pusher-js"

type PusherInstance = InstanceType<typeof PusherType>
let _client: PusherInstance | null = null

// Lazy getter — require() runs only at call time (inside useEffect, browser-only)
// This avoids SSR evaluation of pusher-js which references browser globals like `self`
export function getPusherClient(): PusherInstance {
  if (!_client) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PusherJs = require("pusher-js")
    const Ctor: typeof PusherType = PusherJs.default ?? PusherJs
    _client = new Ctor(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
      }
    )
  }
  return _client
}
