

const bucket = new WeakMap()

let activeEffect = null; // 收集副作用时的temp 变量，可以绕过函数传参的方式，令编码更自然
const effectStack = []//新增

function effect(fn) {
    const effectFn = () => {
        //调用前将 effectFn 从包含它的依赖集合中移除
        cleanUp(effectFn)
        activeEffect = effectFn
        effectStack.push(effectFn)
        fn()
        effectStack.pop()//新增
        activeEffect = effectStack[effectStack.length -1 ]; //新增
    }
    effectFn.deps = [] //收集 包含当前effectFn 的 依赖集合
    effectFn() // 立即执行一次函数,收集依赖
}

function track(target, key) {
    debugger;
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

    //将依赖集合 加入 当前effectFn 的 deps 数组
    activeEffect.deps.push(effects)
}

function trigger(target, key) {
    debugger;
    const depsMap = bucket.get(target)

    if (!depsMap) {
        return
    }
    const tempEffects = new Set(depsMap.get(key) || [])

    tempEffects.forEach(fn => {
        //优化，如果是  effect 注册阶段，不要出发trigger
        if (fn !== activeEffect) {
            fn()
        }
        // fn()
    })
}

function cleanUp(fn) {
    for (let i = 0; i < fn.deps.length; i++) {
        const effects = fn.deps[i] // 拿到依赖集合
        effects && effects.delete(fn)
    }
    fn.deps.length = 0;
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

const data = {
    foo: 1,
}
const obj = observe(data)

effect(function(){
    obj.foo;
    obj.foo = '2'
})










