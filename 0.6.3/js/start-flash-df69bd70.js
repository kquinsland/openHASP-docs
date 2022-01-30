const e = e => { let t = []; for (let s of e) 219 == s ? t = t.concat([219, 221]) : 192 == s ? t = t.concat([219, 220]) : t.push(s); return t },
    t = e => {
        let t = [];
        for (let s = 0; s < e.length; s++) {
            let r = e.charCodeAt(s);
            r <= 255 && t.push(r)
        }
        return t
    },
    s = (e, ...t) => {
        let s = 0;
        if (e.replace(/[<>]/, "").length != t.length) throw new Error("Pack format to Argument count mismatch");
        let r = [],
            i = !0;
        const n = (e, t) => { for (let s = 0; s < t; s++) i ? r.push(e >> 8 * s & 255) : r.push(e >> 8 * (t - s) & 255) };
        for (let r = 0; r < e.length; r++)
            if ("<" == e[r]) i = !0;
            else if (">" == e[r]) i = !1;
        else if ("B" == e[r]) n(t[s], 1), s++;
        else if ("H" == e[r]) n(t[s], 2), s++;
        else {
            if ("I" != e[r]) throw new Error(`Unhandled character "${e[r]}" in pack format`);
            n(t[s], 4), s++
        }
        return r
    },
    r = (e, t = 2) => "0x" + e.toString(16).toUpperCase().padStart(t, "0"),
    i = e => new Promise((t => setTimeout(t, e))),
    n = t(" UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU"),
    o = 50,
    a = 12882,
    l = async e => {
        let s;
        return e == o ? s = await
        import ("./esp32-0beba529.js"): e == a ? s = await
        import ("./esp32s2-8f8a89fc.js"): 33382 == e && (s = await
            import ("./esp8266-23618669.js")), {...s, text: t(atob(s.text)), data: t(atob(s.data)) }
    };
