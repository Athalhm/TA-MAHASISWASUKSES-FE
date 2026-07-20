"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import {
  Save,
  Target,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";

const EVENT_OPTIONS = [
  {
    value: "user_login",
    label: "Login pengguna",
    description:
      "Progress quest akan bertambah setiap user login (atau refresh token).",
  },
  {
    value: "complete_task",
    label: "Menyelesaikan tugas",
    description:
      "Progress quest akan bertambah setiap user menandakan sebuah task sebagai selesai pertama kali (toggle selesai lalu todo lalu selesai tidak progress berulang).",
  },
  {
    value: "complete_quest",
    label: "Menyelesaikan quest",
    description:
      "Progress quest akan bertambah setiap sebuah quest selesai.",
  },
  {
    value: "receive_like",
    label: "Menerima like",
    description:
      "Progress quest akan bertambah setiap post forum yang user buat mendapat like.",
  },
  {
    value: "stay_1_hour",
    label: "Aktif selama 1 jam",
    description:
      "Progress quest akan bertambah setiap user bertahan atau membuka aplikasi secara terus menerus selama 1 jam.",
  },
  {
    value: "stay_10_min",
    label: "Aktif selama 10 menit",
    description:
      "Progress quest akan bertambah setiap user bertahan atau membuka aplikasi secara terus menerus selama 10 menit.",
  },
  {
    value: "post_comment",
    label: "Menulis komentar",
    description:
      "Progress quest akan bertambah setiap user berkomentar di salah satu post forum.",
  },
  {
    value: "post_comment_on_help",
    label: "Menulis komentar di forum bantuan",
    description:
      "Progress quest akan bertambah setiap user berkomentar di salah satu post forum kategori bantuan.",
  },
];

const EMPTY_QUEST = () => ({
  title: "",
  description: "",
  event: "complete_task",
  target: 1,
  difficulty: "easy",
  frequency: "harian",
  xp_reward: 50,
  is_active: true,
});

const FREQUENCY_LABEL = {
  harian: "Daily Quest",
  mingguan: "Weekly Quest",
};

const FREQUENCY_STYLES = {
  harian: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    badge: "bg-blue-50 text-blue-600",
  },
  mingguan: {
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    badge: "bg-purple-50 text-purple-600",
  },
};

