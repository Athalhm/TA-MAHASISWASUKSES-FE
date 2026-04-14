"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, RefreshCw } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [apiFailed, setApiFailed] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
    if (apiFailed) setApiFailed(false);
  };

  const validateForm = () => {
    if (!form.email.trim() || !form.password.trim()) {
      setErrorMessage("Email dan password wajib diisi.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setErrorMessage("Format email tidak valid.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setApiFailed(false);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          data?.detail?.[0]?.msg ||
          data?.message ||
          data?.detail ||
          "Terjadi kesalahan saat sign in.";
        throw new Error(message);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data?.access_token || "");
        localStorage.setItem("refresh_token", data?.refresh_token || "");
        localStorage.setItem("token_type", data?.token_type || "bearer");
        localStorage.setItem("user", JSON.stringify(data?.user || {}));
      }

      setSuccessMessage("Sign in berhasil.");

      setForm({
        email: "",
        password: "",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } catch (error) {
      if (error.name === "AbortError") {
        setApiFailed(true);
        setErrorMessage("Permintaan timeout. Silakan coba lagi.");
      } else {
        const lowerMessage = (error?.message || "").toLowerCase();

        if (
          lowerMessage.includes("failed to fetch") ||
          lowerMessage.includes("network") ||
          lowerMessage.includes("load failed")
        ) {
          setApiFailed(true);
          setErrorMessage(
            "API gagal merespons. Silakan coba beberapa saat lagi."
          );
        } else {
          setErrorMessage(
            error?.message || "Terjadi kesalahan saat sign in."
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setApiFailed(false);
  };

  return (
    <main className="min-h-screen bg-[#f3f3f3]">
      <section className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col items-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-10 flex flex-col items-center justify-center sm:mb-12">
          <div className="mb-3 flex h-[56px] w-[56px] items-center justify-center">
            <img
              src="/images/logo-telu.png"
              alt="Logo Telu"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="text-center text-[18px] font-bold leading-none text-[#1f1f1f] sm:text-[20px]">
            Mahasiswa Sukses
          </h1>
          <p className="mt-1 text-center text-[16px] leading-none text-[#1f1f1f] sm:text-[18px]">
            Belajar Sambil Berkompetisi!
          </p>
        </div>

        <div className="w-full max-w-[640px] rounded-[28px] border border-red-400 bg-transparent px-6 py-8 sm:px-14 sm:py-10">
          <h2 className="mb-12 text-center text-[36px] font-medium leading-none text-[#353535] sm:mb-14 sm:text-[48px]">
            Sign in
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="mb-6">
              <label
                htmlFor="email"
                className="mb-3 block text-[18px] font-medium text-[#6f6f6f] sm:text-[20px]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                className="h-[54px] w-full rounded-[14px] border border-[#c9c9c9] bg-transparent px-4 text-[16px] text-[#353535] outline-none transition focus:border-[#9d9d9d] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[56px] sm:text-[18px]"
              />
            </div>

            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[18px] font-medium text-[#6f6f6f] sm:text-[20px]"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="inline-flex items-center gap-2 text-[16px] font-medium text-[#7a7a7a] transition hover:text-[#4d4d4d] sm:text-[18px]"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  <span>{showPassword ? "Show" : "Hide"}</span>
                </button>
              </div>

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                className="h-[54px] w-full rounded-[14px] border border-[#c9c9c9] bg-transparent px-4 text-[16px] text-[#353535] outline-none transition focus:border-[#9d9d9d] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[56px] sm:text-[18px]"
              />
            </div>

            {(errorMessage || successMessage) && (
              <div
                className={`mb-5 rounded-[14px] border px-4 py-3 text-sm ${
                  errorMessage
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}
              >
                <div className="flex items-start gap-2">
                  {errorMessage ? (
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  ) : (
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-600" />
                  )}
                  <p>{errorMessage || successMessage}</p>
                </div>
              </div>
            )}

            {apiFailed && (
              <div className="mb-5 rounded-[14px] border border-[#d7d7d7] bg-white px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#353535]">
                      Server sedang tidak merespons
                    </p>
                    <p className="mt-1 text-sm text-[#7a7a7a]">
                      Periksa koneksi atau coba lagi dalam beberapa saat.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-[#cfcfcf] px-4 py-2 text-sm font-medium text-[#353535] transition hover:bg-[#f7f7f7]"
                  >
                    <RefreshCw size={16} />
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-[64px] w-full items-center justify-center rounded-full bg-[#ff1828] px-6 text-[22px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 sm:text-[24px]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={22} className="animate-spin" />
                  Logging in...
                </span>
              ) : (
                "Log in"
              )}
            </button>

            <p className="mt-3 text-center text-[14px] text-[#7a7a7a] sm:text-[15px]">
              Belum punya akun ?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-[#2f6fff] hover:underline"
              >
                Sign Up
              </Link>
            </p>

            <div className="mt-20 flex justify-end sm:mt-24">
              <Link
                href="/auth/forgot-password"
                className="text-[16px] text-[#0070f3] underline underline-offset-2 hover:opacity-80 sm:text-[18px]"
              >
                Lupa password ?
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}