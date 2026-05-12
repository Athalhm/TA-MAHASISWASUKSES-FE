"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import {
  Trophy,
  Medal,
  Crown,
  Loader2,
  AlertCircle,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState({
    topGlobal: [],
    topFriends: [],
  });

  const [myStats, setMyStats] = useState({
    rank: 0,
    totalXp: 0,
  });

  const [activeTab, setActiveTab] = useState("top100");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [podiumAnimated, setPodiumAnimated] = useState(false);
  const [podiumAnimationKey, setPodiumAnimationKey] = useState(0);

  const formatNumber = (value) => {
    return new Intl.NumberFormat("id-ID").format(Number(value || 0));
  };

  const getInitials = (name = "User") => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getAvatarUrl = (userId) => {
    if (!userId) return "";

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return `${baseUrl}/api/v1/user/avatar/${userId}`;
  };

  const normalizeLeaderboardItem = (item, index, isFriend = false) => {
    const user = item?.user || {};
    const displayName =
      user?.username ||
      user?.full_name ||
      item?.username ||
      item?.full_name ||
      item?.name ||
      "User";

    return {
      id: user?.id || item?.id || `leaderboard-${index}`,
      name: displayName,
      username: user?.username || item?.username || displayName,
      xp: Number(item?.xp || item?.total_xp || 0),
      rank: Number(item?.rank || index + 1),
      level: Number(item?.level || 0),
      initials: getInitials(user?.username || item?.username || displayName),
      avatarUrl: getAvatarUrl(user?.id || item?.id),
      isFriend,
    };
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError("");

      const leaderboardResponse = await fetchWithAuth(
        "/api/v1/gamification/leaderboard",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const summaryResponse = await fetchWithAuth(
        "/api/v1/gamification/summary",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const topGlobal = Array.isArray(leaderboardResponse?.top_global)
        ? leaderboardResponse.top_global.map((item, index) =>
            normalizeLeaderboardItem(item, index, false)
          )
        : [];

      const topFriends = Array.isArray(leaderboardResponse?.top_friends)
        ? leaderboardResponse.top_friends.map((item, index) =>
            normalizeLeaderboardItem(item, index, true)
          )
        : [];

      setLeaderboardData({
        topGlobal,
        topFriends,
      });

      setMyStats({
        rank:
          Number(leaderboardResponse?.user_rank || 0) ||
          Number(summaryResponse?.current_ranking || 0),
        totalXp:
          Number(leaderboardResponse?.user_total_xp || 0) ||
          Number(summaryResponse?.total_xp_earned || 0),
      });
    } catch (err) {
      console.error("Leaderboard fetch error:", err);

      setError("Data leaderboard gagal dimuat.");
      setLeaderboardData({
        topGlobal: [],
        topFriends: [],
      });
      setMyStats({
        rank: 0,
        totalXp: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = useMemo(() => {
    if (activeTab === "friends") {
      return leaderboardData.topFriends;
    }

    return leaderboardData.topGlobal.slice(0, 100);
  }, [leaderboardData, activeTab]);

  useEffect(() => {
    if (loading) return;

    setPodiumAnimated(false);
    setPodiumAnimationKey((prev) => prev + 1);

    const timer = setTimeout(() => {
      setPodiumAnimated(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [loading, activeTab]);

  const getName = (user) => user?.name || "Nama Pengguna";
  const getXp = (user) => Number(user?.xp || 0);

  return (
    <main className="min-h-screen bg-white px-[30px] py-[23px]">
      <section className="mx-auto w-full max-w-[899px]">
        <section className="relative overflow-hidden rounded-[14px] px-[28px] pb-[22px] pt-[25px]">
          <div className="absolute inset-0 animate-gradient bg-[linear-gradient(-45deg,#ff0000,#8B0000,#ff4d4d,#7f0000)] bg-[length:350%_350%]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%)]" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-[58px] w-[58px] items-center justify-center rounded-[9px] bg-white/25">
                <Trophy className="h-6 w-6 text-white" strokeWidth={1.7} />
              </div>

              <div>
                <h1 className="text-[18px] font-bold leading-none text-white">
                  Leaderboard
                </h1>
                <p className="mt-[10px] text-[12px] font-medium text-white">
                  Lihat peringkat pengguna teratas
                </p>
              </div>
            </div>

            <div className="mt-[32px] grid grid-cols-1 gap-[62px] sm:grid-cols-2">
              <div className="rounded-[8px] bg-white/25 px-[18px] py-[12px] text-white">
                <p className="text-[12px] font-medium">Peringkat Anda</p>
                <p className="mt-[13px] text-[12px] font-semibold">
                  #{myStats.rank || "-"}
                </p>
              </div>

              <div className="rounded-[8px] bg-white/25 px-[18px] py-[12px] text-white">
                <p className="text-[12px] font-medium">Total XP</p>
                <p className="mt-[13px] text-[12px] font-semibold">
                  {formatNumber(myStats.totalXp)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>

            <button
              onClick={fetchLeaderboard}
              className="flex items-center gap-1 font-semibold"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Coba lagi
            </button>
          </div>
        )}

        <div className="mt-[25px] flex items-center gap-[20px] pl-[31px]">
          <button
            onClick={() => setActiveTab("top100")}
            className={`flex h-[31px] items-center gap-2 rounded-[5px] px-[12px] text-[12px] font-medium shadow-md transition ${
              activeTab === "top100"
                ? "bg-[#ff1f2d] text-white"
                : "border border-gray-100 bg-white text-[#ff1f2d]"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Top 100
          </button>

          <button
            onClick={() => setActiveTab("friends")}
            className={`h-[31px] rounded-[5px] px-[12px] text-[12px] font-medium shadow-md transition ${
              activeTab === "friends"
                ? "bg-[#ff1f2d] text-white"
                : "border border-gray-100 bg-white text-[#ff1f2d]"
            }`}
          >
            Teman
          </button>
        </div>

        {loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Memuat leaderboard...
            </div>
          </div>
        ) : (
          <>
            <section
              key={podiumAnimationKey}
              className="mt-[13px] grid grid-cols-1 items-end gap-[78px] md:grid-cols-3"
            >
              {filteredLeaderboard.slice(0, 3).map((user, index) => {
                const rank = Number(user.rank || index + 1);

                const podiumHeight =
                  rank === 1
                    ? "h-[166px]"
                    : rank === 2
                    ? "h-[145px]"
                    : "h-[133px]";

                const podiumColor =
                  rank === 1
                    ? "bg-gradient-to-b from-[#ffa914] to-[#ff7a00]"
                    : rank === 2
                    ? "bg-gradient-to-b from-[#666666] to-[#3f3f3f]"
                    : "bg-gradient-to-b from-[#8a521f] to-[#7a4518]";

                const podiumOrder =
                  rank === 1
                    ? "md:order-2"
                    : rank === 2
                    ? "md:order-1"
                    : "md:order-3";

                return (
                  <div
                    key={`${activeTab}-${user.id || index}`}
                    className={`flex h-[166px] items-end ${podiumOrder}`}
                  >
                    <div
                      className={`flex w-full flex-col items-center justify-center overflow-hidden rounded-[12px] text-white transition-all duration-[1200ms] ease-out ${podiumColor} ${
                        podiumAnimated ? podiumHeight : "h-0"
                      }`}
                      style={{
                        transitionDelay: `${index * 180}ms`,
                      }}
                    >
                      <div className="mb-[17px]">
                        <LeaderboardAvatar user={user} size="podium" />
                      </div>

                      <p className="text-[12px] font-medium">
                        {getName(user)}
                      </p>

                      <p className="mt-[12px] text-[12px] font-medium">
                        {formatNumber(getXp(user))} XP
                      </p>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-[12px] overflow-hidden rounded-[6px] border border-[#666] bg-white">
              <div className="grid grid-cols-[1fr_2fr_1fr] border-b border-[#777] px-[39px] py-[15px] text-[14px] font-bold text-black">
                <div>Peringkat</div>
                <div>Pengguna</div>
                <div className="text-right">XP</div>
              </div>

              {filteredLeaderboard.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                  Tidak ada data leaderboard.
                </div>
              ) : (
                filteredLeaderboard.map((user, index) => {
                  const rank = Number(user.rank || index + 1);

                  return (
                    <div
                      key={user.id || index}
                      className="grid grid-cols-[1fr_2fr_1fr] items-center border-b border-[#777] px-[43px] py-[13px]"
                    >
                      <div className="flex items-center">
                        {rank === 1 ? (
                          <Crown className="h-5 w-5 text-[#FFD700]" />
                        ) : rank === 2 ? (
                          <Medal className="h-5 w-5 text-[#9CA3AF]" />
                        ) : rank === 3 ? (
                          <Medal className="h-5 w-5 text-[#CD7F32]" />
                        ) : (
                          <span className="ml-[4px] text-[12px] font-medium text-black">
                            {rank}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-[31px]">
                        <LeaderboardAvatar user={user} size="table" />

                        <p className="text-[12px] font-medium text-black">
                          {getName(user)}
                        </p>
                      </div>

                      <div className="text-right text-[12px] font-medium text-black">
                        {formatNumber(getXp(user))}
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function LeaderboardAvatar({ user, size = "table" }) {
  const [avatarError, setAvatarError] = useState(false);

  const sizeClass =
    size === "podium"
      ? "h-[42px] w-[42px] text-[13px]"
      : "h-[37px] w-[37px] text-[12px]";

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full bg-[#ff1f2d] font-bold text-white ${sizeClass}`}
    >
      {user.avatarUrl && !avatarError ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="h-full w-full object-cover"
          onError={() => setAvatarError(true)}
        />
      ) : (
        user.initials
      )}
    </div>
  );
}