import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "Mahasiswa Sukses",
  description: "Belajar Sambil Berkompetisi!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased bg-white text-zinc-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}