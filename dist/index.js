var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// decky-global:@decky/ui
var require_ui = __commonJS({
  "decky-global:@decky/ui"(exports, module) {
    module.exports = window.DFL;
  }
});

// decky-global:react
var require_react = __commonJS({
  "decky-global:react"(exports, module) {
    module.exports = window.SP_REACT;
  }
});

// decky-global:react/jsx-runtime
var require_jsx_runtime = __commonJS({
  "decky-global:react/jsx-runtime"(exports, module) {
    module.exports = window.SP_JSX;
  }
});

// src/index.tsx
var import_ui6 = __toESM(require_ui(), 1);

// ../../../opt/npm-tools/node_modules/react-icons/lib/iconBase.mjs
var import_react2 = __toESM(require_react(), 1);

// ../../../opt/npm-tools/node_modules/react-icons/lib/iconContext.mjs
var import_react = __toESM(require_react(), 1);
var DefaultContext = {
  color: void 0,
  size: void 0,
  className: void 0,
  style: void 0,
  attr: void 0
};
var IconContext = import_react.default.createContext && /* @__PURE__ */ import_react.default.createContext(DefaultContext);

// ../../../opt/npm-tools/node_modules/react-icons/lib/iconBase.mjs
var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o, r, i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /* @__PURE__ */ import_react2.default.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return (props) => /* @__PURE__ */ import_react2.default.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = (conf) => {
    var attr = props.attr, size = props.size, title = props.title, svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /* @__PURE__ */ import_react2.default.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /* @__PURE__ */ import_react2.default.createElement("title", null, title), props.children);
  };
  return IconContext !== void 0 ? /* @__PURE__ */ import_react2.default.createElement(IconContext.Consumer, null, (conf) => elem(conf)) : elem(DefaultContext);
}

// ../../../opt/npm-tools/node_modules/react-icons/fa/index.mjs
function FaVolumeUp(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 576 512" }, "child": [{ "tag": "path", "attr": { "d": "M215.03 71.05L126.06 160H24c-13.26 0-24 10.74-24 24v144c0 13.25 10.74 24 24 24h102.06l88.97 88.95c15.03 15.03 40.97 4.47 40.97-16.97V88.02c0-21.46-25.96-31.98-40.97-16.97zm233.32-51.08c-11.17-7.33-26.18-4.24-33.51 6.95-7.34 11.17-4.22 26.18 6.95 33.51 66.27 43.49 105.82 116.6 105.82 195.58 0 78.98-39.55 152.09-105.82 195.58-11.17 7.32-14.29 22.34-6.95 33.5 7.04 10.71 21.93 14.56 33.51 6.95C528.27 439.58 576 351.33 576 256S528.27 72.43 448.35 19.97zM480 256c0-63.53-32.06-121.94-85.77-156.24-11.19-7.14-26.03-3.82-33.12 7.46s-3.78 26.21 7.41 33.36C408.27 165.97 432 209.11 432 256s-23.73 90.03-63.48 115.42c-11.19 7.14-14.5 22.07-7.41 33.36 6.51 10.36 21.12 15.14 33.12 7.46C447.94 377.94 480 319.54 480 256zm-141.77-76.87c-11.58-6.33-26.19-2.16-32.61 9.45-6.39 11.61-2.16 26.2 9.45 32.61C327.98 228.28 336 241.63 336 256c0 14.38-8.02 27.72-20.92 34.81-11.61 6.41-15.84 21-9.45 32.61 6.43 11.66 21.05 15.8 32.61 9.45 28.23-15.55 45.77-45 45.77-76.88s-17.54-61.32-45.78-76.86z" }, "child": [] }] })(props);
}
function FaVolumeDown(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 384 512" }, "child": [{ "tag": "path", "attr": { "d": "M215.03 72.04L126.06 161H24c-13.26 0-24 10.74-24 24v144c0 13.25 10.74 24 24 24h102.06l88.97 88.95c15.03 15.03 40.97 4.47 40.97-16.97V89.02c0-21.47-25.96-31.98-40.97-16.98zm123.2 108.08c-11.58-6.33-26.19-2.16-32.61 9.45-6.39 11.61-2.16 26.2 9.45 32.61C327.98 229.28 336 242.62 336 257c0 14.38-8.02 27.72-20.92 34.81-11.61 6.41-15.84 21-9.45 32.61 6.43 11.66 21.05 15.8 32.61 9.45 28.23-15.55 45.77-45 45.77-76.88s-17.54-61.32-45.78-76.87z" }, "child": [] }] })(props);
}
function FaTv(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 640 512" }, "child": [{ "tag": "path", "attr": { "d": "M592 0H48A48 48 0 0 0 0 48v320a48 48 0 0 0 48 48h240v32H112a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H352v-32h240a48 48 0 0 0 48-48V48a48 48 0 0 0-48-48zm-16 352H64V64h512z" }, "child": [] }] })(props);
}
function FaPlay(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z" }, "child": [] }] })(props);
}
function FaGamepad(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 640 512" }, "child": [{ "tag": "path", "attr": { "d": "M480.07 96H160a160 160 0 1 0 114.24 272h91.52A160 160 0 1 0 480.07 96zM248 268a12 12 0 0 1-12 12h-52v52a12 12 0 0 1-12 12h-24a12 12 0 0 1-12-12v-52H84a12 12 0 0 1-12-12v-24a12 12 0 0 1 12-12h52v-52a12 12 0 0 1 12-12h24a12 12 0 0 1 12 12v52h52a12 12 0 0 1 12 12zm216 76a40 40 0 1 1 40-40 40 40 0 0 1-40 40zm64-96a40 40 0 1 1 40-40 40 40 0 0 1-40 40z" }, "child": [] }] })(props);
}
function FaForward(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M500.5 231.4l-192-160C287.9 54.3 256 68.6 256 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2zm-256 0l-192-160C31.9 54.3 0 68.6 0 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2z" }, "child": [] }] })(props);
}
function FaExpand(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M0 180V56c0-13.3 10.7-24 24-24h124c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H64v84c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12zM288 44v40c0 6.6 5.4 12 12 12h84v84c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12V56c0-13.3-10.7-24-24-24H300c-6.6 0-12 5.4-12 12zm148 276h-40c-6.6 0-12 5.4-12 12v84h-84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24V332c0-6.6-5.4-12-12-12zM160 468v-40c0-6.6-5.4-12-12-12H64v-84c0-6.6-5.4-12-12-12H12c-6.6 0-12 5.4-12 12v124c0 13.3 10.7 24 24 24h124c6.6 0 12-5.4 12-12z" }, "child": [] }] })(props);
}
function FaBackward(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M11.5 280.6l192 160c20.6 17.2 52.5 2.8 52.5-24.6V96c0-27.4-31.9-41.8-52.5-24.6l-192 160c-15.3 12.8-15.3 36.4 0 49.2zm256 0l192 160c20.6 17.2 52.5 2.8 52.5-24.6V96c0-27.4-31.9-41.8-52.5-24.6l-192 160c-15.3 12.8-15.3 36.4 0 49.2z" }, "child": [] }] })(props);
}

