"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock, Medal, RefreshCcw, Share2, Star, Trophy } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

export default function AchievementPage() {
  const defaultSummary = {
    total_achievement: 0,
    unlocked: 0,
    total_xp_earned: 0,
  };

  const [summary, setSummary] = useState(defaultSummary);
  const [achievements, setAchievements] = useState([]);
  const [activeCategory, setActiveCategory] = useState("semua");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const categories = [
    { label: "Semua", value: "semua" },
    { label: "Quest", value: "quest" },
    { label: "Sosial", value: "sosial" },
    { label: "Spesial", value: "spesial" },
  ];

  const normalizeCategory = (type) => {
    const value = String(type || "").toLowerCase();

    if (value === "quest") return "quest";
    if (value === "social" || value === "sosial" || value === "forum") {
      return "sosial";
    }
    if (value === "special" || value === "spesial" || value === "streak") {
      return "spesial";
    }

    return "quest";
  };

  const getAchievementIcon = (type) => {
    const value = String(type || "").toLowerCase();

    if (value === "social" || value === "sosial" || value === "forum") {
      return "medal";
    }

    if (value === "special" || value === "spesial" || value === "streak") {
      return "star";
    }

    return "trophy";
  };

  const getAchievementColor = (difficulty) => {
    const value = String(difficulty || "").toLowerCase();

    if (value === "hard") return "red";
    if (value === "medium") return "red";

    return "orange";
  };

  const normalizeAchievement = (item, index) => {
    return {
      id: `${item?.title || "achievement"}-${index}`,
      title: item?.title || "Achievement",
      description: item?.description || "-",
      category: normalizeCategory(item?.type),
      xp: Number(item?.xp_reward || 0),
      icon: getAchievementIcon(item?.type),
      color: getAchievementColor(item?.difficulty),
      unlocked: Boolean(item?.is_completed),
      progress: Number(item?.progress_percentage || 0),
      completionDate: item?.completion_date || null,
    };
  };

  const fetchAchievementData = async () => {
    try {
      setLoading(true);
      setError(false);

      const [summaryData, achievementData] = await Promise.all([
        fetchWithAuth("/api/v1/gamification/summary", {
          method: "GET",
          cache: "no-store",
        }),
        fetchWithAuth("/api/v1/gamification/achievement", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const normalizedAchievements = Array.isArray(achievementData)
        ? achievementData.map(normalizeAchievement)
        : [];

      const unlockedCount = normalizedAchievements.filter(
        (item) => item.unlocked
      ).length;

      setSummary({
        total_achievement: normalizedAchievements.length,
        unlocked: unlockedCount,
        total_xp_earned: Number(summaryData?.total_xp_earned || 0),
      });

      setAchievements(normalizedAchievements);
    } catch (err) {
      console.error(err);
      setError(true);
      setSummary(defaultSummary);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievementData();
  }, []);

  const filteredAchievements = useMemo(() => {
    if (activeCategory === "semua") return achievements;

    return achievements.filter(
      (item) => item.category?.toLowerCase() === activeCategory
    );
  }, [achievements, activeCategory]);

  const AchievementIcon = ({ item }) => {
    const size = 18;
    const className = "text-white";

    if (item.icon === "medal") return <Medal size={size} className={className} />;
    if (item.icon === "star") return <Star size={size} className={className} />;

    return <Trophy size={size} className={className} />;
  };

  return (
    <main className="min-h-screen w-full bg-white px-8 py-16">
      <section className="mx-auto w-full max-w-[1200px]">
        <div className="relative overflow-hidden rounded-2xl px-10 py-9 text-white">
          <div className="absolute inset-0 animate-gradient bg-[linear-gradient(-45deg,#ff0000,#8B0000,#ff4d4d,#7f0000)] bg-[length:350%_350%]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%)]" />

          <div className="relative z-10">
            <div className="mb-9 flex items-center justify-between">
              <h1 className="text-xl font-semibold tracking-wide">
                Achievement Status
              </h1>

              {error && (
                <button
                  onClick={fetchAchievementData}
                  className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25"
                >
                  <RefreshCcw size={14} />
                  Coba lagi
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid max-w-[520px] grid-cols-3 gap-12">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="space-y-3">
                    <div className="h-3 w-24 animate-pulse rounded bg-white/30" />
                    <div className="h-4 w-8 animate-pulse rounded bg-white/40" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid max-w-[520px] grid-cols-3 gap-12">
                <div>
                  <p className="mb-3 text-xs font-semibold">
                    Total Achievement
                  </p>

                  <p className="text-sm font-semibold">
                    {summary.total_achievement}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold">
                    Terbuka
                  </p>

                  <p className="text-sm font-semibold">
                    {summary.unlocked}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold">
                    Total XP Earned
                  </p>

                  <p className="text-sm font-semibold">
                    {summary.total_xp_earned}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Data achievement gagal dimuat. Silakan coba lagi.
          </div>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          {categories.map((category) => {
            const active = activeCategory === category.value;

            return (
              <button
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                className={`rounded-md px-4 py-2 text-sm shadow-md transition ${
                  active
                    ? "bg-[#ff1f2f] text-white"
                    : "border border-gray-100 bg-white text-black hover:bg-gray-50"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="mt-11 grid gap-x-11 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? [1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-[210px] animate-pulse rounded-2xl bg-gray-100"
                />
              ))
            : filteredAchievements.length > 0
            ? filteredAchievements.map((item) => {
                const unlocked = Boolean(item.unlocked);

                return (
                  <article
                    key={item.id}
                    className={`min-h-[210px] rounded-2xl border border-gray-100 px-6 py-6 shadow-[0_4px_4px_rgba(0,0,0,0.25)] ${
                      unlocked ? "bg-white" : "bg-[#bfbfbf]"
                    }`}
                  >
                    <div className="mb-5 flex items-start justify-between">
                      <div
                        className={`flex h-[43px] w-[43px] items-center justify-center rounded ${
                          item.color === "red" ? "bg-[#f51f32]" : "bg-[#d89125]"
                        }`}
                      >
                        <AchievementIcon item={item} />
                      </div>

                      {!unlocked && (
                        <Lock size={18} className="mt-3 text-[#555555]" />
                      )}
                    </div>

                    <h2 className="text-sm font-medium text-[#111111]">
                      {item.title}
                    </h2>

                    <p className="mt-3 text-sm text-[#555555]">
                      {item.description}
                    </p>

                    <div
                      className={`mt-4 h-px w-full ${
                        unlocked ? "bg-gray-200" : "bg-[#a6a6a6]"
                      }`}
                    />

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm font-medium text-[#d97d13]">
                        +{item.xp} XP
                      </p>

                      {unlocked && (
                        <button
                          type="button"
                          className="text-[#3f3f3f] hover:text-[#ff1f2f]"
                          aria-label={`Bagikan ${item.title}`}
                        >
                          <Share2 size={17} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            : (
              <div className="col-span-full rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-[0_4px_4px_rgba(0,0,0,0.12)]">
                Belum ada achievement tersedia.
              </div>
            )}
        </div>
      </section>
    </main>
  );
}