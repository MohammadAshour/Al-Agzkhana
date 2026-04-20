"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavAuth() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-blue-200 text-sm">
          {session.user?.name || session.user?.email}
        </span>
        <button
          onClick={() => {
            localStorage.removeItem("authToken");
            signOut({ callbackUrl: "/" });
          }}
          className="text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-500"
        >
          خروج
        </button>
      </div>
    );
  }

  return (
    <Link href="/auth/login" className="hover:text-blue-200">
      دخول
    </Link>
  );
}