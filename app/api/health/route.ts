import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ message: 'Everything is working fine' });
}