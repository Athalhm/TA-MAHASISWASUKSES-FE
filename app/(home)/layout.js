"use client";

import { useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  House,
  Medal,
  MessageSquare,
  Brain,
  Trophy,
  Target,
  ChevronDown,
  Coins,
  RefreshCcw,
  User,
  LogOut,
} from "lucide-react";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const profileMenuRef = useRef(null);
  const heartbeatRef = useRef(false);
  const navContainerRef = useRef(null);
  const navItemRefs = useRef({});
  const [activeIndicator, setActiveIndicator] = useState({
    left: 0,
    width: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [xp, setXp] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());

  const menus = [
    { name: "Dashboard", icon: House, href: "/dashboard" },
    { name: "Achievement", icon: Medal, href: "/achievement" },
    { name: "Forum", icon: MessageSquare, href: "/forum" },
    { name: "Quiz", icon: Brain, href: "/quiz" },
    { name: "Leaderboard", icon: Trophy, href: "/leaderboard" },
    { name: "Target dan Tugas", icon: Target, href: "/target-dan-tugas" },
  ];

  const getInitials = (name = "User") => {
    return name
      .split(" ")
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

  const getAvatarUrl = (userId, version = Date.now()) => {
    if (!userId) return "";

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return `${baseUrl}/api/v1/user/avatar/${userId}?v=${version}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user");

    setUser(null);
    setXp(0);
    setAvatarError(false);
    setIsProfileOpen(false);

    router.replace("/sign-in");
  };

  const isAuthError = (err) => {
    const message = String(err?.message || "").toLowerCase();

    return (
      message.includes("401") ||
      message.includes("jwt") ||
      message.includes("expired") ||
      message.includes("unauthorized") ||
      message.includes("not authenticated")
    );
  };

  const fetchLayoutData = async () => {
    try {
      setLoading(true);
      setError("");
      setAvatarError(false);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        handleLogout();
        return;
      }

      try {
        const profileData = await fetchWithAuth("/api/v1/user/profile", {
          method: "GET",
          cache: "no-store",
        });

        setUser(profileData || null);
        setAvatarVersion(Date.now());
      } catch (err) {
        if (isAuthError(err)) {
          handleLogout();
          return;
        }

        setError("Data profil gagal dimuat sementara.");
      }

      try {
        const gamificationData = await fetchWithAuth(
          "/api/v1/gamification/summary",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        setXp(Number(gamificationData?.total_xp_earned || 0));
      } catch (err) {
        if (isAuthError(err)) {
          handleLogout();
          return;
        }

        setXp(0);
      }
    } catch (err) {
      console.error("Layout fetch error:", err);

      if (isAuthError(err)) {
        handleLogout();
        return;
      }

      setError("Data layout gagal dimuat sementara.");
    } finally {
      setLoading(false);
    }
  };

  const sendHeartbeat = async () => {
    if (heartbeatRef.current) return;

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) return;

      heartbeatRef.current = true;

      await fetchWithAuth("/api/v1/gamification/heartbeat", {
        method: "POST",
      });
    } catch (err) {
      console.error("Heartbeat error:", err);
    } finally {
      heartbeatRef.current = false;
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const activeItem = menus.find((item) => pathname === item.href);
    const activeElement = activeItem ? navItemRefs.current[activeItem.href] : null;

    if (!activeElement) return;

    setActiveIndicator({
      left: activeElement.offsetLeft,
      width: activeElement.offsetWidth,
    });
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;

    fetchLayoutData();
    sendHeartbeat();

    const interval = setInterval(() => {
      sendHeartbeat();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const displayName = user?.full_name || user?.username || "Pengguna";
  const displayUsername = user?.username || "Pengguna";
  const displayEmail = user?.email || "pengguna@gmail.com";
  const displayXp = new Intl.NumberFormat("en-US").format(Number(xp ?? 0));

  const avatarUrl =
    user?.id && !avatarError ? getAvatarUrl(user.id, avatarVersion) : "";

  return (
    <div className="min-h-screen w-full bg-[#efefef] text-[#191919] antialiased">
      <div className="min-h-screen w-full">
        <header className="w-full border-x border-t border-b border-[#bdbdbd] bg-[#f3f3f3]">
          <div className="flex min-h-[72px] w-full items-center justify-between px-10">
            <div className="flex items-center gap-4">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-b from-[#ff2338] to-[#8b0c12]">
                <img
                  src="/images/logo-telu.png"
                  alt="Logo Telu"
                  className="h-full w-full object-cover"
                />
              </div>

              <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#171717]">
                Mahasiswa Sukses
              </h1>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex h-[38px] items-center gap-1.5 rounded-[10px] bg-[#fde8eb] px-3 text-[#d85b69]">
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-pulse rounded-full bg-[#efc1c7]" />
                    <div className="h-3 w-16 animate-pulse rounded bg-[#efc1c7]" />
                  </>
                ) : (
                  <>
                    <Coins size={14} strokeWidth={2} />
                    <span className="text-[12px] font-medium">
                      {displayXp} XP
                    </span>
                  </>
                )}
              </div>

              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex h-[42px] min-w-[240px] items-center justify-between rounded-[14px] border border-[#cfcfcf] bg-[#f5f5f5] px-4 shadow-[0_0_0_1px_rgba(0,0,0,0.01)]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      {loading ? (
                        <div className="h-7 w-7 animate-pulse rounded-full bg-[#cfd5ef]" />
                      ) : avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="h-full w-full object-cover"
                          onError={() => {
                            setAvatarError(true);
                          }}
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center text-[11px] font-bold text-white ${getAvatarColor(
                            user?.id || user?.email || displayName
                          )}`}
                        >
                          {getInitials(displayName)}
                        </div>
                      )}
                    </div>

                    <span className="truncate text-[14px] font-medium text-[#212121]">
                      {loading ? "Loading..." : displayUsername}
                    </span>
                  </div>

                  <ChevronDown
                    size={20}
                    strokeWidth={2.2}
                    className={`text-[#202020] transition-transform duration-200 ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                  <div
                    className={`absolute right-0 top-[50px] z-50 w-[240px] rounded-[24px] border border-[#d5d5d5] bg-[#f5f5f5] px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition-all duration-200 ease-out ${
                      isProfileOpen
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-2 opacity-0"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-full">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-full w-full object-cover"
                            onError={() => {
                              setAvatarError(true);
                            }}
                          />
                        ) : (
                          <div
                            className={`flex h-full w-full items-center justify-center text-[15px] font-bold text-white ${getAvatarColor(
                              user?.id || user?.email || displayName
                            )}`}
                          >
                            {getInitials(displayName)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium text-[#1f1f1f]">
                          {displayName}
                        </p>

                        <p className="mt-1 truncate text-[13px] text-[#9b9b9b]">
                          {displayEmail}
                        </p>
                      </div>
                    </div>

                    <div className="my-2 h-px w-full bg-[#d8d8d8]" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/profile");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[#111] transition-all duration-200 hover:translate-x-1 hover:bg-white/70 hover:text-[#ff3d4a]"
                    >
                      <User size={18} strokeWidth={2.1} />

                      <span className="text-[15px] font-medium">Profile</span>
                    </button>

                    <div className="my-2 h-px w-full bg-[#d8d8d8]" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[#111] transition-all duration-200 hover:translate-x-1 hover:bg-white/70 hover:text-[#ff3d4a]"
                    >
                      <LogOut size={18} strokeWidth={2.1} />

                      <span className="text-[15px] font-medium">Keluar</span>
                    </button>
                  </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="border-t border-[#d9b3b8] bg-[#fff1f3] px-10 py-2">
              <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#b5475a]">
                <p>{error}</p>

                <button
                  type="button"
                  onClick={fetchLayoutData}
                  className="inline-flex items-center gap-2 rounded-md border border-[#e6b7bf] bg-white px-3 py-1.5 font-medium"
                >
                  <RefreshCcw size={14} />
                  Coba lagi
                </button>
              </div>
            </div>
          )}
        </header>

        <nav className="w-full border-x border-b border-[#bdbdbd] bg-[#f8f8f8]">
          <div className="w-full overflow-x-auto px-[52px]">
            <div
              ref={navContainerRef}
              className="relative flex min-w-max items-center gap-8"
            >
              <span
                className="absolute bottom-0 h-[2px] rounded-full bg-[#ff3d4a] transition-all duration-300 ease-in-out"
                style={{
                  left: `${activeIndicator.left}px`,
                  width: `${activeIndicator.width}px`,
                }}
              />

              {menus.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    ref={(element) => {
                      navItemRefs.current[item.href] = element;
                    }}
                    className={`relative flex h-[52px] items-center gap-2 whitespace-nowrap px-1 text-[16px] font-medium tracking-[-0.02em] transition ${
                      isActive
                        ? "text-[#ff3d4a]"
                        : "text-[#191919] hover:text-[#ff3d4a]"
                    }`}
                  >
                    <Icon size={20} strokeWidth={2} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
        <main className="min-h-[calc(100vh-124px)] border-x border-[#bdbdbd] bg-[#efefef] px-0 py-0">
          {children}
        </main>
      </div>
    </div>
  );
}