# ls-minifier

A tool that minifies all .js and css files in a folder recursivelly using https://www.npmjs.com/package/node-minify

### Installation

    > npm install -g ls-minifier

### Run CLI

    > ls-minifier --input=./your/files/path --js-compressor=gcc --language-in=ECMASCRIPT_2018 --language-out=ECMASCRIPT5 --css-compressor=yui --silent

### Run in your code

`lsMinifier` function has 3 parts: input-path, options, and callback, such that

    lsMinifier([input-path], [options], [callback])

The callback outputs 2 options:

-   **err**: the error of each file
-   **min**: the output of the minified file

##### Example

```javascript
const lsMinifier = require('ls-minifier')
const input_path = './'
const options = {
    silent: true,
    js_compressor: 'gcc',
    css_compressor: 'yui',
    language_in: 'ECMASCRIPT_2018',
    language_out: 'ECMASCRIPT5',
}
const callback = (err, min) => (err ? console.log(err) : console.log(min))

lsMinifier(input_path, options, callback)
```

### Options

-   **input**
    The input path for the files. (Default is the current console path)

-   **silent**
    If silent mode is on, then logs of which files has been found won't be displayed

-   **js_compressor**
    Determines the compression type that js files should be put through. (Default is yui)

-   **language_in** (ONLY FOR GCC COMPRESSOR)
    Determine the version of ecmascript of the input file. (Default is ECMASCRIPT_2018)

-   **language_out** (ONLY FOR GCC COMPRESSOR)
    Determine the version of ecmascript of the input file. (Default is ECMASCRIPT5)

-   **css_compressor**
    Determines the compression type that css files should be put through. (Default is yui)

PS: As **ls-minifier** depends on **node-minify**, these types are defined by **node-minify** and
can be found [here](https://www.npmjs.com/package/node-minify).
