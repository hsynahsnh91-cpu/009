export async function GET() {
  return Response.json({ configured: !!process.env.OPENAI_API_KEY });
}
