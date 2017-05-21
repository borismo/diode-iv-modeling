var path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'docs')
  },
  resolve: {
    modules: ['src', 'src/assets/js', 'node_modules']
  },
  module: {
    loaders: [
      {
        test: [/\.(html)$/, /\.(txt)$/],
        loader: 'file-loader?name=[path][name].[ext]&context=./src'
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      }

    ]
  }
};