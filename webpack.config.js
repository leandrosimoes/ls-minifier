const isProduction = process.argv.indexOf('production') > -1;
const mode = isProduction ? 'production' : 'development';

module.exports = {
    mode,
    entry: {
        '../dist/index': './src/ts/index'
    },
    output: {
        filename: '[name].js',
        libraryTarget: 'commonjs2'
    },
    resolve: {        
        extensions: ['.tsx', '.ts', '.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /(node_modules|bower_components)/,
                use: 'ts-loader'
            },
            {
                test: /\.jar$/,
                use: 'ignore-loader'
            },
        ]
    },
    target: 'node'
}