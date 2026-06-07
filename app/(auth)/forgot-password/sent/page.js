"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react";

function EmailSentContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("user@gmail.com");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    try {
      const emailFromUrl = searchParams.get("email");
      const savedEmail =
        typeof window !== "undefined"
          ? localStorage.getItem("resetEmail")
          : null;

      setEmail(emailFromUrl || savedEmail || "user@gmail.com");
    } catch (err) {
      setError(true);
      setEmail("user@gmail.com");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    try {
      setError(false);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal mengirim ulang email");
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (err) {
      setError(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fa] text-[#111827]">
      <section className="mx-auto flex min-h-screen w-full flex-col items-center px-5 pt-9">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-[82px] w-[82px] items-center justify-center rounded-2xl bg-[#05C553] shadow-[0_8px_18px_rgba(0,0,0,0.22)]">
            <div className="flex h-[43px] w-[43px] items-center justify-center rounded-full border-[4px] border-white">
              <Check className="h-7 w-7 text-white" strokeWidth={3.5} />
            </div>
          </div>

          <h1 className="mt-7 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-[#111827]">
            Email Terkirim!
          </h1>

          {loading ? (
            <p className="mt-3 text-sm text-slate-500">
              Memuat informasi email...
            </p>
          ) : (
            <p className="mt-3 text-center text-[15px] leading-5 text-slate-600">
              Kami telah mengirimkan link reset password ke
              <br />
              <span className="font-bold text-[#111827]">{email}</span>
            </p>
          )}

          {error && (
            <p className="mt-2 text-xs text-red-500">
              Data email gagal dimuat. Menampilkan fallback sementara.
            </p>
          )}
        </div>

        <div className="mt-7 w-full max-w-[460px] rounded-2xl border border-slate-200 bg-white px-6 py-[25px] shadow-[0_4px_8px_rgba(0,0,0,0.18)] sm:px-[30px]">
          <h2 className="mb-[19px] text-center text-sm font-bold text-[#111827]">
            Langkah Selanjutnya:
          </h2>

          <div className="space-y-[14px]">
            {[
              "Cek inbox email Anda",
              "Klik link yang kami kirimkan (berlaku 24 jam)",
              "Buat password baru dan login kembali",
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold text-red-500">
                  {index + 1}
                </span>
                <p className="text-[13px] leading-5 text-slate-600">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-[18px] rounded-xl border border-blue-200 bg-blue-50 px-4 py-[15px]">
            <div className="flex flex-wrap items-center justify-center gap-1 text-center text-[13px]">
              <span>💡</span>
              <span className="text-[#1D4ED8]">
                Tidak menerima email? Cek folder spam atau
              </span>
              <button
                type="button"
                onClick={handleResendEmail}
                className="font-bold text-[#1D4ED8] underline underline-offset-2 transition hover:text-[#1E40AF]"
              >
                kirim ulang
              </button>
            </div>
          </div>
        </div>

        <Link
          href="/sign-in"
          className="mt-7 inline-flex items-center gap-3 text-[15px] font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Login
        </Link>
      </section>

      {showToast && (
        <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center sm:left-auto sm:right-6 sm:justify-end">
          <div className="w-full max-w-[365px] rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.14)]">
            <div className="flex items-center gap-3">
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-black"
                strokeWidth={2.7}
              />
              <p className="text-sm font-medium text-black">
                Link reset password berhasil dikirim ulang!
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function EmailSentPage() {
  return (
    <Suspense fallback={null}>
      <EmailSentContent />
    </Suspense>
  );
}