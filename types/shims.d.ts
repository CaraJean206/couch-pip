// Loose type stubs so `tsc --noEmit` can check this project without
// downloading @decky/ui and React types. With the normal toolchain
// (`pnpm i`), the real types are used instead.

declare module "@decky/ui" {
    export const Router: any;
    export const findModuleChild: any;
    export const findModuleExport: any;
    export const getGamepadNavigationTrees: () => any[];
    export const staticClasses: any;
    export const showModal: (modal: any, parent?: any, props?: any) => { Close: () => void };
    export const ConfirmModal: any;
    export const ModalRoot: any;
    export const DialogButton: any;
    export const Focusable: any;
    export const TextField: any;
    export const ButtonItem: any;
    export const Field: any;
    export const PanelSection: any;
    export const PanelSectionRow: any;
    export const SliderField: any;
    export const ToggleField: any;
    export enum GamepadButton {
        INVALID, OK, CANCEL, SECONDARY, OPTIONS, BUMPER_LEFT, BUMPER_RIGHT, TRIGGER_LEFT, TRIGGER_RIGHT,
        DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT, SELECT, START,
    }
    export type GamepadEvent = CustomEvent<{ button: number; is_repeat?: boolean; source: number }>;
}

declare module "react" {
    export function useState<T>(init: T | (() => T)): [T, (v: T | ((prev: T) => T)) => void];
    export function useEffect(fn: () => void | (() => void), deps?: any[]): void;
    export function useRef<T>(init: T): { current: T };
    const React: any;
    export default React;
}

declare module "react/jsx-runtime" {
    export const jsx: any;
    export const jsxs: any;
    export const Fragment: any;
}

declare module "react-icons/fa" {
    export const FaTv: any;
    export const FaGamepad: any;
    export const FaPlay: any;
    export const FaBackward: any;
    export const FaForward: any;
    export const FaVolumeDown: any;
    export const FaVolumeUp: any;
    export const FaExpand: any;
}

declare namespace JSX {
    interface IntrinsicElements {
        [name: string]: any;
    }
    interface IntrinsicAttributes {
        key?: any;
    }
    type Element = any;
}
