#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { minify } from 'minify'
import tryToCatch from 'try-to-catch'

const DEFAULT_CALLBACK = (err, _, silent, shouldThrowErrors = false) => {
    if (!!silent && !shouldThrowErrors) return

    const isError = !!err && err instanceof Error
    const isErrorString = !!err && typeof err === 'string'

    let error = undefined

    if (isErrorString) {
        error = new Error(error)
    } else if (isError) {
        error = error
    }

    if (!error) return

    if (shouldThrowErrors) {
        throw error
    } else if (!silent) {
        console.error(error.message)
    }
}
const DEFAULT_LANGUAGE_OUT = '5'
const CONFIG_RC_FILE_NAME = '.ls-minifyrc'
const SIGNATURE_FILE_NAME = '.ls-minify-sign'
let SIGNATURE = ''

const printVersion = () => {
    const infoJSON = fs.readFileSync(path.resolve('./package.json'))
    const info = JSON.parse(infoJSON)
    console.info(`Using ${info.version}`)
}

const signFile = (path, signature_file_path) => {
    const is_valid_js = path.endsWith('.js')
    const is_valid_css = path.endsWith('.css')
    const is_valid_html = path.endsWith('.html') || path.endsWith('.htm')

    let init = ''
    let end = ''

    if (is_valid_js || is_valid_css) {
        init = '/*'
        end = '*/'
    } else if (is_valid_html) {
        init = '<!--'
        end = '-->'
    }

    SIGNATURE = SIGNATURE || fs.readFileSync(signature_file_path).toString()

    const output_file_content = fs.readFileSync(path).toString()
    const signed_file_content = `
${init}
${SIGNATURE}
${end}
${output_file_content.trim()}`

    fs.writeFileSync(path, signed_file_content)
}

const prepareFile = async (input, replacers) => {
    if (!replacers || replacers.length === 0) return input

    const temp = input.replace(
        /(\.js|\.css|\.html|\.htm)/g,
        '.ls-minifier-temp$1'
    )

    const output_file_content = fs.readFileSync(input).toString()
    let final_file_content = output_file_content

    await asyncForEach(replacers, async (r) => {
        const rgx = new RegExp(r.from, 'g')
        final_file_content = final_file_content.replace(rgx, r.to)
    })

    fs.writeFileSync(temp, final_file_content)

    return temp
}

