"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  RotateCcw,
  Star,
  Trophy,
  X,
  Zap,
} from "lucide-react";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params?.quizId;

  const [quizInfo, setQuizInfo] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [endDateTime, setEndDateTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState("00.00");
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [resultData, setResultData] = useState(null);
  const [certificateId, setCertificateId] = useState(null);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  const progress = useMemo(() => {
    if (!totalQuestions) return 0;
    return Math.round((currentQuestion / totalQuestions) * 100);
  }, [currentQuestion, totalQuestions]);

  const options = useMemo(() => {
    if (!question) return [];

    return [
      { key: "A", value: "a", text: question.option_a },
      { key: "B", value: "b", text: question.option_b },
      { key: "C", value: "c", text: question.option_c },
      { key: "D", value: "d", text: question.option_d },
    ].filter((option) => option.text);
  }, [question]);

  const isLastQuestion = currentQuestion === totalQuestions;

  useEffect(() => {
    if (quizId) startQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!endDateTime) return;

    const timer = setInterval(() => {
      const end = new Date(endDateTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, end - now);

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${String(minutes).padStart(2, "0")}.${String(seconds).padStart(
          2,
          "0"
        )}`
      );

      if (diff <= 0) {
        clearInterval(timer);
        handleSubmitQuiz();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDateTime, answers]);

  async function startQuiz() {
    try {
      setLoading(true);
      setError("");

      const quizzes = await fetchWithAuth("/api/v1/quiz/", {
        method: "GET",
        cache: "no-store",
      });

      const selectedQuiz = Array.isArray(quizzes)
        ? quizzes.find((item) => String(item.id) === String(quizId))
        : null;

      setQuizInfo(selectedQuiz || null);

      const startData = await fetchWithAuth(`/api/v1/quiz/${quizId}/start`, {
        method: "POST",
      });

      setAttemptId(startData?.attempt_id || null);
      setTotalQuestions(Number(startData?.total_questions || 0));
      setEndDateTime(startData?.end_date_time || null);
      setCurrentQuestion(startData?.first_question?.current_number || 1);
      setQuestion(startData?.first_question || null);

      const firstNumber = startData?.first_question?.current_number || 1;
      setSelectedAnswer(answers[firstNumber] || "");
    } catch (err) {
      console.error("Start quiz error:", err);
      setError(err?.message || "Quiz gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuestion(questionNumber) {
    try {
      setQuestionLoading(true);
      setError("");

      const data = await fetchWithAuth(
        `/api/v1/quiz/${quizId}/questions/${questionNumber}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      setQuestion(data);
      setCurrentQuestion(Number(data?.current_number || questionNumber));
      setSelectedAnswer(answers[questionNumber] || "");
    } catch (err) {
      console.error("Fetch question error:", err);
      setError(err?.message || "Soal gagal dimuat.");
    } finally {
      setQuestionLoading(false);
    }
  }

  function handleSelectAnswer(value) {
    setSelectedAnswer(value);

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: value,
    }));
  }

  function handleNextQuestion() {
    if (isLastQuestion) {
      setShowSubmitModal(true);
      return;
    }

    fetchQuestion(currentQuestion + 1);
  }

  function handlePreviousQuestion() {
    if (currentQuestion <= 1) return;
    fetchQuestion(currentQuestion - 1);
  }

  async function handleExitQuiz() {
    try {
      await fetchWithAuth(`/api/v1/quiz/${quizId}/exit`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Exit quiz error:", err);
    } finally {
      router.push("/quiz");
    }
  }

  async function handleSubmitQuiz() {
    if (submitting) return;

    try {
      setSubmitting(true);
      setShowSubmitModal(false);

      const formattedAnswers = Object.fromEntries(
        Object.entries(answers).map(([number, answer]) => [
          String(number),
          answer,
        ])
      );

      const result = await fetchWithAuth(`/api/v1/quiz/${quizId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers: formattedAnswers,
        }),
      });

      setResultData(result);
      setShowResultModal(true);
    } catch (err) {
      console.error("Submit quiz error:", err);
      alert(err?.message || "Gagal menyelesaikan quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateCertificate() {
    try {
      const result = await fetchWithAuth(
        `/api/v1/quiz/${quizId}/certificate`,
        {
          method: "POST",
        }
      );

      setCertificateId(result?.certificate_id || null);
      alert("Sertifikat berhasil dibuat.");
    } catch (err) {
      console.error("Generate certificate error:", err);
      alert(err?.message || "Gagal membuat sertifikat.");
    }
  }

  const displayData = {
    subject: quizInfo?.category || "Quiz",
    title: quizInfo?.title || "Quiz",
    currentQuestion,
    totalQuestions,
    duration: timeLeft,
    progress,
    question: question?.text || "",
    options,
    result: {
      score:
        totalQuestions > 0 && resultData
          ? Math.round(
              (Number(resultData.correct_answers || 0) /
                Number(resultData.total_questions || totalQuestions)) *
                100
            )
          : 0,
      correct: Number(resultData?.correct_answers || 0),
      total: Number(resultData?.total_questions || totalQuestions || 0),
      xp: Number(resultData?.points_gained || 0),
      status: resultData?.passed ? "Lulus" : "Belum Lulus",
    },
  };

  return (
    <main className="min-h-screen bg-[#fff3f5] text-[#252525]">
      <section className="flex min-h-screen w-full flex-col">
        <header className="bg-white px-5 py-8 sm:px-10 lg:px-[140px]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#ffccd3] px-3 py-1 text-xs font-semibold text-[#ff2539]">
                {loading ? "Memuat..." : displayData.subject}
              </span>

              <h1 className="text-base font-bold sm:text-lg">
                {loading ? "Memuat quiz..." : displayData.title}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="rounded-full p-1 text-[#555555] transition hover:bg-[#fff3f5] hover:text-[#ff2539]"
            >
              <X size={18} strokeWidth={2.3} />
            </button>
          </div>

          <div className="mt-6 flex items-center gap-8 text-xs font-semibold text-[#555555]">
            <p>
              Soal {displayData.currentQuestion} dari{" "}
              {displayData.totalQuestions}
            </p>

            <div className="flex items-center gap-2">
              <Clock size={15} />
              <span>{displayData.duration}</span>
            </div>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#fde7eb]">
            <div
              className="h-full rounded-full bg-[#ff2539] transition-all duration-500"
              style={{ width: `${displayData.progress}%` }}
            />
          </div>

          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
        </header>

        <section className="flex flex-1 justify-center px-5 py-20 sm:px-8">
          {loading || questionLoading ? (
            <div className="mt-28 h-10 w-10 animate-spin rounded-full border-4 border-[#ffd5dc] border-t-[#ff2539]" />
          ) : (
            <div className="w-full max-w-[840px] space-y-16">
              <div className="flex items-center gap-5 rounded-xl bg-white px-8 py-7 shadow-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ff2539] text-base font-bold text-white">
                  {displayData.currentQuestion}
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    Pertanyaan
                  </p>
                  <p className="text-sm font-bold text-black sm:text-lg">
                    {displayData.question}
                  </p>
                </div>
              </div>

              <div className="space-y-9">
                {displayData.options.map((option) => {
                  const isSelected = selectedAnswer === option.value;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleSelectAnswer(option.value)}
                      className="flex w-full items-center gap-7 rounded-xl bg-white px-8 py-6 text-left shadow-md transition hover:scale-[1.01] hover:shadow-lg"
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isSelected
                            ? "bg-[#ff2539] text-white"
                            : "bg-[#cfcfcf] text-black"
                        }`}
                      >
                        {option.key}
                      </span>

                      <span className="text-base font-medium text-black sm:text-lg">
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <footer className="flex h-[90px] items-center justify-between bg-white px-5 sm:px-10 lg:px-[160px]">
          <button
            type="button"
            disabled={displayData.currentQuestion === 1 || questionLoading}
            onClick={handlePreviousQuestion}
            className="hidden items-center gap-1 rounded-xl bg-[#d9d9d9] px-5 py-3 text-sm font-bold text-[#777777] transition hover:bg-[#cfcfcf] disabled:cursor-not-allowed disabled:opacity-0 sm:flex"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            Sebelumnya
          </button>

          <div className="mx-auto flex items-center gap-3 sm:mx-0">
            {Array.from({ length: displayData.totalQuestions }).map(
              (_, index) => {
                const isActive = index + 1 === displayData.currentQuestion;

                return (
                  <span
                    key={index}
                    className={`h-2.5 w-2.5 rounded-full ${
                      isActive ? "bg-[#ff2539]" : "bg-[#d8d8d8]"
                    }`}
                  />
                );
              }
            )}
          </div>

          <button
            type="button"
            disabled={questionLoading || submitting}
            onClick={handleNextQuestion}
            className="flex items-center gap-1 rounded-xl bg-[#ff2539] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e91f32] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLastQuestion ? "Selesai" : "Selanjutnya"}
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </footer>
      </section>

      {showExitModal && (
        <ConfirmModal
          title="Anda yakin ingin keluar dari quiz?"
          desc="Hasil pengerjaan tidak akan tersimpan jika anda keluar dari quiz"
          onCancel={() => setShowExitModal(false)}
          onConfirm={handleExitQuiz}
        />
      )}

      {showSubmitModal && (
        <ConfirmModal
          title="Anda yakin ingin menyelesaikan quiz?"
          desc="Cek kembali jawaban anda sebelum menyelesaikan quiz"
          onCancel={() => setShowSubmitModal(false)}
          onConfirm={handleSubmitQuiz}
        />
      )}

      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
          <div className="relative w-full max-w-[430px] overflow-hidden rounded-md bg-white shadow-xl">
            <button
              onClick={() => setShowResultModal(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/30 p-1 text-white"
            >
              <X size={18} />
            </button>

            <div className="bg-gradient-to-br from-[#ff1f35] to-[#990b17] px-8 pb-7 pt-5 text-center text-white">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/25">
                <Trophy size={30} />
              </div>

              <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded border border-white px-3 py-1 text-xs font-semibold">
                <Award size={13} />
                {displayData.result.status}
              </div>

              <h2 className="mt-5 text-3xl font-bold">
                {displayData.result.score}
              </h2>
              <p className="mt-1 text-lg">
                {displayData.result.correct} / {displayData.result.total} Soal
                benar
              </p>
            </div>

            <div className="px-8 py-6 text-center">
              <h3 className="text-lg font-bold text-black">
                {displayData.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Selamat! Kamu telah menyelesaikan quiz ini dengan baik.
                <br />
                Pertahankan prestasimu!
              </p>

              <div className="mt-8 flex items-center justify-between rounded-lg border border-[#ff2539] bg-[#ffd1d6] px-4 py-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-[#ff2539] text-white">
                    <Zap size={22} fill="white" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold">XP Diperoleh</p>
                    <p className="text-xs font-bold text-black">
                      +{displayData.result.xp} XP
                    </p>
                  </div>
                </div>

                <Star
                  size={20}
                  className="text-yellow-500"
                  fill="currentColor"
                />
              </div>

              <div className="mt-8 space-y-3 border-t border-gray-200 pt-8">
                <button
                  onClick={() => router.push("/quiz")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff2539] px-5 py-3 text-sm font-bold text-white"
                >
                  Lanjut ke Quiz Lain
                  <ChevronRight size={18} />
                </button>

                <button
                  onClick={handleGenerateCertificate}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#08ad72] px-5 py-3 text-sm font-bold text-white"
                >
                  <Download size={17} />
                  {certificateId ? "Sertifikat Dibuat" : "Download Sertifikat"}
                </button>

                <button
                  onClick={startQuiz}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#ff2539] bg-white px-5 py-3 text-sm font-bold text-black"
                >
                  <RotateCcw size={17} />
                  Ulangi Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ConfirmModal({ title, desc, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-[#ff2539] bg-white px-8 py-16 text-center shadow-xl">
        <h2 className="text-xl font-bold text-black sm:text-2xl">{title}</h2>
        <p className="mt-2 text-sm font-medium text-black">{desc}</p>

        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            onClick={onCancel}
            className="w-28 rounded-md border border-[#ff2539] py-2 text-sm font-semibold text-black"
          >
            Tidak
          </button>

          <button
            onClick={onConfirm}
            className="w-28 rounded-md bg-[#ff2539] py-2 text-sm font-semibold text-white"
          >
            Ya
          </button>
        </div>
      </div>
    </div>
  );
}