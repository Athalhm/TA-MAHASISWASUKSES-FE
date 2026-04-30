"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import {
  RefreshCw,
  Flame,
  Star,
  Play,
  Clock,
  Download,
  Check,
  Loader2,
} from "lucide-react";

export default function QuizPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("quiz");
  const [quizData, setQuizData] = useState(null);
  const [recommendedQuiz, setRecommendedQuiz] = useState(null);
  const [allQuiz, setAllQuiz] = useState([]);
  const [dailyQuests, setDailyQuests] = useState([]);
  const [weeklyQuests, setWeeklyQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificateQuiz, setSelectedCertificateQuiz] = useState(null);

  const fallbackData = {
    title: "Quiz & Latihan",
    description: "Kerjakan quiz dapatkan sertifikat dan XP",
    completedQuiz: 0,
    totalQuiz: 0,
  };

  const tabs = [
    { id: "quiz", label: "Quiz" },
    { id: "daily", label: "Quest Harian" },
    { id: "weekly", label: "Quest Mingguan" },
  ];

  const normalizeDifficulty = (difficulty) => {
    if (!difficulty) return "easy";

    const value = String(difficulty).toLowerCase();

    if (value === "hard") return "Hard";
    if (value === "medium") return "Medium";
    return "easy";
  };

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      setError(false);

      const [quizResult, questResult] = await Promise.allSettled([
        fetchWithAuth("/api/v1/quiz/", {
          method: "GET",
          cache: "no-store",
        }),
        fetchWithAuth("/api/v1/gamification/quests", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      if (quizResult.status !== "fulfilled") {
        throw new Error("Gagal memuat data quiz");
      }

      const quizList = Array.isArray(quizResult.value) ? quizResult.value : [];

      const normalizedQuiz = quizList.map((quiz) => ({
        id: quiz?.id,
        category: quiz?.category || "Umum",
        title: quiz?.title || "Quiz Tanpa Judul",
        status: quiz?.last_attempt_successfull ? "Selesai" : "Belum Mulai",
        statusColor: quiz?.last_attempt_successfull ? "green" : "orange",
        description: "Selesaikan Quiz untuk membuka sertifikat",
        duration: `${quiz?.duration_minutes || 0} Menit`,
        xp: `${quiz?.xp_reward || 0} XP`,
        level: normalizeDifficulty(quiz?.difficulty),
        completed: Boolean(quiz?.last_attempt_successfull),
        certificateId: quiz?.certificate_id || null,
        completionCount: quiz?.completion_count || 0,
      }));

      const completedQuiz = normalizedQuiz.filter((quiz) => quiz.completed).length;

      setAllQuiz(normalizedQuiz);
      setRecommendedQuiz(
        normalizedQuiz.find((quiz) => !quiz.completed) ||
          normalizedQuiz[0] ||
          null
      );

      setQuizData({
        title: fallbackData.title,
        description: fallbackData.description,
        completedQuiz,
        totalQuiz: normalizedQuiz.length,
      });

      const quests =
        questResult.status === "fulfilled" && Array.isArray(questResult.value)
          ? questResult.value
          : [];

      const normalizedQuests = quests.map((quest, index) => ({
        id: `${quest?.title || "quest"}-${index}`,
        title: quest?.title || "Quest Tanpa Judul",
        description: quest?.description || "-",
        reward: `+${quest?.xp_reward || 0} XP`,
        difficulty: normalizeDifficulty(quest?.difficulty),
        progress: Number(quest?.progress_percentage || 0),
        progressText: `${quest?.progress_percentage || 0}%`,
        completed: Boolean(quest?.is_completed),
        frequency: quest?.frequency || "harian",
      }));

      setDailyQuests(
        normalizedQuests.filter(
          (quest) => String(quest.frequency).toLowerCase() === "harian"
        )
      );

      setWeeklyQuests(
        normalizedQuests.filter(
          (quest) => String(quest.frequency).toLowerCase() === "mingguan"
        )
      );
    } catch (err) {
      console.error(err);
      setError(true);
      setQuizData(fallbackData);
      setRecommendedQuiz(null);
      setAllQuiz([]);
      setDailyQuests([]);
      setWeeklyQuests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
  }, []);

  const handleStartQuiz = (quizId) => {
    if (!quizId && quizId !== 0) {
      alert("Quiz tidak valid.");
      return;
    }

    router.push(`/quiz/${quizId}`);
  };

  const handleDownloadCertificate = (quiz) => {
    setSelectedCertificateQuiz(quiz);
    setShowCertificateModal(true);
  };

  const data = quizData || fallbackData;

  const progress =
    data.totalQuiz > 0
      ? Math.min((data.completedQuiz / data.totalQuiz) * 100, 100)
      : 0;

  const renderTabs = () => (
    <div className="mt-8 flex flex-wrap items-center gap-5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-w-[116px] rounded-md px-6 py-2 text-[14px] font-medium shadow-[0_3px_5px_rgba(0,0,0,0.25)] transition ${
              isActive
                ? "bg-red-500 text-white"
                : "bg-white text-red-500 hover:bg-red-50"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const renderQuestHeader = (type) => {
    const isDaily = type === "daily";
    const quests = isDaily ? dailyQuests : weeklyQuests;
    const completedCount = quests.filter((quest) => quest.completed).length;

    return (
      <div className="rounded-[18px] bg-gradient-to-r from-red-500 to-red-900 px-8 py-8 text-white sm:px-10">
        <h2 className="text-[17px] font-bold">
          {isDaily ? "Quest Hari Ini" : "Quest Minggu Ini"}
        </h2>

        <p className="mt-2 text-[14px] font-medium">
          Selesaikan quest untuk mendapatkan XP dan reward!
        </p>

        <div className="mt-5 flex items-center gap-20">
          <div>
            <p className="text-[14px] font-semibold">Total Quest</p>
            <p className="mt-3 text-[12px] font-bold">{quests.length}</p>
          </div>

          <div>
            <p className="text-[14px] font-semibold">Selesai</p>
            <p className="mt-3 text-[12px] font-bold">{completedCount}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestCards = (quests) => {
    if (loading) {
      return (
        <div className="mt-10 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow">
          <Loader2 className="h-5 w-5 animate-spin" />
          Memuat quest...
        </div>
      );
    }

    if (quests.length === 0) {
      return (
        <div className="mt-10 rounded-xl border border-gray-200 bg-white px-5 py-5 text-sm text-gray-500 shadow">
          Belum ada quest tersedia.
        </div>
      );
    }

    return (
      <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className="rounded-[13px] border border-red-400 bg-white px-5 py-4 shadow-[0_3px_5px_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-start gap-5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                  quest.completed
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-red-400 bg-white text-white"
                }`}
              >
                {quest.completed && <Check size={17} />}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[13px] font-bold text-black">
                    {quest.title}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-[15px] font-medium ${
                      quest.difficulty === "easy"
                        ? "bg-green-100 text-green-500"
                        : quest.difficulty === "Hard"
                        ? "bg-red-100 text-red-500"
                        : "bg-orange-100 text-orange-500"
                    }`}
                  >
                    {quest.difficulty}
                  </span>
                </div>

                <p className="mt-2 text-[14px] font-medium text-gray-500">
                  {quest.description}
                </p>

                {quest.progress > 0 && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-300">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${quest.progress}%` }}
                      />
                    </div>

                    <span className="text-[14px] font-medium text-blue-500">
                      {quest.progressText}
                    </span>
                  </div>
                )}

                <p className="mt-3 text-[13px] font-medium text-yellow-500">
                  ✨ {quest.reward}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-white px-4 pt-6 pb-10 sm:px-8 lg:px-10">
      <section className="mx-auto w-full max-w-[1200px]">
        {activeTab === "quiz" && (
          <>
            {error && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <span>
                  Data quiz gagal dimuat. Menampilkan data fallback sementara.
                </span>

                <button
                  onClick={fetchQuizData}
                  className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700"
                >
                  <RefreshCw size={14} />
                  Coba lagi
                </button>
              </div>
            )}

            <div className="rounded-[18px] border border-gray-300 bg-white px-8 py-7 shadow-[0_3px_4px_rgba(0,0,0,0.25)] sm:px-10">
              {loading ? (
                <div className="animate-pulse">
                  <div className="mb-3 h-5 w-40 rounded bg-gray-200" />
                  <div className="mb-4 h-3 w-64 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded-full bg-gray-200" />
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-[15px] font-bold text-black sm:text-base">
                        {data.title}
                      </h1>
                      <p className="mt-2 text-[13px] font-medium text-gray-500 sm:text-xs">
                        {data.description}
                      </p>
                    </div>

                    <p className="mt-9 whitespace-nowrap text-[13px] font-bold text-black sm:text-xs">
                      {data.completedQuiz} / {data.totalQuiz} Quiz Selesai
                    </p>
                  </div>

                  <div className="h-[13px] w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            {renderTabs()}

            <div className="mt-10">
              <div className="mb-5 flex items-center gap-2">
                <Flame size={18} className="fill-red-500 text-red-500" />
                <h2 className="text-[15px] font-bold text-black">
                  Rekomendasi Untuk Kamu
                </h2>
              </div>

              {loading ? (
                <div className="rounded-[16px] bg-gradient-to-r from-red-500 to-red-900 px-10 py-7 text-white">
                  <div className="h-4 w-40 animate-pulse rounded bg-white/30" />
                  <div className="mt-3 h-5 w-64 animate-pulse rounded bg-white/30" />
                  <div className="mt-5 h-10 w-full animate-pulse rounded bg-white/30" />
                </div>
              ) : recommendedQuiz ? (
                <div className="rounded-[16px] bg-gradient-to-r from-red-500 to-red-900 px-10 py-7 text-white">
                  <p className="text-[13px] font-medium">
                    {recommendedQuiz.category}
                  </p>

                  <h3 className="mt-1 text-[15px] font-bold">
                    {recommendedQuiz.title}
                  </h3>

                  <div className="mt-5 flex flex-wrap items-center gap-7 text-[12px] font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-white" />
                      {recommendedQuiz.duration}
                    </span>

                    <span className="flex items-center gap-1">
                      <Star size={11} className="fill-white text-white" />
                      {recommendedQuiz.xp}
                    </span>

                    <span className="rounded-full bg-white/25 px-4 py-1">
                      {recommendedQuiz.level}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartQuiz(recommendedQuiz.id)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-white py-3 text-[13px] font-bold text-red-500"
                  >
                    Mulai Quiz
                    <Play size={15} className="fill-red-500 text-red-500" />
                  </button>
                </div>
              ) : (
                <div className="rounded-[16px] border border-gray-200 bg-white px-10 py-7 text-sm text-gray-500 shadow">
                  Belum ada rekomendasi quiz tersedia.
                </div>
              )}
            </div>

            <div className="mt-10">
              <h2 className="mb-6 text-[15px] font-bold text-black">
                Semua Quiz
              </h2>

              {loading ? (
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="rounded-[8px] border border-gray-300 bg-white px-6 py-5 shadow-[0_3px_5px_rgba(0,0,0,0.25)]"
                    >
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      <div className="mt-4 h-6 w-44 animate-pulse rounded bg-gray-200" />
                      <div className="mt-3 h-3 w-full animate-pulse rounded bg-gray-200" />
                      <div className="mt-5 h-9 w-full animate-pulse rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : allQuiz.length > 0 ? (
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                  {allQuiz.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="rounded-[8px] border border-gray-300 bg-white px-6 py-5 shadow-[0_3px_5px_rgba(0,0,0,0.25)]"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[13px] font-medium text-gray-400">
                          {quiz.category}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
                            quiz.statusColor === "green"
                              ? "bg-green-100 text-green-600"
                              : "bg-orange-100 text-orange-500"
                          }`}
                        >
                          ● {quiz.status}
                        </span>
                      </div>

                      <h3 className="text-[16px] font-bold text-black">
                        {quiz.title}
                      </h3>

                      <p className="mt-2 text-[12px] font-medium text-gray-400">
                        {quiz.description}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-5 text-[9px] font-medium text-black">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {quiz.duration}
                        </span>

                        <span className="flex items-center gap-1">
                          <Star
                            size={12}
                            className="fill-yellow-400 text-yellow-400"
                          />
                          {quiz.xp}
                        </span>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-red-500">
                          {quiz.level}
                        </span>
                      </div>

                      <div className="mt-5 h-px w-full bg-gray-200" />

                      <button
                        type="button"
                        onClick={() =>
                          quiz.completed
                            ? handleDownloadCertificate(quiz)
                            : handleStartQuiz(quiz.id)
                        }
                        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-[13px] font-bold text-white ${
                          quiz.completed ? "bg-green-600" : "bg-red-500"
                        }`}
                      >
                        {quiz.completed ? (
                          <>
                            <Download size={12} />
                            Download Sertifikat
                          </>
                        ) : (
                          "Mulai Quiz"
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[16px] border border-gray-200 bg-white px-10 py-7 text-sm text-gray-500 shadow">
                  Belum ada data quiz tersedia.
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "daily" && (
          <>
            {renderQuestHeader("daily")}
            {renderTabs()}
            {renderQuestCards(dailyQuests)}
          </>
        )}

        {activeTab === "weekly" && (
          <>
            {renderQuestHeader("weekly")}
            {renderTabs()}
            {renderQuestCards(weeklyQuests)}
          </>
        )}
      </section>

      {showCertificateModal && selectedCertificateQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[460px] rounded-md bg-white px-8 py-7 text-center shadow-xl">
            <h2 className="text-[26px] font-bold text-black">
              Klaim Sertifikat Anda!
            </h2>

            <p className="mt-4 text-[13px] font-semibold text-black">
              Hampir Selesai! Validasi pencapaian Anda dalam:
            </p>

            <div className="mt-5 rounded-lg bg-gray-200 px-4 py-3">
              <p className="text-[13px] font-bold italic text-black">
                kuis: {selectedCertificateQuiz.category} -{" "}
                {selectedCertificateQuiz.title}
              </p>
            </div>

            <p className="mt-5 text-[13px] font-medium leading-relaxed text-black">
              Sertifikat Kompetensi Anda siap diunduh! Silahkan selesaikan
              pembayaran biaya administrasi untuk mengaktifkan tautan unduhan.
            </p>

            <div className="mt-5 rounded-lg bg-gray-200 px-4 py-4">
              <p className="text-[14px] font-semibold text-black">
                Total Biaya:
              </p>
              <p className="mt-1 text-[26px] font-medium text-black">
                Rp 45.000
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCertificateModal(false);
                router.push(
                  `/payment/certificate?quizId=${selectedCertificateQuiz.id}`
                );
              }}
              className="mt-6 w-full rounded-md bg-red-500 py-3 text-[13px] font-bold text-white transition hover:bg-red-600"
            >
              Lanjut ke Pembayaran
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCertificateModal(false);
                setSelectedCertificateQuiz(null);
              }}
              className="mt-3 w-full rounded-md border border-red-500 bg-white py-3 text-[13px] font-bold text-red-500 transition hover:bg-red-50"
            >
              Kembali
            </button>
          </div>
        </div>
      )}
    </main>
  );
}