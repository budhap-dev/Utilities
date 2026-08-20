const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  return {
    entry: './src/index.jsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'assets/[name].[contenthash:8].js' : 'assets/[name].js',
      chunkFilename: isProd ? 'assets/[name].[contenthash:8].js' : 'assets/[name].js',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              // Presets are defined here (not in babel.config.js) so the JSX
              // transform follows webpack's mode. Babel's own env defaults to
              // "development" when NODE_ENV is unset, which made production
              // bundles import jsxDEV from react/jsx-dev-runtime (absent in
              // production React) and render a blank page.
              configFile: false,
              babelrc: false,
              cacheDirectory: true,
              presets: [
                ['@babel/preset-env', { targets: 'defaults', modules: false }],
                ['@babel/preset-react', { runtime: 'automatic', development: !isProd }],
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: [isProd ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|woff2?)$/,
          type: 'asset',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: './public/index.html', favicon: './public/favicon.svg' }),
      ...(isProd ? [new MiniCssExtractPlugin({ filename: 'assets/[name].[contenthash:8].css' })] : []),
    ],
    optimization: {
      splitChunks: { chunks: 'all' },
      runtimeChunk: 'single',
    },
    devServer: {
      historyApiFallback: true,
      hot: true,
      port: 3000,
      static: { directory: path.resolve(__dirname, 'public') },
    },
    performance: { hints: false },
  };
};
