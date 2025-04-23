// webpack.config.js
export const module = {
  rules: [
    {
      test: /\.js$/,
      enforce: 'pre',
      use: ['source-map-loader'],
      exclude: /node_modules\/react-datepicker/, // Excluye específicamente este paquete
    },
  ],
};