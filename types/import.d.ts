interface BlockDefine {
    langStore: Record<string, Record<string, string>>;
    method: string;
    type: string;
    opcode: string;
}
interface MenuDefine {
    name: string;
    options: MenuOptionDefine[];
}
interface MenuOptionDefine {
    text: string;
    value: string;
}
declare module "*.seb" {
    const defaultBlock: BlockDefine;
    const blocks: Record<string, BlockDefine>;
    export default defaultBlock;
    export { blocks };
}
declare module "*.sem" {
    const defaultMenu: MenuDefine;
    const menus: Record<string, MenuDefine>;
    export default defaultMenu;
    export { menus };
}