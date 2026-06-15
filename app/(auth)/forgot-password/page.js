"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // ✅ Validasi kosong
    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }

    // ✅ Validasi format email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Format email tidak valid. Contoh: user@gmail.com");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        // ✅ Mapping error berdasarkan status code dan pesan dari backend
        const rawMessage = String(
          data?.detail || data?.message || ""
        ).toLowerCase();

        if (res.status === 404 || rawMessage.includes("not found") || rawMessage.includes("tidak ditemukan")) {
          throw new Error("Email tidak terdaftar. Periksa kembali alamat email kamu.");
        }

        if (res.status === 400 || rawMessage.includes("invalid email") || rawMessage.includes("email tidak valid")) {
          throw new Error("Format email tidak valid. Contoh: user@gmail.com");
        }

        if (res.status === 429 || rawMessage.includes("too many") || rawMessage.includes("rate limit")) {
          throw new Error("Terlalu banyak percobaan. Silakan tunggu beberapa menit lalu coba lagi.");
        }

        if (res.status >= 500) {
          throw new Error("Server sedang bermasalah. Silakan coba beberapa saat lagi.");
        }

        // Fallback: tampilkan pesan dari backend kalau ada, atau pesan default
        throw new Error(
          data?.detail || data?.message || "Gagal mengirim link reset password. Silakan coba lagi."
        );
      }

      localStorage.setItem("resetEmail", email.trim());
      router.push(`/forgot-password/sent?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(err.message || "Koneksi gagal. Periksa internet kamu dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fb] text-[#111827]">
      <div className="mx-auto min-h-screen w-full max-w-[1440px] px-6 sm:px-10 lg:px-[120px]">
        <button
          type="button"
          onClick={() => router.back()}
          className="pt-10 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        <section className="mx-auto mt-8 flex w-full max-w-[480px] flex-col items-center text-center">
          <div className="flex h-[62px] w-[62px] items-center justify-center rounded-2xl bg-[#e60000] shadow-lg shadow-red-200">
            <Mail size={34} className="text-white" strokeWidth={2.3} />
          </div>

          <h1 className="mt-5 text-[26px] font-bold leading-tight text-slate-950">
            Lupa Password?
          </h1>

          <p className="mt-3 max-w-[460px] text-sm leading-5 text-slate-600">
            Masukkan email Anda dan kami akan mengirimkan link untuk reset password
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-9 w-full rounded-2xl border border-slate-200 bg-white px-6 py-6 text-left shadow-md shadow-slate-200/80"
          >
            <label className="mb-3 block text-sm font-semibold text-slate-900">
              Email Address
            </label>

            <div
              className={`flex h-[43px] items-center gap-3 rounded-lg px-3 ${
                error
                  ? "bg-red-50 ring-1 ring-red-300"
                  : "bg-[#f1f1f3]"
              }`}
            >
              <Mail
                size={17}
                className={error ? "text-red-400" : "text-slate-400"}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // ✅ Clear error saat user mulai mengetik ulang
                  if (error) setError("");
                }}
                placeholder="user@gmail.com"
                className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500"
              />
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            {success && (
              <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex h-[48px] w-full items-center justify-center rounded-xl bg-[#ed0000] text-base font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Link Reset"
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}