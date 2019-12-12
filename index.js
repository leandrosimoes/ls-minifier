#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const _compressor = require('node-minify')
const DEFAULT_CALLBACK = err => err && console.log(err)
const DEFAULT_LANGUAGE_IN = 'ECMASCRIPT_2018'
const DEFAULT_LANGUAGE_OUT = 'ECMASCRIPT5'
let SIGNATURE = ''

const signFile = (path, signature_file_path) => {
    let init = ''
    let end = ''

    if (is_valid_js || is_valid_css) {
        init = '/*'
        end = '*/'
    } else if (is_valid_html) {
        init = '<!--'
        end = '-->'
    }

    SIGNATURE = SIGNATURE || fs.readFileSync(signature_file_path)

    const output_file_content = fs.readFileSync(path)
    const signed_file_content = `
${init}
${SIGNATURE}
${end}
${output_file_content}`

    fs.writeFileSync(path, signed_file_content)
}

const prepareFile = async (input, replacers) => {
    if (!replacers || replacers.length === 0) return input

    const temp = input.replace(/(\.js|\.css|\.html|\.htm)/g, '.ls-minifier-temp$1')

    const output_file_content = fs.readFileSync(input).toString()
    let final_file_content = output_file_content

    await asyncForEach(replacers, async r => {
        const rgx = new RegExp(r.from, "g")
        final_file_content = final_file_content.replace(rgx, r.to)
    })

    fs.writeFileSync(temp, final_file_content)

    return temp
}

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

const deleteTempFile = path => {
    if (fs.existsSync(path)) fs.unlinkSync(path)
}

const minify = (path, options, callback) => {
    const {
        js_compressor,
        css_compressor,
        html_compressor,
        silent = false,
        js_language_in = DEFAULT_LANGUAGE_IN,
        js_language_out = DEFAULT_LANGUAGE_OUT,
        override = false,
        signature_file,
        replacers = [],
    } = options

    return new Promise(resolve => {
        const is_valid_js = path.endsWith('.js') && !path.endsWith('.min.js')
        const is_valid_css = path.endsWith('.css') && !path.endsWith('.min.css')
        const is_valid_html = (path.endsWith('.html') || path.endsWith('.htm')) && !path.endsWith('.min.html') && !path.endsWith('.min.htm')

        if (!is_valid_css && !is_valid_js && !is_valid_html) {
            resolve()
            return
        }

        const input = path
        const output = !override ? path.replace(/(\.js|\.css|\.html|\.htm)/g, '.min$1') : path

        let compressor = ''
        let compressor_options = {}

        if (is_valid_js) {
            // only gcc accept this options
            if (js_compressor === 'gcc') compressor_options = { languageIn: js_language_in, languageOut: js_language_out }

            compressor = js_compressor
        } else if (is_valid_css) {
            compressor = css_compressor
        } else if (is_valid_html) {
            compressor = html_compressor
        }

        if (!silent) console.log(`Minifying ${path} ... `)

        prepareFile(input, replacers).then(inputPath => {
            _compressor.minify({
                compressor,
                input: inputPath,
                output,
                options: compressor_options,
                callback: (err, min) => {
                    if (!!signature_file) signFile(output, signature_file)

                    if (inputPath.indexOf('.ls-minifier-temp.') > -1) deleteTempFile(inputPath)

                    callback(err, min)
                    resolve()
                },
            })
        })
    })
}

const lsMinifier = async (input, options = {}, callback = DEFAULT_CALLBACK) => {
    const stat = fs.statSync(input)

    if (stat.isFile()) return await minify(input, options, callback)

    return await walk(input, path => minify(path, options, callback))
}

if (require.main === module) {
    const args = (process.argv || []).filter(a => a.startsWith('--'))

    let input = (args.find(a => a.startsWith('--input=')) || '').replace('--input=', '')
    input = input ? `${process.cwd()}/${input}` : process.cwd()
    input = path.resolve(input)

    let signature_file = (args.find(a => a.startsWith('--signature-file=')) || '').replace('--signature-file=', '') || ''
    signature_file = signature_file ? `${process.cwd()}/${signature_file}` : ''
    signature_file = signature_file ? path.resolve(signature_file) : ''

    const silent = !!(args.find(a => a.startsWith('--silent')) || '')
    const js_compressor = (args.find(a => a.startsWith('--js-compressor=')) || '').replace('--js-compressor=', '') || 'yui'
    const css_compressor = (args.find(a => a.startsWith('--css-compressor=')) || '').replace('--css-compressor=', '') || 'yui'
    const html_compressor = 'html-minifier' // For now, this is the only html compressor that node-minify accepts
    const js_language_in = (args.find(a => a.startsWith('--language-in=')) || '').replace('--language-in=', '') || DEFAULT_LANGUAGE_IN
    const js_language_out = (args.find(a => a.startsWith('--language-out=')) || '').replace('--language-out=', '') || DEFAULT_LANGUAGE_OUT
    const override = !!(args.find(a => a.startsWith('--override')) || '')
    const version = args.find(a => a.startsWith('--version')) || ''
    const replacers = (args.find(a => a.startsWith('--replacers=')) || '')
        .replace('--replacers=', '')
        .split(';')
        .filter(r => r.length > 0)
        .map(r => {
            const [from, to] = r.split('|')
            return { from, to }
        })

    if (version) {
        const info = require('package.json')
        console.log(`Using ${info.version}`)
    }

    lsMinifier(input, { js_compressor, css_compressor, html_compressor, silent, js_language_in, js_language_out, override, signature_file, replacers })
        .then(() => {
            console.log('Minification finished')
        })
        .catch(err => {
            console.error(err)
        })
} else {
    module.exports = lsMinifier
}
