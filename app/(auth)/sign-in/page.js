"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();

  const [role, setRole] = useState("mahasiswa");
  const [form, setForm] = useState({
    emailOrUsername: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [apiFailed, setApiFailed] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
    if (apiFailed) setApiFailed(false);
  };

  const handleRoleChange = (nextRole) => {
    if (loading) return;
    setRole(nextRole);
    setErrorMessage("");
    setSuccessMessage("");
    setApiFailed(false);
  };

  const validateForm = () => {
    if (!form.emailOrUsername.trim() || !form.password.trim()) {
      setErrorMessage("Email/username dan password wajib diisi.");
      return false;
    }
    return true;
  };

  const getErrorMessage = (data) => {
    if (!data) return "Terjadi kesalahan saat sign in.";
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join(", ");
    }
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;
    return "Terjadi kesalahan saat sign in.";
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_or_username: form.emailOrUsername.trim(),
          password: form.password,
          role,
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
        throw new Error(getErrorMessage(data));
      }

      const accountRole = (data?.user?.role || "").toLowerCase();

      if (!accountRole) {
        throw new Error("Data role akun tidak diterima dari server. Coba lagi.");
      }
      if (role === "admin" && accountRole !== "admin") {
        throw new Error(
          "Akun ini bukan akun admin. Silakan pilih tab Mahasiswa lalu masuk kembali."
        );
      }
      if (role === "mahasiswa" && accountRole !== "student") {
        throw new Error(
          "Akun ini bukan akun mahasiswa. Silakan pilih tab Admin lalu masuk kembali."
        );
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data?.access_token || "");
        localStorage.setItem("refresh_token", data?.refresh_token || "");
        localStorage.setItem("token_type", data?.token_type || "bearer");
        localStorage.setItem("user", JSON.stringify(data?.user || {}));
      }

      setSuccessMessage("Sign in berhasil.");
      setForm({ emailOrUsername: "", password: "" });
      setTimeout(() => {
        if (accountRole === "admin") {
          router.push("/admin/dashboard-admin");
        } else {
          router.push("/dashboard");
        }
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
          setErrorMessage(error?.message || "Terjadi kesalahan saat sign in.");
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
    <main className="min-h-screen bg-[#f7f7f7]">
      <section className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col items-center px-4 py-8 sm:py-12">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-2 h-14 w-14">
            <img
              src="/images/logo background merah.png"
              alt="Logo Levelin"
              className="h-full w-full object-contain"
            />
          </div>
          <img
            src="/images/logo tulisan aja.png"
            alt="Levelin"
            className="h-auto w-[130px] object-contain"
          />
        </div>

        <div className="w-full rounded-3xl border-2 border-red-200 bg-white px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Sign in
          </h2>

          <div className="mb-6 grid grid-cols-2 gap-2">
            <RoleButton
              active={role === "mahasiswa"}
              onClick={() => handleRoleChange("mahasiswa")}
              icon={GraduationCap}
              label="Mahasiswa"
            />
            <RoleButton
              active={role === "admin"}
              onClick={() => handleRoleChange("admin")}
              icon={ShieldCheck}
              label="Admin"
            />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="mb-4">
              <label
                htmlFor="emailOrUsername"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email atau username
              </label>
              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                autoComplete="username"
                value={form.emailOrUsername}
                onChange={handleChange}
                disabled={loading}
                placeholder={
                  role === "admin" ? "admin@ms.ac.id" : "nama@ms.ac.id"
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-gray-700"
                >
                  {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
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
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>

            {(errorMessage || successMessage) && (
              <div
                className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                  errorMessage
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}
              >
                <div className="flex items-start gap-2">
                  {errorMessage ? (
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  ) : (
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-600" />
                  )}
                  <p>{errorMessage || successMessage}</p>
                </div>
              </div>
            )}

            {apiFailed && (
              <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Server sedang tidak merespons
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Periksa koneksi atau coba lagi dalam beberapa saat.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <RefreshCw size={14} />
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-full bg-red-600 px-6 text-base font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Logging in...
                </span>
              ) : (
                "Log in"
              )}
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
              Belum punya akun?{" "}
              <Link
                href="/sign-up"
                className="font-semibold text-red-600 hover:underline"
              >
                Sign Up
              </Link>
            </p>

            <div className="my-5 border-t border-gray-100" />

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-red-600 hover:underline"
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

function RoleButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? "bg-red-600 text-white shadow-sm shadow-red-200"
          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}