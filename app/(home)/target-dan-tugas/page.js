"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import {
  Plus,
  Search,
  Clock3,
  Tag,
  Check,
  BookOpen,
  User,
  Briefcase,
  ChevronDown,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function Page() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({
    completed: 0,
    total: 0,
    progress: 0,
    highPriority: 0,
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "Akademik",
    deadline: "",
    difficulty: "medium",
    description: "",
  });

  const getBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const getAuthHeaders = () => {
    if (typeof window === "undefined") {
      return {
        "Content-Type": "application/json",
      };
    }

    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const baseUrl = getBaseUrl();

      const [tasksRes, summaryRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/progress-tracking/tasks`, {
          method: "GET",
          headers: getAuthHeaders(),
        }),
        fetch(`${baseUrl}/api/v1/progress-tracking/summary`, {
          method: "GET",
          headers: getAuthHeaders(),
        }),
      ]);

      if (!tasksRes.ok || !summaryRes.ok) {
        throw new Error("Gagal mengambil data target dan tugas.");
      }

      const tasksData = await tasksRes.json();
      const summaryData = await summaryRes.json();

      const normalizedTasks = Array.isArray(tasksData)
        ? tasksData.map((task) => ({
            ...task,
            status: task.is_completed
              ? "done"
              : "todo",
            priority:
              task.priority === "tinggi"
                ? "high"
                : task.priority === "rendah"
                ? "low"
                : "medium",
          }))
        : [];

      setTasks(normalizedTasks);
      setSummary({
        completed: summaryData.task_completed || 0,
        total: summaryData.todo || 0,
        progress: summaryData.on_progress || 0,
        highPriority: summaryData.high_priority || 0,
      });

    } catch (error) {
      console.error(error);
      setErrorMessage(error?.message || "Data target dan tugas gagal dimuat.");

      setTasks([]);
      setSummary({
        completed: 0,
        total: 0,
        progress: 0,
        highPriority: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    document.body.style.overflow = showAddModal ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showAddModal]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpenModal = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;

    setShowAddModal(false);
    setFormData({
      title: "",
      category: "Akademik",
      deadline: "",
      difficulty: "medium",
      description: "",
    });
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Judul tugas wajib diisi.");
      return;
    }

    if (!formData.deadline) {
      alert("Deadline tugas wajib diisi.");
      return;
    }

    const payload = {
      title: formData.title,
      category: formData.category,
      deadline: formData.deadline,
      difficulty: formData.difficulty,
      description: formData.description,
      status: "todo",
    };

    try {
      setSubmitting(true);
      setErrorMessage("");

      const baseUrl = getBaseUrl();

      const response = await fetch(`${baseUrl}/api/targets-tugas`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Gagal menambahkan tugas.");
      }

      await fetchTasks();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      setErrorMessage(error?.message || "Gagal menambahkan tugas.");
    } finally {
      setSubmitting(false);
    }
  };

  const statsCards = [
    {
      title: "Tugas Selesai",
      value: summary.completed,
    },
    {
      title: "Todo",
      value: summary.total,
    },
    {
      title: "On Progress",
      value: summary.progress,
    },
    {
      title: "High Priority",
      value: summary.highPriority,
    },
  ];

  const filterTabs = [
    { label: "All", value: "all" },
    { label: "Todo", value: "todo" },
    { label: "On Progress", value: "progress" },
    { label: "Done", value: "done" },
  ];

  const filteredTasks = tasks.filter((task) => {
    const title = task?.title?.toLowerCase() || "";
    const description = task?.description?.toLowerCase() || "";
    const category = task?.category?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      !query ||
      title.includes(query) ||
      description.includes(query) ||
      category.includes(query);

    const status = task?.status?.toLowerCase() || "";

    let matchesFilter = true;

    if (activeFilter === "todo") {
      matchesFilter = status === "todo" || status === "draft";
    } else if (activeFilter === "progress") {
      matchesFilter =
        status === "progress" ||
        status === "proses" ||
        status === "on progress";
    } else if (activeFilter === "done") {
      matchesFilter = status === "done" || status === "selesai";
    }

    return matchesSearch && matchesFilter;
  });

  const getPriorityBadge = (priority) => {
    const normalized = priority?.toLowerCase();

    if (normalized === "high") {
      return "border-[#ff6d6d] bg-[#ffd6d6] text-[#ff3d3d]";
    }

    if (normalized === "medium") {
      return "border-[#efaa4d] bg-[#ffd6a2] text-[#d9861e]";
    }

    if (normalized === "low") {
      return "border-[#64dc84] bg-[#caf8d7] text-[#21a44a]";
    }

    return "border-slate-200 bg-slate-100 text-slate-600";
  };

  const renderTaskList = () => {
    if (loading) {
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[18px] border border-[#d8d8d8] bg-[#f8f8f8] shadow-[0_4px_8px_rgba(0,0,0,0.08)]">
          <Loader2 className="h-8 w-8 animate-spin text-[#757575]" />
          <p className="mt-4 text-sm font-medium text-[#444]">
            Memuat data target dan tugas...
          </p>
        </div>
      );
    }

    if (filteredTasks.length === 0) {
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[18px] border border-[#d8d8d8] bg-[#f8f8f8] px-6 text-center shadow-[0_4px_8px_rgba(0,0,0,0.08)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dcdcdc] bg-white">
            <AlertCircle className="h-5 w-5 text-[#7a7a7a]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[#222]">
            Belum ada data yang sesuai
          </h3>
          <p className="mt-2 max-w-md text-sm text-[#777]">
            Coba ubah filter atau kata kunci pencarian, atau tambahkan tugas
            baru.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#ff1d25] px-5 text-sm font-medium text-white shadow-[0_4px_8px_rgba(255,29,37,0.25)] transition hover:bg-[#eb1820]"
          >
            <Plus className="h-4 w-4" />
            Tambah Tugas
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredTasks.map((task, index) => {
          const status = task?.status?.toLowerCase() || "";
          const isCompleted =
            task?.isCompleted || status === "done" || status === "selesai";

          return (
            <article
              key={task.id || index}
              className="rounded-[18px] border border-[#d3d3d3] bg-[#f7f7f7] px-4 py-4 shadow-[0_4px_8px_rgba(0,0,0,0.08)] sm:px-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="pt-1">
                    {isCompleted ? (
                      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#08b45c]">
                        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <span className="block h-[18px] w-[18px] rounded-full border border-[#d5d5d5] bg-[#efefef]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold leading-none text-[#202020]">
                      {task.title || "Tugas Tanpa Judul"}
                    </h3>
                    <p className="mt-2 text-[11px] leading-[1.45] text-[#8a8a8a]">
                      {task.description || "Belum ada deskripsi tugas."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#ff4a4a]">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{task.deadline || "-"}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[#8c8c8c]">
                        <Tag className="h-3.5 w-3.5" />
                        <span>{task.category || "Tugas Kuliah"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sm:pl-4">
                  <span
                    className={`inline-flex min-w-[58px] items-center justify-center rounded-full border px-4 py-[5px] text-[11px] font-semibold leading-none shadow-[0_2px_4px_rgba(0,0,0,0.08)] ${getPriorityBadge(
                      task.priority
                    )}`}
                  >
                    {task.priority
                      ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
                      : "Normal"}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <main className="min-h-screen bg-white">
        <section className="min-h-screen bg-[#efefef] px-5 pt-3 pb-8 sm:px-6 sm:pt-4 lg:px-9 lg:pt-4 lg:pb-8">
          <div className="mx-auto w-full max-w-none">
            {errorMessage && (
              <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Terjadi masalah saat memuat data.</p>
                  <p>{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={fetchTasks}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Coba Lagi
                </button>
              </div>
            )}

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#1d1d1d]">
                  Target dan Tugas
                </h1>
                <p className="mt-1 text-[15px] text-[#5f5f5f]">
                  Kelola tugas akademiku dengan lebih produktif
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenModal}
                className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[6px] bg-[#ff1d25] px-6 text-[13px] font-medium text-white shadow-[0_4px_10px_rgba(255,29,37,0.28)] transition hover:bg-[#eb1820]"
              >
                <Plus className="h-4 w-4" />
                Tambah Tugas
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statsCards.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[16px] border border-[#e6e6e6] bg-[#f8f8f8] px-5 py-4 shadow-[0_4px_8px_rgba(0,0,0,0.08)]"
                >
                  <p className="text-[12px] text-[#7d7d7d]">{item.title}</p>
                  <p className="mt-3 text-[18px] font-medium text-[#202020]">
                    {loading ? "-" : item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[16px] border border-[#d5d5d5] bg-[#f7f7f7] px-4 py-3 shadow-[0_4px_8px_rgba(0,0,0,0.08)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                  {filterTabs.map((tab) => {
                    const isActive = activeFilter === tab.value;

                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setActiveFilter(tab.value)}
                        className={`rounded-[6px] px-4 py-[6px] text-[11px] font-medium transition ${
                          isActive
                            ? "border border-[#ff7b7b] bg-[#ffd9d9] text-[#ff3d3d]"
                            : "border border-transparent bg-transparent text-[#9a9a9a] hover:text-[#666]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="w-full lg:w-[300px]">
                  <div className="flex h-[34px] items-center rounded-[10px] border border-[#d7d7d7] bg-[#ececec] px-3">
                    <Search className="h-3.5 w-3.5 text-[#9b9b9b]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari tugas atau materi"
                      className="ml-2 w-full bg-transparent text-[11px] text-[#555] outline-none placeholder:text-[#9b9b9b]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7">{renderTaskList()}</div>
          </div>
        </section>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
          <div className="relative w-full max-w-2xl rounded-[18px] bg-[#f4f4f4] px-5 py-6 shadow-2xl sm:px-6 sm:py-7">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#666] shadow-sm transition hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto max-w-2xl">
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#111]">
                  Tambah Tugas
                </h2>
                <p className="mt-1 text-sm text-[#8c8c8c]">
                  Isi Detail tugas yang mau kamu selesaikan
                </p>
              </div>

              <form onSubmit={handleSubmitTask} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222]">
                    Judul Tugas
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Contoh : Tugas besar algoritma pemograman"
                    className="h-11 w-full rounded-xl border border-[#d1d1d1] bg-transparent px-4 text-sm text-[#222] outline-none placeholder:text-[#9b9b9b] focus:border-[#ff4d4f]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222]">
                    Kategori
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                      { label: "Akademik", icon: BookOpen },
                      { label: "Pribadi", icon: User },
                      { label: "Organisasi", icon: Briefcase },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = formData.category === item.label;

                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleInputChange("category", item.label)}
                          className={`flex min-h-[80px] flex-col items-center justify-center rounded-2xl border transition ${
                            isActive
                              ? "border-[#ff4d4f] bg-[#fff1f1]"
                              : "border-[#cfcfcf] bg-transparent hover:bg-white"
                          }`}
                        >
                          <Icon
                            className={`mb-3 h-5 w-5 ${
                              isActive ? "text-[#ff4d4f]" : "text-[#8a8a8a]"
                            }`}
                          />
                          <span className="text-[15px] font-semibold text-[#222]">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#222]">
                      Deadline Tugas
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange("deadline", e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#d1d1d1] bg-transparent px-4 text-sm text-[#666] outline-none focus:border-[#ff4d4f]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#222]">
                      Tingkat Kesulitan
                    </label>

                    <div className="relative">
                      <select
                        value={formData.difficulty}
                        onChange={(e) =>
                          handleInputChange("difficulty", e.target.value)
                        }
                        className="h-11 w-full appearance-none rounded-xl border border-[#d1d1d1] bg-transparent px-10 pr-12 text-sm font-medium text-[#222] outline-none focus:border-[#ff4d4f]"
                      >
                        <option value="easy">easy</option>
                        <option value="medium">medium</option>
                        <option value="hard">hard</option>
                      </select>

                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                        <span
                          className={`block h-3.5 w-3.5 rounded-full ${
                            formData.difficulty === "hard"
                              ? "bg-red-500"
                              : formData.difficulty === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        />
                      </div>

                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#222]" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222]">  
                    Deskripsi (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Catatan Tambahan"
                    className="w-full rounded-xl border border-[#d1d1d1] bg-transparent px-4 py-4 text-sm text-[#222] outline-none placeholder:text-[#9c9c9c] focus:border-[#ff4d4f]"/>
                </div>

                <div className="flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6d6d6d] px-8 text-sm font-semibold text-white transition hover:bg-[#5d5d5d] sm:min-w-[124px]"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#ff1f28] px-8 text-smm font-semibold text-white transition hover:bg-[#e61b23] disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[128px]"
                  >
                    {submitting ? "Menyimpan..." : "Tambah"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}