// src/util.ts
var import_ui = __toESM(require_ui(), 1);
var PLUGIN_NAME = "Couch PiP";
var POSITION_LABELS = {
  [7 /* TopLeft */]: "Top left",
  [0 /* Top */]: "Top",
  [1 /* TopRight */]: "Top right",
  [2 /* Right */]: "Right",
  [3 /* BottomRight */]: "Bottom right",
  [4 /* Bottom */]: "Bottom",
  [5 /* BottomLeft */]: "Bottom left",
  [6 /* Left */]: "Left",
  [8 /* Center */]: "Center"
};
var ASPECT = 9 / 16;
var MARGINS = [
  { label: "0", value: 0 },
  { label: "S", value: 0.02 },
  { label: "M", value: 0.04 },
  { label: "L", value: 0.07 }
];
var FALLBACK = { width: 854, height: 534, dpr: 1.5 };
var getMainWindow = () => {
  const root = import_ui.Router.WindowStore?.GamepadUIMainWindowInstance;
  return root?.BrowserWindow ?? null;
};
var getScreen = () => {
  const win = getMainWindow();
  if (win && win.innerWidth > 0 && win.innerHeight > 0) {
    return { width: win.innerWidth, height: win.innerHeight, dpr: win.devicePixelRatio || 1, detected: true };
  }
  return { ...FALLBACK, detected: false };
};
var hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
var normalizeUrl = (input) => {
  const t = input.trim();
  if (!t) return t;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) return t;
  if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/|$)/.test(t) || /^[^./]+(:\d+)(\/|$)/.test(t) || /\.local(:\d+)?(\/|$)/.test(t)) {
    return "http://" + t;
  }
  return "https://" + t;
};

// src/decky.ts
var api = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit.connect(1, PLUGIN_NAME);
var callable = (method) => (...args) => api.call(method, ...args);
var routerHook = api.routerHook;
var toaster = api.toaster;
var fetchNoCors = api.fetchNoCors;
var definePlugin = (fn) => () => fn();

// src/pip.tsx
var import_ui2 = __toESM(require_ui(), 1);
var import_react4 = __toESM(require_react(), 1);

// src/backend.ts
var attach = callable("attach");
var detach = callable("detach");
var listTargets = callable("list_targets");
var nav = callable("nav");
var click = callable("click");
var key = callable("key");
var insertText = callable("insert_text");
var media = callable("media");
var back = callable("back");
var reload = callable("reload");
var setOptions = callable("set_options");
var listInputDevices = callable("list_input_devices");
var padsStart = callable("pads_start");
var padsStop = callable("pads_stop");
var padsStatus = callable("pads_status");
var snapshot = callable("snapshot");
var fillStatus = callable("fill_status");
var pointer = callable("pointer");
var ensureAttached = async (url, tries = 8) => {
  let last = { ok: false, error: "not tried" };
  for (let i = 0; i < tries; i++) {
    last = await attach(url);
    if (last.ok) return last;
    await new Promise((r) => setTimeout(r, 500));
  }
  return last;
};
var withPage = async (url, action) => {
  let res = await action();
  if (!res.ok && /not connected|session closed|websocket closed/i.test(res.error ?? "")) {
    const a = await ensureAttached(url, 4);
    if (!a.ok) return { ok: false, error: a.error };
    res = await action();
  }
  return res;
};

// src/store.ts
var import_react3 = __toESM(require_react(), 1);
var STORAGE_KEY = "couch-pip";
var PERSISTED = ["position", "margin", "size", "url", "bookmarks", "useDevicePixels", "autofill", "nudgeX", "nudgeY", "safe"];
var defaults = {
  viewMode: 3 /* Closed */,
  previousMode: 2 /* Picture */,
  position: 1 /* TopRight */,
  visible: true,
  margin: 0.04,
  size: 0.28,
  url: "https://www.youtube.com",
  bookmarks: [],
  useDevicePixels: false,
  showDiagnostics: false,
  autofill: true,
  nudgeX: 0,
  nudgeY: 0,
  update: null,
  safe: false,
  remoteGuideTop: null
};
var load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return { ...defaults, ...saved };
  } catch {
    return { ...defaults };
  }
};
var state = load();
var listeners = /* @__PURE__ */ new Set();
var getState = () => state;
var setState = (update) => {
  const patch = typeof update === "function" ? update(state) : update;
  state = { ...state, ...patch };
  try {
    const saved = {};
    for (const k of PERSISTED) saved[k] = state[k];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
  }
  listeners.forEach((l) => l(state));
};
var useStore = () => {
  const [s, set] = (0, import_react3.useState)(state);
  (0, import_react3.useEffect)(() => {
    listeners.add(set);
    set(state);
    return () => {
      listeners.delete(set);
    };
  }, []);
  return s;
};