const delay = (miliseconds = 100) => {
    return new Promise((resolve) => {
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
    await asyncForEach(occurencies, async (occurency) => {
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

const deleteTempFile = (path) => {
    if (fs.existsSync(path)) fs.unlinkSync(path)
}

const minifyJS = (path, options, callback) => {
    const {
        silent = false,
        shouldThrowErrors = false,
        js_language_out = DEFAULT_LANGUAGE_OUT,
        override = false,
        signature_file,
        replacers = [],
        js_compressor_options = {},
    } = options

    return new Promise((resolve) => {
        const is_valid_js = path.endsWith('.js') && !path.endsWith('.min.js')

        if (!is_valid_js) {
            resolve()
            return
        }

        const input = path
        const output = !override ? path.replace(/(\.js)/g, '.min$1') : path

        const compressor_options = Object.assign(
            {},
            { js: { compress: { ecma: js_language_out, arrows: false }, format: { safari10: true }, mangle: { safari10: true } } },
            js_compressor_options
        )

        if (!silent) console.info(`Minifying ${path} ... `)

        prepareFile(input, replacers).then(async (inputPath) => {
            const [err, min] = await tryToCatch(
                minify,
                inputPath,
                compressor_options
            )

            fs.writeFileSync(output, min)

            if (signature_file) signFile(output, signature_file)

            if (inputPath.indexOf('.ls-minifier-temp.') > -1)
                deleteTempFile(inputPath)

            callback(err, min, silent, shouldThrowErrors)

            resolve()
        })
    })
}

const minifyCSS = (path, options, callback) => {
    const {
        silent = false,
        shouldThrowErrors = false,
        override = false,
        signature_file,
        replacers = [],
        css_compressor_options = {},
    } = options

    return new Promise((resolve) => {
        const is_valid_css = path.endsWith('.css') && !path.endsWith('.min.css')

        if (!is_valid_css) {
            resolve()
            return
        }

        const input = path
        const output = !override ? path.replace(/(\.css)/g, '.min$1') : path

        if (!silent) console.info(`Minifying ${path} ... `)

        prepareFile(input, replacers).then(async (inputPath) => {
            const [err, min] = await tryToCatch(
                minify,
                inputPath,
                css_compressor_options
            )

            fs.writeFileSync(output, min)

            if (signature_file) signFile(output, signature_file)

            if (inputPath.indexOf('.ls-minifier-temp.') > -1)
                deleteTempFile(inputPath)

            callback(err, min, silent, shouldThrowErrors)

            resolve()
        })
    })
}

const minifyHTML = (path, options, callback) => {
    const {
        silent = false,
        shouldThrowErrors = false,
        override = false,
        signature_file,
        replacers = [],
        html_compressor_options = {},
    } = options

    return new Promise((resolve) => {
        const is_valid_html =
            (path.endsWith('.html') || path.endsWith('.htm')) &&
            !path.endsWith('.min.html') &&
            !path.endsWith('.min.htm')

        if (!is_valid_html) {
            resolve()
            return
        }

        const input = path
        const output = !override
            ? path.replace(/(\.html|\.htm)/g, '.min$1')
            : path

        if (!silent) console.info(`Minifying ${path} ... `)

        prepareFile(input, replacers).then(async (inputPath) => {
            const [err, min] = await tryToCatch(
                minify,
                inputPath,
                html_compressor_options
            )

            fs.writeFileSync(output, min)

            if (signature_file) signFile(output, signature_file)

            if (inputPath.indexOf('.ls-minifier-temp.') > -1)
                deleteTempFile(inputPath)

            callback(err, min, silent, shouldThrowErrors)

            resolve()
        })
    })
}

const run = async (path, options, callback) => {
    await minifyJS(path, options, callback)
    await minifyCSS(path, options, callback)
    await minifyHTML(path, options, callback)
}

const lsMinifier = async (input, options = {}, callback = DEFAULT_CALLBACK) => {
    const stat = fs.statSync(input)

    if (stat.isFile()) return await run(input, options, callback)

    return await walk(input, (path) => run(path, options, callback))
}

const args = (process.argv || []).filter((a) => a.startsWith('--'))
const CWD = process.cwd()

let input = (args.find((a) => a.startsWith('--input=')) || '').replace(
    '--input=',
    ''
)
input = input ? `${CWD}/${input}` : CWD
input = path.resolve(input)

let signature_file =
    (args.find((a) => a.startsWith('--signature-file=')) || '').replace(
        '--signature-file=',
        ''
    ) || ''

const local_signature_file_path = path.resolve(`${CWD}/${SIGNATURE_FILE_NAME}`)

if (!signature_file && fs.existsSync(local_signature_file_path)) {
    signature_file = local_signature_file_path
} else if (signature_file) {
    signature_file = `${CWD}/${signature_file}`
    signature_file = path.resolve(signature_file)
}

let extra_configs = {}

const local_config_rc_file_path = path.resolve(`${CWD}/${CONFIG_RC_FILE_NAME}`)

if (fs.existsSync(local_config_rc_file_path)) {
    extra_configs = JSON.parse(
        fs.readFileSync(local_config_rc_file_path).toString()
    )
}

const silent = !!(args.find((a) => a.startsWith('--silent')) || '')
const shouldThrowErrors = !!(
    args.find((a) => a.startsWith('--throwErrors')) || ''
)
const js_language_out =
    (args.find((a) => a.startsWith('--language-out=')) || '').replace(
        '--language-out=',
        ''
    ) || DEFAULT_LANGUAGE_OUT
const override = !!(args.find((a) => a.startsWith('--override')) || '')
const version = args.find((a) => a.startsWith('--version')) || ''
const replacers = (args.find((a) => a.startsWith('--replacers=')) || '')
    .replace('--replacers=', '')
    .split(';')
    .filter((r) => r.length > 0)
    .map((r) => {
        const [from, to] = r.split('|')
        return { from, to }
    })

if (version) printVersion()

lsMinifier(input, {
    silent,
    shouldThrowErrors,
    js_language_out,
    override,
    signature_file,
    replacers,
    js_compressor_options: extra_configs.js_compressor_options,
    css_compressor_options: extra_configs.css_compressor_options,
    html_compressor_options: extra_configs.html_compressor_options,
})
    .then(() => {
        console.info('Minification finished')
    })
    .catch((err) => {
        if (shouldThrowErrors) {
            throw err
        } else if (!silent) {
            console.error(err)
        }
    })

export default lsMinifier
