"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import {
  Save,
  Plus,
  Star,
  Trash2,
  Check,
  ChevronLeft,
  AlertTriangle,
  RefreshCw,
  X,
  Loader2,
  ChevronDown,
  Info,
} from "lucide-react";

const EMPTY_QUESTION = () => ({
  id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  text: "",
  choices: ["", "", "", ""],
  correctIndex: 0,
  points: 10,
});

const EMPTY_QUIZ = () => ({
  title: "",
  category: "",
  duration_minutes: 30,
  minimum_score: 1,
  difficulty: "easy",
  questions: [EMPTY_QUESTION()],
});

const CHOICE_LETTERS = ["A", "B", "C", "D"];
const CORRECT_OPTIONS = ["a", "b", "c", "d"];

function normalizeQuizFromBackend(json) {
  const backendQuestions = Array.isArray(json.questions) ? json.questions : [];
  const questions = backendQuestions.length
    ? backendQuestions.map((q, idx) => ({
        id: `q-${q.id ?? idx}`,
        text: q.text || "",
        choices: [
          q.option_a || "",
          q.option_b || "",
          q.option_c || "",
          q.option_d || "",
        ],
        correctIndex: CORRECT_OPTIONS.indexOf(
          (q.correct_option || "a").toLowerCase()
        ),
        points: Math.floor((json.xp_reward || 0) / backendQuestions.length) || 0,
      }))
    : [EMPTY_QUESTION()];

  return {
    title: json.title || "",
    category: json.category || "",
    duration_minutes: json.duration_minutes || 30,
    minimum_score: json.minimum_score || 1,
    difficulty: json.difficulty || "easy",
    questions,
  };
}

function serializeQuizToBackend(quiz) {
  const xp_reward = quiz.questions.reduce(
    (sum, q) => sum + (Number(q.points) || 0),
    0
  );

  return {
    title: quiz.title.trim(),
    category: quiz.category.trim(),
    duration_minutes: Number(quiz.duration_minutes) || 0,
    minimum_score: Number(quiz.minimum_score) || 0,
    xp_reward,
    difficulty: quiz.difficulty,
    questions: quiz.questions.map((q, idx) => ({
      text: q.text.trim(),
      option_a: q.choices[0].trim(),
      option_b: q.choices[1].trim(),
      option_c: q.choices[2].trim(),
      option_d: q.choices[3].trim(),
      correct_option: CORRECT_OPTIONS[q.correctIndex] || "a",
      order_index: idx,
    })),
  };
}

