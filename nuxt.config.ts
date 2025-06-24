// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/robots',
    '@formkit/auto-animate/nuxt',
  ],
  compatibilityDate: '2024-12-26',
  devtools: { enabled: false },
  ssr: false,
  experimental: {
    typedPages: true,
  },
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤥</text></svg>',
        },
      ],
    },
  },
  site: { indexable: false },
  typescript: {
    tsConfig: {
      compilerOptions: {
        noImplicitAny: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: true,
      },
    },
  },
});