// src/pip.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var isCompositionHook = (fn) => {
  if (typeof fn !== "function") return false;
  const src = fn.toString();
  return src.includes("AddMinimumCompositionStateRequest") && src.includes("ChangeMinimumCompositionStateRequest") && src.includes("RemoveMinimumCompositionStateRequest") && !src.includes("m_mapCompositionStateRequests");
};
var useUIComposition = (0, import_ui2.findModuleExport)?.(isCompositionHook) ?? (0, import_ui2.findModuleChild)?.((m) => {
  if (typeof m !== "object") return void 0;
  for (const prop in m) if (isCompositionHook(m[prop])) return m[prop];
});
var lastBounds = null;
var VIEW_NAME = "couchpip";
var Browser = ({ url, visible, bounds, devicePixels }) => {
  useUIComposition?.(1 /* Notification */);
  const [{ view, browser }] = (0, import_react4.useState)(() => {
    const root = import_ui2.Router.WindowStore?.GamepadUIMainWindowInstance;
    const view2 = root.CreateBrowserView(VIEW_NAME);
    return { view: view2, browser: view2.GetBrowser() };
  });
  (0, import_react4.useEffect)(() => {
    browser.SetVisible(visible);
  }, [visible]);
  (0, import_react4.useEffect)(() => {
    view.LoadURL(url);
  }, [url]);
  (0, import_react4.useEffect)(() => {
    const scale = devicePixels ? getScreen().dpr : 1;
    const b = {
      x: Math.round(bounds.x * scale),
      y: Math.round(bounds.y * scale),
      width: Math.round(bounds.width * scale),
      height: Math.round(bounds.height * scale)
    };
    lastBounds = b;
    browser.SetBounds(b.x, b.y, b.width, b.height);
  }, [bounds.x, bounds.y, bounds.width, bounds.height, devicePixels]);
  (0, import_react4.useEffect)(() => () => {
    view.Destroy();
  }, []);
  return null;
};
var getObstructions = () => {
  const trees = (0, import_ui2.getGamepadNavigationTrees)();
  const widthOf = (id) => {
    const win = trees.find((t) => t?.id === id)?.m_Root?.m_element?.ownerDocument?.defaultView;
    return win && !win.document.hidden ? win.outerWidth : 0;
  };
  const keyboard = !!trees.find((t) => t?.id === "virtual keyboard");
  return { nav: widthOf("MainNavMenuContainer"), qam: widthOf("QuickAccess-NA"), keyboard };
};
var useObstructions = () => {
  const [state2, setState2] = (0, import_react4.useState)(getObstructions());
  (0, import_react4.useEffect)(() => {
    const timer = setInterval(() => {
      setState2((cur) => {
        const next = getObstructions();
        return next.nav === cur.nav && next.qam === cur.qam && next.keyboard === cur.keyboard ? cur : next;
      });
    }, 250);
    return () => clearInterval(timer);
  }, []);
  return state2;
};
var computeBounds = (s, obs) => {
  const screen = getScreen();
  const area = {
    x: obs.nav,
    y: 0,
    width: screen.width - obs.nav - obs.qam,
    height: screen.height - (obs.keyboard ? screen.height * 0.45 : 0)
  };
  if (s.viewMode === 4 /* Remote */) {
    const m = Math.round(screen.height * 0.03);
    const guideTop = s.remoteGuideTop ?? screen.height * 0.68;
    const height2 = Math.round(Math.min(screen.height * 0.75, Math.max(screen.height * 0.3, guideTop - m * 2)));
    return { x: area.x + m, y: m, width: area.width - m * 2, height: height2 };
  }
  const margin = Math.round(screen.height * (s.viewMode === 1 /* Expand */ ? 0.04 : s.margin));
  const box = { x: area.x + margin, y: area.y + margin, width: area.width - margin * 2, height: area.height - margin * 2 };
  if (s.viewMode === 1 /* Expand */) return box;
  let width = Math.round(screen.width * s.size);
  let height = Math.round(width * ASPECT);
  if (width > box.width) {
    width = box.width;
    height = Math.round(width * ASPECT);
  }
  if (height > box.height) {
    height = box.height;
    width = Math.round(height / ASPECT);
  }
  let x = box.x;
  let y = box.y;
  const right = box.x + box.width - width;
  const bottom = box.y + box.height - height;
  const centerX = box.x + (box.width - width) / 2;
  const centerY = box.y + (box.height - height) / 2;
  switch (s.position) {
    case 0 /* Top */:
      x = centerX;
      break;
    case 1 /* TopRight */:
      x = right;
      break;
    case 2 /* Right */:
      x = right;
      y = centerY;
      break;
    case 3 /* BottomRight */:
      x = right;
      y = bottom;
      break;
    case 4 /* Bottom */:
      x = centerX;
      y = bottom;
      break;
    case 5 /* BottomLeft */:
      y = bottom;
      break;
    case 6 /* Left */:
      y = centerY;
      break;
    case 7 /* TopLeft */:
      break;
    case 8 /* Center */:
      x = centerX;
      y = centerY;
      break;
  }
  x += (s.nudgeX ?? 0) * screen.width;
  y += (s.nudgeY ?? 0) * screen.height;
  x = Math.min(Math.max(x, box.x), box.x + box.width - width);
  y = Math.min(Math.max(y, box.y), box.y + box.height - height);
  return { x: Math.round(x), y: Math.round(y), width, height };
};
var useAutoAttach = (url, autofill, safe) => {
  (0, import_react4.useEffect)(() => {
    let cancelled = false;
    (async () => {
      await setOptions(autofill, safe);
      if (safe) return;
      const r = await ensureAttached(url, 20);
      if (!cancelled && !r.ok) console.warn("Couch PiP: couldn't connect to page", r.error);
    })();
    return () => {
      cancelled = true;
    };
  }, [url, autofill, safe]);
};
var Pip = () => {
  const s = useStore();
  useAutoAttach(s.url, s.autofill, s.safe);
  const obs = useObstructions();
  const bounds = computeBounds(s, s.viewMode === 4 /* Remote */ ? { nav: 0, qam: 0, keyboard: false } : obs);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Browser, { url: s.url, visible: s.visible, bounds, devicePixels: s.useDevicePixels });
};
var PipOuter = () => {
  const { viewMode } = useStore();
  return viewMode === 3 /* Closed */ ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pip, {});
};

// src/settings.tsx
var import_ui5 = __toESM(require_ui(), 1);
var import_react7 = __toESM(require_react(), 1);

