// Used by Jest (babel-jest) only. Webpack defines its own presets in
// webpack.config.js so the JSX transform follows the webpack mode.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic', development: false }],
  ],
};
