import { InputLoader } from "@framework/internal";
import { BlockMode, BlockType, Extension, Menu, MenuMode } from "@framework/structs";
import { DOM, Random } from "@framework/tools";
export default class MyExtension extends Extension {
    id = "myextension";
    displayName = "My Extension";
    loaders: Record<string, InputLoader> = {
        textarray: {
            load(data) {
                return data.split(/[,;|]/);
            },
        }
    };
    @BlockType.Reporter("返回[sth:menu(a,b,c)=c]")
    returnSth({ sth }: { sth: string }) {
        return sth;
    }
    @MenuMode.RefuseReporters
    @MenuMode.Reactive(true)
    apple = new Menu("苹果,智慧果,超凡子,apple,林檎");
    @BlockType.Command("吃[apple:menu]")
    eatApple({ apple }: { apple: string }) {
        this.apple.items = this.apple.items.filter(item => item.value !== apple);
        alert(`你吃掉了${apple}`);
    }
    @BlockType.Command("吐[apple]")
    addApple({ apple }: { apple: string }) {
        this.apple.items.push({ value: apple, name: apple });
        alert(`你吐出了${apple}`);
    }
    @BlockMode.LabelBefore("数组相关")
    @BlockMode.ToDynamic("data", { joinCh: ",", defaultValues: ["apple,pear,banana", "onion,cabbage,tomato"] })
    @BlockType.Reporter("随机返回[data:textarray]中的一个")
    randomReturn({ data }: { data: string[][] }) {
        return data.flat(Infinity)[Random.integer(0, data.length - 1)];
    }
    @BlockMode.Separator("before")
    @BlockMode.LabelBefore("计算相关")
    @BlockMode.Separator("after")
    @BlockType.Reporter([
        "计算[num1:number=114]+[num2:number=514]",
        "计算[num1:number=114]-[num2:number=514]",
        "计算[num1:number=114]*[num2:number=514]",
        "计算[num1:number=114]/[num2:number=514]"
    ]) calc({ num1, num2 }: { num1: number; num2: number }, overloadIndex: number) {
        const overloadMap = [
            (a: number, b: number) => a + b,
            (a: number, b: number) => a - b,
            (a: number, b: number) => a * b,
            (a: number, b: number) => a / b
        ];
        return overloadMap[overloadIndex](num1, num2);
    }
    @BlockMode.LabelBefore("隐藏区")
    @BlockMode.Hidden
    @BlockType.Command("这个积木已隐藏")
    hiddenBlock() { }
};