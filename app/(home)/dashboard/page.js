"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BadgeCheck,
  Brain,
  CheckCircle2,
  Clock3,
  Download,
  List,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Star,
  Tag,
  Trophy,
  Zap,
} from "lucide-react";

function SectionLabel({ children }) {
  return <p className="text-[15px] font-semibold text-[#1f1f1f]">{children}</p>;
}

function CardShell({ children, className = "" }) {
  return (
    <div
      className={`rounded-[16px] border border-[#cfcfcf] bg-[#f8f8f8] shadow-[0_3px_6px_rgba(0,0,0,0.14)] ${className}`}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value = 0, total = 5 }) {
  const safeTotal = Number(total || 0);
  const safeValue = Number(value || 0);
  const percentage =
    safeTotal > 0 ? Math.max(0, Math.min((safeValue / safeTotal) * 100, 100)) : 0;

  return (
    <div className="h-[8px] w-full overflow-hidden rounded-full bg-[#dfdfdf]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#ef1f1f] to-[#f59e0b] transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function ProgressSection({ progress }) {
  return (
    <div>
      <div className="mb-3">
        <SectionLabel>Progress Kamu</SectionLabel>
      </div>

      <CardShell className="px-6 py-5">
        <h2 className="text-[16px] font-bold text-[#1f1f1f] sm:text-[18px]">
          Selamat Datang Kembali!
        </h2>
        <p className="mt-1 text-[11px] text-[#6f6f6f] sm:text-[12px]">
          Anda telah menyelesaikan {progress.completed} dari {progress.total} quest.
          Tetap semangat!
        </p>

        <div className="mt-4">
          <ProgressBar value={progress.completed} total={progress.total} />
        </div>
      </CardShell>
    </div>
  );
}

function StartNowSection({ onStartQuiz, onAddTarget }) {
  return (
    <div className="rounded-[16px] border border-[#ff4d4f] bg-[#f8f8f8] px-6 py-5">
      <h3 className="text-[16px] font-semibold text-[#1f1f1f]">Mulai Sekarang</h3>
      <p className="mt-1 text-[11px] text-[#6f6f6f]">Ayo tingkat skill mu hari ini!</p>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <button
          onClick={onStartQuiz}
          className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-[6px] bg-[#f71d28] px-4 text-[13px] font-medium text-white transition hover:bg-[#e31722]"
        >
          <Play className="h-4 w-4 fill-white text-white" />
          Mulai Quiz
        </button>

        <button
          onClick={onAddTarget}
          className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-[6px] border border-[#ff4d4f] bg-white px-4 text-[13px] font-medium text-[#ff3d3f] transition hover:bg-red-50"
        >
          <Plus className="h-4 w-4" />
          Tambah Target
        </button>
      </div>
    </div>
  );
}

function getPriorityClass(priority) {
  if (priority === "High") {
    return "border-[#f26e6e] bg-[#ffbcbc] text-[#d72828]";
  }

  if (priority === "Low") {
    return "border-[#60dc7b] bg-[#baf5c4] text-[#169d36]";
  }

  return "border-[#f0ad58] bg-[#ffd8a8] text-[#ca8121]";
}

function TargetItem({ item, onToggle }) {
  return (
    <CardShell className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(item.id)}
          aria-label={`Toggle ${item.title}`}
          className="mt-0.5 shrink-0"
        >
          {item.completed ? (
            <CheckCircle2 className="h-[18px] w-[18px] text-[#16a34a]" />
          ) : (
            <div className="h-[18px] w-[18px] rounded-full border border-[#d2d2d2] bg-[#efefef]" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h4 className="truncate text-[12px] font-semibold text-[#1f1f1f] sm:text-[13px]">
                {item.title}
              </h4>
              <p className="mt-1 text-[10px] leading-relaxed text-[#8a8a8a]">
                {item.description}
              </p>
            </div>

            <div
              className={`inline-flex h-[22px] min-w-[44px] shrink-0 items-center justify-center rounded-full border px-3 text-[10px] font-semibold ${getPriorityClass(
                item.priority
              )}`}
            >
              {item.priority}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="inline-flex items-center gap-1 text-[10px] text-[#ef4444]">
              <Clock3 className="h-3 w-3" />
              <span>{item.deadline}</span>
            </div>

            <div className="inline-flex items-center gap-1 text-[10px] text-[#8a8a8a]">
              <Tag className="h-3 w-3" />
              <span>{item.category}</span>
            </div>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function TargetSection({ targets, onToggleTarget }) {
  return (
    <div>
      <div className="mb-3">
        <SectionLabel>Target Aktif</SectionLabel>
      </div>

      <div className="space-y-3">
        {targets.map((item) => (
          <TargetItem key={item.id} item={item} onToggle={onToggleTarget} />
        ))}
      </div>
    </div>
  );
}

function QuickActionItem({ icon, title, iconWrapClass, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[16px] border border-[#cfcfcf] bg-[#f8f8f8] px-4 py-3 shadow-[0_3px_6px_rgba(0,0,0,0.14)] transition hover:-translate-y-[1px]"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-[6px] ${iconWrapClass}`}>
          {icon}
        </div>
        <span className="text-[12px] font-medium text-[#1f1f1f]">{title}</span>
      </div>

      <ArrowRight className="h-4 w-4 text-[#5f5f5f]" />
    </button>
  );
}

function QuickActionSection({ onViewAllQuiz, onViewAchievement }) {
  return (
    <div>
      <div className="mb-3">
        <SectionLabel>Quick Action</SectionLabel>
      </div>

      <div className="space-y-3">
        <QuickActionItem
          title="Lihat Semua Quiz"
          onClick={onViewAllQuiz}
          iconWrapClass="bg-[#ffd9d9] text-[#ef4444]"
          icon={<List className="h-4 w-4" />}
        />

        <QuickActionItem
          title="Lihat Achievement"
          onClick={onViewAchievement}
          iconWrapClass="bg-[#d9ecff] text-[#3b82f6]"
          icon={<BadgeCheck className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}

function CertificateSection({ certificate, onDownload }) {
  if (!certificate) return null;

  return (
    <div>
      <div className="mb-3">
        <SectionLabel>Sertifikat</SectionLabel>
      </div>

      <CardShell className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#bdf3c6] text-[#16a34a]">
            <Award className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-[#8a8a8a]">{certificate.category}</p>
            <h4 className="mt-1 text-[13px] font-bold text-[#1f1f1f]">
              {certificate.title}
            </h4>
          </div>
        </div>

        <button
          onClick={onDownload}
          className="mt-4 inline-flex h-[30px] w-full items-center justify-center gap-2 rounded-[6px] bg-[#10b26f] px-4 text-[10px] font-medium text-white transition hover:bg-[#0d9a60]"
        >
          <Download className="h-3 w-3" />
          Download Sertifikat
        </button>
      </CardShell>
    </div>
  );
}

function StatCard({ title, value, icon, iconWrapClass }) {
  return (
    <CardShell className="min-h-[88px] px-4 py-4">
      <div className={`flex h-6 w-6 items-center justify-center rounded-[6px] ${iconWrapClass}`}>
        {icon}
      </div>

      <p className="mt-4 text-[10px] text-[#7c7c7c]">{title}</p>
      <p className="mt-1 text-[14px] font-bold text-[#1f1f1f]">{value}</p>
    </CardShell>
  );
}

function StatsSection({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard
        title="Total XP"
        value={stats.totalXp}
        icon={<Star className="h-3.5 w-3.5 fill-white text-white" />}
        iconWrapClass="bg-[#f59e0b]"
      />
      <StatCard
        title="Quest Selesai"
        value={stats.questCompleted}
        icon={<Brain className="h-3.5 w-3.5 text-white" />}
        iconWrapClass="bg-[#54c4a2]"
      />
      <StatCard
        title="Achievement"
        value={stats.achievement}
        icon={<Trophy className="h-3.5 w-3.5 text-white" />}
        iconWrapClass="bg-[#ef4444]"
      />
      <StatCard
        title="Streak"
        value={stats.streak}
        icon={<Zap className="h-3.5 w-3.5 fill-white text-white" />}
        iconWrapClass="bg-[#f97316]"
      />
    </div>
  );
}

function RecentActivitySection({ activities }) {
  return (
    <CardShell className="px-5 py-4 sm:px-6 sm:py-5">
      <h3 className="text-[14px] font-semibold text-[#1f1f1f]">Aktivitas Terbaru</h3>

      <div className="mt-4">
        {activities.length === 0 ? (
          <p className="text-[12px] text-[#7a7a7a]">Belum ada aktivitas terbaru.</p>
        ) : (
          activities.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className={`${index !== activities.length - 1 ? "border-b border-[#e5e5e5]" : ""} py-3`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-medium text-[#1f1f1f]">{item.title}</p>
                  <p className="mt-1 text-[11px] text-[#7a7a7a]">{item.time}</p>
                </div>

                <p className="shrink-0 text-[11px] font-medium text-[#10b981]">
                  {item.reward}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </CardShell>
  );
}

function LoadingState() {
  return (
    <CardShell className="px-5 py-5 sm:px-6">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-[#666]" />
        <span className="text-sm text-[#666]">Memuat dashboard...</span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="h-5 w-56 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-72 animate-pulse rounded bg-neutral-200" />
        <div className="h-2 w-full animate-pulse rounded-full bg-neutral-200" />
      </div>
    </CardShell>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-[16px] border border-red-200 bg-white px-5 py-5 shadow-[0_3px_6px_rgba(0,0,0,0.08)] sm:px-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-red-600">Gagal memuat dashboard</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {message || "Terjadi kesalahan saat mengambil data dari server."}
          </p>

          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <CardShell className="px-6 py-5">
      <h2 className="text-[16px] font-bold text-[#1f1f1f] sm:text-[18px]">
        Selamat Datang Kembali!
      </h2>
      <p className="mt-1 text-[12px] text-[#6f6f6f]">
        Data progress belum tersedia untuk saat ini.
      </p>

      <div className="mt-4">
        <ProgressBar value={0} total={5} />
      </div>
    </CardShell>
  );
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [targets, setTargets] = useState([]);
  const [quizList, setQuizList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("id-ID").format(Number(value || 0));
  };

  const formatRelativeTime = (value) => {
    if (!value) return "-";

    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;

      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return "Baru saja";
      if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      return `${diffDays} hari lalu`;
    } catch {
      return value;
    }
  };

  const formatDeadline = (value) => {
    if (!value) return "-";

    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;

      return new Intl.DateTimeFormat("id-ID", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return value;
    }
  };

  const normalizePriority = (priority) => {
    const raw = String(priority || "").toLowerCase();

    if (raw === "high" || raw === "tinggi") return "High";
    if (raw === "low" || raw === "rendah") return "Low";
    return "Medium";
  };

  const normalizeCategory = (category) => {
    const raw = String(category || "").toLowerCase();

    if (raw === "akademik") return "Tugas Kuliah";
    if (raw === "organisasi") return "Organisasi";
    if (raw === "pribadi") return "Pribadi";
    return category || "Tugas Kuliah";
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const baseUrl = getBaseUrl();

      const [
        summaryResult,
        tasksResult,
        historyResult,
        achievementResult,
        quizResult,
      ] = await Promise.allSettled([
        fetch(`${baseUrl}/api/v1/gamification/summary`, {
          method: "GET",
          cache: "no-store",
          headers: getAuthHeaders(),
        }),
        fetch(`${baseUrl}/api/v1/progress-tracking/tasks`, {
          method: "GET",
          cache: "no-store",
          headers: getAuthHeaders(),
        }),
        fetch(`${baseUrl}/api/v1/gamification/history`, {
          method: "GET",
          cache: "no-store",
          headers: getAuthHeaders(),
        }),
        fetch(`${baseUrl}/api/v1/gamification/achievement`, {
          method: "GET",
          cache: "no-store",
          headers: getAuthHeaders(),
        }),
        fetch(`${baseUrl}/api/v1/quiz/`, {
          method: "GET",
          cache: "no-store",
          headers: getAuthHeaders(),
        }),
      ]);

      const readJsonIfOk = async (result, fallback) => {
        if (result.status !== "fulfilled") return fallback;
        if (!result.value.ok) return fallback;

        try {
          return await result.value.json();
        } catch {
          return fallback;
        }
      };

      const summaryData = await readJsonIfOk(summaryResult, {
        total_quest: 0,
        total_quest_completed: 0,
        total_xp_earned: 0,
        current_ranking: 0,
        current_streak: 0,
      });

      const tasksData = await readJsonIfOk(tasksResult, []);
      const historyData = await readJsonIfOk(historyResult, []);
      const achievementData = await readJsonIfOk(achievementResult, []);
      const quizData = await readJsonIfOk(quizResult, []);

      const safeTasks = Array.isArray(tasksData) ? tasksData : [];
      const safeHistory = Array.isArray(historyData) ? historyData : [];
      const safeAchievement = Array.isArray(achievementData) ? achievementData : [];
      const safeQuiz = Array.isArray(quizData) ? quizData : [];

      const normalizedTargets = safeTasks.slice(0, 3).map((item, index) => ({
        id: item?.id ?? `task-${index}`,
        title: item?.title || "Target tanpa judul",
        description: item?.description || "-",
        deadline: formatDeadline(item?.deadline),
        category: normalizeCategory(item?.category),
        priority: normalizePriority(item?.priority),
        completed: Boolean(item?.is_completed),
      }));

      const completedAchievement = safeAchievement.filter(
        (item) => item?.is_completed
      );

      const certificateSource =
        safeQuiz.find((quiz) => quiz?.certificate_id) || null;

      const normalizedData = {
        progress: {
          completed: Number(summaryData?.total_quest_completed ?? 0),
          total: Number(summaryData?.total_quest ?? 0),
        },
        stats: {
          totalXp: formatNumber(summaryData?.total_xp_earned ?? 0),
          questCompleted: String(summaryData?.total_quest_completed ?? 0),
          achievement: String(completedAchievement.length),
          streak: `${summaryData?.current_streak ?? 0} hari`,
        },
        targets: normalizedTargets,
        certificate: certificateSource
          ? {
              id: certificateSource?.certificate_id,
              category: certificateSource?.category || "Quiz",
              title: certificateSource?.title || "Sertifikat",
            }
          : null,
        activities: safeHistory.slice(0, 3).map((item, index) => ({
          id: `${item?.id ?? "activity"}-${index}`,
          title: item?.title || "Aktivitas",
          time: formatRelativeTime(item?.completed_at),
          reward: `+${item?.xp_reward ?? 0} XP`,
        })),
      };

      setDashboardData(normalizedData);
      setTargets(normalizedTargets);
      setQuizList(safeQuiz);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setDashboardData(null);
      setTargets([]);
      setQuizList([]);
      setError(err.message || "Terjadi kesalahan yang tidak diketahui.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const mergedData = useMemo(() => {
    if (!dashboardData) return null;

    return {
      ...dashboardData,
      targets,
    };
  }, [dashboardData, targets]);

  const handleToggleTarget = (id) => {
    setTargets((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleStartQuiz = () => {
    window.location.href = "/quiz";
  };

  const handleAddTarget = () => {
    window.location.href = "/target-dan-tugas";
  };

  const handleViewAllQuiz = () => {
    window.location.href = "/quiz";
  };

  const handleViewAchievement = () => {
    window.location.href = "/achievement";
  };

  const handleDownloadCertificate = async () => {
    if (!mergedData?.certificate?.id) {
      alert("Sertifikat belum tersedia");
      return;
    }

    try {
      const baseUrl = getBaseUrl();

      const response = await fetch(
        `${baseUrl}/api/v1/certificate/${mergedData.certificate.id}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal mengunduh sertifikat");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "certificate.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("File sertifikat gagal diunduh");
    }
  };

  return (
    <main className="min-h-screen w-full">
      <section className="px-4 pb-12 pt-8 sm:px-6 md:px-8 lg:px-10 lg:pt-10">
        <div className="mx-auto w-full max-w-[1280px]">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchDashboardData} />
          ) : !mergedData ? (
            <EmptyState />
          ) : (
            <>
              <ProgressSection progress={mergedData.progress} />

              <div className="mt-6">
                <StartNowSection
                  onStartQuiz={handleStartQuiz}
                  onAddTarget={handleAddTarget}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-4">
                  <TargetSection
                    targets={mergedData.targets}
                    onToggleTarget={handleToggleTarget}
                  />

                  <StatsSection stats={mergedData.stats} />
                </div>

                <div className="space-y-4">
                  <QuickActionSection
                    onViewAllQuiz={handleViewAllQuiz}
                    onViewAchievement={handleViewAchievement}
                  />

                  <CertificateSection
                    certificate={mergedData.certificate}
                    onDownload={handleDownloadCertificate}
                  />
                </div>
              </div>

              <div className="mt-5">
                <RecentActivitySection activities={mergedData.activities} />
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}