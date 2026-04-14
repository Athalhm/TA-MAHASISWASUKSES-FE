"use client";

import { useEffect, useMemo, useState } from "react";
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
  return (
    <p className="text-[15px] font-semibold text-[#1f1f1f]">
      {children}
    </p>
  );
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
  const safeValue = Math.max(0, Math.min(value, total));
  const percentage = total > 0 ? (safeValue / total) * 100 : 0;

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
          Anda telah menyelesaikan {progress.completed} dari {progress.total} quest hari ini.
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
        {activities.map((item, index) => (
          <div
            key={item.id}
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
        ))}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const normalizeDashboardResponse = (data) => {
    const summary = data?.summary || data?.stats || {};
    const progressSource = data?.progress || {};

    const targetsSource =
      data?.targets ||
      data?.activeTargets ||
      data?.tasks ||
      [];

    const activitiesSource =
      data?.activities ||
      data?.recentActivities ||
      data?.histories ||
      [];

    const certificateSource =
      data?.certificate ||
      data?.latestCertificate ||
      data?.certificateData ||
      null;

    const completedQuest =
      progressSource?.completed ??
      summary?.questCompletedToday ??
      summary?.completedQuestToday ??
      0;

    const totalQuest =
      progressSource?.total ??
      summary?.totalQuestToday ??
      summary?.dailyQuestTotal ??
      5;

    return {
      progress: {
        completed: Number(completedQuest || 0),
        total: Number(totalQuest || 0),
      },
      stats: {
        totalXp: formatNumber(
          summary?.totalXp ?? summary?.xp ?? summary?.total_xp ?? 0
        ),
        questCompleted: String(
          summary?.questCompleted ??
            summary?.quest_finished ??
            summary?.completedQuest ??
            0
        ),
        achievement: String(
          summary?.achievement ??
            summary?.achievements ??
            summary?.achievementCount ??
            0
        ),
        streak:
          summary?.streakLabel ||
          (summary?.streakDays != null ? `${summary.streakDays} hari` : "0 hari"),
      },
      targets: targetsSource.map((item, index) => ({
        id: item?.id ?? item?._id ?? index + 1,
        title: item?.title ?? item?.name ?? "Target tanpa judul",
        description: item?.description ?? item?.desc ?? "-",
        deadline: formatDeadline(
          item?.deadline ??
            item?.dueDate ??
            item?.due_date ??
            item?.targetDate
        ),
        category:
          item?.category ??
          item?.type ??
          item?.label ??
          "Tugas Kuliah",
        priority: normalizePriority(item?.priority),
        completed: Boolean(
          item?.completed ?? item?.isCompleted ?? item?.done ?? false
        ),
      })),
      certificate: certificateSource
        ? {
            id: certificateSource?.id ?? certificateSource?._id ?? 1,
            category:
              certificateSource?.category ??
              certificateSource?.courseCategory ??
              certificateSource?.module ??
              "Sertifikat",
            title:
              certificateSource?.title ??
              certificateSource?.name ??
              certificateSource?.courseName ??
              "Sertifikat",
            fileUrl:
              certificateSource?.fileUrl ??
              certificateSource?.url ??
              certificateSource?.downloadUrl ??
              null,
          }
        : null,
      activities: activitiesSource.map((item, index) => ({
        id: item?.id ?? item?._id ?? index + 1,
        title:
          item?.title ??
          item?.activity ??
          item?.description ??
          "Aktivitas",
        time: formatRelativeTime(
          item?.createdAt ??
            item?.created_at ??
            item?.time ??
            item?.timestamp
        ),
        reward:
          item?.rewardLabel ||
          item?.xpLabel ||
          `+${item?.xp ?? item?.reward ?? 0} XP`,
      })),
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch("/api/dashboard", {
        method: "GET",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        let message = "Gagal mengambil data dashboard";

        try {
          const errorData = await response.json();
          message =
            errorData?.message ||
            errorData?.error ||
            `${message} (${response.status})`;
        } catch {
          message = `${message} (${response.status})`;
        }

        throw new Error(message);
      }

      const rawData = await response.json();
      const normalizedData = normalizeDashboardResponse(rawData);

      setDashboardData(normalizedData);
      setTargets(normalizedData.targets);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setDashboardData(null);
      setTargets([]);
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

  const handleToggleTarget = async (id) => {
    const previousTargets = [...targets];

    const nextTargets = targets.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );

    setTargets(nextTargets);

    try {
      const token = localStorage.getItem("token");
      const selectedTarget = nextTargets.find((item) => item.id === id);

      const response = await fetch(`/api/targets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          completed: selectedTarget?.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal update target");
      }
    } catch (err) {
      console.error("Update target error:", err);
      setTargets(previousTargets);
      alert("Status target gagal diperbarui");
    }
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

  const handleDownloadCertificate = () => {
    if (!mergedData?.certificate?.fileUrl) {
      alert("File sertifikat belum tersedia");
      return;
    }

    window.open(mergedData.certificate.fileUrl, "_blank");
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