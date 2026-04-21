export default defineConfig({
  plugins: {
    vue: {},
  },
  config: {
    projectName: 'airecipe-mobile',
    date: new Date().toISOString(),
    designWidth: 375,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      828: 1.81 / 2,
      375: 2 / 1,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    framework: 'vue3',
    compilerOptions: {
      strict: false,
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
      },
    },
    h5: {
      publicPath: '/',
      router: {
        mode: 'hash',
      },
    },
  },
});
