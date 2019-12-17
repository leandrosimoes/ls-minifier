import { readFileSync, writeFileSync, statSync, readdirSync, unlinkSync, existsSync, Stats } from 'fs'
import { join, resolve } from 'path'
import { minify } from 'node-minify'

import { asyncForEach } from './utils'
import LS_OPTIONS from './ls-options'
import LS_REPLACER from './ls-replacer'
import { DEFAULT_CALLBACK, DEFAULT_LANGUAGE_IN, DEFAULT_LANGUAGE_OUT } from './constants'

let SIGNATURE: string = ''

const signFile: Function = (input_path: string, signature_file_path: string): void => {
    const is_valid_js: boolean = input_path.endsWith('.js') && !input_path.endsWith('.min.js')
    const is_valid_css: boolean = input_path.endsWith('.css') && !input_path.endsWith('.min.css')
    const is_valid_html: boolean = (input_path.endsWith('.html') || input_path.endsWith('.htm')) && !input_path.endsWith('.min.html') && !input_path.endsWith('.min.htm')

    let init: string = ''
    let end: string = ''

    if (is_valid_js || is_valid_css) {
        init = '/*'
        end = '*/'
    } else if (is_valid_html) {
        init = '<!--'
        end = '-->'
    }

    SIGNATURE = SIGNATURE || readFileSync(signature_file_path).toString()

    const output_file_content: string = readFileSync(input_path).toString()
    const signed_file_content: string = `
${init}
${SIGNATURE}
${end}
${output_file_content}`

    writeFileSync(input_path, signed_file_content)
}

const prepareFile: Function = async (input_path: string, replacers: Array<string>): Promise<string> => {
    if (!replacers || replacers.length === 0) return input_path

    const temp: string = input_path.replace(/(\.js|\.css|\.html|\.htm)/g, '.ls-minifier-temp$1')

    const output_file_content: string = readFileSync(input_path).toString()
    let final_file_content: string = output_file_content

    await asyncForEach(replacers, async (r: LS_REPLACER) => {
        const rgx: RegExp = new RegExp(r.from, 'g')
        final_file_content = final_file_content.replace(rgx, r.to)
    })

    writeFileSync(temp, final_file_content)

    return temp
}

const walk: Function = async (currentDirPath: string, callback: Function): Promise<any> => {
    const occurencies: Array<string> = readdirSync(currentDirPath)
    await asyncForEach(occurencies, async (occurency: string) => {
        const file_path: string = join(currentDirPath, occurency)
        const stat: Stats = statSync(file_path)

        if (stat.isFile()) {
            return await callback(file_path, stat)
        }

        if (stat.isDirectory() && file_path.indexOf('node_modules') === -1) {
            return await walk(file_path, callback)
        }
    })
}

const deleteTempFile: Function = (input_path: string): void => {
    if (existsSync(input_path)) unlinkSync(input_path)
}

const minifyFile: Function = (input_path: string, options: LS_OPTIONS, callback: Function): Promise<void> => {
    const { js_compressor, css_compressor, html_compressor, silent, js_language_in = DEFAULT_LANGUAGE_IN, js_language_out = DEFAULT_LANGUAGE_OUT, override, signature_file, replacers = [] } = options

    return new Promise(resolve => {
        const is_valid_js: boolean = input_path.endsWith('.js') && !input_path.endsWith('.min.js')
        const is_valid_css: boolean = input_path.endsWith('.css') && !input_path.endsWith('.min.css')
        const is_valid_html: boolean = (input_path.endsWith('.html') || input_path.endsWith('.htm')) && !input_path.endsWith('.min.html') && !input_path.endsWith('.min.htm')

        if (!is_valid_css && !is_valid_js && !is_valid_html) {
            resolve()
            return
        }

        const input: string = input_path
        const output: string = !override ? input_path.replace(/(\.js|\.css|\.html|\.htm)/g, '.min$1') : input_path

        let compressor: string = ''
        let compressor_options: any = {}

        if (is_valid_js) {
            // only gcc accept this options
            if (js_compressor === 'gcc') compressor_options = { languageIn: js_language_in, languageOut: js_language_out }

            compressor = js_compressor
        } else if (is_valid_css) {
            compressor = css_compressor
        } else if (is_valid_html) {
            compressor = html_compressor
        }

        if (!silent) console.log(`Minifying ${input_path} ... `)

        prepareFile(input, replacers).then((finalFilePath: string) => {
            minify({
                compressor,
                input: finalFilePath,
                output,
                options: compressor_options,
                callback: (err: Error, min: string) => {
                    if (!!signature_file) signFile(output, signature_file)

                    if (finalFilePath.indexOf('.ls-minifier-temp.') > -1) deleteTempFile(finalFilePath)

                    callback(err, min)
                    resolve()
                },
            })
        })
    })
}

const lsMinifier: Function = async (input_path: string, options: LS_OPTIONS, callback: Function = DEFAULT_CALLBACK): Promise<void> => {
    const stat = statSync(input_path)

    if (stat.isFile()) return await minifyFile(input_path, options, callback)

    return await walk(input_path, (p: string) => minifyFile(p, options, callback))
}

if (require.main === module) {
    const args: Array<string> = (process.argv || []).filter(a => a.startsWith('--'))

    let input: string = (args.find((a: string) => a.startsWith('--input=')) || '').replace('--input=', '')
    input = input ? `${process.cwd()}/${input}` : process.cwd()
    input = resolve(input)

    let signature_file: string = (args.find(a => a.startsWith('--signature-file=')) || '').replace('--signature-file=', '') || ''
    signature_file = signature_file ? `${process.cwd()}/${signature_file}` : ''
    signature_file = signature_file ? resolve(signature_file) : ''

    const silent: boolean = !!(args.find(a => a.startsWith('--silent')) || '')
    const js_compressor: string = (args.find(a => a.startsWith('--js-compressor=')) || '').replace('--js-compressor=', '') || 'yui'
    const css_compressor: string = (args.find(a => a.startsWith('--css-compressor=')) || '').replace('--css-compressor=', '') || 'yui'
    const html_compressor: string = 'html-minifier' // For now, this is the only html compressor that node-minify accepts
    const js_language_in: string = (args.find(a => a.startsWith('--language-in=')) || '').replace('--language-in=', '') || DEFAULT_LANGUAGE_IN
    const js_language_out: string = (args.find(a => a.startsWith('--language-out=')) || '').replace('--language-out=', '') || DEFAULT_LANGUAGE_OUT
    const override: boolean = !!(args.find(a => a.startsWith('--override')) || '')
    const version: boolean = !!(args.find(a => a.startsWith('--version')) || '')
    const replacers: Array<LS_REPLACER> = (args.find(a => a.startsWith('--replacers=')) || '')
        .replace('--replacers=', '')
        .split(';')
        .filter(r => r.length > 0)
        .map(r => {
            const [from, to] = r.split('|')
            return new LS_REPLACER(from, to)
        })

    if (version) {
        const info: any = require('package.json')
        console.log(`Using ${info.version}`)
    }

    lsMinifier(input, { js_compressor, css_compressor, html_compressor, silent, js_language_in, js_language_out, override, signature_file, replacers })
        .then(() => {
            console.log('Minification finished')
        })
        .catch((err: Error) => {
            console.error(err)
        })
} else {
    module.exports = lsMinifier
}