export default function QuizEditorPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params?.quizadminId;
  const isNew = quizId === "new";
  const isViewOnly = !isNew;

  const [quiz, setQuiz] = useState(EMPTY_QUIZ());
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [validationError, setValidationError] = useState("");

  const fetchQuiz = useCallback(async () => {
    if (isNew) return;
    try {
      setLoading(true);
      setError(false);
      const data = await fetchWithAuth(`/api/v1/quiz/${quizId}`);
      setQuiz(normalizeQuizFromBackend(data));
    } catch (err) {
      setError(true);
      setQuiz(EMPTY_QUIZ());
    } finally {
      setLoading(false);
    }
  }, [quizId, isNew]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const totalPoints = useMemo(
    () => quiz.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0),
    [quiz.questions]
  );

  const activeQuestion = quiz.questions[activeIdx] || quiz.questions[0];

  const updateQuizField = (field, value) => {
    if (isViewOnly) return;
    setQuiz((prev) => ({ ...prev, [field]: value }));
  };

  const updateActiveQuestion = (patch) => {
    if (isViewOnly) return;
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === activeIdx ? { ...q, ...patch } : q
      ),
    }));
  };

  const updateChoice = (choiceIdx, value) => {
    if (isViewOnly) return;
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== activeIdx) return q;
        const nextChoices = [...q.choices];
        nextChoices[choiceIdx] = value;
        return { ...q, choices: nextChoices };
      }),
    }));
  };

  const addQuestion = () => {
    if (isViewOnly) return;
    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, EMPTY_QUESTION()],
    }));
    setActiveIdx(quiz.questions.length);
  };

  const removeQuestion = (idx) => {
    if (isViewOnly) return;
    if (quiz.questions.length <= 1) {
      alert("Quiz harus memiliki minimal satu soal.");
      return;
    }
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
    setActiveIdx((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
  };

  const validate = () => {
    if (!quiz.title.trim()) return "Judul quiz belum diisi.";
    if (!quiz.category.trim()) return "Kategori belum diisi.";
    if (!quiz.duration_minutes || quiz.duration_minutes <= 0)
      return "Durasi harus lebih dari nol menit.";
    if (!quiz.minimum_score || quiz.minimum_score <= 0)
      return "Minimum skor harus lebih dari nol.";
    if (quiz.minimum_score > quiz.questions.length)
      return `Minimum skor (${quiz.minimum_score}) tidak boleh melebihi jumlah soal (${quiz.questions.length}).`;
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (!q.text.trim()) return `Pertanyaan pada Soal ${i + 1} belum diisi.`;
      if (q.choices.some((c) => !c.trim()))
        return `Pilihan jawaban pada Soal ${i + 1} belum lengkap.`;
    }
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
      const payload = serializeQuizToBackend(quiz);
      await fetchWithAuth("/api/v1/quiz/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push("/admin/quiz-admin");
    } catch (err) {
      setValidationError(
        err?.message || "Gagal menyimpan quiz. Periksa koneksi lalu coba lagi."
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleCancel = () => {
    if (isViewOnly) {
      router.push("/admin/quiz-admin");
      return;
    }
    const isPristine =
      !quiz.title.trim() &&
      !quiz.category.trim() &&
      quiz.questions.every(
        (q) => !q.text.trim() && q.choices.every((c) => !c.trim())
      );
    if (isPristine) {
      router.push("/admin/quiz-admin");
    } else {
      setShowCancelModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat data quiz...</span>
        </div>
      </div>
    );
  }

  const headerTitle = isNew ? "Buat Quiz Baru" : "Detail Quiz";

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Data quiz gagal dimuat.
          </div>
          <button
            onClick={fetchQuiz}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}

      {isViewOnly && !error && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Mode Lihat Saja. Quiz yang sudah dipublikasikan belum dapat diedit.
          </span>
        </div>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {headerTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {quiz.questions.length} soal · {totalPoints} total poin
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={publishing}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isViewOnly ? "Kembali" : "Batal"}
          </button>
          {!isViewOnly && (
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
              {publishing ? "Menyimpan..." : "Publikasikan Quiz"}
            </button>
          )}
        </div>
      </header>

      {validationError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <button
        onClick={() => setShowSidebar((s) => !s)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 lg:hidden"
      >
        <ChevronLeft
          className={`h-4 w-4 transition-transform ${
            showSidebar ? "rotate-90" : "-rotate-90"
          }`}
        />
        {showSidebar ? "Sembunyikan Info Quiz" : "Tampilkan Info Quiz"}
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside
          className={`space-y-6 ${showSidebar ? "block" : "hidden"} lg:block`}
        >
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
              Info Quiz
            </p>
            <div className="space-y-3">
              <Field label="Judul Quiz">
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => updateQuizField("title", e.target.value)}
                  disabled={isViewOnly}
                  placeholder="Contoh: Algoritma Dasar"
                  className={inputClass(isViewOnly)}
                />
              </Field>
              <Field label="Kategori">
                <input
                  type="text"
                  value={quiz.category}
                  onChange={(e) => updateQuizField("category", e.target.value)}
                  disabled={isViewOnly}
                  placeholder="Contoh: Pemrograman"
                  className={inputClass(isViewOnly)}
                />
              </Field>
              <Field label="Durasi (menit)">
                <input
                  type="number"
                  min={1}
                  value={quiz.duration_minutes}
                  onChange={(e) =>
                    updateQuizField("duration_minutes", Number(e.target.value))
                  }
                  disabled={isViewOnly}
                  className={inputClass(isViewOnly)}
                />
              </Field>
              <Field label="Minimum Skor">
                <input
                  type="number"
                  min={1}
                  value={quiz.minimum_score}
                  onChange={(e) =>
                    updateQuizField("minimum_score", Number(e.target.value))
                  }
                  disabled={isViewOnly}
                  className={inputClass(isViewOnly)}
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  Minimal jawaban benar untuk lulus.
                </p>
              </Field>
              <Field label="Tingkat Kesulitan">
                <div className="relative">
                  <select
                    value={quiz.difficulty}
                    onChange={(e) =>
                      updateQuizField("difficulty", e.target.value)
                    }
                    disabled={isViewOnly}
                    className={`w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-9 text-sm text-gray-900 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 ${
                      isViewOnly ? "cursor-not-allowed bg-gray-50" : ""
                    }`}
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

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
              Daftar Soal
            </p>
            <ul className="space-y-2">
              {quiz.questions.map((q, idx) => (
                <li key={q.id}>
                  <button
                    onClick={() => {
                      setActiveIdx(idx);
                      setShowSidebar(false);
                    }}
                    className={`w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                      idx === activeIdx
                        ? "bg-red-600 text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Soal {idx + 1}
                  </button>
                </li>
              ))}
            </ul>
            {!isViewOnly && (
              <button
                onClick={addQuestion}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:border-red-300 hover:bg-red-50/50 hover:text-red-600"
              >
                <Plus className="h-4 w-4" />
                Tambah Soal
              </button>
            )}
          </div>
        </aside>

        <main className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
                {activeIdx + 1}
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Soal {activeIdx + 1}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5">
                <Star className="h-4 w-4 text-yellow-500" />
                <label className="text-xs text-gray-600">Poin:</label>
                <input
                  type="number"
                  min={0}
                  value={activeQuestion.points}
                  onChange={(e) =>
                    updateActiveQuestion({ points: Number(e.target.value) })
                  }
                  disabled={isViewOnly}
                  className={`w-14 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm font-semibold text-gray-900 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 ${
                    isViewOnly ? "cursor-not-allowed bg-gray-50" : ""
                  }`}
                />
              </div>
              {!isViewOnly && (
                <button
                  onClick={() => removeQuestion(activeIdx)}
                  className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"
                  aria-label="Hapus soal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Pertanyaan
            </label>
            <textarea
              value={activeQuestion.text}
              onChange={(e) => updateActiveQuestion({ text: e.target.value })}
              disabled={isViewOnly}
              placeholder="Tulis pertanyaan di sini..."
              rows={3}
              className={`w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 ${
                isViewOnly ? "cursor-not-allowed bg-gray-50" : ""
              }`}
            />
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-semibold text-gray-800">
                Pilihan Jawaban
              </label>
              {!isViewOnly && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                  Klik lingkaran untuk tandai jawaban benar
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {activeQuestion.choices.map((choice, cIdx) => {
                const isCorrect = activeQuestion.correctIndex === cIdx;
                return (
                  <div
                    key={cIdx}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                      isCorrect
                        ? "border-green-400 bg-green-50/50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <button
                      onClick={() =>
                        updateActiveQuestion({ correctIndex: cIdx })
                      }
                      disabled={isViewOnly}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        isCorrect
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      } ${isViewOnly ? "cursor-default" : ""}`}
                      aria-label={
                        isCorrect
                          ? `Pilihan ${CHOICE_LETTERS[cIdx]} adalah jawaban benar`
                          : `Tandai pilihan ${CHOICE_LETTERS[cIdx]} sebagai benar`
                      }
                    >
                      {isCorrect ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        CHOICE_LETTERS[cIdx]
                      )}
                    </button>
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => updateChoice(cIdx, e.target.value)}
                      disabled={isViewOnly}
                      placeholder={`Pilihan ${CHOICE_LETTERS[cIdx]}`}
                      className={`flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none ${
                        isViewOnly ? "cursor-not-allowed" : ""
                      }`}
                    />
                    {isCorrect && (
                      <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Benar
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {showCancelModal && (
        <ConfirmCancelModal
          onKeep={() => setShowCancelModal(false)}
          onDiscard={() => router.push("/admin/quiz-admin")}
        />
      )}
    </div>
  );
}

function inputClass(isViewOnly) {
  return `w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 ${
    isViewOnly ? "cursor-not-allowed bg-gray-50" : ""
  }`;
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      {children}
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
          Batalkan pembuatan quiz?
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