// src/modals.tsx
var import_ui3 = __toESM(require_ui(), 1);
var import_react5 = __toESM(require_react(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var useHidePip = () => {
  (0, import_react5.useEffect)(() => {
    setState({ visible: false });
    return () => setState({ visible: true });
  }, []);
};
var BUILT_IN = [
  { name: "YouTube", url: "https://www.youtube.com" },
  { name: "Netflix", url: "https://www.netflix.com/browse" },
  { name: "Twitch", url: "https://www.twitch.tv" },
  { name: "Plex (app.plex.tv)", url: "https://app.plex.tv/desktop" },
  { name: "Disney+", url: "https://www.disneyplus.com" },
  { name: "Prime Video", url: "https://www.primevideo.com" }
];
var openUrl = (url) => {
  setState((s) => ({
    url: normalizeUrl(url),
    viewMode: s.viewMode === 3 /* Closed */ ? 2 /* Picture */ : s.viewMode,
    visible: true
  }));
};
var AddressModal = ({ closeModal, title, withName }) => {
  useHidePip();
  const [url, setUrl] = (0, import_react5.useState)(withName ? "" : getState().url);
  const [name, setName] = (0, import_react5.useState)("");
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    import_ui3.ConfirmModal,
    {
      closeModal,
      strTitle: title,
      strOKButtonText: withName ? "Save and open" : "Open",
      onOK: () => {
        if (!url.trim()) return;
        const full = normalizeUrl(url);
        if (withName) {
          const bm = { name: name.trim() || hostOf(full), url: full };
          setState((s) => ({ bookmarks: [...s.bookmarks.filter((b) => b.url !== full), bm] }));
        }
        openUrl(full);
      },
      children: [
        withName && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_ui3.TextField, { label: "Name", placeholder: "Jellyfin", value: name, onChange: (e) => setName(e.target.value) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          import_ui3.TextField,
          {
            label: "Address",
            description: withName ? "For a home server, e.g. 192.168.1.20:8096 (Jellyfin) or 192.168.1.20:32400/web (Plex)" : void 0,
            value: url,
            focusOnMount: !withName,
            onChange: (e) => setUrl(e.target.value)
          }
        )
      ]
    }
  );
};
var showAddressModal = () => (0, import_ui3.showModal)(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(AddressModal, { title: "Go to address" }));
var showAddServerModal = () => (0, import_ui3.showModal)(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(AddressModal, { title: "Add a site or server", withName: true }));
var SourcesModal = ({ closeModal }) => {
  useHidePip();
  const { bookmarks, url } = useStore();
  const pick = (u) => {
    openUrl(u);
    closeModal?.();
  };
  const row = { width: "100%", marginBottom: 8, textAlign: "left" };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_ui3.ModalRoot, { closeModal, onCancel: closeModal, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 22, fontWeight: 600, marginBottom: 12 }, children: "Watch\u2026" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_ui3.Focusable, { style: { display: "flex", flexDirection: "column", maxHeight: "60vh", overflowY: "auto" }, children: [
      bookmarks.map((b) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        import_ui3.DialogButton,
        {
          style: row,
          onClick: () => pick(b.url),
          onSecondaryActionDescription: "Remove",
          onSecondaryButton: () => setState((s) => ({ bookmarks: s.bookmarks.filter((x) => x.url !== b.url) })),
          children: [
            "\u2605 ",
            b.name,
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { opacity: 0.6, marginLeft: 8, fontSize: "0.8em" }, children: hostOf(b.url) })
          ]
        },
        b.url
      )),
      BUILT_IN.map((b) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_ui3.DialogButton, { style: row, onClick: () => pick(b.url), children: b.name }, b.url)),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        import_ui3.DialogButton,
        {
          style: row,
          onClick: () => {
            closeModal?.();
            showAddServerModal();
          },
          children: "+ Add Jellyfin, Plex server or any site\u2026"
        }
      ),
      !bookmarks.some((b) => b.url === url) && url && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        import_ui3.DialogButton,
        {
          style: row,
          onClick: () => setState((s) => ({ bookmarks: [...s.bookmarks, { name: hostOf(s.url), url: s.url }] })),
          children: [
            "\u2606 Save current page (",
            hostOf(url),
            ")"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { opacity: 0.6, fontSize: 13, marginTop: 8 }, children: "Press X on a saved item to remove it." })
  ] });
};
var showSourcesModal = () => (0, import_ui3.showModal)(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SourcesModal, {}));
var TypeModal = ({ closeModal, onSend }) => {
  useHidePip();
  const [text, setText] = (0, import_react5.useState)("");
  const [hidden, setHidden] = (0, import_react5.useState)(false);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    import_ui3.ConfirmModal,
    {
      closeModal,
      strTitle: "Type into the page",
      strOKButtonText: "Type",
      strMiddleButtonText: "Type + Enter",
      onMiddleButton: () => {
        onSend(text, true);
        closeModal?.();
      },
      onOK: () => onSend(text, false),
      children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        import_ui3.Focusable,
        {
          onSecondaryActionDescription: hidden ? "Show text" : "Hide text",
          onSecondaryButton: () => setHidden(!hidden),
          children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            import_ui3.TextField,
            {
              focusOnMount: true,
              bIsPassword: hidden,
              description: "Press X to hide the text (for passwords).",
              value: text,
              onChange: (e) => setText(e.target.value)
            }
          )
        }
      )
    }
  );
};
var showTypeModal = (onSend) => (0, import_ui3.showModal)(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TypeModal, { onSend }));

