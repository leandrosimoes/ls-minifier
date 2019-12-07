#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const _compressor = require('node-minify')
const DEFAULT_CALLBACK = err => err && console.log(err)
const DEFAULT_LANGUAGE_IN = 'ECMASCRIPT_2018'
const DEFAULT_LANGUAGE_OUT = 'ECMASCRIPT5'

const delay = (miliseconds = 100) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, miliseconds)
    })
}

const asyncForEach = async (arr, callback, miliseconds_delay = 100) => {
    for (let i = 0; i < arr.length; i++) {
        await callback(arr[i])
        await delay(miliseconds_delay)
    }
}

const walk = async (currentDirPath, callback) => {
    const occurencies = fs.readdirSync(currentDirPath)
    await asyncForEach(occurencies, async occurency => {
        const file_path = path.join(currentDirPath, occurency)
        const stat = fs.statSync(file_path)

        if (stat.isFile()) {
            return await callback(file_path, stat)
        }

        if (stat.isDirectory() && file_path.indexOf('node_modules') === -1) {
            return await walk(file_path, callback)
        }
    })
}

const lsMinifier = async (dir, options = {}, callback = DEFAULT_CALLBACK, language_in = DEFAULT_LANGUAGE_IN, language_out = DEFAULT_LANGUAGE_OUT) => {
    const { js_compressor, css_compressor, silent = false } = options

    return await walk(dir, path => {
        return new Promise(resolve => {
            const is_valid_js = path.endsWith('.js') && !path.endsWith('.min.js')

            const is_valid_css = path.endsWith('.css') && !path.endsWith('.min.css')

            if (!is_valid_css && !is_valid_js) {
                resolve()
                return
            }

            const input = path
            const output = path.replace(is_valid_js ? '.js' : '.css', is_valid_js ? '.min.js' : '.min.css')

            const compressor_options = is_valid_js && js_compressor === 'gcc' ? { languageIn: language_in, languageOut: language_out } : {}

            if (!silent) console.log(`Minifying ${path}`)

            _compressor.minify({
                compressor: is_valid_js ? js_compressor : css_compressor,
                input,
                output,
                options: compressor_options,
                callback: (err, min) => {
                    callback(err, min)
                    resolve()
                },
            })
        })
    })
}

if (require.main === module) {
    const args = (process.argv || []).filter(a => a.startsWith('--'))
    const input = (args.find(a => a.startsWith('--input=')) || '').replace('--input=', '') || __dirname
    const silent = !!(args.find(a => a.startsWith('--silent')) || '')
    const js_compressor = (args.find(a => a.startsWith('--js-compressor=')) || '').replace('--js-compressor=', '') || 'yui'
    const css_compressor = (args.find(a => a.startsWith('--css-compressor=')) || '').replace('--css-compressor=', '') || 'yui'
    const language_in = (args.find(a => a.startsWith('--language-in=')) || '').replace('--language-in=', '') || ''
    const language_out = (args.find(a => a.startsWith('--language-out=')) || '').replace('--language-out=', '') || ''

    if (!input) throw new Error('Input Path is required')

    lsMinifier(input, { js_compressor, css_compressor, silent, language_in, language_out })
        .then(() => {
            console.log('Minification finished')
        })
        .catch(err => {
            console.error(err)
        })
} else {
    module.exports = lsMinifier
}
