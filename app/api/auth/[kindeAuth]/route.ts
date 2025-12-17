import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

const handler = handleAuth();

export const GET = handler;
export const POST = handler;
