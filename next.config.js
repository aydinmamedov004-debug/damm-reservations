/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// Makes `next dev` use the real Cloudflare bindings (D1, etc. — see
// wrangler.jsonc) via a local proxy, instead of failing to find them.
import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
  initOpenNextCloudflareForDev();
});

module.exports = nextConfig;
