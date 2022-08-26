let activeEffect = null;
let a = null;
const bucket = new Set()
const data = {text:'hello world'}
const effect = (fn => {
    fn && (activeEffect = fn) && fn()
})
const obj = new Proxy(data,{
    get(target, key) {
        activeEffect && bucket.add(activeEffect)
        return target[key]
    },
    set(target, key, newVal) {
        target[key] = newVal
        bucket.forEach(fn => {
            fn()
        })
        return true
    }
})
/**
 * 这语法想起了什么？没错就是watch
 */
effect(()=>{
     a = obj.text
     console.log(a)
})