// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  compatibilityDate: '2024-12-26',
  devtools: { enabled: false },
  ssr: false,
  experimental: {
    typedPages: true,
  },
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
