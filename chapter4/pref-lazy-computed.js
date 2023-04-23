

const bucket = new WeakMap()

let activeEffect = null; // 收集副作用时的temp 变量，可以绕过函数传参的方式，令编码更自然
const effectStack = []

/**
 * 
 * @param {*} getter 
 * @returns 
 */
function computed(getter){

    let value;
    let dirty = true
    const effectFn = effect(getter,{
        lazy:true,
        scheduler:()=>{
            dirty = true // 依赖值变化，更新检测器
            trigger(obj, 'value')
        }
    })
    
    const obj = {
        get value(){
            if(dirty){
                value = effectFn()
                dirty = false
            }
            track(obj,'value')
            return value
        }
    }

    return obj
}

function traverse (value,seen=new Set()){
    if(typeof value !=='object' || value === null || seen.has(value)) return 

    seen.add(value)

    for(const k in value){
        traverse(value[k],seen)
    }
    return value
}


function watch(source, cb,options={}) {
    let getter
    if (typeof source === 'function') {// 说明传递进来的是一个getter函数,只需要watch这个getter函数的返回值
        getter = source
    } else {
        getter = () => traverse(source)
    }
    let oldValue, newValue

    let cleanup;

    function onCleanUp(fn){
        cleanup =fn
    }

    const job =()=>{
        newValue = effectFn() // 数据更新时调用副作用函数，并将更新的值放到newValue上
        if(cleanup){
            cleanup()//先调用上一轮的过期函数
        }
        cb(newValue, oldValue,onCleanUp)
        oldValue = newValue // 更新旧值
    }
    const effectFn = effect(
        () => {
            return getter() // 调用getter函数，要么是读取所有属性，要么是读取特定属性
        },
        {
            lazy: true,
            scheduler:()=>{
                //flush, 刷新时机
                if(options.flush){
                    Promise.resolve().then(job)
                }
                else{
                    job()
                }
            }
        }
    )
    if(options.immediate){
        job()
    }
    else{
        oldValue = effectFn()
    }
}

//新增options
function effect(fn, options = {}) {
    const effectFn = () => {
        //调用前将 effectFn 从包含它的依赖集合中移除
        cleanUp(effectFn)
        activeEffect = effectFn
        effectStack.push(effectFn)
        const res = fn() // 保存函数执行结果
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]; 

        return res //返回值
    }
    effectFn.deps = [] //收集 包含当前effectFn 的 依赖集合
    effectFn.options = options
    if(!options.lazy){
        effectFn() // 立即执行一次函数,收集依赖
    }
    return effectFn
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

    //将依赖集合 加入 当前effectFn 的 deps 数组
    activeEffect.deps.push(effects)
}

function trigger(target, key) {
    const depsMap = bucket.get(target)

    if (!depsMap) {
        return
    }
    const tempEffects = new Set(depsMap.get(key) || [])

    tempEffects.forEach(fn => {
        //优化，如果是  effect 注册阶段，不要出发trigger
        if (fn !== activeEffect) {

            //如果有调度器 ,那么用调度器执行fn
            const scheduler = fn.options.scheduler
            if (scheduler) {
                scheduler(fn)
            }
            else {
                fn()
            }
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

const obj2 = computed(()=>{
    return obj.foo +  1;
})

watch(obj, (nv,ov)=>{
    console.log(nv,ov)
},{
    immediate:true
})

obj.foo = 2


