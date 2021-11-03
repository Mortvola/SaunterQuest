const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const config = (name, env) => ({
  name,
  mode: env.production ? 'production' : 'development',
  devtool: env.production ? 'source-map' : 'inline-source-map',
  entry: `./client/${name.charAt(0).toUpperCase()}${name.slice(1)}.tsx`,
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: `${name}.js`,
    assetModuleFilename: 'images/[name][ext]',
  },
  module: {
    rules: [
      { test: /.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                exportLocalsConvention: 'camelCaseOnly',
                localIdentName: '[name]-[local]-[hash:base64:5]',
              },
              importLoaders: 1,
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-object-rest-spread'],
          },
        },
        exclude: [/node_modules/, /public/],
      },
      {
        test: /\.(vert|frag)$/,
        use: {
          loader: 'webpack-glsl-loader',
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: name === 'app' ? 'main.css' : 'welcome.css',
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
});

module.exports = [
  (env) => config('app', env),
  (env) => config('welcome', env),
];