// src/remote.tsx
var import_ui4 = __toESM(require_ui(), 1);
var import_react6 = __toESM(require_react(), 1);
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var GUIDE = [
  ["D-pad", "Move highlight"],
  ["A", "Select / click"],
  ["B", "Exit remote"],
  ["X", "Play / pause"],
  ["Y", "Type text"],
  ["L1 / R1", "Back / ahead 10s"],
  ["L2 / R2", "Volume"],
  ["View", "Browser back"],
  ["Menu", "Fill window / full page"],
  ["Right pad / stick", "Mouse"],
  ["Right pad click", "Click"],
  ["Left pad", "Scroll"]
];
var bit = (value, n) => Math.floor(Number(value) / 2 ** n) % 2 === 1;
var PAD_RANGE = 65536;
var PAD_SPEED = 0.9;
var SCROLL_SPEED = 2;
var ASPECT_FIX = 16 / 9;
var padStats = {
  state: 0,
  // controller state packets from Steam
  stateWithPads: 0,
  // packets with trackpad movement or touch
  last: "",
  wheel: 0,
  // DOM scroll-wheel events
  mouse: 0,
  // DOM mouse movement events
  clicks: 0,
  buttons: [],
  // recent button codes we didn't otherwise use
  sent: 0,
  // pointer commands sent to the page
  error: "",
  api: "",
  // which Steam input channel is in use
  analog: {},
  // analog messages per source
  analogLast: "",
  hid: null
  // direct controller reading (backend)
};
var findSteamInput = () => {
  const candidates = [];
  try {
    candidates.push((0, eval)("typeof SteamClient !== 'undefined' ? SteamClient : undefined"));
  } catch {
  }
  candidates.push(globalThis.SteamClient, window.SteamClient, getMainWindow()?.SteamClient);
  for (const c of candidates) if (c?.Input) return c.Input;
  return null;
};
var SRC_LEFT_PAD = 1;
var SRC_RIGHT_PAD = 2;
var SRC_RIGHT_STICK = 12;
var usePadMouse = () => {
  (0, import_react6.useEffect)(() => {
    const acc = { dx: 0, dy: 0, wheel: 0, click: false };
    let right = null;
    let left = null;
    let rightClickDown = false;
    let stick = { x: 0, y: 0 };
    let inflight = false;
    const cleanups = [];
    const input = findSteamInput();
    const apis = [];
    if (input?.RegisterForControllerStateChanges) {
      apis.push("state");
      const reg = input.RegisterForControllerStateChanges((changes) => {
        for (const c of changes) {
          padStats.state++;
          const b = c.ulButtons;
          const rx = c.sRightPadX ?? 0, ry = c.sRightPadY ?? 0;
          const lx = c.sLeftPadX ?? 0, ly = c.sLeftPadY ?? 0;
          const rTouch = bit(b, 20) || rx !== 0 || ry !== 0;
          const lTouch = bit(b, 19) || lx !== 0 || ly !== 0;
          if (rTouch || lTouch) {
            padStats.stateWithPads++;
            padStats.last = `R ${rx},${ry} L ${lx},${ly} btn ${Number(b).toString(16)}`;
          }
          if (rTouch) {
            if (right) {
              const dx = (rx - right.x) / PAD_RANGE;
              const dy = (ry - right.y) / PAD_RANGE;
              if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
                acc.dx += dx * PAD_SPEED;
                acc.dy -= dy * PAD_SPEED * ASPECT_FIX;
              }
            }
            right = { x: rx, y: ry };
          } else {
            right = null;
          }
          if (lTouch) {
            if (left) {
              const dy = (ly - left.y) / PAD_RANGE;
              if (Math.abs(dy) < 0.25) acc.wheel -= dy * SCROLL_SPEED;
            }
            left = { x: lx, y: ly };
          } else {
            left = null;
          }
          const click2 = bit(b, 18);
          if (click2 && !rightClickDown) acc.click = true;
          rightClickDown = click2;
          stick = { x: (c.sRightStickX ?? 0) / 32767, y: (c.sRightStickY ?? 0) / 32767 };
        }
      });
      cleanups.push(() => reg?.unregister?.());
    }
    if (input?.RegisterForControllerAnalogInputMessages) {
      apis.push("analog");
      const lastPad = {};
      const norm = (v) => Math.abs(v) > 1.5 ? v / 32767 : v;
      const reg = input.RegisterForControllerAnalogInputMessages((msgs) => {
        const now = Date.now();
        for (const m of msgs) {
          const src = m.nA;
          const x = norm(m.x ?? 0), y = norm(m.y ?? 0);
          padStats.analog[src] = (padStats.analog[src] ?? 0) + 1;
          padStats.analogLast = `${src}: ${x.toFixed(2)},${y.toFixed(2)}`;
          if (src === SRC_RIGHT_PAD || src === SRC_LEFT_PAD) {
            const prev = lastPad[src];
            if (prev && now - prev.at < 150 && (x !== 0 || y !== 0)) {
              const dx = (x - prev.x) / 2, dy = (y - prev.y) / 2;
              if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
                if (src === SRC_RIGHT_PAD) {
                  acc.dx += dx * PAD_SPEED;
                  acc.dy -= dy * PAD_SPEED * ASPECT_FIX;
                } else {
                  acc.wheel -= dy * SCROLL_SPEED;
                }
              }
            }
            lastPad[src] = x !== 0 || y !== 0 ? { x, y, at: now } : null;
          } else if (src === SRC_RIGHT_STICK) {
            stick = { x, y };
          }
        }
      });
      cleanups.push(() => reg?.unregister?.());
      if (input.EnableControllerAnalogInputMessages) {
        try {
          input.EnableControllerAnalogInputMessages(true);
          apis[apis.length - 1] = "analog (on)";
          cleanups.push(() => {
            try {
              input.EnableControllerAnalogInputMessages(false);
            } catch {
            }
          });
        } catch (e) {
          padStats.error = `couldn't switch on analog input: ${e}`;
        }
      }
    }
    padStats.api = apis.join("+") || "none";
    if (!apis.length) {
      const names = input ? Object.keys(Object.getPrototypeOf(input) ?? {}).concat(Object.keys(input)) : [];
      const reg = names.filter((n) => /Register.*(Controller|Input|Touch)/.test(n));
      padStats.error = input ? `no controller channel; Input has: ${reg.slice(0, 12).join(", ") || "(none listed)"}` : "Steam Input API not found";
    }
    const win = getMainWindow();
    if (win) {
      const onWheel = (e) => {
        padStats.wheel++;
        const px = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * win.innerHeight : e.deltaY;
        acc.wheel += px / win.innerHeight;
      };
      const onMove = (e) => {
        if (!e.movementX && !e.movementY) return;
        padStats.mouse++;
        acc.dx += e.movementX / win.innerWidth;
        acc.dy += e.movementY / win.innerHeight;
      };
      const onDown = (e) => {
        if (e.button !== 0) return;
        padStats.clicks++;
        acc.click = true;
      };
      win.addEventListener("wheel", onWheel, { passive: true, capture: true });
      win.addEventListener("mousemove", onMove, { capture: true });
      win.addEventListener("mousedown", onDown, { capture: true });
      cleanups.push(() => {
        win.removeEventListener("wheel", onWheel, { capture: true });
        win.removeEventListener("mousemove", onMove, { capture: true });
        win.removeEventListener("mousedown", onDown, { capture: true });
      });
    }
    padsStart().then((st) => padStats.hid = st).catch(() => void 0);
    const hidPoll = setInterval(() => {
      padsStatus().then((st) => padStats.hid = st).catch(() => void 0);
    }, 1e3);
    cleanups.push(() => {
      clearInterval(hidPoll);
      padsStop().catch(() => void 0);
    });
    const timer = setInterval(() => {
      const mag = Math.hypot(stick.x, stick.y);
      const deadzone = 0.2;
      if (mag > deadzone) {
        const k = ((mag - deadzone) / (1 - deadzone)) ** 2 * 0.02 / mag;
        acc.dx += stick.x * k;
        acc.dy -= stick.y * k * ASPECT_FIX;
      }
      if ((padStats.hid?.reports ?? 0) > 0) {
        acc.dx = acc.dy = acc.wheel = 0;
      }
      const moved = Math.abs(acc.dx) + Math.abs(acc.dy) > 5e-4;
      const scrolled = Math.abs(acc.wheel) > 2e-3;
      if (!moved && !scrolled && !acc.click || inflight) return;
      const send = { ...acc };
      acc.dx = acc.dy = acc.wheel = 0;
      acc.click = false;
      inflight = true;
      padStats.sent++;
      pointer(send.dx, send.dy, scrolled ? send.wheel : 0, send.click).then((r) => {
        padStats.error = r.ok ? "" : r.error ?? "";
      }).catch((e) => {
        padStats.error = String(e);
      }).finally(() => {
        inflight = false;
      });
    }, 33);
    cleanups.push(() => clearInterval(timer));
    return () => cleanups.forEach((f) => f());
  }, []);
};
var clickAtCursor = () => {
  padStats.sent++;
  return pointer(0, 0, 0, true).then((r) => {
    padStats.error = r.ok ? "" : r.error ?? "";
  });
};
var PadReadout = () => {
  const [, tick] = (0, import_react6.useState)(0);
  (0, import_react6.useEffect)(() => {
    const t = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, []);
  const p = padStats;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { fontSize: 11, opacity: 0.55, marginTop: 4, fontFamily: "monospace", wordBreak: "break-all" }, children: [
    p.hid ? `controller: ${p.hid.devices} dev \xB7 ${p.hid.reports} reports \xB7 ${p.hid.touches} touch \xB7 ${p.hid.sent} sent${p.hid.error ? " \xB7 " + p.hid.error : ""} \xB7 ` : "controller: \u2026 \xB7 ",
    "input: ",
    p.api || "\u2026",
    " \xB7 pads: state ",
    p.state,
    " (touch ",
    p.stateWithPads,
    ") \xB7 analog",
    " ",
    Object.entries(p.analog).map(([k, v]) => `${k}:${v}`).join(" ") || 0,
    p.analogLast ? ` (${p.analogLast})` : "",
    " \xB7 wheel ",
    p.wheel,
    " \xB7 mouse ",
    p.mouse,
    " \xB7 clicks ",
    p.clicks,
    " \xB7 sent ",
    p.sent,
    p.buttons.length ? ` \xB7 buttons ${p.buttons.join(",")}` : "",
    p.last ? ` \xB7 ${p.last}` : "",
    p.error ? ` \xB7 ${p.error}` : ""
  ] });
};
var RemoteModal = ({ closeModal }) => {
  const [status, setStatus] = (0, import_react6.useState)("Connecting to the page\u2026");
  const busy = (0, import_react6.useRef)(false);
  const guideRef = (0, import_react6.useRef)(null);
  (0, import_react6.useEffect)(() => {
    const measure = () => {
      const top = guideRef.current?.getBoundingClientRect().top;
      if (top && top > 0 && Math.abs(top - (getState().remoteGuideTop ?? 0)) > 2) {
        setState({ remoteGuideTop: Math.round(top) });
      }
    };
    measure();
    const t = setInterval(measure, 500);
    return () => {
      clearInterval(t);
      setState({ remoteGuideTop: null });
    };
  }, []);
  usePadMouse();
  (0, import_react6.useEffect)(() => {
    setState((s) => ({
      previousMode: s.viewMode === 4 /* Remote */ || s.viewMode === 3 /* Closed */ ? 2 /* Picture */ : s.viewMode,
      viewMode: 4 /* Remote */,
      visible: true
    }));
    ensureAttached(getState().url).then(
      (r) => setStatus(r.ok ? "Ready. Use the D-pad to move around the page." : `Can't control this page: ${r.error}`)
    );
    return () => setState((s) => ({ viewMode: s.previousMode, visible: true }));
  }, []);
  const run = async (action, label) => {
    if (busy.current) return null;
    busy.current = true;
    try {
      const r = await withPage(getState().url, action);
      if (r.ok) {
        const text = label ? label(r.result) : typeof r.result === "string" ? r.result : "";
        if (text) setStatus(text);
      } else {
        setStatus(r.error ?? "Something went wrong");
      }
      return r;
    } finally {
      busy.current = false;
    }
  };
  const typeText = () => showTypeModal(async (text, enter) => {
    if (text) await run(() => insertText(text));
    if (enter) await run(() => key("Enter"));
  });
  const onButtonDown = (e) => {
    switch (e.detail.button) {
      case import_ui4.GamepadButton.DIR_UP:
        run(() => nav("up"));
        break;
      case import_ui4.GamepadButton.DIR_DOWN:
        run(() => nav("down"));
        break;
      case import_ui4.GamepadButton.DIR_LEFT:
        run(() => nav("left"));
        break;
      case import_ui4.GamepadButton.DIR_RIGHT:
        run(() => nav("right"));
        break;
      case import_ui4.GamepadButton.SECONDARY:
        run(() => media("toggle", 0));
        break;
      case import_ui4.GamepadButton.OPTIONS:
        typeText();
        break;
      case import_ui4.GamepadButton.BUMPER_LEFT:
        run(() => media("seek", -10));
        break;
      case import_ui4.GamepadButton.BUMPER_RIGHT:
        run(() => media("seek", 10));
        break;
      case import_ui4.GamepadButton.TRIGGER_LEFT:
        run(() => media("volume", -0.1));
        break;
      case import_ui4.GamepadButton.TRIGGER_RIGHT:
        run(() => media("volume", 0.1));
        break;
      case import_ui4.GamepadButton.SELECT:
        run(() => back());
        break;
      case import_ui4.GamepadButton.START:
        run(() => media("fill", 0));
        break;
      case 22:
        padStats.clicks++;
        clickAtCursor();
        break;
      default:
        if (e.detail.button > import_ui4.GamepadButton.CANCEL) {
          padStats.buttons = [...padStats.buttons.slice(-5), e.detail.button];
        }
        return;
    }
  };
  const onActivate = async () => {
    const r = await run(() => click(), (res) => res === "editable" ? "Text box selected" : res);
    if (r?.ok && r.result === "editable") typeText();
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_ui4.ModalRoot, { closeModal, onCancel: closeModal, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    import_ui4.Focusable,
    {
      noFocusRing: true,
      onActivate,
      onButtonDown,
      onOKActionDescription: "Select",
      onCancelActionDescription: "Exit remote",
      onSecondaryActionDescription: "Play / pause",
      onOptionsActionDescription: "Type",
      style: { height: "68vh", display: "flex", flexDirection: "column", justifyContent: "flex-end" },
      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { ref: guideRef, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: 15, marginBottom: 6, color: "#dcdedf" }, children: status }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: "2px 14px", fontSize: 12, opacity: 0.75 }, children: GUIDE.map(([button, action]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("b", { children: button }),
          " ",
          action
        ] }, button)) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PadReadout, {})
      ] })
    }
  ) });
};
var showRemote = () => (0, import_ui4.showModal)(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RemoteModal, {}));

