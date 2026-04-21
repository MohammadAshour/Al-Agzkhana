"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      console.log("Full session object:", JSON.stringify(session, null, 2));
      if (session.djangoToken) {
        localStorage.setItem("authToken", session.djangoToken);
        console.log("Token stored successfully");
      } else {
        console.warn("No djangoToken in session — Django auth exchange failed");
      }
    }
  }, [session]);

  useEffect(() => {
    if (session) router.push("/");
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-64">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">👋</div>
        <h2 className="text-2xl font-bold text-blue-900 mb-2">
          مرحباً، {session.user?.name || session.user?.email}
        </h2>
        {!session.djangoToken && (
          <p className="text-red-500 text-sm mb-4">
            ⚠️ فشل ربط حساب Google بالخادم
          </p>
        )}
        <button
          onClick={() => {
            localStorage.removeItem("authToken");
            signOut({ callbackUrl: "/" });
          }}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-500 w-full"
        >
          تسجيل الخروج
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-lg shadow p-8 text-center">
      <div className="text-6xl mb-4">🔐</div>
      <h2 className="text-2xl font-bold text-blue-900 mb-2">تسجيل الدخول</h2>
      <p className="text-gray-600 mb-8">سجل دخولك لإدارة أدوية المنزل</p>
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 w-full transition-all"
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        تسجيل الدخول بـ Google
      </button>
    </div>
  );
}