class c extends EventTarget {
    constructor(e, t, s) { super(), this.port = e, this.logger = t, this._parent = s, this.chipName = null, this._efuses = new Array(4).fill(0), this._flashsize = 4194304, this.debug = !1, this.IS_STUB = !1, this.connected = !0 }
    get _inputBuffer() { return this._parent ? this._parent._inputBuffer : this.__inputBuffer }
    async initialize() {
        await this.hardReset(!0), this._parent || (this.__inputBuffer = [], this.readLoop()), await this.sync();
        let e, t = await this.readRegister(1610612856);
        if (353510656 == t) this.chipFamily = o;
        else if (401408 == t) this.chipFamily = 33382;
        else {
            if (1280 != t) throw "Unknown Chip.";
            this.chipFamily = a
        }
        33382 == this.chipFamily ? e = 1072693328 : (this.chipFamily == o || this.chipFamily == a) && (e = 1610719232);
        for (let t = 0; t < 4; t++) this._efuses[t] = await this.readRegister(e + 4 * t);
        this.chipFamily == o && (this.chipName = "ESP32"), this.chipFamily == a && (this.chipName = "ESP32-S2"), 33382 == this.chipFamily && (16 & this._efuses[0] || 65536 & this._efuses[2] ? this.chipName = "ESP8285" : this.chipName = "ESP8266EX")
    }
    async readLoop() {
        this._reader = this.port.readable.getReader();
        try {
            for (;;) {
                const { value: e, done: t } = await this._reader.read();
                if (t) { this._reader.releaseLock(); break }
                e && 0 !== e.length && this._inputBuffer.push(...Array.from(e))
            }
        } catch (e) { this.connected = !1, this.dispatchEvent(new Event("disconnect")) }
    }
    async hardReset(e = !1) { this.logger.log("Try hard reset."), await this.port.setSignals({ dataTerminalReady: !1, requestToSend: !0 }), await this.port.setSignals({ dataTerminalReady: e, requestToSend: !1 }), await new Promise((e => setTimeout(e, 1e3))) }
    macAddr() {
        let e, t = new Array(6).fill(0),
            s = this._efuses[0],
            r = this._efuses[1],
            i = this._efuses[2],
            n = this._efuses[3];
        if (33382 == this.chipFamily) {
            if (0 != n) e = [n >> 16 & 255, n >> 8 & 255, 255 & n];
            else if (0 == (r >> 16 & 255)) e = [24, 254, 52];
            else {
                if (1 != (r >> 16 & 255)) throw "Couldnt determine OUI";
                e = [172, 208, 116]
            }
            t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = r >> 8 & 255, t[4] = 255 & r, t[5] = s >> 24 & 255
        } else if (this.chipFamily == o) t[0] = i >> 8 & 255, t[1] = 255 & i, t[2] = r >> 24 & 255, t[3] = r >> 16 & 255, t[4] = r >> 8 & 255, t[5] = 255 & r;
        else {
            if (this.chipFamily != a) throw "Unknown chip family";
            t[0] = i >> 8 & 255, t[1] = 255 & i, t[2] = r >> 24 & 255, t[3] = r >> 16 & 255, t[4] = r >> 8 & 255, t[5] = 255 & r
        }
        return t
    }
    async readRegister(e) {
        this.debug && this.logger.debug("Reading Register", e);
        let t = s("I", e);
        return ((e, t) => {
            let s = 0,
                r = [];
            for (let i of e)
                if ("B" == i) r.push(255 & t[s]), s += 1;
                else if ("H" == i) r.push(255 & t[s] | (255 & t[s + 1]) << 8), s += 2;
            else {
                if ("I" != i) throw new Error(`Unhandled character "${i}" in unpack format`);
                r.push(255 & t[s] | (255 & t[s + 1]) << 8 | (255 & t[s + 2]) << 16 | (255 & t[s + 3]) << 24), s += 4
            }
            return r
        })("I", (await this.checkCommand(10, t))[0])[0]
    }
    async checkCommand(e, t, s = 0, i = 3e3) { i = Math.min(i, 12e5), await this.sendCommand(e, t, s); let [n, l] = await this.getResponse(e, i); if (null === l) throw "Didn't get enough status bytes"; let c = 0; if (this.IS_STUB || 33382 == this.chipFamily ? c = 2 : [o, a].includes(this.chipFamily) ? c = 4 : [2, 4].includes(l.length) && (c = l.length), l.length < c) throw "Didn't get enough status bytes"; let d = l.slice(-c, l.length); if (l = l.slice(0, -c), this.debug && (this.logger.debug("status", d), this.logger.debug("value", n), this.logger.debug("data", l)), 1 == d[0]) throw 5 == d[1] ? "Invalid (unsupported) command " + r(e) : "Command failure error code " + r(d[1]); return [n, l] }
    async sendCommand(t, r, i = 0) {
        this._inputBuffer.length = 0;
        let n = [192, 0];
        n.push(t), n = n.concat(s("H", r.length)), n = n.concat(e(s("I", i))), n = n.concat(e(r)), n.push(192), this.debug && this.logger.debug("Writing " + n.length + " byte" + (1 == n.length ? "" : "s") + ":", n), await this.writeToStream(n)
    }
    async getResponse(e, t = 3e3) {
        let s = [],
            r = 0,
            n = !1,
            o = Date.now();
        for (; Date.now() - o < t;) {
            if (this._inputBuffer.length > 0) {
                let e = this._inputBuffer.shift();
                219 == e ? n = !0 : n ? (221 == e ? s.push(220) : 220 == e ? s.push(192) : s = s.concat([219, e]), n = !1) : s.push(e)
            } else await i(10);
            if (s.length > 0 && 192 != s[0] && s.shift(), s.length > 1 && 1 != s[1] && s.shift(), s.length > 2 && s[2] != e && s.shift(), s.length > 4 && (r = s[3] + (s[4] << 8)), s.length == r + 10) break
        }
        if (s.length != r + 10) return this.logger.log("Timed out after " + t + " milliseconds"), [null, null];
        this.debug && this.logger.debug("Reading " + s.length + " byte" + (1 == s.length ? "" : "s") + ":", s);
        let a = s.slice(5, 9),
            l = s.slice(9, -1);
        return this.debug && this.logger.debug("value:", a, "data:", l), [a, l]
    }
    async readBuffer(e = 3e3) {
        let t = [],
            s = !1,
            r = Date.now();
        for (; Date.now() - r < e;) {
            if (this._inputBuffer.length > 0) {
                let e = this._inputBuffer.shift();
                219 == e ? s = !0 : s ? (221 == e ? t.push(220) : 220 == e ? t.push(192) : t = t.concat([219, e]), s = !1) : t.push(e)
            } else await i(10);
            if (t.length > 0 && 192 != t[0] && t.shift(), t.length > 1 && 192 == t[t.length - 1]) break
        }
        if (t.length < 2) return this.logger.log("Timed out after " + e + " milliseconds"), null;
        this.debug && this.logger.debug("Reading " + t.length + " byte" + (1 == t.length ? "" : "s") + ":", t);
        let n = t.slice(1, -1);
        return this.debug && this.logger.debug("data:", n), n
    }
    checksum(e, t = 239) { for (let s of e) t ^= s; return t }
    async setBaudrate(e) {
        if (33382 == this.chipFamily) this.logger.log("Baud rate can only change on ESP32 and ESP32-S2");
        else {
            this.logger.log("Attempting to change baud rate to " + e + "...");
            try {
                let t = s("<II", e, 0);
                await this.checkCommand(15, t), await i(50), await this.checkCommand(15, t), this.logger.log("Changed baud rate to " + e)
            } catch (t) { throw "Unable to change the baud rate, please try setting the connection speed from " + e + " to 115200 and reconnecting." }
        }
    }
    async sync() {
        for (let e = 0; e < 5; e++) {
            if (await this._sync()) return await i(100), !0;
            await i(100)
        }
        throw "Couldn't sync to ESP. Try resetting."
    }
    async _sync() { await this.sendCommand(8, n); for (let e = 0; e < 8; e++) { let [e, t] = await this.getResponse(8, 100); if (null !== t && (t.length > 1 && 0 == t[0] && 0 == t[1])) return !0 } return !1 }
    getFlashWriteSize() { return this.chipFamily == a ? 1024 : 512 }
    async flashData(e, t, s = 0) {
        let r = e.byteLength;
        this.logger.log("\nWriting data with filesize:" + r), await this.flashBegin(r, s);
        let i = [],
            n = 0,
            o = 0,
            a = 0,
            l = Date.now(),
            c = this.getFlashWriteSize();
        for (; r - a > 0;) r - a >= c ? i = Array.from(new Uint8Array(e, a, c)) : (i = Array.from(new Uint8Array(e, a, r - a)), i = i.concat(new Array(c - i.length).fill(255))), await this.flashBlock(i, n, 2e3), n += 1, o += i.length, a += c, t(o);
        this.logger.log("Took " + (Date.now() - l) + "ms to write " + r + " bytes")
    }
    async flashBlock(e, t, r = 100) { await this.checkCommand(3, s("<IIII", e.length, t, 0, 0).concat(e), this.checksum(e), r) }
    async flashBegin(e = 0, t = 0, i = !1) {
        let n, l, c = this.getFlashWriteSize();
        [o, a].includes(this.chipFamily) && await this.checkCommand(13, new Array(8).fill(0)), this.chipFamily == o && (l = s("<IIIIII", 0, this._flashsize, 65536, 4096, 256, 65535), await this.checkCommand(11, l));
        let d, h = Math.floor((e + c - 1) / c);
        n = 33382 == this.chipFamily ? this.getEraseSize(t, e) : e, d = this.IS_STUB ? 3e3 : ((e, t) => { let s = Math.floor(e * (t / 486)); return s < 3e3 ? 3e3 : s })(3e4, e);
        let p = Date.now();
        return l = s("<IIII", n, h, c, t), this.chipFamily == a && (l = l.concat(s("<I", i ? 1 : 0))), this.logger.log("Erase size " + n + ", blocks " + h + ", block size " + c + ", offset " + r(t, 4) + ", encrypted " + (i ? "yes" : "no")), await this.checkCommand(2, l, 0, d), 0 == e || this.IS_STUB || this.logger.log("Took " + (Date.now() - p) + "ms to erase " + h + " bytes"), h
    }
    async flashFinish() {
        let e = s("<I", 1);
        await this.checkCommand(4, e)
    }
    getEraseSize(e, t) {
        let s = 4096,
            r = Math.floor((t + s - 1) / s),
            i = 16 - Math.floor(e / s) % 16;
        return r < i && (i = r), r < 2 * i ? Math.floor((r + 1) / 2 * s) : (r - i) * s
    }
    async memBegin(e, t, r, i) { return await this.checkCommand(5, s("<IIII", e, t, r, i)) }
    async memBlock(e, t) { return await this.checkCommand(7, s("<IIII", e.length, t, 0, 0).concat(e), this.checksum(e)) }
    async memFinish(e = 0) {
        let t = this.IS_STUB ? 3e3 : 50,
            r = s("<II", 0 == e ? 1 : 0, e);
        return await this.checkCommand(6, r, 0, t)
    }
    async runStub() {
        const e = await l(this.chipFamily);
        let t = 2048;
        this.logger.log("Uploading stub...");
        for (let s of["text", "data"])
            if (Object.keys(e).includes(s)) {
                let r = e[s + "_start"],
                    i = e[s].length,
                    n = Math.floor((i + t - 1) / t);
                await this.memBegin(i, n, t, r);
                for (let r of Array(n).keys()) {
                    let n = r * t,
                        o = n + t;
                    o > i && (o = i), await this.memBlock(e[s].slice(n, o), r)
                }
            }
        this.logger.log("Running stub..."), await this.memFinish(e.entry);
        const s = await this.readBuffer(100),
            r = String.fromCharCode(...s);
        if ("OHAI" != r) throw "Failed to start stub. Unexpected response: " + r;
        this.logger.log("Stub is now running...");
        return new d(this.port, this.logger, this)
    }
    async writeToStream(e) {
        const t = this.port.writable.getWriter();
        await t.write(new Uint8Array(e));
        try { t.releaseLock() } catch (e) { console.error("Ignoring release lock error", e) }
    }
    async disconnect() { this._parent ? await this._parent.disconnect() : (this._reader && await this._reader.cancel(), await this.port.writable.getWriter().close(), await this.port.close(), this.connected = !1) }
}
class d extends c {
    constructor() { super(...arguments), this.IS_STUB = !0 }
    async memBegin(e, t, s, i) {
        let n = await l(this.chipFamily),
            o = i,
            a = i + e;
        console.log(o, a), console.log(n.data_start, n.data.length, n.text_start, n.text.length);
        for (let [e, t] of[[n.data_start, n.data_start + n.data.length], [n.text_start, n.text_start + n.text.length]])
            if (o < t && a > e) throw "Software loader is resident at " + r(e, 8) + "-" + r(t, 8) + ". Can't load binary at overlapping address range " + r(o, 8) + "-" + r(a, 8) + ". Try changing the binary loading address."
    }
    async eraseFlash() { await this.checkCommand(208, [], 0, 6e5) }
}
const h = async(e, t, s, r) => {
        let i, n, l;
        const d = t => {
                ((e, t, s, r) => {
                    r = r || {};
                    const i = new CustomEvent(t, { bubbles: void 0 === r.bubbles || r.bubbles, cancelable: Boolean(r.cancelable), composed: void 0 === r.composed || r.composed, detail: s });
                    e.dispatchEvent(i)
                })(e, "state-changed", {...t, manifest: i, build: n, chipFamily: l })
            },
            h = new URL(s, location.toString()).toString(),
            p = fetch(h).then((e => e.json()));
        let u;
        try { u = await (async e => { const t = await navigator.serial.requestPort(); return e.log("Connecting..."), await t.open({ baudRate: 115200 }), e.log("Connected successfully."), new c(t, e) })(t) } catch (e) { return }
        window.esploader = u, d({ state: "initializing", message: "Initializing...", details: { done: !1 } });
        try { await u.initialize() } catch (e) { return t.error(e), void(u.connected && (d({ state: "error", message: "Failed to initialize. Try resetting your device or holding the BOOT button before clicking connect.", details: { error: "failed_initialize", details: e } }), await u.disconnect())) }
        l = (e => {
            switch (e.chipFamily) {
                case o:
                    return "ESP32";
                case 33382:
                    return "ESP8266";
                case a:
                    return "ESP32-S2";
                default:
                    return "Unknown Chip"
            }
        })(u), d({ state: "initializing", message: `Initialized. Found ${l}`, details: { done: !0 } }), d({ state: "manifest", message: "Fetching manifest...", details: { done: !1 } });
        try { i = await p } catch (e) { return d({ state: "error", message: `Unable to fetch manifest: ${e.message}`, details: { error: "fetch_manifest_failed", details: e } }), void await u.disconnect() }
        if (n = i.builds.find((e => e.chipFamily === l)), d({ state: "manifest", message: `Found manifest for ${i.name}`, details: { done: !0 } }), !n) return d({ state: "error", message: `Your ${l} board is not supported.`, details: { error: "not_supported", details: l } }), void await u.disconnect();
        d({ state: "preparing", message: "Preparing installation...", details: { done: !1 } });
        const m = n.parts.map((async e => {
                const t = new URL(e.path, h).toString(),
                    s = await fetch(t);
                if (!s.ok) throw new Error(`Downlading firmware ${e.path} failed: ${s.status}`);
                return s.arrayBuffer()
            })),
            g = await u.runStub(),
            f = [];
        let y = 0;
        for (const e of m) try {
            const t = await e;
            f.push(t), y += t.byteLength
        } catch (e) { return d({ state: "error", message: e, details: { error: "failed_firmware_download", details: e } }), void await u.disconnect() }
        d({ state: "preparing", message: "Installation prepared", details: { done: !0 } }), r && (d({ state: "erasing", message: "Erasing device...", details: { done: !1 } }), await g.eraseFlash(), d({ state: "erasing", message: "Device erased", details: { done: !0 } }));
        let v = 0;
        d({ state: "writing", message: `Writing progress: ${v}%`, details: { bytesTotal: y, bytesWritten: 0, percentage: v } });
        let b = 0;
        for (const e of n.parts) {
            const t = f.shift();
            try {
                await g.flashData(t, (e => {
                    const t = Math.floor((b + e) / y * 100);
                    t !== v && (v = t, d({ state: "writing", message: `Writing progress: ${t}%`, details: { bytesTotal: y, bytesWritten: b + e, percentage: t } }))
                }), e.offset)
            } catch (e) { return d({ state: "error", message: e, details: { error: "write_failed", details: e } }), void await u.disconnect() }
            b += t.byteLength
        }
        var w;
        d({ state: "writing", message: "Writing complete", details: { bytesTotal: y, bytesWritten: b, percentage: 100 } }), await (w = 100, new Promise((e => setTimeout(e, w)))), await u.hardReset(), await u.disconnect(), d({ state: "finished", message: "All done!" })
    },
    p = window.ShadowRoot && (void 0 === window.ShadyCSS || window.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype,
    u = Symbol();
class m {
    constructor(e, t) {
        if (t !== u) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
        this.cssText = e
    }
    get styleSheet() { return p && void 0 === this.t && (this.t = new CSSStyleSheet, this.t.replaceSync(this.cssText)), this.t }
    toString() { return this.cssText }
}
const g = new Map,
    f = e => { let t = g.get(e); return void 0 === t && g.set(e, t = new m(e, u)), t },
    y = (e, ...t) => { const s = 1 === e.length ? e[0] : t.reduce(((t, s, r) => t + (e => { if (e instanceof m) return e.cssText; if ("number" == typeof e) return e; throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.") })(s) + e[r + 1]), e[0]); return f(s) },
    v = p ? e => e : e => e instanceof CSSStyleSheet ? (e => { let t = ""; for (const s of e.cssRules) t += s.cssText; return (e => f("string" == typeof e ? e : e + ""))(t) })(e) : e;
var b, w, _, S;
const x = {
        toAttribute(e, t) {
            switch (t) {
                case Boolean:
                    e = e ? "" : null;
                    break;
                case Object:
                case Array:
                    e = null == e ? e : JSON.stringify(e)
            }
            return e
        },
        fromAttribute(e, t) {
            let s = e;
            switch (t) {
                case Boolean:
                    s = null !== e;
                    break;
                case Number:
                    s = null === e ? null : Number(e);
                    break;
                case Object:
                case Array:
                    try { s = JSON.parse(e) } catch (e) { s = null }
            }
            return s
        }
    },
    P = (e, t) => t !== e && (t == t || e == e),
    C = { attribute: !0, type: String, converter: x, reflect: !1, hasChanged: P };
class k extends HTMLElement {
    constructor() { super(), this.Πi = new Map, this.Πo = void 0, this.Πl = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this.Πh = null, this.u() }
    static addInitializer(e) {
        var t;
        null !== (t = this.v) && void 0 !== t || (this.v = []), this.v.push(e)
    }
    static get observedAttributes() {
        this.finalize();
        const e = [];
        return this.elementProperties.forEach(((t, s) => {
            const r = this.Πp(s, t);
            void 0 !== r && (this.Πm.set(r, s), e.push(r))
        })), e
    }
    static createProperty(e, t = C) {
        if (t.state && (t.attribute = !1), this.finalize(), this.elementProperties.set(e, t), !t.noAccessor && !this.prototype.hasOwnProperty(e)) {
            const s = "symbol" == typeof e ? Symbol() : "__" + e,
                r = this.getPropertyDescriptor(e, s, t);
            void 0 !== r && Object.defineProperty(this.prototype, e, r)
        }
    }
    static getPropertyDescriptor(e, t, s) {
        return {get() { return this[t] },
            set(r) {
                const i = this[e];
                this[t] = r, this.requestUpdate(e, i, s)
            },
            configurable: !0,
            enumerable: !0
        }
    }
    static getPropertyOptions(e) { return this.elementProperties.get(e) || C }
    static finalize() {
        if (this.hasOwnProperty("finalized")) return !1;
        this.finalized = !0;
        const e = Object.getPrototypeOf(this);
        if (e.finalize(), this.elementProperties = new Map(e.elementProperties), this.Πm = new Map, this.hasOwnProperty("properties")) {
            const e = this.properties,
                t = [...Object.getOwnPropertyNames(e), ...Object.getOwnPropertySymbols(e)];
            for (const s of t) this.createProperty(s, e[s])
        }
        return this.elementStyles = this.finalizeStyles(this.styles), !0
    }
    static finalizeStyles(e) { const t = []; if (Array.isArray(e)) { const s = new Set(e.flat(1 / 0).reverse()); for (const e of s) t.unshift(v(e)) } else void 0 !== e && t.push(v(e)); return t }
    static Πp(e, t) { const s = t.attribute; return !1 === s ? void 0 : "string" == typeof s ? s : "string" == typeof e ? e.toLowerCase() : void 0 }
    u() {
        var e;
        this.Πg = new Promise((e => this.enableUpdating = e)), this.L = new Map, this.Π_(), this.requestUpdate(), null === (e = this.constructor.v) || void 0 === e || e.forEach((e => e(this)))
    }
    addController(e) {
        var t, s;
        (null !== (t = this.ΠU) && void 0 !== t ? t : this.ΠU = []).push(e), void 0 !== this.renderRoot && this.isConnected && (null === (s = e.hostConnected) || void 0 === s || s.call(e))
    }
    removeController(e) {
        var t;
        null === (t = this.ΠU) || void 0 === t || t.splice(this.ΠU.indexOf(e) >>> 0, 1)
    }
    Π_() { this.constructor.elementProperties.forEach(((e, t) => { this.hasOwnProperty(t) && (this.Πi.set(t, this[t]), delete this[t]) })) }
    createRenderRoot() {
        var e;
        const t = null !== (e = this.shadowRoot) && void 0 !== e ? e : this.attachShadow(this.constructor.shadowRootOptions);
        return ((e, t) => {
            p ? e.adoptedStyleSheets = t.map((e => e instanceof CSSStyleSheet ? e : e.styleSheet)) : t.forEach((t => {
                const s = document.createElement("style");
                s.textContent = t.cssText, e.appendChild(s)
            }))
        })(t, this.constructor.elementStyles), t
    }
    connectedCallback() {
        var e;
        void 0 === this.renderRoot && (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), null === (e = this.ΠU) || void 0 === e || e.forEach((e => { var t; return null === (t = e.hostConnected) || void 0 === t ? void 0 : t.call(e) })), this.Πl && (this.Πl(), this.Πo = this.Πl = void 0)
    }
    enableUpdating(e) {}
    disconnectedCallback() {
        var e;
        null === (e = this.ΠU) || void 0 === e || e.forEach((e => { var t; return null === (t = e.hostDisconnected) || void 0 === t ? void 0 : t.call(e) })), this.Πo = new Promise((e => this.Πl = e))
    }
    attributeChangedCallback(e, t, s) { this.K(e, s) }
    Πj(e, t, s = C) {
        var r, i;
        const n = this.constructor.Πp(e, s);
        if (void 0 !== n && !0 === s.reflect) {
            const o = (null !== (i = null === (r = s.converter) || void 0 === r ? void 0 : r.toAttribute) && void 0 !== i ? i : x.toAttribute)(t, s.type);
            this.Πh = e, null == o ? this.removeAttribute(n) : this.setAttribute(n, o), this.Πh = null
        }
    }
    K(e, t) {
        var s, r, i;
        const n = this.constructor,
            o = n.Πm.get(e);
        if (void 0 !== o && this.Πh !== o) {
            const e = n.getPropertyOptions(o),
                a = e.converter,
                l = null !== (i = null !== (r = null === (s = a) || void 0 === s ? void 0 : s.fromAttribute) && void 0 !== r ? r : "function" == typeof a ? a : null) && void 0 !== i ? i : x.fromAttribute;
            this.Πh = o, this[o] = l(t, e.type), this.Πh = null
        }
    }
    requestUpdate(e, t, s) {
        let r = !0;
        void 0 !== e && (((s = s || this.constructor.getPropertyOptions(e)).hasChanged || P)(this[e], t) ? (this.L.has(e) || this.L.set(e, t), !0 === s.reflect && this.Πh !== e && (void 0 === this.Πk && (this.Πk = new Map), this.Πk.set(e, s))) : r = !1), !this.isUpdatePending && r && (this.Πg = this.Πq())
    }
    async Πq() { this.isUpdatePending = !0; try { for (await this.Πg; this.Πo;) await this.Πo } catch (e) { Promise.reject(e) } const e = this.performUpdate(); return null != e && await e, !this.isUpdatePending }
    performUpdate() {
        var e;
        if (!this.isUpdatePending) return;
        this.hasUpdated, this.Πi && (this.Πi.forEach(((e, t) => this[t] = e)), this.Πi = void 0);
        let t = !1;
        const s = this.L;
        try { t = this.shouldUpdate(s), t ? (this.willUpdate(s), null === (e = this.ΠU) || void 0 === e || e.forEach((e => { var t; return null === (t = e.hostUpdate) || void 0 === t ? void 0 : t.call(e) })), this.update(s)) : this.Π$() } catch (e) { throw t = !1, this.Π$(), e }
        t && this.E(s)
    }
    willUpdate(e) {}
    E(e) {
        var t;
        null === (t = this.ΠU) || void 0 === t || t.forEach((e => { var t; return null === (t = e.hostUpdated) || void 0 === t ? void 0 : t.call(e) })), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e)
    }
    Π$() { this.L = new Map, this.isUpdatePending = !1 }
    get updateComplete() { return this.getUpdateComplete() }
    getUpdateComplete() { return this.Πg }
    shouldUpdate(e) { return !0 }
    update(e) { void 0 !== this.Πk && (this.Πk.forEach(((e, t) => this.Πj(t, this[t], e))), this.Πk = void 0), this.Π$() }
    updated(e) {}
    firstUpdated(e) {}
}
var E, A, U, T;
k.finalized = !0, k.elementProperties = new Map, k.elementStyles = [], k.shadowRootOptions = { mode: "open" }, null === (w = (b = globalThis).reactiveElementPlatformSupport) || void 0 === w || w.call(b, { ReactiveElement: k }), (null !== (_ = (S = globalThis).reactiveElementVersions) && void 0 !== _ ? _ : S.reactiveElementVersions = []).push("1.0.0-rc.2");
const N = globalThis.trustedTypes,
    R = N ? N.createPolicy("lit-html", { createHTML: e => e }) : void 0,
    $ = `lit$${(Math.random()+"").slice(9)}$`,
    O = "?" + $,
    z = `<${O}>`,
    I = document,
    F = (e = "") => I.createComment(e),
    B = e => null === e || "object" != typeof e && "function" != typeof e,
    H = Array.isArray,
    M = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,
    V = /-->/g,
    j = />/g,
    L = />|[ 	\n\r](?:([^\s"'>=/]+)([ 	\n\r]*=[ 	\n\r]*(?:[^ 	\n\r"'`<>=]|("|')|))|$)/g,
    X = /'/g,
    D = /"/g,
    W = /^(?:script|style|textarea)$/i,
    q = (e => (t, ...s) => ({ _$litType$: e, strings: t, values: s }))(1),
    J = Symbol.for("lit-noChange"),
    Q = Symbol.for("lit-nothing"),
    K = new WeakMap,
    Z = I.createTreeWalker(I, 129, null, !1);
class Y {
    constructor({ strings: e, _$litType$: t }, s) {
        let r;
        this.parts = [];
        let i = 0,
            n = 0;
        const o = e.length - 1,
            a = this.parts,
            [l, c] = ((e, t) => {
                const s = e.length - 1,
                    r = [];
                let i, n = 2 === t ? "<svg>" : "",
                    o = M;
                for (let t = 0; t < s; t++) {
                    const s = e[t];
                    let a, l, c = -1,
                        d = 0;
                    for (; d < s.length && (o.lastIndex = d, l = o.exec(s), null !== l);) d = o.lastIndex, o === M ? "!--" === l[1] ? o = V : void 0 !== l[1] ? o = j : void 0 !== l[2] ? (W.test(l[2]) && (i = RegExp("</" + l[2], "g")), o = L) : void 0 !== l[3] && (o = L) : o === L ? ">" === l[0] ? (o = null != i ? i : M, c = -1) : void 0 === l[1] ? c = -2 : (c = o.lastIndex - l[2].length, a = l[1], o = void 0 === l[3] ? L : '"' === l[3] ? D : X) : o === D || o === X ? o = L : o === V || o === j ? o = M : (o = L, i = void 0);
                    const h = o === L && e[t + 1].startsWith("/>") ? " " : "";
                    n += o === M ? s + z : c >= 0 ? (r.push(a), s.slice(0, c) + "$lit$" + s.slice(c) + $ + h) : s + $ + (-2 === c ? (r.push(void 0), t) : h)
                }
                const a = n + (e[s] || "<?>") + (2 === t ? "</svg>" : "");
                return [void 0 !== R ? R.createHTML(a) : a, r]
            })(e, t);
        if (this.el = Y.createElement(l, s), Z.currentNode = this.el.content, 2 === t) {
            const e = this.el.content,
                t = e.firstChild;
            t.remove(), e.append(...t.childNodes)
        }
        for (; null !== (r = Z.nextNode()) && a.length < o;) {
            if (1 === r.nodeType) {
                if (r.hasAttributes()) {
                    const e = [];
                    for (const t of r.getAttributeNames())
                        if (t.endsWith("$lit$") || t.startsWith($)) {
                            const s = c[n++];
                            if (e.push(t), void 0 !== s) {
                                const e = r.getAttribute(s.toLowerCase() + "$lit$").split($),
                                    t = /([.?@])?(.*)/.exec(s);
                                a.push({ type: 1, index: i, name: t[2], strings: e, ctor: "." === t[1] ? re : "?" === t[1] ? ie : "@" === t[1] ? ne : se })
                            } else a.push({ type: 6, index: i })
                        }
                    for (const t of e) r.removeAttribute(t)
                }
                if (W.test(r.tagName)) {
                    const e = r.textContent.split($),
                        t = e.length - 1;
                    if (t > 0) {
                        r.textContent = N ? N.emptyScript : "";
                        for (let s = 0; s < t; s++) r.append(e[s], F()), Z.nextNode(), a.push({ type: 2, index: ++i });
                        r.append(e[t], F())
                    }
                }
            } else if (8 === r.nodeType)
                if (r.data === O) a.push({ type: 2, index: i });
                else { let e = -1; for (; - 1 !== (e = r.data.indexOf($, e + 1));) a.push({ type: 7, index: i }), e += $.length - 1 }
            i++
        }
    }
    static createElement(e, t) { const s = I.createElement("template"); return s.innerHTML = e, s }
}

function G(e, t, s = e, r) { var i, n, o, a; if (t === J) return t; let l = void 0 !== r ? null === (i = s.Σi) || void 0 === i ? void 0 : i[r] : s.Σo; const c = B(t) ? void 0 : t._$litDirective$; return (null == l ? void 0 : l.constructor) !== c && (null === (n = null == l ? void 0 : l.O) || void 0 === n || n.call(l, !1), void 0 === c ? l = void 0 : (l = new c(e), l.T(e, s, r)), void 0 !== r ? (null !== (o = (a = s).Σi) && void 0 !== o ? o : a.Σi = [])[r] = l : s.Σo = l), void 0 !== l && (t = G(e, l.S(e, t.values), l, r)), t }
class ee {
    constructor(e, t) { this.l = [], this.N = void 0, this.D = e, this.M = t }
    u(e) {
        var t;
        const { el: { content: s }, parts: r } = this.D, i = (null !== (t = null == e ? void 0 : e.creationScope) && void 0 !== t ? t : I).importNode(s, !0);
        Z.currentNode = i;
        let n = Z.nextNode(),
            o = 0,
            a = 0,
            l = r[0];
        for (; void 0 !== l;) {
            if (o === l.index) {
                let t;
                2 === l.type ? t = new te(n, n.nextSibling, this, e) : 1 === l.type ? t = new l.ctor(n, l.name, l.strings, this, e) : 6 === l.type && (t = new oe(n, this, e)), this.l.push(t), l = r[++a]
            }
            o !== (null == l ? void 0 : l.index) && (n = Z.nextNode(), o++)
        }
        return i
    }
    v(e) { let t = 0; for (const s of this.l) void 0 !== s && (void 0 !== s.strings ? (s.I(e, s, t), t += s.strings.length - 2) : s.I(e[t])), t++ }
}
class te {
    constructor(e, t, s, r) { this.type = 2, this.N = void 0, this.A = e, this.B = t, this.M = s, this.options = r }
    setConnected(e) {
        var t;
        null === (t = this.P) || void 0 === t || t.call(this, e)
    }
    get parentNode() { return this.A.parentNode }
    get startNode() { return this.A }
    get endNode() { return this.B }
    I(e, t = this) { e = G(this, e, t), B(e) ? e === Q || null == e || "" === e ? (this.H !== Q && this.R(), this.H = Q) : e !== this.H && e !== J && this.m(e) : void 0 !== e._$litType$ ? this._(e) : void 0 !== e.nodeType ? this.$(e) : (e => { var t; return H(e) || "function" == typeof(null === (t = e) || void 0 === t ? void 0 : t[Symbol.iterator]) })(e) ? this.g(e) : this.m(e) }
    k(e, t = this.B) { return this.A.parentNode.insertBefore(e, t) }
    $(e) { this.H !== e && (this.R(), this.H = this.k(e)) }
    m(e) {
        const t = this.A.nextSibling;
        null !== t && 3 === t.nodeType && (null === this.B ? null === t.nextSibling : t === this.B.previousSibling) ? t.data = e : this.$(I.createTextNode(e)), this.H = e
    }
    _(e) {
        var t;
        const { values: s, _$litType$: r } = e, i = "number" == typeof r ? this.C(e) : (void 0 === r.el && (r.el = Y.createElement(r.h, this.options)), r);
        if ((null === (t = this.H) || void 0 === t ? void 0 : t.D) === i) this.H.v(s);
        else {
            const e = new ee(i, this),
                t = e.u(this.options);
            e.v(s), this.$(t), this.H = e
        }
    }
    C(e) { let t = K.get(e.strings); return void 0 === t && K.set(e.strings, t = new Y(e)), t }
    g(e) {
        H(this.H) || (this.H = [], this.R());
        const t = this.H;
        let s, r = 0;
        for (const i of e) r === t.length ? t.push(s = new te(this.k(F()), this.k(F()), this, this.options)) : s = t[r], s.I(i), r++;
        r < t.length && (this.R(s && s.B.nextSibling, r), t.length = r)
    }
    R(e = this.A.nextSibling, t) {
        var s;
        for (null === (s = this.P) || void 0 === s || s.call(this, !1, !0, t); e && e !== this.B;) {
            const t = e.nextSibling;
            e.remove(), e = t
        }
    }
}
class se {
    constructor(e, t, s, r, i) { this.type = 1, this.H = Q, this.N = void 0, this.V = void 0, this.element = e, this.name = t, this.M = r, this.options = i, s.length > 2 || "" !== s[0] || "" !== s[1] ? (this.H = Array(s.length - 1).fill(Q), this.strings = s) : this.H = Q }
    get tagName() { return this.element.tagName }
    I(e, t = this, s, r) {
        const i = this.strings;
        let n = !1;
        if (void 0 === i) e = G(this, e, t, 0), n = !B(e) || e !== this.H && e !== J, n && (this.H = e);
        else { const r = e; let o, a; for (e = i[0], o = 0; o < i.length - 1; o++) a = G(this, r[s + o], t, o), a === J && (a = this.H[o]), n || (n = !B(a) || a !== this.H[o]), a === Q ? e = Q : e !== Q && (e += (null != a ? a : "") + i[o + 1]), this.H[o] = a }
        n && !r && this.W(e)
    }
    W(e) { e === Q ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, null != e ? e : "") }
}
class re extends se {
    constructor() { super(...arguments), this.type = 3 }
    W(e) { this.element[this.name] = e === Q ? void 0 : e }
}
class ie extends se {
    constructor() { super(...arguments), this.type = 4 }
    W(e) { e && e !== Q ? this.element.setAttribute(this.name, "") : this.element.removeAttribute(this.name) }
}
class ne extends se {
    constructor() { super(...arguments), this.type = 5 }
    I(e, t = this) {
        var s;
        if ((e = null !== (s = G(this, e, t, 0)) && void 0 !== s ? s : Q) === J) return;
        const r = this.H,
            i = e === Q && r !== Q || e.capture !== r.capture || e.once !== r.once || e.passive !== r.passive,
            n = e !== Q && (r === Q || i);
        i && this.element.removeEventListener(this.name, this, r), n && this.element.addEventListener(this.name, this, e), this.H = e
    }
    handleEvent(e) { var t, s; "function" == typeof this.H ? this.H.call(null !== (s = null === (t = this.options) || void 0 === t ? void 0 : t.host) && void 0 !== s ? s : this.element, e) : this.H.handleEvent(e) }
}
class oe {
    constructor(e, t, s) { this.element = e, this.type = 6, this.N = void 0, this.V = void 0, this.M = t, this.options = s }
    I(e) { G(this, e) }
}
var ae, le, ce, de, he, pe;
null === (A = (E = globalThis).litHtmlPlatformSupport) || void 0 === A || A.call(E, Y, te), (null !== (U = (T = globalThis).litHtmlVersions) && void 0 !== U ? U : T.litHtmlVersions = []).push("2.0.0-rc.3"), (null !== (ae = (pe = globalThis).litElementVersions) && void 0 !== ae ? ae : pe.litElementVersions = []).push("3.0.0-rc.2");
class ue extends k {
    constructor() { super(...arguments), this.renderOptions = { host: this }, this.Φt = void 0 }
    createRenderRoot() { var e, t; const s = super.createRenderRoot(); return null !== (e = (t = this.renderOptions).renderBefore) && void 0 !== e || (t.renderBefore = s.firstChild), s }
    update(e) {
        const t = this.render();
        super.update(e), this.Φt = ((e, t, s) => {
            var r, i;
            const n = null !== (r = null == s ? void 0 : s.renderBefore) && void 0 !== r ? r : t;
            let o = n._$litPart$;
            if (void 0 === o) {
                const e = null !== (i = null == s ? void 0 : s.renderBefore) && void 0 !== i ? i : null;
                n._$litPart$ = o = new te(t.insertBefore(F(), e), e, void 0, s)
            }
            return o.I(e), o
        })(t, this.renderRoot, this.renderOptions)
    }
    connectedCallback() {
        var e;
        super.connectedCallback(), null === (e = this.Φt) || void 0 === e || e.setConnected(!0)
    }
    disconnectedCallback() {
        var e;
        super.disconnectedCallback(), null === (e = this.Φt) || void 0 === e || e.setConnected(!1)
    }
    render() { return J }
}
ue.finalized = !0, ue._$litElement$ = !0, null === (ce = (le = globalThis).litElementHydrateSupport) || void 0 === ce || ce.call(le, { LitElement: ue }), null === (he = (de = globalThis).litElementPlatformSupport) || void 0 === he || he.call(de, { LitElement: ue });
const me = e => t => "function" == typeof t ? ((e, t) => (window.customElements.define(e, t), t))(e, t) : ((e, t) => { const { kind: s, elements: r } = t; return { kind: s, elements: r, finisher(t) { window.customElements.define(e, t) } } })(e, t),
    ge = (e, t) => "method" === t.kind && t.descriptor && !("value" in t.descriptor) ? {...t, finisher(s) { s.createProperty(t.key, e) } } : { kind: "field", key: Symbol(), placement: "own", descriptor: {}, originalKey: t.key, initializer() { "function" == typeof t.initializer && (this[t.key] = t.initializer.call(this)) }, finisher(s) { s.createProperty(t.key, e) } };

function fe(e) { return function(e) { return (t, s) => void 0 !== s ? ((e, t, s) => { t.constructor.createProperty(s, e) })(e, t, s) : ge(e, t) }({...e, state: !0, attribute: !1 }) }
const ye = 1;
const ve = (e => (...t) => ({ _$litDirective$: e, values: t }))(class extends class {
    constructor(e) {}
    T(e, t, s) { this.Σdt = e, this.M = t, this.Σct = s }
    S(e, t) { return this.update(e, t) }
    update(e, t) { return this.render(...t) }
} {
    constructor(e) { var t; if (super(e), e.type !== ye || "class" !== e.name || (null === (t = e.strings) || void 0 === t ? void 0 : t.length) > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.") }
    render(e) { return Object.keys(e).filter((t => e[t])).join(" ") }
    update(e, [t]) {
        if (void 0 === this.bt) { this.bt = new Set; for (const e in t) t[e] && this.bt.add(e); return this.render(t) }
        const s = e.element.classList;
        this.bt.forEach((e => { e in t || (s.remove(e), this.bt.delete(e)) }));
        for (const e in t) {
            const r = !!t[e];
            r !== this.bt.has(e) && (r ? (s.add(e), this.bt.add(e)) : (s.remove(e), this.bt.delete(e)))
        }
        return J
    }
});
var be = function(e, t, s, r) {
    var i, n = arguments.length,
        o = n < 3 ? t : null === r ? r = Object.getOwnPropertyDescriptor(t, s) : r;
    if ("object" == typeof Reflect && "function" == typeof Reflect.decorate) o = Reflect.decorate(e, t, s, r);
    else
        for (var a = e.length - 1; a >= 0; a--)(i = e[a]) && (o = (n < 3 ? i(o) : n > 3 ? i(t, s, o) : i(t, s)) || o);
    return n > 3 && o && Object.defineProperty(t, s, o), o
};
let we = class extends ue {
        constructor() { super(...arguments), this._rows = [] }
        render() { return q `${this._rows.map((e=>q`<div
          class=${ve({error:!0===e.error,action:!0===e.action})}
        >
          ${e.message}
        </div>`))}`}willUpdate(){this.toggleAttribute("hidden",!this._rows.length)}clear(){this._rows=[]}processState(e){"error"!==e.state?(this.addRow(e),"finished"===e.state&&this.addAction(q`<button @click=${this.clear}>Close this log</button>`)):this.addError(e.message)}addRow(e){if(e.state&&this._rows.length>0&&this._rows[this._rows.length-1].state===e.state){const t=this._rows.slice(0,-1);t.push(e),this._rows=t}else this._rows=[...this._rows,e]}addError(e){this.addRow({message:e,error:!0})}addAction(e){this.addRow({message:e,action:!0})}removeRow(e){this._rows.length>0&&this._rows[this._rows.length-1].state===e&&(this._rows=this._rows.slice(0,-1))}};function _e(e,t,s,r){var i,n=arguments.length,o=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,s):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,s,r);else for(var a=e.length-1;a>=0;a--)(i=e[a])&&(o=(n<3?i(o):n>3?i(t,s,o):i(t,s))||o);return n>3&&o&&Object.defineProperty(t,s,o),o}we.styles=y`
    :host {
      display: block;
      margin-top: 16px;
      padding: 12px 16px;
      font-family: monospace;
      background: var(--esp-tools-log-background, black);
      color: var(--esp-tools-log-text-color, greenyellow);
      font-size: 14px;
      line-height: 19px;
    }

    :host([hidden]) {
      display: none;
    }

    button {
      background: none;
      color: inherit;
      border: none;
      padding: 0;
      font: inherit;
      text-align: left;
      text-decoration: underline;
      cursor: pointer;
    }

    .error {
      color: var(--esp-tools-error-color, #dc3545);
    }

    .error,
    .action {
      margin-top: 1em;
    }
  `,be([fe()],we.prototype,"_rows",void 0),we=be([me("esp-web-flash-log")],we);const Se="undefined"!=typeof window&&null!=window.customElements&&void 0!==window.customElements.polyfillWrapFlushCallback,xe=(e,t,s=null)=>{for(;t!==s;){const s=t.nextSibling;e.removeChild(t),t=s}},Pe=`{{lit-${String(Math.random()).slice(2)}}}`,Ce=`\x3c!--${Pe}--\x3e`,ke=new RegExp(`${Pe}|${Ce}`);class Ee{constructor(e,t){this.parts=[],this.element=t;const s=[],r=[],i=document.createTreeWalker(t.content,133,null,!1);let n=0,o=-1,a=0;const{strings:l,values:{length:c}}=e;for(;a<c;){const e=i.nextNode();if(null!==e){if(o++,1===e.nodeType){if(e.hasAttributes()){const t=e.attributes,{length:s}=t;let r=0;for(let e=0;e<s;e++)Ae(t[e].name,"$lit$")&&r++;for(;r-- >0;){const t=l[a],s=Ne.exec(t)[2],r=s.toLowerCase()+"$lit$",i=e.getAttribute(r);e.removeAttribute(r);const n=i.split(ke);this.parts.push({type:"attribute",index:o,name:s,strings:n}),a+=n.length-1}}"TEMPLATE"===e.tagName&&(r.push(e),i.currentNode=e.content)}else if(3===e.nodeType){const t=e.data;if(t.indexOf(Pe)>=0){const r=e.parentNode,i=t.split(ke),n=i.length-1;for(let t=0;t<n;t++){let s,n=i[t];if(""===n)s=Te();else{const e=Ne.exec(n);null!==e&&Ae(e[2],"$lit$")&&(n=n.slice(0,e.index)+e[1]+e[2].slice(0,-"$lit$".length)+e[3]),s=document.createTextNode(n)}r.insertBefore(s,e),this.parts.push({type:"node",index:++o})}""===i[n]?(r.insertBefore(Te(),e),s.push(e)):e.data=i[n],a+=n}}else if(8===e.nodeType)if(e.data===Pe){const t=e.parentNode;null!==e.previousSibling&&o!==n||(o++,t.insertBefore(Te(),e)),n=o,this.parts.push({type:"node",index:o}),null===e.nextSibling?e.data="":(s.push(e),o--),a++}else{let t=-1;for(;-1!==(t=e.data.indexOf(Pe,t+1));)this.parts.push({type:"node",index:-1}),a++}}else i.currentNode=r.pop()}for(const e of s)e.parentNode.removeChild(e)}}const Ae=(e,t)=>{const s=e.length-t.length;return s>=0&&e.slice(s)===t},Ue=e=>-1!==e.index,Te=()=>document.createComment(""),Ne=/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;function Re(e,t){const{element:{content:s},parts:r}=e,i=document.createTreeWalker(s,133,null,!1);let n=Oe(r),o=r[n],a=-1,l=0;const c=[];let d=null;for(;i.nextNode();){a++;const e=i.currentNode;for(e.previousSibling===d&&(d=null),t.has(e)&&(c.push(e),null===d&&(d=e)),null!==d&&l++;void 0!==o&&o.index===a;)o.index=null!==d?-1:o.index-l,n=Oe(r,n),o=r[n]}c.forEach((e=>e.parentNode.removeChild(e)))}const $e=e=>{let t=11===e.nodeType?0:1;const s=document.createTreeWalker(e,133,null,!1);for(;s.nextNode();)t++;return t},Oe=(e,t=-1)=>{for(let s=t+1;s<e.length;s++){const t=e[s];if(Ue(t))return s}return-1};const ze=new WeakMap,Ie=e=>(...t)=>{const s=e(...t);return ze.set(s,!0),s},Fe=e=>"function"==typeof e&&ze.has(e),Be={},He={};class Me{constructor(e,t,s){this.__parts=[],this.template=e,this.processor=t,this.options=s}update(e){let t=0;for(const s of this.__parts)void 0!==s&&s.setValue(e[t]),t++;for(const e of this.__parts)void 0!==e&&e.commit()}_clone(){const e=Se?this.template.element.content.cloneNode(!0):document.importNode(this.template.element.content,!0),t=[],s=this.template.parts,r=document.createTreeWalker(e,133,null,!1);let i,n=0,o=0,a=r.nextNode();for(;n<s.length;)if(i=s[n],Ue(i)){for(;o<i.index;)o++,"TEMPLATE"===a.nodeName&&(t.push(a),r.currentNode=a.content),null===(a=r.nextNode())&&(r.currentNode=t.pop(),a=r.nextNode());if("node"===i.type){const e=this.processor.handleTextExpression(this.options);e.insertAfterNode(a.previousSibling),this.__parts.push(e)}else this.__parts.push(...this.processor.handleAttributeExpressions(a,i.name,i.strings,this.options));n++}else this.__parts.push(void 0),n++;return Se&&(document.adoptNode(e),customElements.upgrade(e)),e}}const Ve=window.trustedTypes&&trustedTypes.createPolicy("lit-html",{createHTML:e=>e}),je=` ${Pe} `;class Le{constructor(e,t,s,r){this.strings=e,this.values=t,this.type=s,this.processor=r}getHTML(){const e=this.strings.length-1;let t="",s=!1;for(let r=0;r<e;r++){const e=this.strings[r],i=e.lastIndexOf("\x3c!--");s=(i>-1||s)&&-1===e.indexOf("--\x3e",i+1);const n=Ne.exec(e);t+=null===n?e+(s?je:Ce):e.substr(0,n.index)+n[1]+n[2]+"$lit$"+n[3]+Pe}return t+=this.strings[e],t}getTemplateElement(){const e=document.createElement("template");let t=this.getHTML();return void 0!==Ve&&(t=Ve.createHTML(t)),e.innerHTML=t,e}}const Xe=e=>null===e||!("object"==typeof e||"function"==typeof e),De=e=>Array.isArray(e)||!(!e||!e[Symbol.iterator]);class We{constructor(e,t,s){this.dirty=!0,this.element=e,this.name=t,this.strings=s,this.parts=[];for(let e=0;e<s.length-1;e++)this.parts[e]=this._createPart()}_createPart(){return new qe(this)}_getValue(){const e=this.strings,t=e.length-1,s=this.parts;if(1===t&&""===e[0]&&""===e[1]){const e=s[0].value;if("symbol"==typeof e)return String(e);if("string"==typeof e||!De(e))return e}let r="";for(let i=0;i<t;i++){r+=e[i];const t=s[i];if(void 0!==t){const e=t.value;if(Xe(e)||!De(e))r+="string"==typeof e?e:String(e);else for(const t of e)r+="string"==typeof t?t:String(t)}}return r+=e[t],r}commit(){this.dirty&&(this.dirty=!1,this.element.setAttribute(this.name,this._getValue()))}}class qe{constructor(e){this.value=void 0,this.committer=e}setValue(e){e===Be||Xe(e)&&e===this.value||(this.value=e,Fe(e)||(this.committer.dirty=!0))}commit(){for(;Fe(this.value);){const e=this.value;this.value=Be,e(this)}this.value!==Be&&this.committer.commit()}}class Je{constructor(e){this.value=void 0,this.__pendingValue=void 0,this.options=e}appendInto(e){this.startNode=e.appendChild(Te()),this.endNode=e.appendChild(Te())}insertAfterNode(e){this.startNode=e,this.endNode=e.nextSibling}appendIntoPart(e){e.__insert(this.startNode=Te()),e.__insert(this.endNode=Te())}insertAfterPart(e){e.__insert(this.startNode=Te()),this.endNode=e.endNode,e.endNode=this.startNode}setValue(e){this.__pendingValue=e}commit(){if(null===this.startNode.parentNode)return;for(;Fe(this.__pendingValue);){const e=this.__pendingValue;this.__pendingValue=Be,e(this)}const e=this.__pendingValue;e!==Be&&(Xe(e)?e!==this.value&&this.__commitText(e):e instanceof Le?this.__commitTemplateResult(e):e instanceof Node?this.__commitNode(e):De(e)?this.__commitIterable(e):e===He?(this.value=He,this.clear()):this.__commitText(e))}__insert(e){this.endNode.parentNode.insertBefore(e,this.endNode)}__commitNode(e){this.value!==e&&(this.clear(),this.__insert(e),this.value=e)}__commitText(e){const t=this.startNode.nextSibling,s="string"==typeof(e=null==e?"":e)?e:String(e);t===this.endNode.previousSibling&&3===t.nodeType?t.data=s:this.__commitNode(document.createTextNode(s)),this.value=e}__commitTemplateResult(e){const t=this.options.templateFactory(e);if(this.value instanceof Me&&this.value.template===t)this.value.update(e.values);else{const s=new Me(t,e.processor,this.options),r=s._clone();s.update(e.values),this.__commitNode(r),this.value=s}}__commitIterable(e){Array.isArray(this.value)||(this.value=[],this.clear());const t=this.value;let s,r=0;for(const i of e)s=t[r],void 0===s&&(s=new Je(this.options),t.push(s),0===r?s.appendIntoPart(this):s.insertAfterPart(t[r-1])),s.setValue(i),s.commit(),r++;r<t.length&&(t.length=r,this.clear(s&&s.endNode))}clear(e=this.startNode){xe(this.startNode.parentNode,e.nextSibling,this.endNode)}}class Qe{constructor(e,t,s){if(this.value=void 0,this.__pendingValue=void 0,2!==s.length||""!==s[0]||""!==s[1])throw new Error("Boolean attributes can only contain a single expression");this.element=e,this.name=t,this.strings=s}setValue(e){this.__pendingValue=e}commit(){for(;Fe(this.__pendingValue);){const e=this.__pendingValue;this.__pendingValue=Be,e(this)}if(this.__pendingValue===Be)return;const e=!!this.__pendingValue;this.value!==e&&(e?this.element.setAttribute(this.name,""):this.element.removeAttribute(this.name),this.value=e),this.__pendingValue=Be}}class Ke extends We{constructor(e,t,s){super(e,t,s),this.single=2===s.length&&""===s[0]&&""===s[1]}_createPart(){return new Ze(this)}_getValue(){return this.single?this.parts[0].value:super._getValue()}commit(){this.dirty&&(this.dirty=!1,this.element[this.name]=this._getValue())}}class Ze extends qe{}let Ye=!1;(()=>{try{const e={get capture(){return Ye=!0,!1}};window.addEventListener("test",e,e),window.removeEventListener("test",e,e)}catch(e){}})();class Ge{constructor(e,t,s){this.value=void 0,this.__pendingValue=void 0,this.element=e,this.eventName=t,this.eventContext=s,this.__boundHandleEvent=e=>this.handleEvent(e)}setValue(e){this.__pendingValue=e}commit(){for(;Fe(this.__pendingValue);){const e=this.__pendingValue;this.__pendingValue=Be,e(this)}if(this.__pendingValue===Be)return;const e=this.__pendingValue,t=this.value,s=null==e||null!=t&&(e.capture!==t.capture||e.once!==t.once||e.passive!==t.passive),r=null!=e&&(null==t||s);s&&this.element.removeEventListener(this.eventName,this.__boundHandleEvent,this.__options),r&&(this.__options=et(e),this.element.addEventListener(this.eventName,this.__boundHandleEvent,this.__options)),this.value=e,this.__pendingValue=Be}handleEvent(e){"function"==typeof this.value?this.value.call(this.eventContext||this.element,e):this.value.handleEvent(e)}}const et=e=>e&&(Ye?{capture:e.capture,passive:e.passive,once:e.once}:e.capture);function tt(e){let t=st.get(e.type);void 0===t&&(t={stringsArray:new WeakMap,keyString:new Map},st.set(e.type,t));let s=t.stringsArray.get(e.strings);if(void 0!==s)return s;const r=e.strings.join(Pe);return s=t.keyString.get(r),void 0===s&&(s=new Ee(e,e.getTemplateElement()),t.keyString.set(r,s)),t.stringsArray.set(e.strings,s),s}const st=new Map,rt=new WeakMap;const it=new class{handleAttributeExpressions(e,t,s,r){const i=t[0];if("."===i){return new Ke(e,t.slice(1),s).parts}if("@"===i)return[new Ge(e,t.slice(1),r.eventContext)];if("?"===i)return[new Qe(e,t.slice(1),s)];return new We(e,t,s).parts}handleTextExpression(e){return new Je(e)}};"undefined"!=typeof window&&(window.litHtmlVersions||(window.litHtmlVersions=[])).push("1.4.1");const nt=(e,...t)=>new Le(e,t,"html",it),ot=(e,t)=>`${e}--${t}`;let at=!0;void 0===window.ShadyCSS?at=!1:void 0===window.ShadyCSS.prepareTemplateDom&&(console.warn("Incompatible ShadyCSS version detected. Please update to at least @webcomponents/webcomponentsjs@2.0.2 and @webcomponents/shadycss@1.3.1."),at=!1);const lt=e=>t=>{const s=ot(t.type,e);let r=st.get(s);void 0===r&&(r={stringsArray:new WeakMap,keyString:new Map},st.set(s,r));let i=r.stringsArray.get(t.strings);if(void 0!==i)return i;const n=t.strings.join(Pe);if(i=r.keyString.get(n),void 0===i){const s=t.getTemplateElement();at&&window.ShadyCSS.prepareTemplateDom(s,e),i=new Ee(t,s),r.keyString.set(n,i)}return r.stringsArray.set(t.strings,i),i},ct=["html","svg"],dt=new Set,ht=(e,t,s)=>{dt.add(e);const r=s?s.element:document.createElement("template"),i=t.querySelectorAll("style"),{length:n}=i;if(0===n)return void window.ShadyCSS.prepareTemplateStyles(r,e);const o=document.createElement("style");for(let e=0;e<n;e++){const t=i[e];t.parentNode.removeChild(t),o.textContent+=t.textContent}(e=>{ct.forEach((t=>{const s=st.get(ot(t,e));void 0!==s&&s.keyString.forEach((e=>{const{element:{content:t}}=e,s=new Set;Array.from(t.querySelectorAll("style")).forEach((e=>{s.add(e)})),Re(e,s)}))}))})(e);const a=r.content;s?function(e,t,s=null){const{element:{content:r},parts:i}=e;if(null==s)return void r.appendChild(t);const n=document.createTreeWalker(r,133,null,!1);let o=Oe(i),a=0,l=-1;for(;n.nextNode();)for(l++,n.currentNode===s&&(a=$e(t),s.parentNode.insertBefore(t,s));-1!==o&&i[o].index===l;){if(a>0){for(;-1!==o;)i[o].index+=a,o=Oe(i,o);return}o=Oe(i,o)}}(s,o,a.firstChild):a.insertBefore(o,a.firstChild),window.ShadyCSS.prepareTemplateStyles(r,e);const l=a.querySelector("style");if(window.ShadyCSS.nativeShadow&&null!==l)t.insertBefore(l.cloneNode(!0),t.firstChild);else if(s){a.insertBefore(o,a.firstChild);const e=new Set;e.add(o),Re(s,e)}};window.JSCompiler_renameProperty=(e,t)=>e;const pt={toAttribute(e,t){switch(t){case Boolean:return e?"":null;case Object:case Array:return null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){switch(t){case Boolean:return null!==e;case Number:return null===e?null:Number(e);case Object:case Array:return JSON.parse(e)}return e}},ut=(e,t)=>t!==e&&(t==t||e==e),mt={attribute:!0,type:String,converter:pt,reflect:!1,hasChanged:ut};class gt extends HTMLElement{constructor(){super(),this.initialize()}static get observedAttributes(){this.finalize();const e=[];return this._classProperties.forEach(((t,s)=>{const r=this._attributeNameForProperty(s,t);void 0!==r&&(this._attributeToPropertyMap.set(r,s),e.push(r))})),e}static _ensureClassProperties(){if(!this.hasOwnProperty(JSCompiler_renameProperty("_classProperties",this))){this._classProperties=new Map;const e=Object.getPrototypeOf(this)._classProperties;void 0!==e&&e.forEach(((e,t)=>this._classProperties.set(t,e)))}}static createProperty(e,t=mt){if(this._ensureClassProperties(),this._classProperties.set(e,t),t.noAccessor||this.prototype.hasOwnProperty(e))return;const s="symbol"==typeof e?Symbol():`__${e}`,r=this.getPropertyDescriptor(e,s,t);void 0!==r&&Object.defineProperty(this.prototype,e,r)}static getPropertyDescriptor(e,t,s){return{get(){return this[t]},set(r){const i=this[e];this[t]=r,this.requestUpdateInternal(e,i,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this._classProperties&&this._classProperties.get(e)||mt}static finalize(){const e=Object.getPrototypeOf(this);if(e.hasOwnProperty("finalized")||e.finalize(),this.finalized=!0,this._ensureClassProperties(),this._attributeToPropertyMap=new Map,this.hasOwnProperty(JSCompiler_renameProperty("properties",this))){const e=this.properties,t=[...Object.getOwnPropertyNames(e),..."function"==typeof Object.getOwnPropertySymbols?Object.getOwnPropertySymbols(e):[]];for(const s of t)this.createProperty(s,e[s])}}static _attributeNameForProperty(e,t){const s=t.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof e?e.toLowerCase():void 0}static _valueHasChanged(e,t,s=ut){return s(e,t)}static _propertyValueFromAttribute(e,t){const s=t.type,r=t.converter||pt,i="function"==typeof r?r:r.fromAttribute;return i?i(e,s):e}static _propertyValueToAttribute(e,t){if(void 0===t.reflect)return;const s=t.type,r=t.converter;return(r&&r.toAttribute||pt.toAttribute)(e,s)}initialize(){this._updateState=0,this._updatePromise=new Promise((e=>this._enableUpdatingResolver=e)),this._changedProperties=new Map,this._saveInstanceProperties(),this.requestUpdateInternal()}_saveInstanceProperties(){this.constructor._classProperties.forEach(((e,t)=>{if(this.hasOwnProperty(t)){const e=this[t];delete this[t],this._instanceProperties||(this._instanceProperties=new Map),this._instanceProperties.set(t,e)}}))}_applyInstanceProperties(){this._instanceProperties.forEach(((e,t)=>this[t]=e)),this._instanceProperties=void 0}connectedCallback(){this.enableUpdating()}enableUpdating(){void 0!==this._enableUpdatingResolver&&(this._enableUpdatingResolver(),this._enableUpdatingResolver=void 0)}disconnectedCallback(){}attributeChangedCallback(e,t,s){t!==s&&this._attributeToProperty(e,s)}_propertyToAttribute(e,t,s=mt){const r=this.constructor,i=r._attributeNameForProperty(e,s);if(void 0!==i){const e=r._propertyValueToAttribute(t,s);if(void 0===e)return;this._updateState=8|this._updateState,null==e?this.removeAttribute(i):this.setAttribute(i,e),this._updateState=-9&this._updateState}}_attributeToProperty(e,t){if(8&this._updateState)return;const s=this.constructor,r=s._attributeToPropertyMap.get(e);if(void 0!==r){const e=s.getPropertyOptions(r);this._updateState=16|this._updateState,this[r]=s._propertyValueFromAttribute(t,e),this._updateState=-17&this._updateState}}requestUpdateInternal(e,t,s){let r=!0;if(void 0!==e){const i=this.constructor;s=s||i.getPropertyOptions(e),i._valueHasChanged(this[e],t,s.hasChanged)?(this._changedProperties.has(e)||this._changedProperties.set(e,t),!0!==s.reflect||16&this._updateState||(void 0===this._reflectingProperties&&(this._reflectingProperties=new Map),this._reflectingProperties.set(e,s))):r=!1}!this._hasRequestedUpdate&&r&&(this._updatePromise=this._enqueueUpdate())}requestUpdate(e,t){return this.requestUpdateInternal(e,t),this.updateComplete}async _enqueueUpdate(){this._updateState=4|this._updateState;try{await this._updatePromise}catch(e){}const e=this.performUpdate();return null!=e&&await e,!this._hasRequestedUpdate}get _hasRequestedUpdate(){return 4&this._updateState}get hasUpdated(){return 1&this._updateState}performUpdate(){if(!this._hasRequestedUpdate)return;this._instanceProperties&&this._applyInstanceProperties();let e=!1;const t=this._changedProperties;try{e=this.shouldUpdate(t),e?this.update(t):this._markUpdated()}catch(t){throw e=!1,this._markUpdated(),t}e&&(1&this._updateState||(this._updateState=1|this._updateState,this.firstUpdated(t)),this.updated(t))}_markUpdated(){this._changedProperties=new Map,this._updateState=-5&this._updateState}get updateComplete(){return this._getUpdateComplete()}_getUpdateComplete(){return this._updatePromise}shouldUpdate(e){return!0}update(e){void 0!==this._reflectingProperties&&this._reflectingProperties.size>0&&(this._reflectingProperties.forEach(((e,t)=>this._propertyToAttribute(t,this[t],e))),this._reflectingProperties=void 0),this._markUpdated()}updated(e){}firstUpdated(e){}}gt.finalized=!0;const ft=(e,t)=>"method"===t.kind&&t.descriptor&&!("value"in t.descriptor)?Object.assign(Object.assign({},t),{finisher(s){s.createProperty(t.key,e)}}):{kind:"field",key:Symbol(),placement:"own",descriptor:{},initializer(){"function"==typeof t.initializer&&(this[t.key]=t.initializer.call(this))},finisher(s){s.createProperty(t.key,e)}};function yt(e){return(t,s)=>void 0!==s?((e,t,s)=>{t.constructor.createProperty(s,e)})(e,t,s):ft(e,t)}function vt(e){return yt({attribute:!1,hasChanged:null==e?void 0:e.hasChanged})}const bt=(e,t,s)=>{Object.defineProperty(t,s,e)},wt=(e,t)=>({kind:"method",placement:"prototype",key:t.key,descriptor:e}),_t=window.ShadowRoot&&(void 0===window.ShadyCSS||window.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,St=Symbol();class xt{constructor(e,t){if(t!==St)throw new Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e}get styleSheet(){return void 0===this._styleSheet&&(_t?(this._styleSheet=new CSSStyleSheet,this._styleSheet.replaceSync(this.cssText)):this._styleSheet=null),this._styleSheet}toString(){return this.cssText}}(window.litElementVersions||(window.litElementVersions=[])).push("2.4.0");const Pt={};class Ct extends gt{static getStyles(){return this.styles}static _getUniqueStyles(){if(this.hasOwnProperty(JSCompiler_renameProperty("_styles",this)))return;const e=this.getStyles();if(Array.isArray(e)){const t=(e,s)=>e.reduceRight(((e,s)=>Array.isArray(s)?t(s,e):(e.add(s),e)),s),s=t(e,new Set),r=[];s.forEach((e=>r.unshift(e))),this._styles=r}else this._styles=void 0===e?[]:[e];this._styles=this._styles.map((e=>{if(e instanceof CSSStyleSheet&&!_t){const t=Array.prototype.slice.call(e.cssRules).reduce(((e,t)=>e+t.cssText),"");return new xt(String(t),St)}return e}))}initialize(){super.initialize(),this.constructor._getUniqueStyles(),this.renderRoot=this.createRenderRoot(),window.ShadowRoot&&this.renderRoot instanceof window.ShadowRoot&&this.adoptStyles()}createRenderRoot(){return this.attachShadow({mode:"open"})}adoptStyles(){const e=this.constructor._styles;0!==e.length&&(void 0===window.ShadyCSS||window.ShadyCSS.nativeShadow?_t?this.renderRoot.adoptedStyleSheets=e.map((e=>e instanceof CSSStyleSheet?e:e.styleSheet)):this._needsShimAdoptedStyleSheets=!0:window.ShadyCSS.ScopingShim.prepareAdoptedCssText(e.map((e=>e.cssText)),this.localName))}connectedCallback(){super.connectedCallback(),this.hasUpdated&&void 0!==window.ShadyCSS&&window.ShadyCSS.styleElement(this)}update(e){const t=this.render();super.update(e),t!==Pt&&this.constructor.render(t,this.renderRoot,{scopeName:this.localName,eventContext:this}),this._needsShimAdoptedStyleSheets&&(this._needsShimAdoptedStyleSheets=!1,this.constructor._styles.forEach((e=>{const t=document.createElement("style");t.textContent=e.cssText,this.renderRoot.appendChild(t)})))}render(){return Pt}}Ct.finalized=!0,Ct.render=(e,t,s)=>{if(!s||"object"!=typeof s||!s.scopeName)throw new Error("The `scopeName` option is required.");const r=s.scopeName,i=rt.has(t),n=at&&11===t.nodeType&&!!t.host,o=n&&!dt.has(r),a=o?document.createDocumentFragment():t;if(((e,t,s)=>{let r=rt.get(t);void 0===r&&(xe(t,t.firstChild),rt.set(t,r=new Je(Object.assign({templateFactory:tt},s))),r.appendInto(t)),r.setValue(e),r.commit()})(e,a,Object.assign({templateFactory:lt(r)},s)),o){const e=rt.get(a);rt.delete(a);const s=e.value instanceof Me?e.value.template:void 0;ht(r,a,s),xe(t,t.firstChild),t.appendChild(a),rt.set(t,e)}!i&&n&&window.ShadyCSS.styleElement(t.host)};class kt{constructor(e){this.classes=new Set,this.changed=!1,this.element=e;const t=(e.getAttribute("class")||"").split(/\s+/);for(const e of t)this.classes.add(e)}add(e){this.classes.add(e),this.changed=!0}remove(e){this.classes.delete(e),this.changed=!0}commit(){if(this.changed){let e="";this.classes.forEach((t=>e+=t+" ")),this.element.setAttribute("class",e)}}}const Et=new WeakMap,At=Ie((e=>t=>{if(!(t instanceof qe)||t instanceof Ze||"class"!==t.committer.name||t.committer.parts.length>1)throw new Error("The `classMap` directive must be used in the `class` attribute and must be the only part in the attribute.");const{committer:s}=t,{element:r}=s;let i=Et.get(t);void 0===i&&(r.setAttribute("class",s.strings.join(" ")),Et.set(t,i=new Set));const n=r.classList||new kt(r);i.forEach((t=>{t in e||(n.remove(t),i.delete(t))}));for(const t in e){const s=e[t];s!=i.has(t)&&(s?(n.add(t),i.add(t)):(n.remove(t),i.delete(t)))}"function"==typeof n.commit&&n.commit()})),Ut=new WeakMap,Tt=Ie((e=>t=>{const s=Ut.get(t);if(void 0===e&&t instanceof qe){if(void 0!==s||!Ut.has(t)){const e=t.committer.name;t.committer.element.removeAttribute(e)}}else e!==s&&t.setValue(e);Ut.set(t,e)})),Nt=new WeakMap,Rt=Ie((e=>t=>{if(!(t instanceof qe)||t instanceof Ze||"style"!==t.committer.name||t.committer.parts.length>1)throw new Error("The `styleMap` directive must be used in the style attribute and must be the only part in the attribute.");const{committer:s}=t,{style:r}=s.element;let i=Nt.get(t);void 0===i&&(r.cssText=s.strings.join(" "),Nt.set(t,i=new Set)),i.forEach((t=>{t in e||(i.delete(t),-1===t.indexOf("-")?r[t]=null:r.removeProperty(t))}));for(const t in e)i.add(t),-1===t.indexOf("-")?r[t]=e[t]:r.setProperty(t,e[t])}));class $t extends Ct{constructor(){super(...arguments),this.indeterminate=!1,this.progress=0,this.buffer=1,this.reverse=!1,this.closed=!1,this.stylePrimaryHalf="",this.stylePrimaryFull="",this.styleSecondaryQuarter="",this.styleSecondaryHalf="",this.styleSecondaryFull="",this.animationReady=!0,this.closedAnimationOff=!1,this.resizeObserver=null}connectedCallback(){super.connectedCallback(),this.rootEl&&this.attachResizeObserver()}render(){const e={"mdc-linear-progress--closed":this.closed,"mdc-linear-progress--closed-animation-off":this.closedAnimationOff,"mdc-linear-progress--indeterminate":this.indeterminate,"mdc-linear-progress--animation-ready":this.animationReady},t={"--mdc-linear-progress-primary-half":this.stylePrimaryHalf,"--mdc-linear-progress-primary-half-neg":""!==this.stylePrimaryHalf?`-${this.stylePrimaryHalf}`:"","--mdc-linear-progress-primary-full":this.stylePrimaryFull,"--mdc-linear-progress-primary-full-neg":""!==this.stylePrimaryFull?`-${this.stylePrimaryFull}`:"","--mdc-linear-progress-secondary-quarter":this.styleSecondaryQuarter,"--mdc-linear-progress-secondary-quarter-neg":""!==this.styleSecondaryQuarter?`-${this.styleSecondaryQuarter}`:"","--mdc-linear-progress-secondary-half":this.styleSecondaryHalf,"--mdc-linear-progress-secondary-half-neg":""!==this.styleSecondaryHalf?`-${this.styleSecondaryHalf}`:"","--mdc-linear-progress-secondary-full":this.styleSecondaryFull,"--mdc-linear-progress-secondary-full-neg":""!==this.styleSecondaryFull?`-${this.styleSecondaryFull}`:""},s={"flex-basis":this.indeterminate?"100%":100*this.buffer+"%"},r={transform:this.indeterminate?"scaleX(1)":`scaleX(${this.progress})`};return nt`
      <div
          role="progressbar"
          class="mdc-linear-progress ${At(e)}"
          style="${Rt(t)}"
          dir="${Tt(this.reverse?"rtl":void 0)}"
          aria-label="${Tt(this.ariaLabel)}"
          aria-valuemin="0"
          aria-valuemax="1"
          aria-valuenow="${Tt(this.indeterminate?void 0:this.progress)}"
        @transitionend="${this.syncClosedState}">
        <div class="mdc-linear-progress__buffer">
          <div
            class="mdc-linear-progress__buffer-bar"
            style=${Rt(s)}>
          </div>
          <div class="mdc-linear-progress__buffer-dots"></div>
        </div>
        <div
            class="mdc-linear-progress__bar mdc-linear-progress__primary-bar"
            style=${Rt(r)}>
          <span class="mdc-linear-progress__bar-inner"></span>
        </div>
        <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
          <span class="mdc-linear-progress__bar-inner"></span>
        </div>
      </div>`}update(e){!e.has("closed")||this.closed&&void 0!==e.get("closed")||this.syncClosedState(),super.update(e)}async firstUpdated(e){super.firstUpdated(e),this.attachResizeObserver()}syncClosedState(){this.closedAnimationOff=this.closed}updated(e){!e.has("indeterminate")&&e.has("reverse")&&this.indeterminate&&this.restartAnimation(),e.has("indeterminate")&&void 0!==e.get("indeterminate")&&this.indeterminate&&window.ResizeObserver&&this.calculateAndSetAnimationDimensions(this.rootEl.offsetWidth),super.updated(e)}disconnectedCallback(){this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null),super.disconnectedCallback()}attachResizeObserver(){if(window.ResizeObserver)return this.resizeObserver=new window.ResizeObserver((e=>{if(this.indeterminate)for(const t of e)if(t.contentRect){const e=t.contentRect.width;this.calculateAndSetAnimationDimensions(e)}})),void this.resizeObserver.observe(this.rootEl);this.resizeObserver=null}calculateAndSetAnimationDimensions(e){const t=.8367142*e,s=2.00611057*e,r=.37651913*e,i=.84386165*e,n=1.60277782*e;this.stylePrimaryHalf=`${t}px`,this.stylePrimaryFull=`${s}px`,this.styleSecondaryQuarter=`${r}px`,this.styleSecondaryHalf=`${i}px`,this.styleSecondaryFull=`${n}px`,this.restartAnimation()}async restartAnimation(){this.animationReady=!1,await this.updateComplete,await new Promise(requestAnimationFrame),this.animationReady=!0,await this.updateComplete}open(){this.closed=!1}close(){this.closed=!0}}var Ot,zt;_e([(Ot=".mdc-linear-progress",(e,t)=>{const s={get(){return this.renderRoot.querySelector(Ot)},enumerable:!0,configurable:!0};if(zt){const e="symbol"==typeof t?Symbol():`__${t}`;s.get=function(){return void 0===this[e]&&(this[e]=this.renderRoot.querySelector(Ot)),this[e]}}return void 0!==t?bt(s,e,t):wt(s,e)})],$t.prototype,"rootEl",void 0),_e([yt({type:Boolean,reflect:!0})],$t.prototype,"indeterminate",void 0),_e([yt({type:Number})],$t.prototype,"progress",void 0),_e([yt({type:Number})],$t.prototype,"buffer",void 0),_e([yt({type:Boolean,reflect:!0})],$t.prototype,"reverse",void 0),_e([yt({type:Boolean,reflect:!0})],$t.prototype,"closed",void 0),_e([function(e,t,s){if(void 0!==t)return function(e,t,s){const r=e.constructor;if(!s){const e=`__${t}`;if(!(s=r.getPropertyDescriptor(t,e)))throw new Error("@ariaProperty must be used after a @property decorator")}const i=s;let n="";if(!i.set)throw new Error(`@ariaProperty requires a setter for ${t}`);const o={configurable:!0,enumerable:!0,set(e){if(""===n){const e=r.getPropertyOptions(t);n=e.attribute}this.hasAttribute(n)&&this.removeAttribute(n),i.set.call(this,e)}};return i.get&&(o.get=function(){return i.get.call(this)}),o}(e,t,s);throw new Error("@ariaProperty only supports TypeScript Decorators")},yt({attribute:"aria-label"})],$t.prototype,"ariaLabel",void 0),_e([vt()],$t.prototype,"stylePrimaryHalf",void 0),_e([vt()],$t.prototype,"stylePrimaryFull",void 0),_e([vt()],$t.prototype,"styleSecondaryQuarter",void 0),_e([vt()],$t.prototype,"styleSecondaryHalf",void 0),_e([vt()],$t.prototype,"styleSecondaryFull",void 0),_e([vt()],$t.prototype,"animationReady",void 0),_e([vt()],$t.prototype,"closedAnimationOff",void 0);const It=((e,...t)=>{const s=t.reduce(((t,s,r)=>t+(e=>{if(e instanceof xt)return e.cssText;if("number"==typeof e)return e;throw new Error(`Value passed to 'css' function must be a 'css' function result: ${e}. Use 'unsafeCSS' to pass non-literal values, but\n            take care to ensure page security.`)})(s)+e[r+1]),e[0]);return new xt(s,St)})`@keyframes mdc-linear-progress-primary-indeterminate-translate{0%{transform:translateX(0)}20%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(0)}59.15%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(83.67142%);transform:translateX(var(--mdc-linear-progress-primary-half, 83.67142%))}100%{transform:translateX(200.611057%);transform:translateX(var(--mdc-linear-progress-primary-full, 200.611057%))}}@keyframes mdc-linear-progress-primary-indeterminate-scale{0%{transform:scaleX(0.08)}36.65%{animation-timing-function:cubic-bezier(0.334731, 0.12482, 0.785844, 1);transform:scaleX(0.08)}69.15%{animation-timing-function:cubic-bezier(0.06, 0.11, 0.6, 1);transform:scaleX(0.661479)}100%{transform:scaleX(0.08)}}@keyframes mdc-linear-progress-secondary-indeterminate-translate{0%{animation-timing-function:cubic-bezier(0.15, 0, 0.515058, 0.409685);transform:translateX(0)}25%{animation-timing-function:cubic-bezier(0.31033, 0.284058, 0.8, 0.733712);transform:translateX(37.651913%);transform:translateX(var(--mdc-linear-progress-secondary-quarter, 37.651913%))}48.35%{animation-timing-function:cubic-bezier(0.4, 0.627035, 0.6, 0.902026);transform:translateX(84.386165%);transform:translateX(var(--mdc-linear-progress-secondary-half, 84.386165%))}100%{transform:translateX(160.277782%);transform:translateX(var(--mdc-linear-progress-secondary-full, 160.277782%))}}@keyframes mdc-linear-progress-secondary-indeterminate-scale{0%{animation-timing-function:cubic-bezier(0.205028, 0.057051, 0.57661, 0.453971);transform:scaleX(0.08)}19.15%{animation-timing-function:cubic-bezier(0.152313, 0.196432, 0.648374, 1.004315);transform:scaleX(0.457104)}44.15%{animation-timing-function:cubic-bezier(0.257759, -0.003163, 0.211762, 1.38179);transform:scaleX(0.72796)}100%{transform:scaleX(0.08)}}@keyframes mdc-linear-progress-buffering{from{transform:rotate(180deg) translateX(-10px)}}@keyframes mdc-linear-progress-primary-indeterminate-translate-reverse{0%{transform:translateX(0)}20%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(0)}59.15%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(-83.67142%);transform:translateX(var(--mdc-linear-progress-primary-half-neg, -83.67142%))}100%{transform:translateX(-200.611057%);transform:translateX(var(--mdc-linear-progress-primary-full-neg, -200.611057%))}}@keyframes mdc-linear-progress-secondary-indeterminate-translate-reverse{0%{animation-timing-function:cubic-bezier(0.15, 0, 0.515058, 0.409685);transform:translateX(0)}25%{animation-timing-function:cubic-bezier(0.31033, 0.284058, 0.8, 0.733712);transform:translateX(-37.651913%);transform:translateX(var(--mdc-linear-progress-secondary-quarter-neg, -37.651913%))}48.35%{animation-timing-function:cubic-bezier(0.4, 0.627035, 0.6, 0.902026);transform:translateX(-84.386165%);transform:translateX(var(--mdc-linear-progress-secondary-half-neg, -84.386165%))}100%{transform:translateX(-160.277782%);transform:translateX(var(--mdc-linear-progress-secondary-full-neg, -160.277782%))}}@keyframes mdc-linear-progress-buffering-reverse{from{transform:translateX(-10px)}}.mdc-linear-progress{position:relative;width:100%;height:4px;transform:translateZ(0);outline:1px solid transparent;overflow:hidden;transition:opacity 250ms 0ms cubic-bezier(0.4, 0, 0.6, 1)}.mdc-linear-progress__bar{position:absolute;width:100%;height:100%;animation:none;transform-origin:top left;transition:transform 250ms 0ms cubic-bezier(0.4, 0, 0.6, 1)}.mdc-linear-progress__bar-inner{display:inline-block;position:absolute;width:100%;animation:none;border-top:4px solid}.mdc-linear-progress__buffer{display:flex;position:absolute;width:100%;height:100%}.mdc-linear-progress__buffer-dots{background-repeat:repeat-x;background-size:10px 4px;flex:auto;transform:rotate(180deg);animation:mdc-linear-progress-buffering 250ms infinite linear}.mdc-linear-progress__buffer-bar{flex:0 1 100%;transition:flex-basis 250ms 0ms cubic-bezier(0.4, 0, 0.6, 1)}.mdc-linear-progress__primary-bar{transform:scaleX(0)}.mdc-linear-progress__secondary-bar{visibility:hidden}.mdc-linear-progress--indeterminate .mdc-linear-progress__bar{transition:none}.mdc-linear-progress--indeterminate .mdc-linear-progress__primary-bar{left:-145.166611%}.mdc-linear-progress--indeterminate .mdc-linear-progress__secondary-bar{left:-54.888891%;visibility:visible}.mdc-linear-progress--indeterminate.mdc-linear-progress--animation-ready .mdc-linear-progress__primary-bar{animation:mdc-linear-progress-primary-indeterminate-translate 2s infinite linear}.mdc-linear-progress--indeterminate.mdc-linear-progress--animation-ready .mdc-linear-progress__primary-bar>.mdc-linear-progress__bar-inner{animation:mdc-linear-progress-primary-indeterminate-scale 2s infinite linear}.mdc-linear-progress--indeterminate.mdc-linear-progress--animation-ready .mdc-linear-progress__secondary-bar{animation:mdc-linear-progress-secondary-indeterminate-translate 2s infinite linear}.mdc-linear-progress--indeterminate.mdc-linear-progress--animation-ready .mdc-linear-progress__secondary-bar>.mdc-linear-progress__bar-inner{animation:mdc-linear-progress-secondary-indeterminate-scale 2s infinite linear}[dir=rtl] .mdc-linear-progress:not([dir=ltr]) .mdc-linear-progress__bar,.mdc-linear-progress[dir=rtl]:not([dir=ltr]) .mdc-linear-progress__bar{right:0;-webkit-transform-origin:center right;transform-origin:center right}[dir=rtl] .mdc-linear-progress:not([dir=ltr]).mdc-linear-progress--animation-ready .mdc-linear-progress__primary-bar,.mdc-linear-progress[dir=rtl]:not([dir=ltr]).mdc-linear-progress--animation-ready .mdc-linear-progress__primary-bar{animation-name:mdc-linear-progress-primary-indeterminate-translate-reverse}[dir=rtl] .mdc-linear-progress:not([dir=ltr]).mdc-linear-progress--animation-ready .mdc-linear-progress__secondary-bar,.mdc-linear-progress[dir=rtl]:not([dir=ltr]).mdc-linear-progress--animation-ready .mdc-linear-progress__secondary-bar{animation-name:mdc-linear-progress-secondary-indeterminate-translate-reverse}[dir=rtl] .mdc-linear-progress:not([dir=ltr]) .mdc-linear-progress__buffer-dots,.mdc-linear-progress[dir=rtl]:not([dir=ltr]) .mdc-linear-progress__buffer-dots{animation:mdc-linear-progress-buffering-reverse 250ms infinite linear;transform:rotate(0)}[dir=rtl] .mdc-linear-progress:not([dir=ltr]).mdc-linear-progress--indeterminate .mdc-linear-progress__primary-bar,.mdc-linear-progress[dir=rtl]:not([dir=ltr]).mdc-linear-progress--indeterminate .mdc-linear-progress__primary-bar{right:-145.166611%;left:auto}[dir=rtl] .mdc-linear-progress:not([dir=ltr]).mdc-linear-progress--indeterminate .mdc-linear-progress__secondary-bar,.mdc-linear-progress[dir=rtl]:not([dir=ltr]).mdc-linear-progress--indeterminate .mdc-linear-progress__secondary-bar{right:-54.888891%;left:auto}.mdc-linear-progress--closed{opacity:0}.mdc-linear-progress--closed-animation-off .mdc-linear-progress__buffer-dots{animation:none}.mdc-linear-progress--closed-animation-off.mdc-linear-progress--indeterminate .mdc-linear-progress__bar,.mdc-linear-progress--closed-animation-off.mdc-linear-progress--indeterminate .mdc-linear-progress__bar .mdc-linear-progress__bar-inner{animation:none}.mdc-linear-progress__bar-inner{border-color:#6200ee;border-color:var(--mdc-theme-primary, #6200ee)}.mdc-linear-progress__buffer-dots{background-image:url("data:image/svg+xml,%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' enable-background='new 0 0 5 2' xml:space='preserve' viewBox='0 0 5 2' preserveAspectRatio='none slice'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23e6e6e6'/%3E%3C/svg%3E")}.mdc-linear-progress__buffer-bar{background-color:#e6e6e6}:host{display:block}.mdc-linear-progress__buffer-bar{background-color:#e6e6e6;background-color:var(--mdc-linear-progress-buffer-color, #e6e6e6)}.mdc-linear-progress__buffer-dots{background-image:url("data:image/svg+xml,%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' enable-background='new 0 0 5 2' xml:space='preserve' viewBox='0 0 5 2' preserveAspectRatio='none slice'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23e6e6e6'/%3E%3C/svg%3E");background-image:var(--mdc-linear-progress-buffering-dots-image, url("data:image/svg+xml,%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' enable-background='new 0 0 5 2' xml:space='preserve' viewBox='0 0 5 2' preserveAspectRatio='none slice'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23e6e6e6'/%3E%3C/svg%3E"))}`;let Ft=class extends $t{};var Bt;Ft.styles=It,Ft=_e([(Bt="mwc-linear-progress",e=>"function"==typeof e?((e,t)=>(window.customElements.define(e,t),t))(Bt,e):((e,t)=>{const{kind:s,elements:r}=t;return{kind:s,elements:r,finisher(t){window.customElements.define(e,t)}}})(Bt,e))],Ft);var Ht=function(e,t,s,r){var i,n=arguments.length,o=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,s):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,s,r);else for(var a=e.length-1;a>=0;a--)(i=e[a])&&(o=(n<3?i(o):n>3?i(t,s,o):i(t,s))||o);return n>3&&o&&Object.defineProperty(t,s,o),o};let Mt=class extends ue{constructor(){super(...arguments),this._indeterminate=!0,this._progress=0}processState(e){this._state=e,"writing"===this._state.state&&(this._indeterminate=!1,this._progress=this._state.details.percentage/100),"error"===this._state.state&&(this._indeterminate=!1)}clear(){this._state=void 0,this._progress=0,this._indeterminate=!0}render(){if(this._state)return q`<h2
        class=${ve({error:"error"===this._state.state,done:"finished"===this._state.state})}
      >
        ${this._state.message}
      </h2>
      <p>
        ${this._state.manifest?q`${this._state.manifest.name}: ${this._state.chipFamily}`:q`&nbsp;`}
      </p>
      <mwc-linear-progress
        class=${ve({error:"error"===this._state.state,done:"finished"===this._state.state})}
        .indeterminate=${this._indeterminate}
        .progress=${this._progress}
      ></mwc-linear-progress>`}};Mt.styles=y`
    :host {
      display: block;
      --mdc-theme-primary: var(--esp-tools-progress-color, #03a9f4);
    }
    .error {
      color: var(--esp-tools-error-color, #dc3545);
      --mdc-theme-primary: var(--esp-tools-error-color, #dc3545);
    }
    .done {
      color: var(--esp-tools-success-color, #28a745);
      --mdc-theme-primary: var(--esp-tools-success-color, #28a745);
    }
    mwc-linear-progress {
      text-align: left;
    }
    h2 {
      margin: 16px 0 0;
    }
    p {
      margin: 4px 0;
    }
  `,Ht([fe()],Mt.prototype,"_state",void 0),Ht([fe()],Mt.prototype,"_indeterminate",void 0),Ht([fe()],Mt.prototype,"_progress",void 0),Mt=Ht([me("esp-web-flash-progress")],Mt);let Vt,jt,Lt,Xt=!1;const Dt=(e,t)=>(e.renderRoot.append(t),t),Wt=async e=>{if(e.hasAttribute("active"))return;const t=e.manifest||e.getAttribute("manifest");if(!t)return void alert("No manifest defined!");let s=!1;Xt||(Xt=!0,e.addEventListener("state-changed",(t=>{var r;const i=e.state=t.detail;"initializing"===i.state?e.toggleAttribute("active",!0):"manifest"===i.state&&(null===(r=i.build)||void 0===r?void 0:r.improv)?(s=!0,import("https://www.improv-wifi.com/sdk-js/launch-button.js")):"finished"===i.state?(e.toggleAttribute("active",!1),s&&qt(e)):"error"===i.state&&e.toggleAttribute("active",!1),null==jt||jt.processState(t.detail),null==Vt||Vt.processState(t.detail)})));const r=e.logConsole||e.hasAttribute("log-console"),i=e.showLog||e.hasAttribute("show-log"),n=!i&&!0!==e.hideProgress&&!e.hasAttribute("hide-progress");i&&!Vt?Vt=Dt(e,document.createElement("esp-web-flash-log")):!i&&Vt&&(Vt.remove(),Vt=void 0),n&&!jt?jt=Dt(e,document.createElement("esp-web-flash-progress")):!n&&jt&&(jt.remove(),jt=void 0),null==Vt||Vt.clear(),null==jt||jt.clear(),null==Lt||Lt.classList.toggle("hidden",!0),h(e,r?console:{log:()=>{},error:()=>{},debug:()=>{}},t,void 0!==e.eraseFirst?e.eraseFirst:e.hasAttribute("erase-first"))},qt=async e=>{await import("https://www.improv-wifi.com/sdk-js/launch-button.js");const t=customElements.get("improv-wifi-launch-button");if(t.isSupported&&t.isAllowed){if(!Lt){Lt=document.createElement("improv-wifi-launch-button"),Lt.addEventListener("state-changed",(e=>{"PROVISIONED"===e.detail.state&&Lt.classList.toggle("hidden",!0)}));const t=document.createElement("button");t.slot="activate",t.textContent="CLICK HERE TO FINISH SETTING UP YOUR DEVICE",Lt.appendChild(t),Dt(e,Lt)}Lt.classList.toggle("hidden",!1)}};export{Wt as startFlash};