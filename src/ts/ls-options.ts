import LS_REPLACER from './ls-replacer'
import { DEFAULT_LANGUAGE_IN, DEFAULT_LANGUAGE_OUT } from './constants'

export default class LS_OPTIONS {
    js_compressor: string
    css_compressor: string
    html_compressor: string
    silent: boolean = false
    js_language_in: string = DEFAULT_LANGUAGE_IN
    js_language_out: string = DEFAULT_LANGUAGE_OUT
    override: boolean = false
    signature_file: string
    replacers: Array<LS_REPLACER | string> = []
}
