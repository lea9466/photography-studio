import type { NextConfig } from "next";

function supabaseStorageHost(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function r2PublicHost(): string | undefined {
  const url =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL
  if (!url) return undefined
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname
  } catch {
    return undefined
  }
}

const supabaseHost = supabaseStorageHost();
const r2Host = r2PublicHost();

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "sharp",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    proxyClientMaxBodySize: "50mb",
    optimizePackageImports: ["@supabase/supabase-js", "@supabase/ssr"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      ...(r2Host
        ? [
            {
              protocol: "https" as const,
              hostname: r2Host,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
