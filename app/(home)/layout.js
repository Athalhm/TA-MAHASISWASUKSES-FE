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
  CircleUserRound,
  Coins,
  RefreshCcw,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const profileMenuRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [xp, setXp] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const menus = [
    { name: "Dashboard", icon: House, href: "/dashboard" },
    { name: "Achievement", icon: Medal, href: "/achievement" },
    { name: "Forum", icon: MessageSquare, href: "/forum" },
    { name: "Quiz", icon: Brain, href: "/quiz" },
    { name: "Leaderboard", icon: Trophy, href: "/leaderboard" },
    { name: "Target dan Tugas", icon: Target, href: "/target-dan-tugas" },
  ];

  const fetchLayoutData = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      const [profileResponse, gamificationResponse] = await Promise.all([
        fetch(`${baseUrl}/api/v1/user/profile`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }),
        fetch(`${baseUrl}/api/v1/gamification/summary`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }),
      ]);

      if (!profileResponse.ok) {
        let message = "Gagal mengambil data profile";

        try {
          const errorData = await profileResponse.json();
          message =
            errorData?.message ||
            errorData?.detail ||
            `${message} (${profileResponse.status})`;
        } catch {}

        throw new Error(message);
      }

      if (!gamificationResponse.ok) {
        let message = "Gagal mengambil data gamification summary";

        try {
          const errorData = await gamificationResponse.json();
          message =
            errorData?.message ||
            errorData?.detail ||
            `${message} (${gamificationResponse.status})`;
        } catch {}

        throw new Error(message);
      }

      const profileData = await profileResponse.json();
      const gamificationData = await gamificationResponse.json();

      setUser(profileData || null);

      if (profileData) {
        localStorage.setItem("user", JSON.stringify(profileData));
      }

      setXp(gamificationData?.total_xp_earned ?? 0);
    } catch (err) {
      console.error("Layout fetch error:", err);
      setError(err.message || "Terjadi kesalahan");

      const savedUser =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      }

      setXp((prev) => prev ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchLayoutData();
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user");

    setIsProfileOpen(false);
    router.push("/sign-in");
  };

  const displayName = user?.full_name || "Pengguna";
  const displayEmail = user?.email || "pengguna@gmail.com";
  const displayAvatar = user?.avatar || null;
  const displayXp = new Intl.NumberFormat("en-US").format(Number(xp ?? 0));

  return (
    <div className="min-h-screen w-full bg-[#efefef] text-[#191919] antialiased">
      <div className="min-h-screen w-full">
        <header className="w-full border-x border-t border-b border-[#242424] bg-[#f3f3f3]">
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
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d8def7]">
                      {loading ? (
                        <div className="h-7 w-7 animate-pulse rounded-full bg-[#cfd5ef]" />
                      ) : displayAvatar ? (
                        <img
                          src={displayAvatar}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <CircleUserRound size={18} className="text-[#5d6b95]" />
                      )}
                    </div>

                    <span className="truncate text-[14px] font-medium text-[#212121]">
                      {loading ? "Loading..." : displayName}
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

                {isProfileOpen && (
                  <div className="absolute right-0 top-[50px] z-50 w-[240px] rounded-[24px] border border-[#d5d5d5] bg-[#f5f5f5] px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d8def7]">
                        {displayAvatar ? (
                          <img
                            src={displayAvatar}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <CircleUserRound
                            size={30}
                            className="text-[#5d6b95]"
                          />
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
                      className="flex w-full items-center gap-3 py-2 text-left text-[#111] transition hover:opacity-80"
                    >
                      <SlidersHorizontal size={18} strokeWidth={2.1} />
                      <span className="text-[15px] font-medium">
                        Edit Profile
                      </span>
                    </button>

                    <div className="my-2 h-px w-full bg-[#d8d8d8]" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 py-2 text-left text-[#111] transition hover:opacity-80"
                    >
                      <LogOut size={18} strokeWidth={2.1} />
                      <span className="text-[15px] font-medium">Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="border-t border-[#d9b3b8] bg-[#fff1f3] px-10 py-2">
              <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#b5475a]">
                <p>
                  Data header gagal dimuat. Menampilkan data fallback sementara.
                </p>

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
            <div className="flex min-w-max items-center gap-8">
              {menus.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative flex h-[52px] items-center gap-2 whitespace-nowrap border-b-2 px-1 text-[16px] font-medium tracking-[-0.02em] transition ${
                      isActive
                        ? "border-[#ff3d4a] text-[#ff3d4a]"
                        : "border-transparent text-[#191919] hover:text-[#ff3d4a]"
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

        <main className="min-h-[calc(100vh-124px)] border-x border-[#242424] bg-[#efefef] px-0 py-0">
          {children}
        </main>
      </div>
    </div>
  );
}