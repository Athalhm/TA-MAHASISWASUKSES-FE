"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, AlertCircle, RefreshCcw } from "lucide-react";

export default function SignUpPage() {
  const initialForm = useMemo(
    () => ({
      fullName: "",
      email: "",
      phone: "",
      nim: "",
      birthDate: "",
      password: "",
    }),
    []
  );

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setApiError("");
    setSuccessMessage("");
  }

  function validateForm() {
    const errors = {};

    if (!form.fullName.trim()) {
      errors.fullName = "Nama lengkap wajib diisi.";
    } else if (form.fullName.trim().length < 3) {
      errors.fullName = "Nama lengkap minimal 3 karakter.";
    }

    if (!form.email.trim()) {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Format email tidak valid.";
    }

    if (!form.phone.trim()) {
      errors.phone = "Nomor telephone wajib diisi.";
    } else if (!/^[0-9+\-\s]{10,15}$/.test(form.phone)) {
      errors.phone = "Nomor telephone tidak valid.";
    }

    if (!form.nim.trim()) {
      errors.nim = "NIM wajib diisi.";
    }

    if (!form.birthDate) {
      errors.birthDate = "Tanggal lahir wajib diisi.";
    }

    if (!form.password.trim()) {
      errors.password = "Password wajib diisi.";
    } else if (form.password.length < 8) {
      errors.password = "Password minimal 8 karakter.";
    }

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errors = validateForm();
    setFieldErrors(errors);
    setApiError("");
    setSuccessMessage("");

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          phone_number: form.phone.trim(),
          nim: form.nim.trim(),
          full_name: form.fullName.trim(),
          birth_date: form.birthDate,
        }),
      });

      let result = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        const message =
          result?.detail?.[0]?.msg ||
          result?.message ||
          result?.detail ||
          "Pendaftaran gagal. Silakan coba lagi.";
        throw new Error(message);
      }

      setSuccessMessage("Akun berhasil dibuat. Silakan lanjut login.");
      setForm(initialForm);
    } catch (error) {
      setApiError(error?.message || "Terjadi kesalahan pada server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRetry() {
    setApiError("");
    setSuccessMessage("");
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1440px] items-center">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[1fr_760px] lg:gap-10 xl:gap-14">
          <section className="flex items-center justify-center lg:justify-start">
            <div className="w-full max-w-[520px] px-2 sm:px-4 lg:px-6">
              <div className="text-center lg:text-left">
                <h1 className="text-[42px] font-semibold leading-none tracking-tight text-[#2f2f2f] sm:text-[54px] xl:text-[44px]">
                  Mahasiswa Sukses
                </h1>

                <p className="mt-8 text-[26px] font-normal leading-tight text-[#353535] sm:text-[36px] xl:text-[30px]">
                  Belajar Sambil Berkompetisi!
                </p>
              </div>

              <div className="mt-14 flex justify-center lg:mt-20 lg:justify-start">
                <div className="relative h-[260px] w-[220px] sm:h-[320px] sm:w-[260px] xl:h-[360px] xl:w-[300px]">
                  <Image
                    src="/images/logo-telu.png"
                    alt="Logo Telu"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="min-h-[760px] rounded-[28px] border border-[#ff4b4b] bg-transparent px-6 py-10 sm:px-10 sm:py-12 lg:px-16 lg:py-12">
              <div className="mx-auto flex h-full max-w-[522px] flex-col">
                <h2 className="text-[42px] font-semibold leading-none tracking-tight text-[#2f2f2f] sm:text-[40px]">
                  Sign up
                </h2>

                <div className="mt-10">
                  {successMessage ? (
                    <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {successMessage}
                    </div>
                  ) : null}

                  {apiError ? (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-700">
                            Terjadi masalah
                          </p>
                          <p className="mt-1 text-sm leading-6 text-red-600">
                            {apiError}
                          </p>

                          <button
                            type="button"
                            onClick={handleRetry}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                          >
                            <RefreshCcw className="h-4 w-4" />
                            Coba lagi
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div>
                      <label
                        htmlFor="fullName"
                        className="mb-2 block text-[18px] font-medium text-[#6e6e6e]"
                      >
                        Nama Lengkap
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={handleChange}
                        className={`h-[54px] w-full rounded-2xl border bg-transparent px-5 text-base text-[#2f2f2f] outline-none transition ${
                          fieldErrors.fullName
                            ? "border-red-300 focus:border-red-400"
                            : "border-[#cfcfcf] focus:border-[#a8a8a8]"
                        }`}
                      />
                      {fieldErrors.fullName ? (
                        <p className="mt-2 text-sm text-red-500">
                          {fieldErrors.fullName}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-[18px] font-medium text-[#6e6e6e]"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className={`h-[54px] w-full rounded-2xl border bg-transparent px-5 text-base text-[#2f2f2f] outline-none transition ${
                          fieldErrors.email
                            ? "border-red-300 focus:border-red-400"
                            : "border-[#cfcfcf] focus:border-[#a8a8a8]"
                        }`}
                      />
                      {fieldErrors.email ? (
                        <p className="mt-2 text-sm text-red-500">
                          {fieldErrors.email}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-[18px] font-medium text-[#6e6e6e]"
                      >
                        Nomor Telephone
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        className={`h-[54px] w-full rounded-2xl border bg-transparent px-5 text-base text-[#2f2f2f] outline-none transition ${
                          fieldErrors.phone
                            ? "border-red-300 focus:border-red-400"
                            : "border-[#cfcfcf] focus:border-[#a8a8a8]"
                        }`}
                      />
                      {fieldErrors.phone ? (
                        <p className="mt-2 text-sm text-red-500">
                          {fieldErrors.phone}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="nim"
                        className="mb-2 block text-[18px] font-medium text-[#6e6e6e]"
                      >
                        NIM
                      </label>
                      <input
                        id="nim"
                        name="nim"
                        type="text"
                        value={form.nim}
                        onChange={handleChange}
                        className={`h-[54px] w-full rounded-2xl border bg-transparent px-5 text-base text-[#2f2f2f] outline-none transition ${
                          fieldErrors.nim
                            ? "border-red-300 focus:border-red-400"
                            : "border-[#cfcfcf] focus:border-[#a8a8a8]"
                        }`}
                      />
                      {fieldErrors.nim ? (
                        <p className="mt-2 text-sm text-red-500">
                          {fieldErrors.nim}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="birthDate"
                        className="mb-2 block text-[18px] font-medium text-[#6e6e6e]"
                      >
                        Tanggal Lahir
                      </label>
                      <input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        value={form.birthDate}
                        onChange={handleChange}
                        className={`h-[54px] w-full rounded-2xl border bg-transparent px-5 text-base text-[#2f2f2f] outline-none transition ${
                          fieldErrors.birthDate
                            ? "border-red-300 focus:border-red-400"
                            : "border-[#cfcfcf] focus:border-[#a8a8a8]"
                        }`}
                      />
                      {fieldErrors.birthDate ? (
                        <p className="mt-2 text-sm text-red-500">
                          {fieldErrors.birthDate}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="block text-[18px] font-medium text-[#6e6e6e]"
                        >
                          Password
                        </label>

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="inline-flex items-center gap-2 text-[16px] font-medium text-[#7b7b7b]"
                        >
                          {showPassword ? (
                            <>
                              <Eye className="h-5 w-5" />
                              Show
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-5 w-5" />
                              Hide
                            </>
                          )}
                        </button>
                      </div>

                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={handleChange}
                        className={`h-[54px] w-full rounded-2xl border bg-transparent px-5 text-base text-[#2f2f2f] outline-none transition ${
                          fieldErrors.password
                            ? "border-red-300 focus:border-red-400"
                            : "border-[#cfcfcf] focus:border-[#a8a8a8]"
                        }`}
                      />
                      {fieldErrors.password ? (
                        <p className="mt-2 text-sm text-red-500">
                          {fieldErrors.password}
                        </p>
                      ) : null}
                    </div>

                    <div className="pt-10">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex h-[60px] min-w-[162px] items-center justify-center rounded-full bg-[#ff2028] px-8 text-[22px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-2 text-base">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Loading
                            </span>
                          ) : (
                            "Sign up"
                          )}
                        </button>

                        <p className="text-[16px] text-[#696969] sm:text-[18px]">
                          Sudah punya akun?{" "}
                          <Link
                            href="/sign-in"
                            className="font-medium text-[#2f2f2f] underline underline-offset-2"
                          >
                            Log in
                          </Link>
                        </p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}