
/**
 * 解决 effectFn 和 key 无法对应的问题
 */
const bucket = new WeakMap()

let activeEffect = null; // 收集副作用时的temp 变量，可以绕过函数传参的方式，令编码更自然


function effect(fn) {
    activeEffect = fn;
    fn() // 立即执行一次函数,收集依赖
}

function track(target, key) {
    if (!activeEffect) {
        return
    }
    let depsMap = bucket.get(target)
    if (!depsMap) {
        bucket.set(target, (depsMap = new Map()))
    }
    //副作用函数集合
    let effects = depsMap.get(key)
    if (!effects) {
        depsMap.set(key, (effects = new Set()))
    }
    //将当前副作用函数加入依赖集合,为什么用Set 防止依赖的重复收集
    effects.add(activeEffect)
}

function trigger(target,key) {
    debugger;
    const depsMap = bucket.get(target)

    if (!depsMap) {
        return
    }
    const effects = depsMap.get(key)

    effects && effects.forEach(fn => {
        fn()
    })
}


const data = {
    text: 'hello world',
    ok:true,
}

//只处理了一层
const observe = (data) => {
    return new Proxy(data, {
        get(target, key) {
            track(target, key)
            return target[key]
        },
        set(target, key, nVal) {
            target[key] = nVal
            trigger(target, key)
        }
    })
}
// 响应式数据
const obj = observe(data)


effect(() => {
    console.log(obj.text)
})


obj.text = '111'





