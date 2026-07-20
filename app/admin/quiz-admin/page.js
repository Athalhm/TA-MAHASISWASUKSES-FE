"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import {
  BookOpen,
  Clock,
  Star,
  FileText,
  Trash2,
  Plus,
  AlertTriangle,
  RefreshCw,
  Inbox,
  X,
} from "lucide-react";

const CATEGORY_STYLES = {
  Pemrograman: "bg-blue-50 text-blue-600",
  Infrastruktur: "bg-purple-50 text-purple-600",
  Database: "bg-green-50 text-green-600",
  default: "bg-gray-100 text-gray-600",
};

const STATUS_STYLES = {
  Aktif: "bg-green-50 text-green-700",
  Draft: "bg-gray-100 text-gray-600",
};

export default function KelolaQuizPage() {
  const router = useRouter();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await fetchWithAuth("/api/v1/quiz/get-raw-quiz");
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(true);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const goToCreate = () => router.push("/admin/quiz-admin/new");
  const goToEdit = (quiz) => router.push(`/admin/quiz-admin/${quiz.id}`);

  const toggleStatus = async (quiz) => {
    const newActive = !quiz.is_active;
    const previous = quizzes;
    setQuizzes((prev) =>
      prev.map((q) => (q.id === quiz.id ? { ...q, is_active: newActive } : q))
    );
    try {
      await fetchWithAuth(
        `/api/v1/quiz/${quiz.id}/set-active?active=${newActive}`,
        { method: "POST" }
      );
    } catch (err) {
      setQuizzes(previous);
      alert(err?.message || "Gagal mengubah status quiz. Coba lagi.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setProcessing(true);
    try {
      await fetchWithAuth(`/api/v1/quiz/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err?.message || "Gagal menghapus quiz. Coba lagi.");
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
              ? "Memuat daftar quiz..."
              : `${quizzes.length} quiz tersedia`}
          </p>
        </div>
        <button
          onClick={goToCreate}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Buat Quiz Baru
        </button>
      </header>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Daftar quiz gagal dimuat.
          </div>
          <button
            onClick={fetchQuizzes}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <QuizCardSkeleton key={i} />)
        ) : quizzes.length === 0 && !error ? (
          <EmptyState onCreate={goToCreate} />
        ) : (
          quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onEdit={() => goToEdit(quiz)}
              onToggle={() => toggleStatus(quiz)}
              onDelete={() => setDeleteTarget(quiz)}
            />
          ))
        )}

        {!loading && quizzes.length > 0 && <CreateNewCard onClick={goToCreate} />}
      </section>

      {/* Modal konfirmasi hapus */}
      {deleteTarget && (
        <DeleteModal
          quiz={deleteTarget}
          processing={processing}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function QuizCard({ quiz, onEdit, onToggle, onDelete }) {
  const isActive = quiz.is_active;
  const statusLabel = isActive ? "Aktif" : "Draft";
  const categoryStyle =
    CATEGORY_STYLES[quiz.category] || CATEGORY_STYLES.default;
  const statusStyle = STATUS_STYLES[statusLabel];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-5">
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-1 bg-red-500" aria-hidden />
      )}

      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
          <BookOpen className="h-5 w-5 text-red-500" />
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </div>

      <button onClick={onEdit} className="mt-4 text-left focus:outline-none">
        <h3 className="text-base font-bold text-gray-900 hover:text-red-600">
          {quiz.title}
        </h3>
      </button>
      <span
        className={`mt-2 inline-block w-fit rounded-md px-2 py-0.5 text-xs font-medium ${categoryStyle}`}
      >
        {quiz.category}
      </span>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatBox icon={Clock} value={`${quiz.duration_minutes}m`} label="Durasi" />
        <StatBox icon={Star} value={quiz.xp_reward} label="XP" />
        <StatBox icon={FileText} value={quiz.question_count} label="Soal" />
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4">
        <button
          onClick={onToggle}
          className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {isActive ? "Nonaktifkan" : "Aktifkan"}
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
          aria-label={`Hapus quiz ${quiz.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, value, label }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2 text-center">
      <Icon className="mx-auto h-3.5 w-3.5 text-gray-400" />
      <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

function CreateNewCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 text-center transition-colors hover:border-red-300 hover:bg-red-50/50"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-red-100">
        <Plus className="h-6 w-6 text-gray-400 transition-colors group-hover:text-red-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">Buat Quiz Baru</p>
        <p className="mt-1 text-xs text-gray-500">Tambah quiz untuk mahasiswa</p>
      </div>
    </button>
  );
}

function QuizCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-6 w-14 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className="mt-4 h-9 w-full animate-pulse rounded-lg bg-gray-100" />
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Inbox className="h-7 w-7 text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">Belum ada quiz</p>
        <p className="mt-1 text-xs text-gray-500">
          Mulai buat quiz pertama untuk mahasiswa.
        </p>
      </div>
      <button
        onClick={onCreate}
        className="mt-2 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        <Plus className="h-4 w-4" />
        Buat Quiz Baru
      </button>
    </div>
  );
}

function DeleteModal({ quiz, processing, onCancel, onConfirm }) {
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
        <h3 className="mt-4 text-base font-bold text-gray-900">Hapus Quiz</h3>
        <p className="mt-1 text-sm text-gray-600">
          Anda yakin ingin menghapus quiz{" "}
          <span className="font-semibold text-gray-900">{quiz.title}</span>?
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