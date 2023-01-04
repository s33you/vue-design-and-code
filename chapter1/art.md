### 权衡的艺术

#### 命令式和声明式

实现一个功能， 点击弹窗 hello world

```javascript
//命令式
const ele = document.querySelector('#app')

ele.onclick = ()=>{
    alert("hello world")
}
```
```html
<!-- 声明式 -->
<div id="app" @click="()=>{ alert( 'hello world' )}">
```
从以上代码可以看到

命令式的方式更注重过程，体现了代码的 执行逻辑

而声明式的方式更注重结果， 框架或者程序帮我们封装了过程


#### 性能和代码可维护性的权衡

严格来说，声明式代码的 性能  不如 命令式代码 ，命令式代码 可以以最理想的 情况实现 逻辑

```javascript

ele.textContent ='hello world'
//没有一种方法可以比这个性能更好，至少在js代码层面
```
设直接修改的性能消耗为A, 声明式内部封装的程序执行消耗为B（对于 vue 来说，主要体现在找出差异的过程），需要量化 命令式 和 声明式 代码之间的区别，则：

命令式 = A
声明式 = B + A

#### 虚拟DOM 的性能究竟如何




