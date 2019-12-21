document.addEventListener('readystatechange', event => {
    if (document.readyState === 'complete') {
        console.log('Test done')
    }
})
