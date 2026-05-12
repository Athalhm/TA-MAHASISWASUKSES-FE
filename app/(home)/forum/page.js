"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Plus,
  AlertCircle,
  MessageCircle,
  ThumbsUp,
  X,
  Users,
} from "lucide-react";

export default function Page() {
  const router = useRouter();

  const categoryTabs = useMemo(
    () => ["Semua", "Umum", "Tips & Trik", "Bantuan", "Ruang Belajar"],
    []
  );

  const postCategories = useMemo(
    () => ["Umum", "Tips & Trik", "Bantuan", "Ruang Belajar"],
    []
  );

  const initialForm = {
    title: "",
    category: "Umum",
    content: "",
    maxParticipants: 20,
  };

  const [forumData, setForumData] = useState({
    title: "Forum Community",
    subtitle: "Diskusi dan berbagi dengan komunitas",
    latestPosts: [],
  });

  const [studyRooms, setStudyRooms] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Semua");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postForm, setPostForm] = useState(initialForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const mapCategoryToApi = (category) => {
    const map = {
      Umum: "umum",
      "Tips & Trik": "tips_trik",
      Bantuan: "bantuan",
    };

    return map[category] || "umum";
  };

  const mapCategoryFromApi = (category) => {
    const map = {
      umum: "Umum",
      tips_trik: "Tips & Trik",
      bantuan: "Bantuan",
    };

    return map[category] || "Umum";
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return "Baru saja";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Baru saja";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Baru saja";
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
  };

  const normalizePost = (post) => ({
    id: post?.id,
    title: post?.title || "Tanpa Judul",
    author: post?.author?.full_name || "Anonim",
    createdAt: formatTime(post?.created_at),
    excerpt: post?.content || "Belum ada isi postingan.",
    category: mapCategoryFromApi(post?.category),
    likes: Number(post?.likes_count || 0),
    comments: Number(post?.comments_count || 0),
    isLiked: Boolean(post?.is_liked),
    type: "post",
  });

  const normalizeRoom = (room) => ({
    id: room?.id,
    title: room?.title || "Ruang Belajar Tanpa Judul",
    author: room?.author?.full_name || "Anonim",
    authorId: room?.author?.id || null,
    createdAt: formatTime(room?.created_at),
    excerpt: room?.description || "Belum ada deskripsi ruang belajar.",
    category: "Ruang Belajar",
    likes: Number(room?.likes_count || 0),
    comments: 0,
    currentParticipants: Number(room?.current_participants || 0),
    maxParticipants: Number(room?.max_participants || 20),
    isJoined: Boolean(room?.is_joined),
    isActive: Boolean(room?.is_active),
    isLiked: Boolean(room?.is_liked),
    type: "room",
  });

  const fetchForumData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [forumResponse, roomResponse, profileResponse] =
        await Promise.allSettled([
          fetchWithAuth("/api/v1/community/feed/forum", {
            method: "GET",
            cache: "no-store",
          }),
          fetchWithAuth("/api/v1/community/feed/room", {
            method: "GET",
            cache: "no-store",
          }),
          fetchWithAuth("/api/v1/user/profile", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

      const forumDataResult =
        forumResponse.status === "fulfilled" && Array.isArray(forumResponse.value)
          ? forumResponse.value
          : [];

      const roomDataResult =
        roomResponse.status === "fulfilled" && Array.isArray(roomResponse.value)
          ? roomResponse.value
          : [];

      const normalizedPosts = forumDataResult.map(normalizePost);
      const normalizedRooms = roomDataResult.map(normalizeRoom);

      setForumData({
        title: "Forum Community",
        subtitle: "Diskusi dan berbagi dengan komunitas",
        latestPosts: normalizedPosts,
      });

      setStudyRooms(normalizedRooms);

      if (profileResponse.status === "fulfilled") {
        setCurrentUser(profileResponse.value);
      }

      setIsUsingFallback(false);
    } catch (error) {
      console.error("Forum fetch error:", error);
      setIsUsingFallback(true);
      setErrorMessage(
        error?.message ||
          "Data forum gagal dimuat. Menampilkan data fallback sementara."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForumData();
  }, []);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === "Ruang Belajar") return studyRooms;
    if (activeCategory === "Semua") return forumData.latestPosts;

    return forumData.latestPosts.filter(
      (post) =>
        (post?.category || "").toLowerCase() === activeCategory.toLowerCase()
    );
  }, [forumData.latestPosts, studyRooms, activeCategory]);

  const handleChangeForm = (field, value) => {
    setPostForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openModal = () => {
    setSubmitError("");
    setPostForm(initialForm);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitLoading) return;

    setIsModalOpen(false);
    setSubmitError("");
    setPostForm(initialForm);
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();

    if (!postForm.title.trim() || !postForm.content.trim()) {
      setSubmitError("Judul tugas dan isi postingan wajib diisi.");
      return;
    }

    if (
      postForm.category === "Ruang Belajar" &&
      (Number(postForm.maxParticipants) < 1 ||
        Number(postForm.maxParticipants) > 25)
    ) {
      setSubmitError("Jumlah peserta ruang belajar harus antara 1 sampai 25.");
      return;
    }

    try {
      setSubmitLoading(true);
      setSubmitError("");

      if (postForm.category === "Ruang Belajar") {
        const payload = {
          title: postForm.title.trim(),
          description: postForm.content.trim(),
          max_participants: Number(postForm.maxParticipants),
        };

        const result = await fetchWithAuth("/api/v1/community/room", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setIsModalOpen(false);
        setPostForm(initialForm);

        router.push(`/forum/rooms/${result.id}`);
        return;
      }

      const payload = {
        title: postForm.title.trim(),
        content: postForm.content.trim(),
        tags: [],
        category: mapCategoryToApi(postForm.category),
      };

      const result = await fetchWithAuth("/api/v1/community/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const newPost = normalizePost(result);

      setForumData((prev) => ({
        ...prev,
        latestPosts: [newPost, ...prev.latestPosts],
      }));

      setIsModalOpen(false);
      setPostForm(initialForm);
    } catch (error) {
      console.error("Create post/room error:", error);
      setSubmitError(error?.message || "Gagal menambahkan postingan.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const result = await fetchWithAuth(
        `/api/v1/community/posts/${postId}/like`,
        {
          method: "POST",
        }
      );

      setForumData((prev) => ({
        ...prev,
        latestPosts: prev.latestPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: Number(result?.likes_count || 0),
                isLiked: Boolean(result?.is_liked),
              }
            : post
        ),
      }));
    } catch (error) {
      console.error("Like post error:", error);
    }
  };

  const handleLikeRoom = async (roomId) => {
    try {
      const result = await fetchWithAuth(
        `/api/v1/community/room/${roomId}/like?room_id=${roomId}`,
        {
          method: "POST",
        }
      );

      setStudyRooms((prev) =>
        prev.map((room) =>
          room.id === roomId
            ? {
                ...room,
                likes: Number(result?.likes_count || 0),
                isLiked: Boolean(result?.is_liked),
              }
            : room
        )
      );
    } catch (error) {
      console.error("Like room error:", error);
      alert(error?.message || "Gagal menyukai ruang belajar.");
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await fetchWithAuth(`/api/v1/community/rooms/${roomId}/join`, {
        method: "POST",
      });

      // 🔥 UPDATE STATE BIAR LANGSUNG GANTI BUTTON
      setStudyRooms((prev) =>
        prev.map((room) =>
          room.id === roomId
            ? {
                ...room,
                isJoined: true,
                currentParticipants: room.currentParticipants + 1,
              }
            : room
        )
      );

      router.push(`/forum/rooms/${roomId}`);
    } catch (error) {
      console.error("Join room error:", error);
      alert(error?.message || "Gagal masuk ke ruang belajar.");
    }
  };

  const handleOpenRoomChat = (roomId) => {
    router.push(`/forum/rooms/${roomId}`);
  };

  const handleOpenPostDetail = (postId) => {
    router.push(`/forum/posts/${postId}`);
  };

  const isRoomOwner = (room) => {
    if (!currentUser || !room) return false;

    const currentUserId = currentUser?.id;
    const currentUserName = currentUser?.full_name || currentUser?.name;

    return (
      (currentUserId && room.authorId && currentUserId === room.authorId) ||
      (currentUserName &&
        room.author &&
        currentUserName.toLowerCase() === room.author.toLowerCase())
    );
  };

  const renderRoomButton = (room) => {
    const currentParticipants = Number(room.currentParticipants || 0);
    const maxParticipants = Number(room.maxParticipants || 0);

    const isFull =
      maxParticipants > 0 &&
      currentParticipants >= maxParticipants;

    const isOwner = isRoomOwner(room);

    const isJoined =
      room.isJoined === true ||
      isOwner === true;

    // OWNER ATAU SUDAH JOIN
    if (isJoined) {
      return (
        <button
          type="button"
          onClick={() => handleOpenRoomChat(room.id)}
          className="inline-flex h-[34px] min-w-[88px] items-center justify-center rounded-[8px] bg-[#00a651] px-4 text-xs font-semibold text-white transition hover:bg-[#008c45]"
        >
          Lihat Chat
        </button>
      );
    }

    // ROOM PENUH
    if (isFull) {
      return (
        <button
          type="button"
          disabled
          className="inline-flex h-[34px] min-w-[88px] cursor-not-allowed items-center justify-center rounded-[8px] bg-[#c9ced6] px-4 text-xs font-semibold text-white"
        >
          Penuh
        </button>
      );
    }

    // BELUM JOIN
    return (
      <button
        type="button"
        onClick={() => handleJoinRoom(room.id)}
        className="inline-flex h-[34px] min-w-[88px] items-center justify-center rounded-[8px] bg-[#ff1f25] px-4 text-xs font-semibold text-white transition hover:bg-[#e61720]"
      >
        Join
      </button>
    );
  };

  const renderSkeleton = () => {
    return [...Array(3)].map((_, index) => (
      <div
        key={index}
        className="rounded-[18px] border border-[#e9e9e9] bg-white px-6 py-5 shadow-[0_3px_8px_rgba(0,0,0,0.12)]"
      >
        <div className="flex gap-4">
          <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-5 w-72 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded bg-gray-100" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-gray-100" />
            <div className="mt-5 h-4 w-36 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    ));
  };

  return (
    <>
      <main className="min-h-screen bg-[#f3f3f3] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-[1400px]">
          <div className="rounded-[24px] p-2 sm:p-4">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-8 w-60 animate-pulse rounded-md bg-gray-300" />
                    <div className="h-5 w-72 animate-pulse rounded-md bg-gray-200" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-[26px] font-semibold tracking-tight text-[#111111]">
                      {forumData.title}
                    </h1>
                    <p className="mt-3 text-[15px] text-[#5d5d5d]">
                      {forumData.subtitle}
                    </p>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={openModal}
                className="inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-[6px] bg-[#ff1f25] px-6 text-sm font-medium text-white shadow-[0_4px_10px_rgba(0,0,0,0.16)] transition hover:bg-[#e91b22] sm:w-auto sm:min-w-[230px]"
              >
                <Plus size={18} strokeWidth={2.3} />
                Buat Postingan
              </button>
            </div>

            {errorMessage && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b42318]">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-10 overflow-x-auto">
              <div className="flex min-w-max items-center gap-3">
                {categoryTabs.map((tab) => {
                  const isActive = activeCategory === tab;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveCategory(tab)}
                      className={`h-[34px] rounded-[6px] px-4 text-sm font-medium shadow-[0_3px_6px_rgba(0,0,0,0.14)] transition ${
                        isActive
                          ? "bg-[#ff1f25] text-white"
                          : "border border-[#e3e3e3] bg-white text-[#333333] hover:bg-[#fafafa]"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-10 space-y-5">
              {loading ? (
                renderSkeleton()
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((item) => (
                  <article
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      if (item.type === "post") {
                        handleOpenPostDetail(item.id);
                      }
                    }}
                    className={`rounded-[18px] border border-[#e9e9e9] bg-white px-6 py-5 shadow-[0_3px_8px_rgba(0,0,0,0.12)] ${
                      item.type === "post"
                        ? "cursor-pointer transition hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.14)]"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                      <div className="flex min-w-0 flex-1 gap-4">
                        <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#ff2d2d] to-[#d50000] text-white">
                          <MessageCircle size={19} strokeWidth={1.8} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-[18px] font-semibold text-[#111111] sm:text-[20px]">
                            {item.title}
                          </h2>

                          <p className="mt-2 text-sm text-[#6b6b6b]">
                            oleh {item.author} • {item.createdAt}
                          </p>

                          <p className="mt-2 text-[15px] leading-7 text-[#2f2f2f]">
                            {item.excerpt}
                          </p>
                        </div>
                      </div>

                      <div className="sm:pl-4">
                        <span className="inline-flex rounded-full bg-[#f3b7b9] px-4 py-2 text-xs font-medium text-[#ff2d2d] shadow-[0_3px_6px_rgba(0,0,0,0.12)]">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {item.type === "room" && (
                      <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#f6f7f9] px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-[#333333]">
                          <Users size={16} />
                          <span>
                            {item.currentParticipants} / {item.maxParticipants}{" "}
                            peserta
                          </span>
                        </div>

                        {renderRoomButton(item)}
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-8 text-sm text-[#555555]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          if (item.type === "post") {
                            handleLikePost(item.id);
                          } else if (item.type === "room") {
                            handleLikeRoom(item.id);
                          }
                        }}
                        className="flex items-center gap-2 transition hover:text-[#ff1f25]"
                      >
                        <ThumbsUp
                          size={16}
                          strokeWidth={1.9}
                          className={
                            item.isLiked ? "fill-[#ff1f25] text-[#ff1f25]" : ""
                          }
                        />
                        <span>{item.likes}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <MessageCircle size={16} strokeWidth={1.9} />
                        <span>{item.comments} Komentar</span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[#d8d8d8] bg-white px-6 py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff1f2] text-[#ff1d25]">
                    <MessageCircle size={28} />
                  </div>
                  <h4 className="mt-5 text-lg font-semibold text-[#111111]">
                    Belum ada postingan
                  </h4>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[#6b7280]">
                    Belum ada postingan pada kategori{" "}
                    <span className="font-medium text-[#111111]">
                      {activeCategory}
                    </span>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={openModal}
                    className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff1d25] px-5 text-sm font-medium text-white shadow-[0_6px_14px_rgba(0,0,0,0.12)] transition hover:bg-[#e61720]"
                  >
                    <Plus size={17} />
                    Buat Postingan
                  </button>
                </div>
              )}
            </div>

            {isUsingFallback && (
              <div className="mt-6 rounded-xl bg-[#fff7ed] px-4 py-3 text-xs text-[#9a3412]">
                Menampilkan data fallback sementara karena API belum tersedia
                atau sedang bermasalah.
              </div>
            )}
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
          <div className="relative w-full max-w-[680px] rounded-[18px] bg-white px-5 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:px-8 sm:py-8">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#666666] transition hover:bg-[#f5f5f5] hover:text-[#111111]"
            >
              <X size={18} />
            </button>

            <div className="text-center">
              <h2 className="text-[28px] font-bold tracking-tight text-[#111111]">
                Posting forum
              </h2>
              <p className="mt-2 text-[16px] text-[#8a8a8a]">
                Isi detail postingan mu
              </p>
            </div>

            <form onSubmit={handleSubmitPost} className="mt-8">
              <div>
                <label className="mb-3 block text-[16px] font-semibold text-[#111111]">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => handleChangeForm("title", e.target.value)}
                  placeholder="Contoh : Tugas besar algoritma pemograman"
                  className="h-12 w-full rounded-[10px] border border-[#d7d7d7] bg-white px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#9b9b9b] focus:border-[#ff1d25]"
                />
              </div>

              <div className="mt-6">
                <label className="mb-4 block text-[16px] font-semibold text-[#111111]">
                  Kategori
                </label>

                <div className="flex flex-wrap justify-center gap-3">
                  {postCategories.map((category) => {
                    const isSelected = postForm.category === category;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleChangeForm("category", category)}
                        className={`h-[36px] min-w-[120px] flex-1 rounded-[10px] border px-3 text-[13px] font-medium transition ${
                          isSelected
                            ? "border-[#ff1d25] bg-[#ff1d25] text-white"
                            : "border-[#cfcfcf] bg-white text-[#222222] hover:bg-[#fafafa]"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              {postForm.category === "Ruang Belajar" && (
                <div className="mt-6">
                  <label className="mb-3 block text-[16px] font-semibold text-[#111111]">
                    Maksimal Peserta
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={postForm.maxParticipants}
                    onChange={(e) =>
                      handleChangeForm("maxParticipants", e.target.value)
                    }
                    className="h-12 w-full rounded-[10px] border border-[#d7d7d7] bg-white px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#9b9b9b] focus:border-[#ff1d25]"
                  />
                  <p className="mt-2 text-xs text-[#7a7a7a]">
                    Maksimal 25 user dapat masuk ke ruang belajar.
                  </p>
                </div>
              )}

              <div className="mt-6">
                <label className="mb-3 block text-[16px] font-semibold text-[#111111]">
                  Isi postingan
                </label>
                <textarea
                  value={postForm.content}
                  onChange={(e) => handleChangeForm("content", e.target.value)}
                  placeholder="Catatan Tambahan"
                  rows={5}
                  className="w-full resize-none rounded-[10px] border border-[#d7d7d7] bg-white px-4 py-3 text-sm text-[#111111] outline-none transition placeholder:text-[#9b9b9b] focus:border-[#ff1d25]"
                />
              </div>

              {submitError && (
                <div className="mt-4 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b42318]">
                  {submitError}
                </div>
              )}

              <div className="mt-10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitLoading}
                  className="inline-flex h-11 min-w-[112px] items-center justify-center rounded-[8px] bg-[#6c6c6c] px-6 text-sm font-semibold text-white transition hover:bg-[#5d5d5d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="inline-flex h-11 min-w-[112px] items-center justify-center rounded-[8px] bg-[#ff1d25] px-6 text-sm font-semibold text-white transition hover:bg-[#e61720] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitLoading
                    ? "Menyimpan..."
                    : postForm.category === "Ruang Belajar"
                    ? "Buat Room"
                    : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}