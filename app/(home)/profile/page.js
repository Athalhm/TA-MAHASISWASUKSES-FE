    "use client";

    import { useEffect, useMemo, useState } from "react";
    import { fetchWithAuth } from "@/lib/api";
    import { useRouter } from "next/navigation";
    import {
      Edit3,
      Trophy,
      Zap,
      Users,
      UserPlus,
      Star,
      RefreshCcw,
      AlertCircle,
      Loader2,
      X,
      Check,
      Trash2,
    } from "lucide-react";

    export default function ProfilePage() {
      const router = useRouter();

      const fallbackData = {
        id: "",
        username: "User",
        bio: "Mahasiswa Teknik Informatika yang passionate dalam web development dan UI/UX design.",
        initials: "U",
        level: 12,
        totalXp: 2450,
        maxXp: 4000,
        friendsCount: 6,
        achievementOpen: 0,
        achievementTotal: 0,
      };

      const [profile, setProfile] = useState(fallbackData);
      const [achievements, setAchievements] = useState([]);
      const [friends, setFriends] = useState([]);
      const [friendRequests, setFriendRequests] = useState([]);
      const [friendSummary, setFriendSummary] = useState({
        friend_count: 0,
        friend_request_count: 0,
      });

      const [loading, setLoading] = useState(true);
      const [error, setError] = useState("");

      const [avatarUrl, setAvatarUrl] = useState("");
      const [avatarError, setAvatarError] = useState(false);

      const [showAddFriendModal, setShowAddFriendModal] = useState(false);
      const [friendInput, setFriendInput] = useState("");
      const [friendLoading, setFriendLoading] = useState(false);
      const [friendError, setFriendError] = useState("");
      const [friendSuccess, setFriendSuccess] = useState("");

      const [friendActionLoading, setFriendActionLoading] = useState("");

      const [animatedProgress, setAnimatedProgress] = useState(0);

      const getBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || "";

      const getAuthHeaders = () => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        return {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
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

      const getAvatarColor = (userKey = "user") => {
        const colors = [
          "bg-blue-500",
          "bg-red-500",
          "bg-purple-500",
          "bg-green-500",
          "bg-orange-500",
          "bg-indigo-500",
        ];

        let hash = 0;
        const key = String(userKey);

        for (let i = 0; i < key.length; i++) {
          hash = key.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
      };

      const getAvatarUrl = (userId) => {
        if (!userId) return "";

        const baseUrl = getBaseUrl();
        return `${baseUrl}/api/v1/user/avatar/${userId}?v=${Date.now()}`;
      };

      const formatNumber = (value) => {
        return new Intl.NumberFormat("id-ID").format(Number(value || 0));
      };

      const normalizeAchievement = (item, index) => {
        const colors = [
          "from-orange-400 to-red-500",
          "from-pink-400 to-rose-500",
          "from-yellow-400 to-orange-500",
          "from-purple-400 to-pink-500",
          "from-blue-400 to-purple-500",
          "from-green-400 to-emerald-500",
          "from-indigo-400 to-blue-500",
          "from-cyan-400 to-blue-500",
        ];

        const icons = ["🎯", "💬", "⭐", "🏆", "🌟", "⚡", "📚", "💎"];

        return {
          id: `${item?.title || "achievement"}-${index}`,
          icon: icons[index % icons.length],
          title: item?.title || "Achievement",
          description: item?.description || "-",
          xp: `+${item?.xp_reward || 0} XP`,
          color: colors[index % colors.length],
          isCompleted: Boolean(item?.is_completed),
        };
      };

      const normalizeFriend = (item) => {
        const username = item?.username || "User";
        const fullName = item?.full_name || username;

        return {
          id: item?.id,
          username,
          fullName,
          initials: getInitials(username),
          level: Number(item?.level || 0),
          totalXp: Number(item?.total_xp || 0),
          avatarUrl: getAvatarUrl(item?.id),
          avatarColor: getAvatarColor(item?.id || username),
          online: Boolean(
            item?.online_status ??
              item?.is_online ??
              item?.online ??
              item?.is_active ??
              item?.active ??
              false
          ),
        };
      };

      const normalizeFriendRequest = (item) => {
        const username = item?.username || "User";
        const fullName = item?.full_name || username;

        return {
          id: item?.id,
          username,
          fullName,
          displayName: username,
          initials: getInitials(username),
          level: Number(item?.level || item?.current_level || 0),
          totalXp: Number(item?.total_xp || item?.xp || 0),
          avatarUrl: getAvatarUrl(item?.id),
          avatarColor: getAvatarColor(item?.id || username),
        };
      };

      const fetchJson = async (url, fallback) => {
        try {
          const response = await fetch(url, {
            method: "GET",
            cache: "no-store",
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            return fallback;
          }

          return await response.json();
        } catch {
          return fallback;
        }
      };

      const fetchProfile = async () => {
        try {
          setLoading(true);
          setError("");
          setAvatarError(false);

          const baseUrl = getBaseUrl();

          const profileData = await fetchJson(
            `${baseUrl}/api/v1/user/profile`,
            null
          );

          if (!profileData) {
            throw new Error("Data profile gagal dimuat.");
          }

          const achievementData = await fetchJson(
            `${baseUrl}/api/v1/gamification/achievement`,
            []
          );

          const summaryData = await fetchJson(
            `${baseUrl}/api/v1/gamification/summary`,
            null
          );

          const friendsData = await fetchJson(`${baseUrl}/api/v1/friends/`, []);

          const friendRequestData = await fetchJson(
            `${baseUrl}/api/v1/friends/request_list`,
            []
          );

          const friendSummaryData = await fetchJson(
            `${baseUrl}/api/v1/friends/summary`,
            {
              friend_count: 0,
              friend_request_count: 0,
            }
          );

          const safeAchievements = Array.isArray(achievementData)
            ? achievementData
            : [];

          const safeFriends = Array.isArray(friendsData) ? friendsData : [];

          const safeFriendRequests = Array.isArray(friendRequestData)
            ? friendRequestData
            : [];

          const completedAchievements = safeAchievements.filter(
            (item) => item?.is_completed
          );

          const totalAchievement = safeAchievements.length;

          const totalXp =
            Number(profileData?.total_xp || 0) ||
            Number(summaryData?.total_xp_earned || 0);

          const currentLevel =
            Number(profileData?.current_level || 0) ||
            Number(summaryData?.current_level || 0);

          const nextLevel = currentLevel + 1;
          const maxXp = Math.max(nextLevel * 1000, 1000);

          const displayName =
            profileData?.username ||
            profileData?.full_name ||
            profileData?.email ||
            "User";

          setProfile({
            id: profileData?.id || "",
            username: profileData?.username || profileData?.full_name || "User",
            fullName: profileData?.full_name || displayName,
            bio:
              profileData?.description ||
              "Mahasiswa Teknik Informatika yang passionate dalam web development dan UI/UX design.",
            initials: getInitials(profileData?.full_name || displayName),
            level: currentLevel,
            totalXp,
            maxXp,
            friendsCount: Number(
              friendSummaryData?.friend_count || safeFriends.length || 0
            ),
            achievementOpen: completedAchievements.length,
            achievementTotal: totalAchievement,
          });

          if (profileData?.id) {
            setAvatarUrl(getAvatarUrl(profileData.id));
          } else {
            setAvatarUrl("");
          }

          setAchievements(safeAchievements.map(normalizeAchievement));
          setFriends(safeFriends.map(normalizeFriend));
          setFriendRequests(safeFriendRequests.map(normalizeFriendRequest));
          setFriendSummary(friendSummaryData);
        } catch (err) {
          setError(
            err?.message ||
              "Data profile gagal dimuat. Menampilkan data fallback sementara."
          );
          setProfile(fallbackData);
          setAchievements([]);
          setFriends([]);
          setFriendRequests([]);
          setFriendSummary({
            friend_count: 0,
            friend_request_count: 0,
          });
          setAvatarUrl("");
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchProfile();
      }, []);

      const progress = Math.min(
        Math.round((profile.totalXp / profile.maxXp) * 100),
        100
      );

      useEffect(() => {
        if (loading) return;

        setAnimatedProgress(0);

        const resetTimer = setTimeout(() => {
          setAnimatedProgress(progress);
        }, 300);

        return () => clearTimeout(resetTimer);
      }, [progress, loading]);  

      const achievementList = useMemo(() => {
        return achievements.filter((item) => item.isCompleted);
      }, [achievements]);

      const handleAddFriend = async (e) => {
        e.preventDefault();

        if (!friendInput.trim()) {
          setFriendError("Username atau email wajib diisi.");
          return;
        }

        try {
          setFriendLoading(true);
          setFriendError("");
          setFriendSuccess("");

          await fetchWithAuth("/api/v1/friends/request", {
            method: "POST",
            body: JSON.stringify({
              email_or_username: friendInput.trim(),
            }),
          });

          setFriendSuccess("Friend request berhasil dikirim.");
          setFriendInput("");
          await fetchProfile();
        } catch (err) {
          setFriendError(err?.message || "Gagal mengirim friend request.");
        } finally {
          setFriendLoading(false);
        }
      };

      const handleAcceptFriend = async (requesterId) => {
        try {
          setFriendActionLoading(`accept-${requesterId}`);

          await fetchWithAuth(`/api/v1/friends/accept/${requesterId}`, {
            method: "POST",
          });

          await fetchProfile();
        } catch (err) {
          alert(err?.message || "Gagal menerima friend request.");
        } finally {
          setFriendActionLoading("");
        }
      };

      const handleDenyFriend = async (requesterId) => {
        try {
          setFriendActionLoading(`deny-${requesterId}`);

          await fetchWithAuth(`/api/v1/friends/deny/${requesterId}`, {
            method: "POST",
          });

          await fetchProfile();
        } catch (err) {
          alert(err?.message || "Gagal menolak friend request.");
        } finally {
          setFriendActionLoading("");
        }
      };

      const handleRemoveFriend = async (friendId) => {
        const confirmDelete = window.confirm("Hapus teman ini?");

        if (!confirmDelete) return;

        try {
          setFriendActionLoading(`remove-${friendId}`);

          await fetchWithAuth(`/api/v1/friends/${friendId}`, {
            method: "DELETE",
          });

          await fetchProfile();
        } catch (err) {
          alert(err?.message || "Gagal menghapus teman.");
        } finally {
          setFriendActionLoading("");
        }
      };

      return (
        <main className="min-h-screen bg-white px-6 py-5 sm:px-8">
          <section className="mx-auto max-w-[1440px]">
            <div className="mb-7">
              <h1 className="text-[22px] font-bold text-gray-900">Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                Informasi akun dan statistik Anda
              </p>
            </div>

            {error && (
              <div className="mb-5 flex max-w-xl items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                <p>{error}</p>
                <button
                  onClick={fetchProfile}
                  className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold"
                >
                  <RefreshCcw size={13} />
                  Coba lagi
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex h-[360px] items-center justify-center rounded-2xl bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-gray-200 bg-white px-7 py-7 shadow-sm">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-3xl font-bold text-white shadow-lg">
                          {avatarUrl && !avatarError ? (
                            <img
                              src={avatarUrl}
                              alt={profile.username}
                              className="h-full w-full object-cover"
                              onError={() => setAvatarError(true)}
                            />
                          ) : (
                            profile.initials
                          )}
                        </div>

                        <div className="absolute -bottom-2 -right-2 flex h-10 w-10 flex-col items-center justify-center rounded-xl border-2 border-white bg-red-500 text-white shadow-md">
                          <span className="text-[9px] font-semibold leading-none">
                            Lv
                          </span>
                          <span className="text-sm font-bold leading-none">
                            {profile.level}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">
                          {profile.username}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">{profile.bio}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push("/profile/edit-profile")}
                      className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      <Edit3 size={15} />
                      Edit Profile
                    </button>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      icon={<Star size={16} />}
                      label="Level"
                      value={profile.level}
                      color="red"
                    />
                    <StatCard
                      icon={<Zap size={16} />}
                      label="Total XP"
                      value={formatNumber(profile.totalXp)}
                      color="orange"
                    />
                    <StatCard
                      icon={<Users size={16} />}
                      label="Teman"
                      value={profile.friendsCount}
                      color="blue"
                    />
                    <StatCard
                      icon={<Trophy size={16} />}
                      label="Achievement"
                      value={`${profile.achievementOpen}/${profile.achievementTotal}`}
                      color="purple"
                    />
                  </div>

                  <div className="mt-7 border-t border-gray-100 pt-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Progress ke Level {profile.level + 1}
                      </h3>
                      <div className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-bold text-gray-900">
                        ⚡ {formatNumber(profile.totalXp)} /{" "}
                        {formatNumber(profile.maxXp)} XP
                      </div>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 transition-all duration-1000 ease-out"
                        style={{ width: `${animatedProgress}%` }}
                      />
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                      🎯{" "}
                      {formatNumber(Math.max(profile.maxXp - profile.totalXp, 0))}{" "}
                      XP lagi untuk naik level!
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_430px]">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                          <Trophy size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Achievement Terbuka
                        </h3>
                      </div>

                      <span className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-500">
                        {profile.achievementOpen} / {profile.achievementTotal}
                      </span>
                    </div>

                    {achievementList.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {achievementList.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-gray-200 bg-white p-4 text-center"
                          >
                            <div
                              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-2xl text-white`}
                            >
                              {item.icon}
                            </div>

                            <h4 className="mt-4 text-sm font-bold text-gray-900">
                              {item.title}
                            </h4>
                            <p className="mt-2 line-clamp-1 text-xs text-gray-500">
                              {item.description}
                            </p>

                            <div className="mt-5 rounded-lg bg-orange-50 py-2 text-xs font-bold text-red-500">
                              ⚡ {item.xp}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                        Belum ada achievement tersedia.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
                        <Users size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Teman ({profile.friendsCount})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddFriendModal(true);
                        setFriendInput("");
                        setFriendError("");
                        setFriendSuccess("");
                      }}
                      className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      <UserPlus size={17} />
                      Tambah Teman Baru
                    </button>

                    {friendRequests.length > 0 && (
                      <div className="mb-5">
                        <h4 className="mb-3 text-sm font-bold text-gray-900">
                          Friend Request ({friendRequests.length})
                        </h4>

                        <div className="space-y-3">
                          {friendRequests.map((request) => (
                            <FriendRequestCard
                              key={request.id}
                              request={request}
                              loadingKey={friendActionLoading}
                              onAccept={handleAcceptFriend}
                              onDeny={handleDenyFriend}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {friends.length > 0 ? (
                        friends.map((friend) => (
                          <FriendCard
                            key={friend.id}
                            friend={friend}
                            loadingKey={friendActionLoading}
                            onRemove={handleRemoveFriend}
                          />
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                          Belum ada teman.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          {showAddFriendModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
              <div className="w-full max-w-[420px] rounded-[10px] bg-white px-6 py-5 shadow-2xl">
                <div className="mb-7 flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-black">
                    Tambah Teman Baru
                  </h3>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFriendModal(false);
                      setFriendInput("");
                      setFriendError("");
                      setFriendSuccess("");
                    }}
                    className="flex h-6 w-6 items-center justify-center text-black transition hover:opacity-70"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>

                <form onSubmit={handleAddFriend}>
                  <label className="mb-3 block text-[10px] font-semibold text-[#707070]">
                    Username atau Email
                  </label>

                  <input
                    type="text"
                    value={friendInput}
                    onChange={(e) => {
                      setFriendInput(e.target.value);
                      setFriendError("");
                      setFriendSuccess("");
                    }}
                    placeholder="Masukkan Username"
                    className="h-[28px] w-full rounded-[3px] border-0 bg-[#e9e9e9] px-3 text-[10px] font-semibold text-[#333] outline-none placeholder:text-[#777]"
                  />

                  {friendError && (
                    <div className="mt-3 flex items-start gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-medium text-red-600">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      <p>{friendError}</p>
                    </div>
                  )}

                  {friendSuccess && (
                    <div className="mt-3 rounded-md border border-green-100 bg-green-50 px-3 py-2 text-[10px] font-medium text-green-600">
                      {friendSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={friendLoading}
                    className="mt-5 flex h-[36px] w-full items-center justify-center rounded-[3px] bg-[#ff1f2d] text-[13px] font-bold text-white transition hover:bg-[#e91625] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {friendLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Kirim Friend Request"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      );
    }

    function FriendRequestCard({ request, loadingKey, onAccept, onDeny }) {
      const [avatarError, setAvatarError] = useState(false);

      const acceptLoading = loadingKey === `accept-${request.id}`;
      const denyLoading = loadingKey === `deny-${request.id}`;

      return (
        <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-3">
          <div
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white ${request.avatarColor}`}
          >
            {request.avatarUrl && !avatarError ? (
              <div className="h-full w-full overflow-hidden rounded-xl">
                <img
                  src={request.avatarUrl}
                  alt={request.displayName || request.username}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              </div>
            ) : (
              request.initials
            )}

            <span className="absolute -right-2 -top-2 z-10 h-5 w-5 rounded-full border-2 border-orange-50 bg-red-600" />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-bold text-gray-900">
              {request.fullName}
            </h4>
            <div className="mt-1 flex items-center gap-2 text-[11px] font-bold">
              <span className="rounded-full bg-red-50 px-2 py-1 text-red-500">
                ☆ Lv {request.level}
              </span>
              <span className="rounded-full bg-orange-50 px-2 py-1 text-orange-500">
                ⚡ {new Intl.NumberFormat("id-ID").format(request.totalXp)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={acceptLoading || denyLoading}
              onClick={() => onAccept(request.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {acceptLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={18} strokeWidth={3} />
              )}
            </button>

            <button
              type="button"
              disabled={acceptLoading || denyLoading}
              onClick={() => onDeny(request.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {denyLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <X size={18} strokeWidth={3} />
              )}
            </button>
          </div>
        </div>
      );
    }

    function FriendCard({ friend, loadingKey, onRemove }) {
      const [avatarError, setAvatarError] = useState(false);

      const removeLoading = loadingKey === `remove-${friend.id}`;

      return (
        <div className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-3">
          <div
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white ${friend.avatarColor}`}
          >
            {friend.avatarUrl && !avatarError ? (
              <div className="h-full w-full overflow-hidden rounded-xl">
                <img
                  src={friend.avatarUrl}
                  alt={friend.fullName}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              </div>
            ) : (
              friend.initials
            )}

            <span
              className={`absolute -bottom-1 -right-1 z-10 h-3.5 w-3.5 rounded-full border-2 border-white ${
                friend.online ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-bold text-gray-900">
              {friend.username}
            </h4>
            <div className="mt-1 flex items-center gap-2 text-[11px] font-bold">
              <span className="rounded-full bg-red-50 px-2 py-1 text-red-500">
                ☆ Lv {friend.level}
              </span>
              <span className="rounded-full bg-orange-50 px-2 py-1 text-orange-500">
                ⚡ {new Intl.NumberFormat("id-ID").format(friend.totalXp)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={removeLoading}
            onClick={() => onRemove(friend.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 opacity-0 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 group-hover:opacity-100"
          >
            {removeLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
          </button>
        </div>
      );
    }

    function StatCard({ icon, label, value, color }) {
      const styles = {
        red: {
          gradient: "from-red-50 to-orange-50",
          bg: "bg-red-500",
        },
        orange: {
          gradient: "from-orange-50 to-yellow-50",
          bg: "bg-orange-500",
        },
        blue: {
          gradient: "from-blue-50 to-cyan-50",
          bg: "bg-blue-500",
        },
        purple: {
          gradient: "from-purple-50 to-pink-50",
          bg: "bg-purple-500",
        },
      };

      const selectedStyle = styles[color];

      return (
        <div
          className={`rounded-xl border border-gray-100 bg-gradient-to-br ${selectedStyle.gradient} px-4 py-4`}
        >
          <div className="mb-3 flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${selectedStyle.bg} text-white`}
            >
              {icon}
            </div>
            <p className="text-xs font-medium text-gray-500">{label}</p>
          </div>

          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      );
    }