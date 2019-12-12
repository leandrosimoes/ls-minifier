# ls-minifier

A tool that minifies all .js, css and html files in a folder recursivelly using https://www.npmjs.com/package/node-minify

### Installation

    > npm install -g ls-minifier

### Run CLI

    > ls-minifier --version --input=./your/files/path --js-compressor=gcc --language-in=ECMASCRIPT_2018 --language-out=ECMASCRIPT5 --css-compressor=yui --html-compressor=html-minifier --silent --override --signature-file=./path/to/signature.txt --replacers=[VERSION]|v1.0.0;{{YEAR}}|2019

### Run in your code

`lsMinifier` function has 3 parts: input-path, options, and callback, such that

    lsMinifier([input-path], [options], [callback])

-   **input-path**: Can be a directory or a single file

The callback outputs 2 options:

-   **err**: the error of each file
-   **min**: the output of the minified file

##### Example

```javascript
const lsMinifier = require('ls-minifier')
const input_path = './'
const options = {
    silent: true,
    js_language_in: 'ECMASCRIPT_2018',
    js_language_out: 'ECMASCRIPT5',
    js_compressor: 'gcc',
    css_compressor: 'yui',
    html_compressor: 'html-minifier',
    override: false,
    signature_file: '',
    replacers: []
}
const callback = (err, min) => (err ? console.log(err) : console.log(min))

lsMinifier(input_path, options, callback)
```

### Options

-   **silent**
    If silent mode is on, then logs of which files has been found won't be displayed

-   **js_language_in** (ONLY FOR GCC COMPRESSOR)
    Determine the version of ecmascript of the input file. (Default is ECMASCRIPT_2018)

-   **js_language_out** (ONLY FOR GCC COMPRESSOR)
    Determine the version of ecmascript of the input file. (Default is ECMASCRIPT5)

-   **js_compressor**
    Determines the compression type that js files should be put through. (Default is yui)

-   **css_compressor**
    Determines the compression type that css files should be put through. (Default is yui)

-   **html_compressor**
    Determines the compression type that html files should be put through. (Default is html-minifier)

-   **override**
    Determines if will override the original input file or if will create another .min. file. (Default is false)

-   **signature_file**
    Path to a signature file with some text that you want to add to the top of the minified files.

-   **version**
    Show in console the current version of the ls-minifier package.

-   **replacers**
    Use this if you want to replace some keywords in your files. See the sample:

```javascript
const replacers = [
    { from: '[VERSION]', to: 'v1.0.0' },
    { from: '{{YEAR}}', to: '2019' },
]
```

PS: As **ls-minifier** depends on **node-minify**, these types are defined by **node-minify** and
can be found [here](https://www.npmjs.com/package/node-minify).
