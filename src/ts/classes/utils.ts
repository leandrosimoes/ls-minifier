export const delay: Function = (miliseconds: number = 100): Promise<any> => {
    return new Promise((resolve: any) => {
        setTimeout(() => {
            resolve()
        }, miliseconds)
    })
}

export const asyncForEach: Function = async (arr: Array<any>, callback: Function, miliseconds_delay: number = 100): Promise<any> => {
    for (let i = 0; i < arr.length; i++) {
        await callback(arr[i])
        await delay(miliseconds_delay)
    }
}
