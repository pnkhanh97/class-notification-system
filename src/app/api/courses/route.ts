import { NextResponse } from 'next/server';
import { getCourseMap } from '@/lib/sheets';

export async function GET() {
  try {
    const courseMap = await getCourseMap();
    return NextResponse.json({ courses: Object.values(courseMap) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
