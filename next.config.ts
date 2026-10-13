import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // czcionki z public/fonts trzymane w pamięci podręcznej rok – przy podmianie pliku trzeba zmienić jego nazwę
  async headers() {
    return [
      { source: "/fonts/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      {
        // podstawowe nagłówki bezpieczeństwa: bez osadzania w ramkach obcych stron, bez zgadywania typu plików,
        // bez pełnego adresu w Referer do innych domen; mikrofon/kamera/geolokalizacja niepotrzebne
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
