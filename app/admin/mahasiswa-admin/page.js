"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchWithAuth } from "@/lib/api";
import {
  Search,
  Flame,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Inbox,
  X,
  Star,
  Calendar,
  Loader2,
} from "lucide-react";

function formatNumber(n) {
  return new Intl.NumberFormat("id-ID").format(n ?? 0);
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function DataMahasiswaPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await fetchWithAuth("/api/v1/user");
      setStudents(Array.isArray(data?.students) ? data.students : []);
    } catch (err) {
      setError(true);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = (s.full_name || "").toLowerCase();
      const nim = String(s.nim || "").toLowerCase();
      return name.includes(q) || nim.includes(q);
    });
  }, [students, query]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Data mahasiswa gagal dimuat.
          </div>
          <button
            onClick={fetchStudents}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau NIM mahasiswa..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
          />
        </div>
        <p className="text-sm text-gray-500">
          {loading ? "Memuat data..." : `${filtered.length} mahasiswa ditemukan`}
        </p>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState query={query} onClear={() => setQuery("")} />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <Th className="w-16 text-center">#</Th>
                  <Th>Mahasiswa</Th>
                  <Th>Total XP</Th>
                  <Th>Streak</Th>
                  <Th>Quiz Selesai</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, idx) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                  >
                    <Td className="w-16 text-center text-sm text-gray-400">
                      {idx + 1}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={student.full_name} />
                        <span className="text-sm font-medium text-gray-800">
                          {student.full_name}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <XpDisplay value={student.total_xp} />
                    </Td>
                    <Td>
                      <StreakDisplay days={student.current_streak} />
                    </Td>
                    <Td className="text-sm text-gray-700">
                      {student.total_quizzes_completed} quiz
                    </Td>
                    <Td className="text-right">
                      <button
                        onClick={() => setSelectedId(student.id)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"
                      >
                        Detail
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {filtered.map((student, idx) => (
              <div
                key={student.id}
                className="rounded-2xl border border-gray-100 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-400">
                    #{idx + 1}
                  </span>
                  <Avatar name={student.full_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {student.full_name}
                    </p>
                    {student.nim && (
                      <p className="truncate text-xs text-gray-500">
                        NIM: {student.nim}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center">
                  <MobileStat label="Total XP">
                    <XpDisplay value={student.total_xp} />
                  </MobileStat>
                  <MobileStat label="Streak">
                    <div className="flex justify-center">
                      <StreakDisplay days={student.current_streak} />
                    </div>
                  </MobileStat>
                  <MobileStat label="Quiz">
                    <p className="text-sm font-semibold text-gray-700">
                      {student.total_quizzes_completed}
                    </p>
                  </MobileStat>
                </div>

                <button
                  onClick={() => setSelectedId(student.id)}
                  className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-red-50 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                >
                  Lihat Detail
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedId && (
        <StudentDetailModal
          studentId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function StudentDetailModal({ studentId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await fetchWithAuth(`/api/v1/user/${studentId}/detail`);
      setDetail(data);
    } catch (err) {
      setError(true);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <ModalLoading onClose={onClose} />
        ) : error || !detail ? (
          <ModalError onRetry={fetchDetail} onClose={onClose} />
        ) : (
          <ModalContent detail={detail} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function ModalLoading({ onClose }) {
  return (
    <div className="flex min-h-[400px] flex-col">
      <div className="flex items-center justify-end p-4">
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat detail mahasiswa...</span>
        </div>
      </div>
    </div>
  );
}

function ModalError({ onRetry, onClose }) {
  return (
    <div className="flex min-h-[400px] flex-col">
      <div className="flex items-center justify-end p-4">
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-sm font-semibold text-gray-800">
          Gagal memuat detail
        </p>
        <p className="text-xs text-gray-500">
          Periksa koneksi Anda lalu coba lagi.
        </p>
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Coba lagi
        </button>
      </div>
    </div>
  );
}

function ModalContent({ detail, onClose }) {
  const level = detail.current_level ?? 0;
  const currentLevelXp = detail.current_level_xp ?? 0;
  const nextLevelXp = detail.xp_required_for_this_milestone ?? 0;
  const progressPercent =
    typeof detail.progress_percentage === "number"
      ? Math.min(100, detail.progress_percentage)
      : Math.min(100, Math.round((currentLevelXp / (nextLevelXp || 1)) * 100));
  const activity = useMemo(() => {
    const raw = detail.activity_30_days || [];
    return Array.from({ length: 30 }, (_, i) => Boolean(raw[i]));
  }, [detail.activity_30_days]);

  return (
    <>
      <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-6 text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-2xl font-bold text-red-600">
            {detail.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold sm:text-xl">{detail.full_name}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                <Star className="h-3 w-3" />
                Level {level}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                <Flame className="h-3 w-3" />
                {detail.current_streak ?? 0} hari streak
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span>Progress ke Level {level + 1}</span>
            <span className="font-semibold">
              {currentLevelXp} / {nextLevelXp} XP
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox
            color="red"
            value={formatNumber(detail.total_xp)}
            suffix="XP"
            label="Total XP"
          />
          <StatBox
            color="blue"
            value={detail.total_quizzes_completed}
            suffix="quiz"
            label="Quiz Selesai"
          />
          <StatBox
            color="green"
            value={detail.average_score}
            suffix="pts"
            label="Rata-rata Nilai"
          />
          <StatBox
            color="orange"
            value={detail.current_streak}
            suffix="hari"
            label="Streak"
          />
        </div>

        <section className="mt-6">
          <h3 className="text-sm font-bold text-gray-900">
            Aktivitas 30 Hari Terakhir
          </h3>
          <div className="mt-3 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5 sm:gap-2">
            {activity.map((active, i) => (
              <div
                key={i}
                className={`aspect-square rounded ${
                  active ? "bg-red-500" : "bg-gray-100"
                }`}
                title={`Hari ke-${i + 1}: ${active ? "Aktif" : "Tidak aktif"}`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-red-500" />
              Aktif
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-gray-200" />
              Tidak aktif
            </span>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-bold text-gray-900">Riwayat Quiz</h3>
          {(detail.quiz_history || []).length === 0 ? (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 py-6 text-center">
              <Inbox className="h-6 w-6 text-gray-400" />
              <p className="text-xs text-gray-500">Belum ada riwayat quiz</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {detail.quiz_history.map((quiz, idx) => (
                <QuizHistoryRow key={idx} quiz={quiz} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-3">
        <p className="text-xs text-gray-500">
          {detail.last_updated
            ? `Data diperbarui: ${formatDateShort(detail.last_updated)}`
            : "Data terbaru"}
        </p>
        <button
          onClick={onClose}
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Tutup
        </button>
      </div>
    </>
  );
}

function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-4 py-4 ${className}`}>{children}</td>;
}

function Avatar({ name }) {
  const letter = name?.charAt(0)?.toUpperCase() || "?";
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
      {letter}
    </div>
  );
}

function XpDisplay({ value }) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="text-sm font-bold text-red-600">
        {formatNumber(value)}
      </span>
      <span className="text-[10px] font-semibold text-red-500">XP</span>
    </span>
  );
}

function StreakDisplay({ days }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500">
      <Flame className="h-3.5 w-3.5" />
      {days ?? 0} hari
    </span>
  );
}

function MobileStat({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function StatBox({ color, value, suffix, label }) {
  const styles = {
    red: { bg: "bg-red-50", text: "text-red-600", suffix: "text-red-500" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", suffix: "text-blue-500" },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      suffix: "text-green-500",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      suffix: "text-orange-500",
    },
  };
  const s = styles[color] || styles.red;
  return (
    <div className={`rounded-xl p-3 ${s.bg}`}>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-extrabold ${s.text}`}>{value ?? 0}</span>
        <span className={`text-[10px] font-semibold ${s.suffix}`}>{suffix}</span>
      </div>
      <p className="mt-0.5 text-xs text-gray-600">{label}</p>
    </div>
  );
}

function QuizHistoryRow({ quiz }) {
  const score = quiz.score ?? 0;
  const passed = quiz.passed ?? score >= 60;

  const scoreStyle =
    score >= 80
      ? "bg-green-100 text-green-700"
      : score >= 60
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  const barColor =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-400" : "bg-red-400";

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 p-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${scoreStyle}`}
      >
        {score}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">
          {quiz.quiz_title}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          {formatDateShort(quiz.completed_date)}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}
      >
        {passed ? "Lulus" : "Gagal"}
      </span>
      <div className="ml-1 h-2 w-20 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </li>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3">
        <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-gray-100 px-4 py-4 last:border-b-0"
        >
          <div className="h-4 w-6 animate-pulse rounded bg-gray-100" />
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-100" />
          <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ query, onClear }) {
  const isSearching = query.trim().length > 0;
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Inbox className="h-7 w-7 text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">
          {isSearching ? "Mahasiswa tidak ditemukan" : "Belum ada mahasiswa"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {isSearching
            ? `Tidak ada hasil untuk "${query}". Coba kata kunci lain.`
            : "Data mahasiswa akan tampil di sini setelah terdaftar."}
        </p>
      </div>
      {isSearching && (
        <button
          onClick={onClear}
          className="mt-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Bersihkan pencarian
        </button>
      )}
    </div>
  );
}