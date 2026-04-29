import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"

  return NextResponse.redirect(new URL(callbackUrl, origin))
}
