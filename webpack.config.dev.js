import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
	debug: true,
	devtool: 'inline-source-map',
	noInfo: false,
	entry: [
		path.resolve(__dirname, 'src/example')
	],
	target: 'web',
	output: {
		path: path.resolve(__dirname, 'src'),
		publicPath: '/',
		filename: 'bundle.js'
	},
	plugins: [

		// Create HTML file that includes reference to bundled JS.
		new HtmlWebpackPlugin({
			template: 'src/example.html',
			inject: true
		})
	],
	module: {
		loaders: [
			{test: /\.js$/, exclude: /node_modules/, loaders: ['babel']}
		]
	}
}
