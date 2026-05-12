"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import {
  ArrowLeft,
  Users,
  Circle,
  ThumbsUp,
  Reply,
  Send,
} from "lucide-react";

export default function RoomChatPage() {
  const params = useParams();
  const roomId = params?.roomId;
  const bottomRef = useRef(null);
  const supabaseRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const lastTypingSentRef = useRef(0);
  const userCacheRef = useRef({});
  const ownLikeActionRef = useRef({});

  const [message, setMessage] = useState("");
  const [room, setRoom] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [brokenAvatars, setBrokenAvatars] = useState({});

  useEffect(() => {
    if (roomId) {
      fetchRoomData();
    }
  }, [roomId]);

  useEffect(() => {
    if (!loading && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading, chats]);

  useEffect(() => {
    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      Object.values(typingTimeoutRef.current).forEach((timer) => {
        clearTimeout(timer);
      });

      typingTimeoutRef.current = {};
    };
  }, []);

  function getInitials(name = "User") {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getAvatarColor(userKey = "user") {
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
  }

  function getAvatarUrl(userId) {
    if (!userId) return "";

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return `${baseUrl}/api/v1/user/avatar/${userId}`;
  }

  function formatTime(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function normalizeRoom(data) {
    return {
      id: data?.id,
      title: data?.title || "Ruang Belajar",
      participants: Number(data?.current_participants || 0),
      maxParticipants: Number(data?.max_participants || 0),
      status: data?.is_active ? "Active" : "Inactive",
      authorId: data?.author?.id || null,
      authorName: data?.author?.full_name || data?.author?.username || "Admin",
    };
  }

  function normalizeChat(item, index, user) {
    const authorName =
      item?.author?.username ||
      item?.author?.full_name ||
      item?.author_name ||
      item?.username ||
      "Pengguna";

    const authorId = item?.author?.id || item?.author_id;
    const currentUserId = user?.id;
    const isMe = authorId && currentUserId && authorId === currentUserId;

    return {
      id: item?.id ?? `message-${index}`,
      authorId,
      name: isMe ? "Anda" : authorName,
      time: formatTime(item?.created_at),
      avatar: getInitials(authorName),
      avatarUrl: getAvatarUrl(authorId),
      color: getAvatarColor(authorId || authorName),
      message: item?.content || "",
      likes: Number(item?.likes_count || 0),
      isLiked: Boolean(item?.is_liked),
      replies: 0,
      isMe,
      createdAt: item?.created_at,
    };
  }

  function setupRealtime(user) {
    if (!roomId || !user?.id) return;

    const token = localStorage.getItem("token");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!token || !supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase env atau token belum tersedia.");
      return;
    }

    if (channelRef.current) {
      supabaseRef.current?.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    supabaseRef.current = supabase;

    const channel = supabase.channel(`study_room:${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "study_room_messages",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const newMessage = payload.new;

        if (!newMessage?.id) return;

        setChats((prev) => {
          const alreadyExists = prev.some(
            (chat) => String(chat.id) === String(newMessage.id)
          );

          if (alreadyExists) return prev;

          const cachedUser = userCacheRef.current[newMessage.author_id];

          const normalized = normalizeChat(
            {
              ...newMessage,
              author: {
                id: newMessage.author_id,
                username:
                  cachedUser?.username ||
                  newMessage.author_username ||
                  newMessage.username ||
                  user?.username ||
                  "",
                full_name:
                  cachedUser?.full_name ||
                  newMessage.author_name ||
                  user?.full_name ||
                  "Pengguna",
              },
            },
            prev.length,
            user
          );

          return [...prev, normalized];
        });
      }
    );

    channel.on("broadcast", { event: "message_like_updated" }, (payload) => {
      const likeData = payload?.payload;

      if (!likeData?.messageId) return;

      setChats((prev) =>
        prev.map((chat) =>
          String(chat.id) === String(likeData.messageId)
            ? {
                ...chat,
                likes: Number(likeData.likesCount ?? chat.likes),
                isLiked:
                  likeData.userId === currentUser?.id
                    ? Boolean(likeData.isLiked)
                    : chat.isLiked,
              }
            : chat
        )
      );
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const onlineCount = Object.keys(state).length;

      setRoom((prev) =>
        prev
          ? {
              ...prev,
              participants: onlineCount,
            }
          : prev
      );
    });

    channel.on("broadcast", { event: "typing" }, (payload) => {
      const typingUser = payload?.payload;

      if (!typingUser?.id || typingUser.id === user.id) return;

      const typingName = typingUser.name || "User";

      setTypingUsers((prev) => {
        if (prev.includes(typingName)) return prev;
        return [...prev, typingName];
      });

      if (typingTimeoutRef.current[typingUser.id]) {
        clearTimeout(typingTimeoutRef.current[typingUser.id]);
      }

      typingTimeoutRef.current[typingUser.id] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((name) => name !== typingName));
        delete typingTimeoutRef.current[typingUser.id];
      }, 2000);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          id: user.id,
          name: user.username || user.full_name || "User",
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;
  }

  async function fetchRoomData() {
    try {
      setLoading(true);
      setError("");
      setBrokenAvatars({});

      const [roomFeedResult, messagesResult, profileResult] =
        await Promise.allSettled([
          fetchWithAuth("/api/v1/community/feed/room", {
            method: "GET",
            cache: "no-store",
          }),
          fetchWithAuth(`/api/v1/community/rooms/${roomId}/messages`, {
            method: "GET",
            cache: "no-store",
          }),
          fetchWithAuth("/api/v1/user/profile", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

      const user =
        profileResult.status === "fulfilled" ? profileResult.value : null;

      const roomList =
        roomFeedResult.status === "fulfilled" &&
        Array.isArray(roomFeedResult.value)
          ? roomFeedResult.value
          : [];

      const selectedRoom = roomList.find(
        (item) => String(item?.id) === String(roomId)
      );

      if (selectedRoom) {
        setRoom(normalizeRoom(selectedRoom));
      } else {
        setRoom({
          id: roomId,
          title: "Ruang Belajar",
          participants: 0,
          maxParticipants: 0,
          status: "Active",
          authorId: null,
          authorName: "Admin",
        });
      }

      setCurrentUser(user);

      const messageList =
        messagesResult.status === "fulfilled" &&
        Array.isArray(messagesResult.value)
          ? messagesResult.value
          : [];

      const sortedMessages = [...messageList].sort((a, b) => {
        return new Date(a?.created_at || 0) - new Date(b?.created_at || 0);
      });

      const nextUserCache = {};

      sortedMessages.forEach((item) => {
        const authorId = item?.author?.id || item?.author_id;

        if (!authorId) return;

        nextUserCache[authorId] = {
          id: authorId,
          username: item?.author?.username || item?.username || "",
          full_name:
            item?.author?.full_name ||
            item?.author_name ||
            item?.full_name ||
            "Pengguna",
        };
      });

      if (user?.id) {
        nextUserCache[user.id] = {
          id: user.id,
          username: user.username || "",
          full_name: user.full_name || user.username || "Anda",
        };
      }

      userCacheRef.current = {
        ...userCacheRef.current,
        ...nextUserCache,
      };

      setChats(
        sortedMessages.map((item, index) => normalizeChat(item, index, user))
      );

      setTypingUsers([]);

      if (user) {
        setupRealtime(user);
      }
    } catch (err) {
      console.error("Room chat error:", err);
      setError(err?.message || "Data room gagal dimuat.");
      setChats([]);
    } finally {
      setLoading(false);
    }
  }

  function handleTyping(value) {
    setMessage(value);

    const now = Date.now();

    if (!channelRef.current || !currentUser?.id) return;
    if (now - lastTypingSentRef.current < 500) return;

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        id: currentUser.id,
        name: currentUser.username || currentUser.full_name || "User",
      },
    });

    lastTypingSentRef.current = now;
  }

  async function handleSendMessage() {
    if (!message.trim() || sending) return;

    try {
      setSending(true);

      await fetchWithAuth(`/api/v1/community/rooms/${roomId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: message.trim(),
        }),
      });

      setMessage("");
    } catch (err) {
      console.error("Send message error:", err);
      alert(err?.message || "Gagal mengirim pesan.");
    } finally {
      setSending(false);
    }
  }

  async function handleToggleLike(chatId) {
    if (!chatId) return;

    try {
      const result = await fetchWithAuth(
        `/api/v1/community/room/message/${chatId}/like`,
        {
          method: "POST",
        }
      );

      const nextLikesCount = Number(result?.likes_count ?? 0);
      const nextIsLiked = Boolean(result?.is_liked);

      setChats((prev) =>
        prev.map((chat) =>
          String(chat.id) === String(chatId)
            ? {
                ...chat,
                likes: nextLikesCount,
                isLiked: nextIsLiked,
              }
            : chat
        )
      );

      channelRef.current?.send({
        type: "broadcast",
        event: "message_like_updated",
        payload: {
          messageId: chatId,
          likesCount: nextLikesCount,
          isLiked: nextIsLiked,
          userId: currentUser?.id,
        },
      });
    } catch (err) {
      console.error("Toggle like error:", err);
      alert(err?.message || "Gagal memberi like.");
    }
  }

  function renderAvatar(chat) {
    const avatarKey = chat.authorId || chat.name;
    const isBroken = brokenAvatars[avatarKey];

    if (chat.avatarUrl && !isBroken) {
      return (
        <>
          <img
            src={chat.avatarUrl}
            alt={chat.name}
            className="h-full w-full rounded-full object-cover"
            onError={() => {
              setBrokenAvatars((prev) => ({
                ...prev,
                [avatarKey]: true,
              }));
            }}
          />

          <div
            className={`hidden h-full w-full items-center justify-center rounded-full text-[12px] font-bold text-white ${chat.color}`}
          >
            {chat.avatar}
          </div>
        </>
      );
    }

    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-full text-[12px] font-bold text-white ${chat.color}`}
      >
        {chat.avatar}
      </div>
    );
  }

  const currentRoom = room || {
    title: "Memuat ruang belajar...",
    participants: 0,
    maxParticipants: 0,
    status: "Active",
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
        <div className="flex w-full items-center justify-between px-6 py-3 md:px-10 lg:px-16">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              {loading ? (
                <>
                  <div className="h-4 w-52 animate-pulse rounded bg-slate-200" />
                  <div className="mt-1 h-3 w-32 animate-pulse rounded bg-slate-100" />
                </>
              ) : (
                <>
                  <h1 className="text-[16px] font-semibold text-slate-900 md:text-[17px]">
                    {currentRoom.title}
                  </h1>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {currentRoom.participants}/{currentRoom.maxParticipants}
                    </span>

                    <span className="text-slate-300">•</span>

                    <span className="flex items-center gap-1 text-emerald-600">
                      <Circle size={6} fill="currentColor" />
                      {currentRoom.status}
                    </span>
                  </div>
                </>
              )}

              {error && (
                <p className="mt-1 text-[10px] text-amber-600">{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-6 sm:px-10 md:px-14 lg:px-16">
        <div className="flex-1 bg-slate-50 px-4 py-6 sm:px-10 md:px-24 lg:px-36">
          <div className="flex flex-col gap-6 pb-40">
            {loading ? (
              <div className="space-y-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-start gap-4">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
                    <div className="flex-1">
                      <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
                      <div className="mt-2 h-12 animate-pulse rounded-xl bg-white" />
                    </div>
                  </div>
                ))}
              </div>
            ) : chats.length > 0 ? (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex ${
                    chat.isMe ? "justify-end" : "items-start gap-4"
                  }`}
                >
                  {!chat.isMe && (
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                      {renderAvatar(chat)}
                    </div>
                  )}

                  <div
                    className={`flex max-w-[760px] flex-col ${
                      chat.isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`mb-2 flex items-center gap-1.5 ${
                        chat.isMe ? "justify-end" : ""
                      }`}
                    >
                      {!chat.isMe && (
                        <>
                          <h3 className="text-xs font-bold text-slate-950">
                            {chat.name}
                          </h3>

                          {room?.authorId && chat.authorId && room.authorId === chat.authorId && (
                            <span className="rounded-md bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                              Admin
                            </span>
                          )}
                        </>
                      )}

                      <span className="text-[10px] font-medium text-slate-400">
                        {chat.time}
                      </span>

                      {chat.isMe && (
                        <span className="text-[10px] font-bold text-slate-800">
                          Anda
                        </span>
                      )}
                    </div>

                    <div
                      className={`inline-block max-w-full rounded-xl px-4 py-3 shadow-sm ${
                        chat.isMe
                          ? "bg-red-500 text-white"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                        {chat.message}
                      </p>
                    </div>

                    <div
                      className={`mt-2 flex items-center gap-3 text-[10px] text-slate-500 ${
                        chat.isMe ? "justify-end" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleLike(chat.id)}
                      className={`flex items-center gap-1 transition ${
                        chat.isLiked
                          ? "text-red-500"
                          : "text-slate-500 hover:text-red-500"
                      }`}
                      >
                        <ThumbsUp
                          size={11}
                          className={chat.isLiked ? "fill-red-500 text-red-500" : ""}
                        />
                        {chat.likes}
                      </button>

                      {chat.replies > 0 && (
                        <span className="flex items-center gap-1">
                          <Reply size={11} />
                          {chat.replies} balasan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-[360px] items-center justify-center text-center">
                <p className="text-xs font-medium text-slate-400">
                  Belum ada pesan di ruang belajar ini.
                </p>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      </section>

      {typingUsers.length > 0 && (
        <div className="fixed bottom-[72px] left-0 right-0 z-40 border-t border-slate-200 bg-white px-4 py-2">
          <div className="mx-auto flex max-w-[1100px] items-center gap-2 text-[11px] font-medium text-slate-400">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
            </div>

            <span>{typingUsers.join(", ")} sedang mengetik...</span>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3">
          <div className="flex h-10 flex-1 items-center rounded-xl bg-slate-100 px-4">
            <input
              type="text"
              placeholder="Tulis pesan..."
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={sending || !message.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500 transition hover:bg-red-500 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </main>
  );
}