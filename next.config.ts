import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // czcionki z public/fonts trzymane w pamięci podręcznej rok – przy podmianie pliku trzeba zmienić jego nazwę
  async headers() {
    return [{ source: "/fonts/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
};

export default nextConfig;
