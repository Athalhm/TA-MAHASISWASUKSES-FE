export async function fetchWithAuth(url, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // 🔥 HANDLE TOKEN EXPIRED
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.href = "/sign-in";
    }
    return;
  }

  // 🔥 HANDLE ERROR OBJECT (biar ga [object Object])
  if (!response.ok) {
    let message = "Terjadi kesalahan";

    try {
      const data = await response.json();
      message =
        typeof data?.detail === "string"
          ? data.detail
          : typeof data?.message === "string"
          ? data.message
          : JSON.stringify(data);
    } catch {
      message = `Request gagal (${response.status})`;
    }

    throw new Error(message);
  }

  // 🔥 SAFE PARSE (biar ga error kalau response kosong)
  try {
    return await response.json();
  } catch {
    return null;
  }
}