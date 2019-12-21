import LS_REPLACER from './ls-replacer';
export default class LS_OPTIONS {
    js_compressor: string;
    css_compressor: string;
    html_compressor: string;
    silent: boolean;
    js_language_in: string;
    js_language_out: string;
    override: boolean;
    signature_file: string;
    replacers: Array<LS_REPLACER | string>;
}
