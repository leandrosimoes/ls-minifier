import 'jasmine'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { lsMinifier } from '../src/ts/index'
import LS_OPTIONS from '../src/ts/classes/ls-options'

describe('All Validations', () => {
    const mock_data_path = './spec/mock-data/'
    
    const options = new LS_OPTIONS()
    options.silent = true

    const result_html = '<!doctype html><html lang=en><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><meta http-equiv=X-UA-Compatible content="ie=edge"><link rel=stylesheet href=./style.css><title>Test</title><body><script src=./script.js></script>'
    const result_js = "document.addEventListener('readystatechange',event =>{if(document.readyState === 'complete'){console.log('Test done')}})"
    const result_css = ':root{--red:#f00}html,body{padding:0;background-color:var(--red);margin:0;width:100%;height:100%}'

    it('Should minify without error', async () => {
        expect(async () => {
            await lsMinifier(mock_data_path, options)
        }).not.toThrow()
    })

    it ('Shold HTML result match', async () => {
        await lsMinifier(mock_data_path, options)
        
        const real_result_html = readFileSync(resolve(mock_data_path, 'index.min.html')).toString()
        expect(real_result_html).toEqual(result_html)
    })

    it ('Shold JS result match', async () => {
        await lsMinifier(mock_data_path, options)
        
        const real_result_js = readFileSync(resolve(mock_data_path, 'script.min.js')).toString()
        expect(real_result_js).toEqual(result_js)
    })

    it ('Shold CSS result match', async () => {
        await lsMinifier(mock_data_path, options)
        
        const real_result_css = readFileSync(resolve(mock_data_path, 'style.min.css')).toString()
        expect(real_result_css).toEqual(result_css)
    })
})