// src/updates.ts
var VERSION = true ? "0.4.0" : "0.0.0";
var VERSION_URL = "https://raw.githubusercontent.com/CaraJean206/couch-pip/main/version.json";
var isNewer = (a, b) => {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
};
var getJson = async (url) => {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (r.ok) return await r.json();
  } catch {
  }
  if (fetchNoCors) {
    const r = await fetchNoCors(url);
    if (r.ok) return await r.json();
  }
  throw new Error("Couldn't reach GitHub");
};
var checkForUpdate = async () => {
  const info = await getJson(`${VERSION_URL}?t=${Date.now()}`);
  if (!info?.version || !info?.zip) throw new Error("version.json is incomplete");
  const update = isNewer(info.version, VERSION) ? info : null;
  setState({ update });
  return update;
};
var installUpdate = (u) => {
  const backend = window.DeckyBackend;
  return backend.call("utilities/install_plugin", u.zip, PLUGIN_NAME, u.version, u.sha256 ?? "", 2);
};
var startUpdateChecks = () => {
  let notified = "";
  const run = async () => {
    try {
      const u = await checkForUpdate();
      if (u && notified !== u.version) {
        notified = u.version;
        toaster?.toast?.({
          title: `${PLUGIN_NAME} ${u.version} is available`,
          body: `Open ${PLUGIN_NAME} in the Quick Access Menu to update.`
        });
      }
    } catch (e) {
      console.warn(`${PLUGIN_NAME}: update check failed`, e);
    }
  };
  const first = setTimeout(run, 2e4);
  const every = setInterval(run, 6 * 60 * 60 * 1e3);
  return () => {
    clearTimeout(first);
    clearInterval(every);
  };
};

