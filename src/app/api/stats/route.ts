import { dbGet } from "@/lib/db";

export async function GET() {
  const recruiterCount = (await dbGet<{ c: number }>("SELECT COUNT(*) as c FROM recruiters"))!.c;
  const reviewCount = (await dbGet<{ c: number }>("SELECT COUNT(*) as c FROM reviews WHERE status = 'approved'"))!.c;
  const companyCount = (await dbGet<{ c: number }>("SELECT COUNT(*) as c FROM companies"))!.c;

  return Response.json({ recruiterCount, reviewCount, companyCount });
}
