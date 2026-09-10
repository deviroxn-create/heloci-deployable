const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "photos.zillowstatic.com",
      },
    ],
  },
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
