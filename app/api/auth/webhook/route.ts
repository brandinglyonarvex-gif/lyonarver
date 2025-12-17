import { headers } from "next/headers";
import { getOrCreateUser } from "@/lib/kinde-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    // The `getOrCreateUser` function uses `upsert`, so it handles both
    // user creation and updates seamlessly. We can use it for both events.
    if (type === "user.created" || type === "user.updated") {
      const { id: kindeId, email, given_name, picture } = data;

      // This will either create the user with the details or update them if they exist.
      await getOrCreateUser(
        kindeId,
        email || "",
        given_name || undefined,
        picture || undefined,
      );
    }

    return new Response("", { status: 200 });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response("Error occurred", { status: 400 });
  }
}

