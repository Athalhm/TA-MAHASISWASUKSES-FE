"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchWithAuth } from "@/lib/api";
import {
  BarChart3,
  BookOpen,
  Target,
  Users,
  LogOut,
  Menu,
  X,
  SquarePen,
  AlertTriangle,
  User,
  Lock,
  Shield,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";

const MENU_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard-admin", icon: BarChart3 },
  { label: "Kelola Quiz", href: "/admin/quiz-admin", icon: BookOpen },
  { label: "Kelola Quest", href: "/admin/quest-admin", icon: Target },
  { label: "Mahasiswa", href: "/admin/mahasiswa-admin", icon: Users },
];

const PAGE_TITLES = {
  "/admin/dashboard-admin": "Dashboard Overview",
  "/admin/quiz-admin": "Kelola Quiz",
  "/admin/quest-admin": "Kelola Quest",
  "/admin/mahasiswa-admin": "Data Mahasiswa",
};

const FALLBACK_ADMIN = { full_name: "Admin", email: "-", role: "admin" };

function getSemesterLabel(date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 1 && month <= 6) return `Semester Genap ${year - 1}/${year}`;
  if (month === 0) return `Semester Ganjil ${year - 1}/${year}`;
  return `Semester Ganjil ${year}/${year + 1}`;
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getRoleLabel(role) {
  if (!role) return "Pengguna";
  const map = {
    admin: "Administrator",
    student: "Mahasiswa",
    mahasiswa: "Mahasiswa",
  };
  return map[role.toLowerCase()] || role;
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState("");
  const [semesterLabel, setSemesterLabel] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const now = new Date();
    setDateLabel(
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    );
    setSemesterLabel(getSemesterLabel(now));
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(false);
        const data = await fetchWithAuth("/api/v1/user/profile");
        if (!ignore) setAdmin(data);
      } catch (err) {
        if (!ignore) {
          setError(true);
          setAdmin(FALLBACK_ADMIN);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchProfile();
    return () => {
      ignore = true;
    };
  }, []);

  const activeAdmin = admin || FALLBACK_ADMIN;
  const currentTitle = PAGE_TITLES[pathname] || "Dashboard Overview";
  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  const handleLogout = () => {
    if (typeof window !== "undefined") localStorage.clear();
    router.push("/sign-in");
  };

  const handleProfileSaved = (updated) => {
    setAdmin((prev) => ({ ...(prev || FALLBACK_ADMIN), ...updated }));
    setShowProfileModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-100 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
              <Image
                src="/images/logo background merah.png"
                alt="Logo Levelin"
                fill
                sizes="44px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-base font-bold leading-none text-gray-900">Levelin</p>
              <p className="mt-1 text-xs font-semibold tracking-wide text-red-600">
                ADMIN PANEL
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Menu
          </p>
          <ul className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-red-600 text-white shadow-sm shadow-red-200"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-white" : "text-gray-500"}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-gray-100 p-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Data gagal dimuat
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
                {getInitials(activeAdmin.full_name)}
              </div>
              <div className="min-w-0">
                {loading ? (
                  <>
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                    <div className="mt-1.5 h-2.5 w-24 animate-pulse rounded bg-gray-200" />
                  </>
                ) : (
                  <>
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {activeAdmin.full_name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {activeAdmin.email}
                    </p>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="shrink-0 text-gray-400 hover:text-gray-600"
              aria-label="Edit profil admin"
            >
              <SquarePen className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
                {currentTitle}
              </h1>
              <p className="truncate text-xs text-gray-500 sm:text-sm">
                {dateLabel ? `${dateLabel} · ${semesterLabel}` : "Memuat tanggal..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 rounded-full border border-gray-200 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {getInitials(activeAdmin.full_name)}
              </div>
              <span className="hidden text-sm font-medium text-gray-800 sm:inline">
                {activeAdmin.full_name || "Admin"}
              </span>
              <SquarePen className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {showProfileModal && (
        <AdminProfileModal
          currentAdmin={activeAdmin}
          onClose={() => setShowProfileModal(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}

function AdminProfileModal({ currentAdmin, onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState("profil");

  const [form, setForm] = useState({
    full_name: currentAdmin?.full_name || "",
    email: currentAdmin?.email || "",
  });

  const [fullProfile, setFullProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchProfile() {
      try {
        setLoading(true);
        setFetchError(false);
        const data = await fetchWithAuth("/api/v1/user/profile");
        if (ignore) return;
        setFullProfile(data);
        setForm({
          full_name: data?.full_name || currentAdmin?.full_name || "",
          email: data?.email || currentAdmin?.email || "",
        });
      } catch (err) {
        if (!ignore) {
          setFetchError(true);
          setForm({
            full_name: currentAdmin?.full_name || "",
            email: currentAdmin?.email || "",
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchProfile();
    return () => {
      ignore = true;
    };
  }, [currentAdmin]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationError("");
    setSaveSuccess(false);
  };

  const validate = () => {
    if (!form.full_name.trim()) return "Nama lengkap tidak boleh kosong.";
    if (!form.email.trim()) return "Email tidak boleh kosong.";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) return "Format email tidak valid.";
    return "";
  };

  const handleSave = async () => {
    const msg = validate();
    if (msg) {
      setValidationError(msg);
      return;
    }
    setValidationError("");
    setSaving(true);
    try {
      const payload = {
        ...(fullProfile || {}),
        full_name: form.full_name,
        email: form.email,
      };
      delete payload.id;
      delete payload.total_xp;
      delete payload.current_level;
      delete payload.role;

      await fetchWithAuth("/api/v1/user/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSaveSuccess(true);
      setTimeout(
        () =>
          onSaved({
            full_name: form.full_name,
            email: form.email,
          }),
        600
      );
    } catch (err) {
      setValidationError(
        err?.message || "Gagal menyimpan. Periksa koneksi lalu coba lagi."
      );
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = getRoleLabel(currentAdmin?.role);
  const initials = getInitials(form.full_name || currentAdmin?.full_name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold sm:text-xl">Edit Profil Admin</h2>
          <p className="mt-0.5 text-sm text-white/80">Perbarui informasi akun Anda</p>

          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-bold text-red-600">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold">
                {form.full_name || "Admin"}
              </p>
              <p className="truncate text-sm text-white/80">{form.email || "-"}</p>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                <Shield className="h-3 w-3" />
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-100 bg-white">
          <TabButton
            active={activeTab === "profil"}
            onClick={() => setActiveTab("profil")}
            icon={User}
            label="Informasi Profil"
          />
          <TabButton
            active={activeTab === "keamanan"}
            onClick={() => setActiveTab("keamanan")}
            icon={Lock}
            label="Keamanan"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === "profil" ? (
            <ProfilTab
              form={form}
              updateField={updateField}
              loading={loading}
              fetchError={fetchError}
              roleLabel={roleLabel}
            />
          ) : (
            <KeamananTab />
          )}

          {activeTab === "profil" && validationError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
          {activeTab === "profil" && saveSuccess && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Perubahan berhasil disimpan.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          {activeTab === "profil" && (
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-red-600 text-red-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ProfilTab({ form, updateField, loading, fetchError, roleLabel }) {
  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat profil...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {fetchError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Data profil terbaru gagal dimuat. Anda dapat tetap mengubah dan menyimpan.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama Lengkap">
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
            placeholder="Nama lengkap"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="email@ms.ac.id"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
          />
        </Field>
      </div>

      <div className="mt-6 rounded-xl border border-red-100 bg-red-50/60 p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-500" />
          <p className="text-sm font-semibold text-red-700">Role & Akses</p>
        </div>
        <p className="mt-1 text-sm text-red-600">
          {roleLabel} — akses penuh ke semua fitur panel
        </p>
      </div>
    </>
  );
}

function KeamananTab() {
  const [pwd, setPwd] = useState({ current: "", next: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const update = (field, value) => {
    setPwd((prev) => ({ ...prev, [field]: value }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const validate = () => {
    if (!pwd.current) return "Password saat ini belum diisi.";
    if (!pwd.next) return "Password baru belum diisi.";
    if (pwd.next.length < 8) return "Password baru minimal 8 karakter.";
    if (pwd.next === pwd.current)
      return "Password baru tidak boleh sama dengan password saat ini.";
    return "";
  };

  const handleSubmit = async () => {
    const msg = validate();
    if (msg) {
      setErrorMsg(msg);
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);
    try {
      await fetchWithAuth("/api/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: pwd.current,
          new_password: pwd.next,
        }),
      });
      setSuccessMsg("Password berhasil diubah.");
      setPwd({ current: "", next: "" });
    } catch (err) {
      setErrorMsg(err?.message || "Gagal mengubah password. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Ubah password secara berkala untuk menjaga keamanan akun Anda.</span>
      </div>

      <div className="mt-5 space-y-4">
        <PasswordField
          label="Password Saat Ini"
          value={pwd.current}
          onChange={(v) => update("current", v)}
          placeholder="Masukkan password saat ini"
          visible={showCurrent}
          onToggleVisible={() => setShowCurrent((s) => !s)}
        />
        <PasswordField
          label="Password Baru"
          value={pwd.next}
          onChange={(v) => update("next", v)}
          placeholder="Minimal 8 karakter"
          visible={showNext}
          onToggleVisible={() => setShowNext((s) => !s)}
        />
      </div>

      {errorMsg && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mengubah...
          </>
        ) : (
          "Ubah Password"
        )}
      </button>
    </>
  );
}

function PasswordField({ label, value, onChange, placeholder, visible, onToggleVisible }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-800">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-400"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-800">
        {label}
      </label>
      {children}
    </div>
  );
}