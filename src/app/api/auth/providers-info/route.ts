import { NextResponse } from "next/server";

export async function GET() {
  const ssoEnabled = !!(
    process.env.SSO_URL &&
    process.env.SSO_CLIENT_ID &&
    process.env.SSO_CLIENT_SECRET
  );

  return NextResponse.json({
    ssoEnabled,
    ssoProvider: ssoEnabled ? "keycloak" : null,
  });
}