// src/settings.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var nearestIndex = (list, v) => list.reduce((best, item, i) => Math.abs(item.value - v) < Math.abs(list[best].value - v) ? i : best, 0);
var GRID = [
  [7 /* TopLeft */, 0 /* Top */, 1 /* TopRight */],
  [6 /* Left */, 8 /* Center */, 2 /* Right */],
  [5 /* BottomLeft */, 4 /* Bottom */, 3 /* BottomRight */]
];
var PositionGrid = () => {
  const { position } = useStore();
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { width: "100%" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { fontSize: 14, marginBottom: 6 }, children: [
      "Position: ",
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: POSITION_LABELS[position] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      import_ui5.Focusable,
      {
        "flow-children": "grid",
        style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 4,
          aspectRatio: "16 / 9",
          padding: 4,
          borderRadius: 6,
          border: "2px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.25)"
        },
        children: GRID.flat().map((p) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          import_ui5.DialogButton,
          {
            onClick: () => setState({ position: p, nudgeX: 0, nudgeY: 0 }),
            style: {
              minWidth: 0,
              minHeight: 0,
              height: "100%",
              padding: 0,
              background: p === position ? "#1a9fff" : void 0,
              color: p === position ? "#fff" : void 0
            },
            children: p === position ? "\u25A0" : ""
          },
          p
        ))
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { fontSize: 11, opacity: 0.6, marginTop: 4 }, children: "While this menu is open the picture moves left to stay visible." })
  ] });
};
var iconButton = { minWidth: 0, padding: "10px 0", flex: 1, display: "flex", justifyContent: "center" };
var MediaRow = () => {
  const [msg, setMsg] = (0, import_react7.useState)("");
  const act = async (action, amount = 0) => {
    const r = await withPage(getState().url, () => media(action, amount));
    setMsg(r.ok ? String(r.result ?? "") : r.error ?? "");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_ui5.Focusable, { style: { display: "flex", gap: 6 }, "flow-children": "horizontal", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.DialogButton, { style: iconButton, onClick: () => act("seek", -10), children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FaBackward, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.DialogButton, { style: iconButton, onClick: () => act("toggle"), children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FaPlay, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.DialogButton, { style: iconButton, onClick: () => act("seek", 10), children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FaForward, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.DialogButton, { style: iconButton, onClick: () => act("volume", -0.1), children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FaVolumeDown, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.DialogButton, { style: iconButton, onClick: () => act("volume", 0.1), children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FaVolumeUp, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.DialogButton, { style: iconButton, onClick: () => act("fill"), children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FaExpand, {}) })
    ] }) }),
    msg && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { fontSize: 12, opacity: 0.7, padding: "0 4px" }, children: msg }) })
  ] });
};
var Diagnostics = () => {
  const s = useStore();
  const [targets, setTargets] = (0, import_react7.useState)("");
  const [shot, setShot] = (0, import_react7.useState)("");
  const screen = getScreen();
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_ui5.PanelSection, { title: "Diagnostics", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { fontSize: 12, lineHeight: 1.5, wordBreak: "break-all" }, children: [
      "Screen: ",
      screen.width,
      "\xD7",
      screen.height,
      " CSS px, scale ",
      screen.dpr,
      screen.detected ? "" : " (not detected, using Steam Deck size)",
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("br", {}),
      "PiP bounds: ",
      lastBounds ? `${lastBounds.x},${lastBounds.y} ${lastBounds.width}\xD7${lastBounds.height}` : "none",
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("br", {}),
      "Page: ",
      s.url
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      import_ui5.ToggleField,
      {
        label: "Use device pixels",
        description: "Turn on if the picture is the wrong size or in the wrong place.",
        checked: s.useDevicePixels,
        onChange: (v) => setState({ useDevicePixels: v })
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      import_ui5.ButtonItem,
      {
        layout: "below",
        onClick: async () => {
          const r = await listTargets();
          if (!r.ok) return setTargets(r.error ?? "error");
          setTargets(
            (r.targets ?? []).filter((t) => t.type === "page").map((t) => `${t.id === r.attached ? "\u25B6 " : ""}${t.title || "(no title)"} \u2014 ${t.url}`).join("\n")
          );
        },
        children: "List browser pages"
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      import_ui5.ButtonItem,
      {
        layout: "below",
        onClick: async () => {
          const r = await withPage(getState().url, () => fillStatus());
          setTargets(r.ok ? JSON.stringify(r.result, null, 1) : r.error ?? "error");
        },
        children: "Check video fill"
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      import_ui5.ButtonItem,
      {
        layout: "below",
        description: "Shows what the browser itself is drawing in the picture",
        onClick: async () => {
          setShot("");
          setTargets("Taking snapshot\u2026");
          const r = await withPage(getState().url, () => snapshot());
          if (r.ok && r.result) {
            setShot(r.result);
            setTargets("");
          } else setTargets(r.error ?? "Snapshot failed");
        },
        children: "Snapshot page"
      }
    ) }),
    shot && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("img", { src: shot, style: { width: "100%", border: "1px solid rgba(255,255,255,0.3)" } }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      import_ui5.ButtonItem,
      {
        layout: "below",
        onClick: () => {
          const input = findSteamInput();
          if (!input) return setTargets("Steam Input API not found");
          const names = /* @__PURE__ */ new Set();
          for (let o = input; o && o !== Object.prototype; o = Object.getPrototypeOf(o)) {
            Object.getOwnPropertyNames(o).forEach((n) => names.add(n));
          }
          const list = [...names].filter((n) => /Register|Controller|Pad|Touch|Analog|State/i.test(n)).sort();
          setTargets(`Steam Input functions (${list.length}):
` + list.join("\n"));
        },
        children: "Steam input functions"
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      import_ui5.ButtonItem,
      {
        layout: "below",
        onClick: async () => {
          const r = await listInputDevices();
          if (!r.ok) return setTargets(r.error ?? "error");
          const lines = (r.devices ?? []).map(
            (d) => `${d.name} [${d.events.join(",")}]${d.readable.length ? " readable" : ""}${d.abs && d.abs !== "0" ? " abs=" + d.abs : ""}`
          );
          const hid = (r.hidraw ?? []).map((h) => `${h.dev}${h.readable ? " readable" : ""}`).join(", ");
          setTargets(`user: ${r.user}
${lines.join("\n")}
hidraw: ${hid || "none"}`);
        },
        children: "Controller devices"
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      import_ui5.ToggleField,
      {
        label: "Safe mode",
        description: "Don't change the page at all (no scrollbar hiding, fill or mouse). Reloads the page.",
        checked: s.safe,
        onChange: (v) => setState({ safe: v })
      }
    ) }),
    targets && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all", opacity: 0.8 }, children: targets }) })
  ] });
};
var UpdateBanner = () => {
  const { update } = useStore();
  if (!update) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSection, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_ui5.ButtonItem, { layout: "below", onClick: () => installUpdate(update), children: [
    "\u2B06 Update to ",
    update.version
  ] }) }) });
};
var VersionRow = () => {
  const [msg, setMsg] = (0, import_react7.useState)("");
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSection, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    import_ui5.ButtonItem,
    {
      layout: "below",
      description: msg || `Version ${VERSION}`,
      onClick: async () => {
        setMsg("Checking\u2026");
        try {
          const u = await checkForUpdate();
          setMsg(u ? `Version ${u.version} is available` : `Version ${VERSION} is the newest`);
        } catch (e) {
          setMsg(`Couldn't check: ${e?.message ?? e}`);
        }
      },
      children: "Check for updates"
    }
  ) }) });
};
var Settings = () => {
  const s = useStore();
  const open = s.viewMode !== 3 /* Closed */;
  (0, import_react7.useEffect)(() => {
    setState({ visible: true });
  }, []);
  if (!open) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(UpdateBanner, {}),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_ui5.PanelSection, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_ui5.ButtonItem, { layout: "below", onClick: () => setState({ viewMode: 2 /* Picture */, visible: true }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FaTv, { style: { marginRight: 8 } }),
          "Open ",
          hostOf(s.url)
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.ButtonItem, { layout: "below", onClick: showSourcesModal, children: "Choose what to watch\u2026" }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(VersionRow, {})
    ] });
  }
  const marginIndex = nearestIndex(MARGINS, s.margin);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(UpdateBanner, {}),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_ui5.PanelSection, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_ui5.ButtonItem, { layout: "below", onClick: showRemote, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FaGamepad, { style: { marginRight: 8 } }),
        "Control page with controller"
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(MediaRow, {}),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.ButtonItem, { layout: "below", label: "Watching", description: hostOf(s.url), onClick: showSourcesModal, children: "Change\u2026" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.ButtonItem, { layout: "below", onClick: showAddressModal, children: "Go to address\u2026" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        import_ui5.ToggleField,
        {
          label: "Large",
          description: "Fill most of the screen",
          checked: s.viewMode === 1 /* Expand */,
          onChange: (v) => setState({ viewMode: v ? 1 /* Expand */ : 2 /* Picture */ })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        import_ui5.ToggleField,
        {
          label: "Fill window when a video plays",
          description: "Hides the rest of the website. Press Menu in the remote to switch back.",
          checked: s.autofill,
          onChange: (v) => setState({ autofill: v })
        }
      ) })
    ] }),
    s.viewMode === 2 /* Picture */ && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_ui5.PanelSection, { title: "Picture", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PositionGrid, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        import_ui5.SliderField,
        {
          label: "Size",
          description: "Width of the picture as a share of the screen",
          value: Math.round(s.size * 100),
          min: 10,
          max: 80,
          step: 1,
          showValue: true,
          valueSuffix: "%",
          resetValue: 28,
          onChange: (v) => setState({ size: v / 100 })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        import_ui5.SliderField,
        {
          label: "Edge spacing",
          value: marginIndex,
          min: 0,
          max: MARGINS.length - 1,
          step: 1,
          notchCount: MARGINS.length,
          notchTicksVisible: true,
          notchLabels: MARGINS.map((x, i) => ({ label: x.label, notchIndex: i, value: i })),
          onChange: (i) => setState({ margin: MARGINS[i].value })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        import_ui5.SliderField,
        {
          label: "Fine tune: left / right",
          value: Math.round((s.nudgeX ?? 0) * 100),
          min: -30,
          max: 30,
          step: 1,
          showValue: true,
          valueSuffix: "%",
          resetValue: 0,
          onChange: (v) => setState({ nudgeX: v / 100 })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        import_ui5.SliderField,
        {
          label: "Fine tune: up / down",
          value: Math.round((s.nudgeY ?? 0) * 100),
          min: -30,
          max: 30,
          step: 1,
          showValue: true,
          valueSuffix: "%",
          resetValue: 0,
          onChange: (v) => setState({ nudgeY: v / 100 })
        }
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_ui5.PanelSection, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        import_ui5.ToggleField,
        {
          label: "Show diagnostics",
          checked: s.showDiagnostics,
          onChange: (v) => setState({ showDiagnostics: v })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_ui5.PanelSectionRow, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        import_ui5.ButtonItem,
        {
          layout: "below",
          onClick: () => {
            detach();
            setState({ viewMode: 3 /* Closed */ });
          },
          children: "Close picture"
        }
      ) })
    ] }),
    s.showDiagnostics && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Diagnostics, {}),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(VersionRow, {})
  ] });
};

// src/index.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
var index_default = definePlugin(() => {
  setState({ viewMode: 3 /* Closed */, visible: true });
  routerHook.addGlobalComponent("CouchPiP", PipOuter);
  const stopUpdates = startUpdateChecks();
  return {
    name: PLUGIN_NAME,
    titleView: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: import_ui6.staticClasses.Title, children: PLUGIN_NAME }),
    icon: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FaTv, {}),
    content: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Settings, {}),
    onDismount() {
      routerHook.removeGlobalComponent("CouchPiP");
      stopUpdates();
    }
  };
});
export {
  index_default as default
};
