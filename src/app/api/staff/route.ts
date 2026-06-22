import { NextResponse } from 'next/server';
import { getStaffMap } from '@/lib/sheets';

export async function GET() {
  try {
    const staffMap = await getStaffMap();
    return NextResponse.json({ staff: Object.values(staffMap) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
