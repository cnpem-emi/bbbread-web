var fs = require('fs');
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin');

module.exports = {
  publicPath: '',
  transpileDependencies: [
    'vuetify'
  ],
  chainWebpack: config => {
    config.plugin('VuetifyLoaderPlugin').tap(args => [{
      match(originalTag, { kebabTag, camelTag, path, component }) {
        if (kebabTag.startsWith('core-')) {
          return [camelTag, `import ${camelTag} from '@/components/core/${camelTag.substring(4)}.vue'`]
        }
      }
    }]),
      config
        .plugin('html')
        .tap(args => {
          args[0].title = "BBBread Web GUI";
          return args;
        })
  },
  devServer: {
    open: process.platform === 'darwin',
    host: '0.0.0.0',
    https: process.env.NODE_ENV !== "production" ? {
      key: fs.readFileSync('./sim.key'),
      cert: fs.readFileSync('./sim.crt'),
    } : undefined,
    port: 8085,
    hotOnly: false,
  },
}
