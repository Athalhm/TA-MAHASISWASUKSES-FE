"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import { ArrowLeft, MessageCircle, Send, ThumbsUp, X } from "lucide-react";

export default function PostCommentPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.postId;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formatTime = (value) => {
    if (!value) return "Baru saja";

    const date = new Date(value);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);

    if (Number.isNaN(diff)) return "Baru saja";
    if (diff < 1) return "Baru saja";
    if (diff < 60) return `${diff} menit lalu`;
    if (diff < 1440) return `${Math.floor(diff / 60)} jam lalu`;
    return `${Math.floor(diff / 1440)} hari lalu`;
  };

  const fetchPostDetail = async () => {
    try {
      setLoading(true);

      const postData = await fetchWithAuth(`/api/v1/community/posts/${postId}`);
      const commentData = await fetchWithAuth(
        `/api/v1/community/posts/${postId}/comments`
      );

      setPost({
        ...postData,
        time: formatTime(postData?.created_at),
      });

      setComments(Array.isArray(commentData) ? commentData : []);
    } catch (err) {
      console.error("Post detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) fetchPostDetail();
  }, [postId]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;

    try {
      setSubmitting(true);

      await fetchWithAuth(`/api/v1/community/posts/${postId}/comment`, {
        method: "POST",
        body: JSON.stringify({ comment: commentText.trim() }),
      });

      setCommentText("");
      setShowCommentModal(false);
      fetchPostDetail();
    } catch (err) {
      alert(err.message || "Gagal mengirim komentar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async () => {
    try {
      const res = await fetchWithAuth(
        `/api/v1/community/posts/${postId}/like`,
        { method: "POST" }
      );

      setPost((prev) => ({
        ...prev,
        likes_count: res?.likes_count ?? prev?.likes_count ?? 0,
        is_liked: res?.is_liked ?? prev?.is_liked ?? false,
      }));
    } catch (err) {
      alert(err.message || "Gagal menyukai postingan.");
    }
  };

  const handleLikeComment = (id) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== id) return comment;

        const isLiked = comment.is_liked || false;

        return {
          ...comment,
          is_liked: !isLiked,
          likes: isLiked
            ? (comment.likes || 1) - 1
            : (comment.likes || 0) + 1,
        };
      })
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-4 py-10">
        <section className="mx-auto max-w-[880px]">
          <div className="mb-6 h-4 w-36 animate-pulse rounded bg-gray-200" />
          <div className="h-44 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
          <div className="mt-5 h-48 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
        </section>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-white px-4 py-10">
        <section className="mx-auto max-w-[880px]">
          <button
            onClick={() => router.push("/forum")}
            className="mb-6 flex items-center gap-2 text-sm text-gray-600"
          >
            <ArrowLeft size={16} />
            Kembali ke Forum
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Postingan tidak ditemukan.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <section className="mx-auto max-w-[880px]">
        <button
          onClick={() => router.push("/forum")}
          className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Kembali ke Forum
        </button>

        <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
              <MessageCircle size={20} />
            </div>

            <div className="flex-1">
              <h1 className="text-lg font-bold text-slate-900">
                {post.title}
              </h1>

              <p className="mt-1 text-xs text-gray-500">
                oleh {post.author?.full_name || "Pengguna"} • {post.time}
              </p>

              <p className="mt-3 text-sm leading-6 text-gray-700">
                {post.content}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <button
                onClick={handleToggleLike}
                className="flex items-center gap-2 hover:text-red-500"
              >
                <ThumbsUp
                  size={16}
                  className={
                    post.is_liked ? "fill-red-500 text-red-500" : ""
                  }
                />
                {post.likes_count || 0}
              </button>

              <div className="flex items-center gap-2">
                <MessageCircle size={16} />
                {comments.length} Komentar
              </div>
            </div>
          </div>
        </article>

        <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">
              {comments.length} Komentar
            </h2>

            <button
              onClick={() => setShowCommentModal(true)}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Tulis Komentar
            </button>
          </div>

          <div className="space-y-5">
            {comments.length > 0 ? (
              comments.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                    {(item.author?.full_name || "PG").slice(0, 2)}
                  </div>

                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {item.author?.full_name || "Pengguna"}
                      <span className="ml-2 text-xs font-medium text-gray-400">
                        {formatTime(item.created_at)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-6 text-gray-700">
                      {item.comment}
                    </p>

                    <div className="mt-2 -ml-1">
                      <button
                        onClick={() => handleLikeComment(item.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
                      >
                        <ThumbsUp
                          size={14}
                          className={item.is_liked ? "fill-red-500 text-red-500" : ""}
                        />
                        {item.likes || 0}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                Belum ada komentar untuk postingan ini.
              </p>
            )}
          </div>
        </section>

        {showCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
            <div className="w-full max-w-[560px] rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                Tulis Komentar
                </h2>

                <button
                onClick={() => setShowCommentModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-slate-500 hover:bg-gray-200"
                >
                <X size={18} />
                </button>
            </div>

            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-slate-500">Membalas:</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                {post.title}
                </p>
            </div>

            <label className="mb-2 block text-sm font-bold text-slate-900">
                Komentar Anda <span className="text-red-500">*</span>
            </label>

            <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
                placeholder="Tulis komentar atau jawaban Anda di sini..."
                className="h-36 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-2 text-xs text-slate-400">
                {commentText.length}/500 karakter
            </p>

            <div className="mt-4 rounded-xl border border-blue-300 bg-blue-50 p-4 text-xs text-blue-700">
                <p className="font-bold">Tips Komentar yang Baik:</p>
                <p>• Berikan jawaban atau feedback yang konstruktif</p>
                <p>• Gunakan bahasa yang sopan dan menghormati</p>
                <p>• Jika memberikan saran, jelaskan alasannya</p>
                <p>• Hindari spam atau komentar yang tidak relevan</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                onClick={() => setShowCommentModal(false)}
                disabled={submitting}
                className="rounded-xl bg-gray-100 py-3 text-sm font-bold text-slate-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                Batal
                </button>

                <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || submitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#df2f2f] py-3 text-sm font-bold text-white hover:bg-[#c82727] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                <Send size={15} />
                {submitting ? "Mengirim..." : "Kirim Komentar"}
                </button>
            </div>
            </div>
        </div>
        )}
      </section>
    </main>
  );
}