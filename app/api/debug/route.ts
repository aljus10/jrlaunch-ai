import db from "../../../lib/db";

export async function GET() {
  const rows = db.prepare("SELECT * FROM business").all();
  return Response.json({ count: rows.length, rows });
}