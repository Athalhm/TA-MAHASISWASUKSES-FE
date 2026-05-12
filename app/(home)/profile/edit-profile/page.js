"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import {
  ArrowLeft,
  Save,
  RefreshCcw,
  AlertCircle,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Perubahan tersimpan");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fallbackProfile = {
    id: "",
    username: "User",
    full_name: "",
    email: "User@mail.com",
    phone_number: "",
    nim: "",
    birth_date: "",
    description:
      "Mahasiswa Teknik Informatika yang passionate dalam web development dan UI/UX design.",
    notifications: true,
    newPassword: "",
    confirmPassword: "",
  };

  const [form, setForm] = useState(fallbackProfile);

  const getAvatarUrl = (userId, version = Date.now()) => {
    if (!userId) return "";

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return `${baseUrl}/api/v1/user/avatar/${userId}?v=${version}`;
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchWithAuth("/api/v1/user/profile", {
        method: "GET",
        cache: "no-store",
      });

      setForm({
        id: data.id || "",
        username: data.username || data.full_name || "",
        full_name: data.full_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        nim: data.nim || "",
        birth_date: data.birth_date || "",
        description:
          data.description ||
          "Mahasiswa Teknik Informatika yang passionate dalam web development dan UI/UX design.",
        notifications: Boolean(data.notifications),
        newPassword: "",
        confirmPassword: "",
      });

      if (data.id) {
        const version = Date.now();
        setAvatarVersion(version);
        setAvatarUrl(getAvatarUrl(data.id, version));
      } else {
        setAvatarUrl("");
      }
    } catch (err) {
      setError("Data profil gagal dimuat. Menampilkan data fallback sementara.");
      setForm(fallbackProfile);
      setAvatarUrl("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran foto maksimal 2MB.");
      return;
    }

    try {
      setError("");

      const token = localStorage.getItem("token");
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${baseUrl}/api/v1/user/profile/avatar`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        let message = "Upload foto gagal";

        try {
          const data = await res.json();
          message = data?.detail || data?.message || JSON.stringify(data);
        } catch {}

        throw new Error(message);
      }

      const nextVersion = Date.now();
      setAvatarVersion(nextVersion);

      if (form.id) {
        setAvatarUrl(getAvatarUrl(form.id, nextVersion));
      } else {
        setAvatarUrl(URL.createObjectURL(file));
      }

      setSuccessMessage("Foto profil berhasil diperbarui");
      setShowSuccess(true);
    } catch (err) {
      setError(err?.message || "Upload foto gagal. Silakan coba lagi.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("Password baru dan verifikasi password tidak sama.");
      return;
    }

    if (form.newPassword && form.newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        username: form.username || null,
        full_name: form.full_name || null,
        description: form.description || null,
        email: form.email || null,
        phone_number: form.phone_number || null,
        nim: form.nim || null,
        birth_date: form.birth_date || null,
        password: form.newPassword || null,
      };

      await fetchWithAuth("/api/v1/user/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setForm((prev) => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
      }));

      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setSuccessMessage("Perubahan tersimpan");
      setShowSuccess(true);
      await fetchProfile();
    } catch (err) {
      setError(err?.message || "Profil gagal disimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name = "User") => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (userKey = "user") => {
    const colors = [
      "bg-blue-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-indigo-500",
    ];

    let hash = 0;
    const key = String(userKey);

    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <section className="mx-auto w-full max-w-[760px] px-6 py-10 sm:px-8 md:py-[72px]">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-7 flex items-center gap-2 text-[17px] font-semibold text-black"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>

        <header className="mb-4">
          <h1 className="text-[24px] font-bold leading-tight text-black">
            Edit Profile
          </h1>
          <p className="mt-2 text-[15px] font-medium text-[#5f5f5f]">
            Perbarui informasi profil Anda
          </p>
        </header>

        {error && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={fetchProfile}
              className="flex shrink-0 items-center gap-1 font-semibold"
            >
              <RefreshCcw size={15} />
              Coba lagi
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white px-[54px] py-[46px] shadow-[0_3px_4px_rgba(0,0,0,0.22)]">
          {loading ? (
            <div className="space-y-5">
              <div className="h-[72px] w-[72px] animate-pulse rounded-full bg-gray-200" />
              <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <section className="mb-7 flex items-center gap-5">
                <div className="h-[72px] w-[72px] overflow-hidden rounded-full">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Foto Profil"
                      className="h-full w-full object-cover"
                      onError={() => setAvatarUrl("")}
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center text-[24px] font-bold text-white ${getAvatarColor(
                        form.id || form.email || form.username
                      )}`}
                    >
                      {getInitials(form.username || "User")}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-[18px] font-bold text-black">
                    Foto Profil
                  </h2>
                  <p className="mt-1 text-[13px] font-medium text-[#666]">
                    JPG, PNG atau GIF. Maksimal 2MB
                  </p>

                  <label className="mt-3 inline-block cursor-pointer rounded-xl bg-[#d9d9d9] px-8 py-2 text-[14px] font-semibold text-black hover:bg-[#cfcfcf]">
                    Upload Foto
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      onChange={handleUploadAvatar}
                      className="hidden"
                    />
                  </label>
                </div>
              </section>

              <div className="border-t border-[#bdbdbd] pt-6">
                <div className="space-y-4">
                  <Input
                    label="Username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    icon="user"
                  />

                  <Input
                    label="Email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    icon="mail"
                  />

                  <Input
                    label="Deskripsi"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    icon={null}
                  />
                </div>

                <div className="my-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-[#bdbdbd]" />
                  <p className="whitespace-nowrap text-[14px] font-medium text-[#666]">
                    Ubah Password (Opsional)
                  </p>
                  <div className="h-px flex-1 bg-[#bdbdbd]" />
                </div>

                <div className="space-y-4">
                  <Input
                    label="Password Baru"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    icon="lock"
                    type={showNewPassword ? "text" : "password"}
                    helper="Kosongkan jika tidak ingin mengubah password"
                    showPasswordToggle
                    isPasswordVisible={showNewPassword}
                    onTogglePassword={() =>
                      setShowNewPassword((prev) => !prev)
                    }
                  />

                  <Input
                    label="Verifikasi Password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    icon="lock"
                    type={showConfirmPassword ? "text" : "password"}
                    showPasswordToggle
                    isPasswordVisible={showConfirmPassword}
                    onTogglePassword={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                  />
                </div>

                <div className="pt-5">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ED1C24] py-3 text-[14px] font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} />
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-[320px] rounded-2xl bg-white px-6 py-8 text-center shadow-lg">
            <h2 className="text-[16px] font-bold text-black">
              Perubahan berhasil
            </h2>
            <p className="mt-1 text-[12px] text-[#777]">{successMessage}</p>

            <div className="mx-auto my-6 flex h-[110px] w-[110px] items-center justify-center rounded-full bg-[#ED1C24]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSuccess(false);
              }}
              className="w-full rounded-lg border border-[#ED1C24] py-2 text-[13px] font-semibold text-[#ED1C24] transition hover:bg-red-50"
            >
              Kembali
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  icon,
  type = "text",
  helper,
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
}) {
  const Icon =
    icon === "user" ? User : icon === "mail" ? Mail : icon === "lock" ? Lock : null;

  return (
    <div>
      <label className="mb-2 block text-[14px] font-medium text-[#666]">
        {label}
      </label>

      <div className="flex h-[38px] items-center rounded-lg border border-gray-200 bg-white px-4">
        {Icon && <Icon size={15} className="mr-3 shrink-0 text-black" />}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="h-full w-full bg-transparent text-[11px] font-medium text-black outline-none"
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center text-black"
          >
            {isPasswordVisible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>

      {helper && (
        <p className="mt-2 text-[9px] font-medium text-[#666]">{helper}</p>
      )}
    </div>
  );
}