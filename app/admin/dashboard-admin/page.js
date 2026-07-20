"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "@/lib/api";
import {
  BookOpen,
  Target,
  GraduationCap,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Inbox,
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

const FREQUENCY_STYLES = {
  harian: { label: "Daily", color: "text-blue-600" },
  mingguan: { label: "Weekly", color: "text-purple-600" },
  default: { label: "-", color: "text-gray-500" },
};

function getRankStyle(rank) {
  if (rank === 1) return "bg-yellow-400 text-white";
  if (rank === 2) return "bg-gray-300 text-white";
  if (rank === 3) return "bg-orange-400 text-white";
  return "bg-red-100 text-red-600";
}

function formatNumber(n) {
  return new Intl.NumberFormat("id-ID").format(n ?? 0);
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [recentQuiz, setRecentQuiz] = useState([]);
  const [activeQuest, setActiveQuest] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [loadingQuest, setLoadingQuest] = useState(true);

  const [errorOverview, setErrorOverview] = useState(false);
  const [errorQuiz, setErrorQuiz] = useState(false);
  const [errorQuest, setErrorQuest] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      setErrorOverview(false);
      const data = await fetchWithAuth("/api/v1/user/admin/overview");
      setOverview(data);
    } catch (err) {
      setErrorOverview(true);
      setOverview(null);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const fetchRecentQuiz = useCallback(async () => {
    try {
      setLoadingQuiz(true);
      setErrorQuiz(false);
      const data = await fetchWithAuth("/api/v1/quiz/get-raw-quiz");
      const sorted = Array.isArray(data)
        ? [...data].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )
        : [];
      setRecentQuiz(sorted.slice(0, 8));
    } catch (err) {
      setErrorQuiz(true);
      setRecentQuiz([]);
    } finally {
      setLoadingQuiz(false);
    }
  }, []);

  const fetchActiveQuest = useCallback(async () => {
    try {
      setLoadingQuest(true);
      setErrorQuest(false);
      const data = await fetchWithAuth("/api/v1/gamification/list-all");
      const active = Array.isArray(data)
        ? data.filter((q) => q.is_active).slice(0, 3)
        : [];
      setActiveQuest(active);
    } catch (err) {
      setErrorQuest(true);
      setActiveQuest([]);
    } finally {
      setLoadingQuest(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchRecentQuiz();
    fetchActiveQuest();
  }, [fetchOverview, fetchRecentQuiz, fetchActiveQuest]);

  const handleRetryAll = () => {
    fetchOverview();
    fetchRecentQuiz();
    fetchActiveQuest();
  };

  const anyError = errorOverview || errorQuiz || errorQuest;
  const topStudents = overview?.top_users || [];
  const activeQuizCount = overview?.total_active_quizzes ?? 0;
  const activeQuestCount = overview?.total_active_quests ?? 0;

  return (
    <div className="space-y-6">
      {anyError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Sebagian data gagal dimuat.
          </div>
          <button
            onClick={handleRetryAll}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BookOpen}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          label="Total Quiz"
          value={overview?.total_quizzes}
          subLabel={`${activeQuizCount} aktif`}
          loading={loadingOverview}
        />
        <StatCard
          icon={Target}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          label="Total Quest"
          value={overview?.total_quests}
          subLabel={`${activeQuestCount} aktif`}
          loading={loadingOverview}
        />
        <StatCard
          icon={GraduationCap}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          label="Mahasiswa"
          value={overview?.total_active_users}
          subLabel="terdaftar"
          loading={loadingOverview}
        />
        <StatCard
          icon={TrendingUp}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          label="Submission"
          value={overview?.total_submissions?.value}
          subLabel="minggu ini"
          trend={overview?.total_submissions?.trend_percentage}
          loading={loadingOverview}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionCard title="Quiz Terbaru" href="/admin/quiz-admin">
            {loadingQuiz ? (
              <SkeletonRows count={3} />
            ) : recentQuiz.length === 0 ? (
              <EmptyState message="Belum ada quiz yang dibuat" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentQuiz.map((quiz) => {
                  const statusLabel = quiz.is_active ? "Aktif" : "Draft";
                  return (
                    <li
                      key={quiz.id}
                      className="flex flex-wrap items-center gap-3 py-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                        <BookOpen className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {quiz.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                              CATEGORY_STYLES[quiz.category] ||
                              CATEGORY_STYLES.default
                            }`}
                          >
                            {quiz.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {quiz.question_count} soal · {quiz.xp_reward} XP
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[statusLabel]}`}
                        >
                          {statusLabel}
                        </span>
                        <span className="text-xs text-gray-500">
                          {quiz.duration_minutes}m
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Quest Aktif" href="/admin/quest-admin">
            {loadingQuest ? (
              <SkeletonRows count={2} />
            ) : activeQuest.length === 0 ? (
              <EmptyState message="Belum ada quest aktif" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {activeQuest.map((quest) => {
                  const freqStyle =
                    FREQUENCY_STYLES[quest.frequency] ||
                    FREQUENCY_STYLES.default;
                  return (
                    <li
                      key={quest.id}
                      className="flex items-center gap-3 py-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50">
                        <Target className="h-5 w-5 text-purple-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {quest.title}
                        </p>
                        <p
                          className={`mt-0.5 text-xs font-medium ${freqStyle.color}`}
                        >
                          {freqStyle.label}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">
                          +{quest.xp_reward}
                        </p>
                        <p className="text-xs text-gray-500">XP</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Top Mahasiswa" href="/admin/mahasiswa-admin">
            {loadingOverview ? (
              <SkeletonRows count={4} />
            ) : topStudents.length === 0 ? (
              <EmptyState message="Belum ada data mahasiswa" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {topStudents.map((student, idx) => {
                  const rank = idx + 1;
                  const displayName = student.full_name || student.user_name;
                  return (
                    <li
                      key={student.user_id}
                      className="flex items-center gap-3 py-3"
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getRankStyle(
                          rank
                        )}`}
                      >
                        {rank}
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                        {displayName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                        {displayName}
                      </p>
                      <p className="text-sm font-bold text-red-600">
                        {formatNumber(student.total_xp)} XP
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  subLabel,
  trend,
  loading,
}) {
  const showTrend = typeof trend === "number";
  const trendPositive = (trend ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {loading ? (
          <span className="h-6 w-12 animate-pulse rounded-full bg-gray-100" />
        ) : (
          showTrend && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                trendPositive
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {trendPositive ? "+" : ""}
              {trend}%
            </span>
          )
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <>
            <div className="h-8 w-20 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-3 w-16 animate-pulse rounded bg-gray-100" />
          </>
        ) : (
          <>
            <p className="text-3xl font-bold text-gray-900">
              {formatNumber(value)}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-700">{label}</p>
            <p className="mt-0.5 text-xs text-gray-500">{subLabel}</p>
          </>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, href, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <a
          href={href}
          className="flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"
        >
          Lihat Semua
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function SkeletonRows({ count = 3 }) {
  return (
    <ul className="divide-y divide-gray-100">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 py-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-6 w-14 animate-pulse rounded-full bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <Inbox className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}