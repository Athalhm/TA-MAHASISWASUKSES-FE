async function refreshAccessToken() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const refreshToken =
    typeof window !== "undefined"
      ? localStorage.getItem("refresh_token")
      : null;

  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const response = await fetch(`${baseUrl}/api/v1/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Refresh token failed");
  }

  const data = await response.json();

  if (typeof window !== "undefined") {
    localStorage.setItem("token", data.access_token);

    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
  }

  return data.access_token;
}

async function parseResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function getErrorMessage(response) {
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

  return message;
}

export async function fetchWithAuth(url, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  let token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const makeRequest = async (accessToken) => {
    return await fetch(`${baseUrl}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
    });
  };

  let response = await makeRequest(token);

  // 🔥 HANDLE TOKEN EXPIRED
  if (response.status === 401) {
    try {
      token = await refreshAccessToken();
      response = await makeRequest(token);
    } catch {
      if (typeof window !== "undefined") {
        localStorage.clear();
        window.location.href = "/sign-in";
      }
      return;
    }
  }

  // 🔥 HANDLE ERROR OBJECT (biar ga [object Object])
  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new Error(message);
  }

  // 🔥 SAFE PARSE (biar ga error kalau response kosong)
  return await parseResponse(response);
}