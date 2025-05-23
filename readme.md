<div align="center">

# FS-Context 🦐
**更优雅的开发通用Scratch拓展**

</div>

## 概览
FS-Context是一个易用的**TypeScript**上下文，用于更优雅的开发通用于*TurboWarp/GandiIDE*等ScratchMod的拓展。提供了一些拓展开发中较常用的工具/脚手架。

## 优势
- **更现代化的码风** 实现基于TypeScript和最新ES标准，简化繁琐的声明步骤并提供类型补全
- **压缩代码和使用第三方库** 使用Webpack打包压缩JavaScript代码，允许导入第三方库
- **平台通用加载器** 在各个平台均可自动加载拓展，无需轮子
- **格式化+统一规范** 使用ESLint优化代码规范和风格
- **通用翻译器** 解决l10n在各个平台实现不统一情况
- **更优雅的积木和菜单声明** 在语法层用更优雅的方式生成声明，无需冗余符号
- **Blockly注入模块完美支持** 动态参数框和文字重载，一步搞定！
- **置前参数预加载** 输入的特定积木参数格式无需在实现内部额外编写加载代码
- **通用工具集** 提供不同拓展间联动上下文和一些工具函数
- **原版解析器** 解析并标准化原版菜单和积木文字的编写方式
- **积木调试器 Waterbox（已弃用）** 有点鸡肋，不再赘述

## 项目初衷
不管在什么平台下，开发拓展都非常的折磨，<u>缺少类型提示/自动补全/代码不易读</u>，以及不同平台对*runtime和vm*的沙盒机制都有严重差异。通用拓展需要编写非常多的并不必要的冗余代码。

因此，本项目旨在提供一些*TS类型提示与工具集*，同时将不同平台加载拓展/获取vm等频繁且常用的操作封装，开发者不需要重复制造轮子，可以专注于**积木逻辑**的开发。

## 对比
（点击查看）
<details>
<summary>案例1：实现四则运算</summary>

> TurboWarp
```js
class MyExtension {
    getInfo() {
        return {
            id: "myextension",
            name: "My Extension",
            blocks: [
                {
                    opcode: "calc",
                    text: "Calculate [a] [method] [b]",
                    arguments: {
                        a: {
                            type: Scratch.ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        b: {
                            type: Scratch.ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        method: {
                            menu: "methods"
                        }
                    },
                    blockType: Scratch.BlockType.REPORTER
                }
            ],
            menu: {
                methods: [
                    {
                        text: "加",
                        value: "0"
                    },
                    {
                        text: "减",
                        value: "1"
                    },
                    {
                        text: "乘",
                        value: "2"
                    },
                    {
                        text: "除",
                        value: "3"
                    },
                ]
            }
        }
    }
    calc(args) {
        const methodMapper = [
            (a, b) => a + b,
            (a, b) => a - b,
            (a, b) => a * b,
            (a, b) => a / b,
        ];
        return methodMapper[args.method].call(null, args.a, args.b)
    }
}
Scratch.extensions.register(new MyExtension());
```
> FS-Context
```ts
import { Extension, BlockType, Menu } from "@framework/structs";
export default class MyExtension extends Extension {
    id = "myextension";
    name = "My Extension";
    menus = [
        new Menu("methods", "+ = 0, - = 1, * = 2, / = 3")
    ];
    @BlockType.Reporter("Calculate [a:number=0] [method:menu=methods] [b:number=0]")
    calc({ a, method, b }) {
        const methodMapper = [
            (a, b) => a + b,
            (a, b) => a - b,
            (a, b) => a * b,
            (a, b) => a / b,
        ];
        return methodMapper[method].call(null, a, b);
    }
};
```
</details>

<details>
<summary>案例2：实现三维向量乘积运算</summary>

> TurboWarp
```js
class MyExtension {
    parseVector(data) {
        const part = data.split(" ");
        part.push(0);
        part.push(0);
        return [
            Scratch.Cast.toNumber(part[0]),
            Scratch.Cast.toNumber(part[1]),
            Scratch.Cast.toNumber(part[2])
        ];
    }
    getInfo() {
        return {
            id: "myextension",
            name: "My Extension",
            blocks: [
                {
                    opcode: "crossVector",
                    text: "Product [a] cross [b]",
                    arguments: {
                        a: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "0 0"
                        },
                        b: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "0 0"
                        }
                    },
                    blockType: Scratch.BlockType.REPORTER
                },
                {
                    opcode: "dotVector",
                    text: "Product [a] dot [b]",
                    arguments: {
                        a: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "0 0"
                        },
                        b: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "0 0"
                        }
                    },
                    blockType: Scratch.BlockType.REPORTER
                }
            ]
        }
    }
    crossVector(args) {
        const v1 = this.parseVector(args.a);
        const v2 = this.parseVector(args.a);
        return [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]
        ];
    }
    dotVector(args) {
        const v1 = this.parseVector(args.a);
        const v2 = this.parseVector(args.a);
        return v1.map((value, index) => value * v2[index]).reduce((sum, current) => sum + current, 0);
    }
}
Scratch.extensions.register(new MyExtension());
```
> FS-Context
```ts
import { Extension, BlockType, Menu } from "@framework/structs";
export default class MyExtension extends Extension {
    id = "myextension";
    name = "My Extension";
    loaders = {
        vector: {
            load(src: string): [number, number, number] {
                const parts: (number | string)[] = src.split(" ");
                parts.push(0);
                parts.push(0);
                return [
                    Scratch.Cast.toNumber(parts[0]),
                    Scratch.Cast.toNumber(parts[1]),
                    Scratch.Cast.toNumber(parts[2])
                ];
            }
        }
    };
    @BlockType.Reporter("Product [a:vector=0 0] cross [b:vector=0 0]")
    cross({ a, b }: { a: number[], b: number[] }) {
        const v1 = a;
        const v2 = b;
        return [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]
        ];
    }
    @BlockType.Reporter("Product [a:vector=0 0] dot [b:vector=0 0]")
    dot({ a, b }: { a: number[], b: number[] }) {
        const v1 = a;
        const v2 = b;
        return v1.map((value, index) => value * v2[index]).reduce((sum, current) => sum + current, 0);
    }
};
```
</details>

不仅体积大量减少的同时也利用了许多最新的语言特性，让源代码更已读。
# 完整文档
[GithubIO](https://rundll86.github.io/fs-context)