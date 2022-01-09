export const flattenArr = (arr) => {
    //map是起始值，然后item是数组中的每一项
    return arr.reduce((map, item) => {
        map[item.id] = item
        return map
    }, {})
}

export const objToArr = (obj) => {
    // 学习下这种写法，遍历对象上的key，返回key对应的value
    return Object.keys(obj).map(key => obj[key])
}

