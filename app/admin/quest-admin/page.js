"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import {
  Target,
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  RefreshCw,
  Inbox,
  X,
} from "lucide-react";

const FREQUENCY_STYLES = {
  harian: {
    label: "Daily",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    badge: "bg-blue-50 text-blue-600",
  },
  mingguan: {
    label: "Weekly",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    badge: "bg-purple-50 text-purple-600",
  },
  default: {
    label: "-",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
    badge: "bg-gray-100 text-gray-600",
  },
};

export default function KelolaQuestPage() {
  const router = useRouter();

  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchQuests = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await fetchWithAuth("/api/v1/gamification/list-all");
      setQuests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(true);
      setQuests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  const goToCreate = () => router.push("/admin/quest-admin/new");
  const goToEdit = (quest) => router.push(`/admin/quest-admin/${quest.id}`);
  const toggleStatus = async (quest) => {
    const newActive = !quest.is_active;
    const previous = quests;
    setQuests((prev) =>
      prev.map((q) => (q.id === quest.id ? { ...q, is_active: newActive } : q))
    );
    try {
      await fetchWithAuth(
        `/api/v1/gamification/${quest.id}/set-active?active=${newActive}`,
        { method: "POST" }
      );
    } catch (err) {
      setQuests(previous);
      alert(err?.message || "Gagal mengubah status quest. Coba lagi.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setProcessing(true);
    try {
      await fetchWithAuth(`/api/v1/gamification/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setQuests((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err?.message || "Gagal menghapus quest. Coba lagi.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            {loading
              ? "Memuat daftar quest..."
              : `${quests.length} quest tersedia`}
          </p>
        </div>
        <button
          onClick={goToCreate}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Buat Quest Baru
        </button>
      </header>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Daftar quest gagal dimuat.
          </div>
          <button
            onClick={fetchQuests}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}

      <section className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <QuestRowSkeleton key={i} />)
        ) : quests.length === 0 && !error ? (
          <EmptyState onCreate={goToCreate} />
        ) : (
          quests.map((quest) => (
            <QuestRow
              key={quest.id}
              quest={quest}
              onToggle={() => toggleStatus(quest)}
              onEdit={() => goToEdit(quest)}
              onDelete={() => setDeleteTarget(quest)}
            />
          ))
        )}

        {!loading && quests.length > 0 && (
          <AddQuestButton onClick={goToCreate} />
        )}
      </section>

      {/* Modal konfirmasi hapus */}
      {deleteTarget && (
        <DeleteModal
          quest={deleteTarget}
          processing={processing}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function QuestRow({ quest, onToggle, onEdit, onDelete }) {
  const style = FREQUENCY_STYLES[quest.frequency] || FREQUENCY_STYLES.default;
  const isActive = quest.is_active;
  const statusLabel = isActive ? "Aktif" : "Nonaktif";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
        >
          <Target className={`h-5 w-5 ${style.iconColor}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 sm:text-base">
              {quest.title}
            </h3>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${style.badge}`}
            >
              {style.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            {quest.description}
          </p>
        </div>

        <div className="text-right">
          <p
            className={`text-xl font-extrabold sm:text-2xl ${
              isActive ? "text-red-600" : "text-red-300"
            }`}
          >
            +{quest.xp_reward}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            XP
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 lg:mt-0 lg:border-0 lg:pt-0">
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            isActive
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
          aria-label={`Ubah status quest ${quest.title}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isActive ? "bg-green-500" : "bg-gray-400"
            }`}
            aria-hidden
          />
          {statusLabel}
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg bg-blue-50 p-2 text-blue-500 transition-colors hover:bg-blue-100"
          aria-label={`Edit quest ${quest.title}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
          aria-label={`Hapus quest ${quest.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AddQuestButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/40 py-4 text-sm font-medium text-gray-500 transition-colors hover:border-red-300 hover:bg-red-50/50 hover:text-red-600"
    >
      <Plus className="h-4 w-4 transition-colors group-hover:text-red-500" />
      Tambah Quest Baru
    </button>
  );
}

function QuestRowSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-8 w-16 animate-pulse rounded bg-gray-100" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Inbox className="h-7 w-7 text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">Belum ada quest</p>
        <p className="mt-1 text-xs text-gray-500">
          Mulai buat quest untuk memotivasi mahasiswa.
        </p>
      </div>
      <button
        onClick={onCreate}
        className="mt-2 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        <Plus className="h-4 w-4" />
        Buat Quest Baru
      </button>
    </div>
  );
}

function DeleteModal({ quest, processing, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h3 className="mt-4 text-base font-bold text-gray-900">Hapus Quest</h3>
        <p className="mt-1 text-sm text-gray-600">
          Anda yakin ingin menghapus quest{" "}
          <span className="font-semibold text-gray-900">{quest.title}</span>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {processing ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}