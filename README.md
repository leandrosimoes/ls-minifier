# ls-minifier

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/11fa54a446614cafbfd4fe648499899e)](https://app.codacy.com/manual/leandrosimoes/ls-minifier?utm_source=github.com&utm_medium=referral&utm_content=leandrosimoes/ls-minifier&utm_campaign=Badge_Grade_Dashboard)
[![npm version](https://badge.fury.io/js/ls-minifier.svg)](https://badge.fury.io/js/ls-minifier)
![Node.js Package](https://github.com/leandrosimoes/ls-minifier/workflows/Node%2Ejs%20Package/badge.svg)

A tool that minifies all .js, css and html files in a folder recursivelly using https://www.npmjs.com/package/node-minify

### Installation

    > npm install -g ls-minifier

### Run CLI

    > ls-minifier --version --input=./your/files/path --js-compressor=gcc --language-in=ECMASCRIPT_2018 --language-out=ECMASCRIPT5 --css-compressor=yui --html-compressor=html-minifier --silent --override --signature-file=./path/to/signature.txt --replacers=[VERSION]|v1.0.0;{{YEAR}}|2019

### Compressors Configuration File

You can specify some configurations for each compressor using a `.ls-minifyrc` file the must be located at the root of the command execution path. The file must contain a valid JSON object like this:

```json
{
    "js_compressor_options": {
        ...
    },
    "css_compressor_options": {
        ...
    },
    "html_compressor_options": {
        ...
    }
}
```

The options for each compressor you can see at the [here](https://github.com/srod/node-minify/tree/3.6.0)

### Signature File

You can also create a `.ls-minify-sign` file at the root of the command execution to use as a signature to sign each minification. This file must contain just plain text and will omit the `--signature-file` command flag.

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
    replacers: [],
    // EXTRA SPECIFIC OPTIONS FOR THE COMPRESSORS
    js_compressor_options: {
        ...
    },
    css_compressor_options: {
        ...
    },
    html_compressor_options: {
        ...
    }
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
    Determines the compression type that js files should be put through. (All js files will be ignored if this option is not set)

-   **css_compressor**
    Determines the compression type that css files should be put through. (All css files will be ignored if this option is not set)

-   **html_compressor**
    Determines the compression type that html files should be put through. (All html files will be ignored if this option is not set)

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

PS: As **ls-minifier** depends on **node-minify v3.6.0**, these types are defined by **node-minify** and
can be found [here](https://github.com/srod/node-minify/tree/3.6.0).
