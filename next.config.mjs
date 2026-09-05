const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  images: { remotePatterns: [] },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        handlebars: false
      };
    }

    return config;
  }
};

export default nextConfig;
