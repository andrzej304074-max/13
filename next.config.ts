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
          // tylko HTTPS przez rok (przeglądarka ignoruje nagłówek na http://localhost)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // izolacja od okien i zasobów innych stron
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          // bez indeksowania w wyszukiwarkach (treść tylko dla zalogowanych)
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
