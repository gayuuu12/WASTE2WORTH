/**
 * Safe development-only logging for AI API routes.
 * Never log secrets, cookies, tokens, or request bodies.
 */
export function logAiRouteDev(
  route: "chat" | "analyze-waste",
  request: Request,
  details: {
    authenticated: boolean
    responseStatus: number
    providerCalled: boolean
    errorKind?: string
  },
) {
  if (process.env.NODE_ENV !== "development") return

  console.info(`[AI route ${route}]`, {
    host: request.headers.get("host") ?? "unknown",
    origin: request.headers.get("origin") ?? "none",
    authenticated: details.authenticated,
    responseStatus: details.responseStatus,
    providerCalled: details.providerCalled,
    errorKind: details.errorKind ?? "none",
  })
}