export default function QuestEditorPage() {
  const router = useRouter();
  const params = useParams();
  const questId = params?.questadminId;
  const isNew = questId === "new";

  const [quest, setQuest] = useState(EMPTY_QUEST());
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [validationError, setValidationError] = useState("");

  const fetchQuest = useCallback(async () => {
    if (isNew) return;
    try {
      setLoading(true);
      setError(false);
      const data = await fetchWithAuth(
        `/api/v1/gamification/get-one/${questId}`
      );
      setQuest({
        title: data.title || "",
        description: data.description || "",
        event: data.event || "complete_task",
        target: data.target || 1,
        difficulty: data.difficulty || "easy",
        frequency: data.frequency || "harian",
        xp_reward: data.xp_reward || 50,
        is_active: data.is_active ?? true,
      });
    } catch (err) {
      setError(true);
      setQuest(EMPTY_QUEST());
    } finally {
      setLoading(false);
    }
  }, [questId, isNew]);

  useEffect(() => {
    fetchQuest();
  }, [fetchQuest]);

  const updateField = (field, value) => {
    setQuest((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!quest.title.trim()) return "Judul quest belum diisi.";
    if (!quest.description.trim()) return "Deskripsi quest belum diisi.";
    if (!quest.xp_reward || quest.xp_reward <= 0)
      return "Reward XP harus lebih dari nol.";
    if (!quest.target || quest.target <= 0)
      return "Target harus lebih dari nol.";
    if (!quest.event) return "Trigger quest belum dipilih.";
    if (!quest.frequency) return "Tipe quest belum dipilih.";
    if (!quest.difficulty) return "Kesulitan quest belum dipilih.";
    return "";
  };

  const handlePublish = async () => {
    const msg = validate();
    if (msg) {
      setValidationError(msg);
      return;
    }
    setValidationError("");
    setPublishing(true);
    try {
      const payload = {
        title: quest.title.trim(),
        description: quest.description.trim(),
        event: quest.event,
        target: Number(quest.target),
        difficulty: quest.difficulty,
        frequency: quest.frequency,
        xp_reward: Number(quest.xp_reward),
        is_active: quest.is_active,
      };

      if (isNew) {
        await fetchWithAuth("/api/v1/gamification/create", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchWithAuth(`/api/v1/gamification/${questId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }
      router.push("/admin/quest-admin");
    } catch (err) {
      setValidationError(
        err?.message || "Gagal menyimpan quest. Periksa koneksi lalu coba lagi."
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleCancel = () => {
    const isPristine =
      !quest.title.trim() && !quest.description.trim();
    if (isPristine) {
      router.push("/admin/quest-admin");
    } else {
      setShowCancelModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat data quest...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Data quest gagal dimuat. Form dimulai dari kosong.
          </div>
          <button
            onClick={fetchQuest}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {isNew ? "Buat Quest Baru" : "Edit Quest"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Quest akan tampil di dashboard mahasiswa setelah dipublikasikan
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={publishing}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {publishing ? "Menyimpan..." : isNew ? "Publikasikan Quest" : "Simpan Perubahan"}
          </button>
        </div>
      </header>

      {validationError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
            <h2 className="text-base font-bold text-gray-900">Detail Quest</h2>
            <div className="mt-4 space-y-4">
              <Field label="Judul Quest">
                <input
                  type="text"
                  value={quest.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="contoh: Selesaikan 3 Quiz Hari Ini"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                />
              </Field>
              <Field label="Deskripsi">
                <textarea
                  value={quest.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Jelaskan tugas yang harus diselesaikan mahasiswa..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
            <h2 className="text-base font-bold text-gray-900">Pengaturan</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Trigger Quest">
                <div className="relative">
                  <select
                    value={quest.event}
                    onChange={(e) => updateField("event", e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm text-gray-900 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                  >
                    {EVENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                  {EVENT_OPTIONS.find((opt) => opt.value === quest.event)
                    ?.description || "Pilih kejadian yang menambah progress quest."}
                </p>
              </Field>

              <Field label="Target">
                <input
                  type="number"
                  min={1}
                  value={quest.target}
                  onChange={(e) =>
                    updateField("target", Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  Jumlah yang harus dicapai untuk selesai.
                </p>
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Reward XP">
                <div className="flex items-center rounded-lg border border-gray-200 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400">
                  <input
                    type="number"
                    min={0}
                    value={quest.xp_reward}
                    onChange={(e) =>
                      updateField("xp_reward", Number(e.target.value))
                    }
                    className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none"
                  />
                  <span className="pr-3 text-xs font-bold text-red-500">XP</span>
                </div>
              </Field>

              <Field label="Tipe Quest">
                <div className="relative">
                  <select
                    value={quest.frequency}
                    onChange={(e) => updateField("frequency", e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm text-gray-900 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                  >
                    <option value="harian">Harian</option>
                    <option value="mingguan">Mingguan</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </Field>

              <Field label="Kesulitan Quest">
                <div className="relative">
                  <select
                    value={quest.difficulty}
                    onChange={(e) => updateField("difficulty", e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm text-gray-900 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </Field>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            Preview Mahasiswa
          </p>
          <QuestPreview quest={quest} />
        </aside>
      </div>

      {showCancelModal && (
        <ConfirmCancelModal
          onKeep={() => setShowCancelModal(false)}
          onDiscard={() => router.push("/admin/quest-admin")}
        />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function QuestPreview({ quest }) {
  const style = FREQUENCY_STYLES[quest.frequency] || FREQUENCY_STYLES.harian;
  const label = FREQUENCY_LABEL[quest.frequency] || "Quest";

  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
        >
          <Target className={`h-5 w-5 ${style.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${style.badge}`}
          >
            {label}
          </span>
          <h3 className="mt-1 text-sm font-bold text-gray-900">
            {quest.title || "Judul Quest"}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {quest.description || "Deskripsi quest akan ditampilkan di sini..."}
          </p>
        </div>
        <div className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-center">
          <p className="text-lg font-extrabold text-red-600">
            +{quest.xp_reward || 0}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-red-500">
            XP
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-3">
        <button
          disabled
          className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white opacity-90"
        >
          Kerjakan
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ConfirmCancelModal({ onKeep, onDiscard }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onKeep}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <button
            onClick={onKeep}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h3 className="mt-4 text-base font-bold text-gray-900">
          Batalkan perubahan quest?
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Progress yang belum disimpan akan hilang. Anda yakin ingin keluar?
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onKeep}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Lanjut Edit
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Ya, Batalkan
          </button>
        </div>
      </div>
    </div>
  );
}