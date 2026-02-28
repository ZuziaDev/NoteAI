import C from "node:http";
import te from "node:https";
import B from "node:zlib";
import S, { PassThrough as F, pipeline as U } from "node:stream";
import { Buffer as d } from "node:buffer";
import { F as G, f as ne, B as oe, d as se } from "./from-BbN1lGD2.js";
import { a as Me } from "./from-BbN1lGD2.js";
import { types as N, deprecate as M, promisify as ie } from "node:util";
import { format as ae } from "node:url";
import { isIP as ce } from "node:net";
class W extends Error {
  constructor(e, t) {
    super(e), Error.captureStackTrace(this, this.constructor), this.type = t;
  }
  get name() {
    return this.constructor.name;
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
class T extends W {
  /**
   * @param  {string} message -      Error message for human
   * @param  {string} [type] -        Error type for machine
   * @param  {SystemError} [systemError] - For Node.js system error
   */
  constructor(e, t, o) {
    super(e, t), o && (this.code = this.errno = o.code, this.erroredSysCall = o.syscall);
  }
}
const I = Symbol.toStringTag, Q = (r) => typeof r == "object" && typeof r.append == "function" && typeof r.delete == "function" && typeof r.get == "function" && typeof r.getAll == "function" && typeof r.has == "function" && typeof r.set == "function" && typeof r.sort == "function" && r[I] === "URLSearchParams", D = (r) => r && typeof r == "object" && typeof r.arrayBuffer == "function" && typeof r.type == "string" && typeof r.stream == "function" && typeof r.constructor == "function" && /^(Blob|File)$/.test(r[I]), ue = (r) => typeof r == "object" && (r[I] === "AbortSignal" || r[I] === "EventTarget"), fe = (r, e) => {
  const t = new URL(e).hostname, o = new URL(r).hostname;
  return t === o || t.endsWith(`.${o}`);
}, le = (r, e) => {
  const t = new URL(e).protocol, o = new URL(r).protocol;
  return t === o;
}, he = ie(S.pipeline), m = /* @__PURE__ */ Symbol("Body internals");
class k {
  constructor(e, {
    size: t = 0
  } = {}) {
    let o = null;
    e === null ? e = null : Q(e) ? e = d.from(e.toString()) : D(e) || d.isBuffer(e) || (N.isAnyArrayBuffer(e) ? e = d.from(e) : ArrayBuffer.isView(e) ? e = d.from(e.buffer, e.byteOffset, e.byteLength) : e instanceof S || (e instanceof G ? (e = ne(e), o = e.type.split("=")[1]) : e = d.from(String(e))));
    let n = e;
    d.isBuffer(e) ? n = S.Readable.from(e) : D(e) && (n = S.Readable.from(e.stream())), this[m] = {
      body: e,
      stream: n,
      boundary: o,
      disturbed: !1,
      error: null
    }, this.size = t, e instanceof S && e.on("error", (s) => {
      const i = s instanceof W ? s : new T(`Invalid response body while trying to fetch ${this.url}: ${s.message}`, "system", s);
      this[m].error = i;
    });
  }
  get body() {
    return this[m].stream;
  }
  get bodyUsed() {
    return this[m].disturbed;
  }
  /**
   * Decode response as ArrayBuffer
   *
   * @return  Promise
   */
  async arrayBuffer() {
    const { buffer: e, byteOffset: t, byteLength: o } = await V(this);
    return e.slice(t, t + o);
  }
  async formData() {
    const e = this.headers.get("content-type");
    if (e.startsWith("application/x-www-form-urlencoded")) {
      const o = new G(), n = new URLSearchParams(await this.text());
      for (const [s, i] of n)
        o.append(s, i);
      return o;
    }
    const { toFormData: t } = await import("./multipart-parser-yk7u4NIt.js");
    return t(this.body, e);
  }
  /**
   * Return raw response as Blob
   *
   * @return Promise
   */
  async blob() {
    const e = this.headers && this.headers.get("content-type") || this[m].body && this[m].body.type || "", t = await this.arrayBuffer();
    return new oe([t], {
      type: e
    });
  }
  /**
   * Decode response as json
   *
   * @return  Promise
   */
  async json() {
    const e = await this.text();
    return JSON.parse(e);
  }
  /**
   * Decode response as text
   *
   * @return  Promise
   */
  async text() {
    const e = await V(this);
    return new TextDecoder().decode(e);
  }
  /**
   * Decode response as buffer (non-spec api)
   *
   * @return  Promise
   */
  buffer() {
    return V(this);
  }
}
k.prototype.buffer = M(k.prototype.buffer, "Please use 'response.arrayBuffer()' instead of 'response.buffer()'", "node-fetch#buffer");
Object.defineProperties(k.prototype, {
  body: { enumerable: !0 },
  bodyUsed: { enumerable: !0 },
  arrayBuffer: { enumerable: !0 },
  blob: { enumerable: !0 },
  json: { enumerable: !0 },
  text: { enumerable: !0 },
  data: { get: M(
    () => {
    },
    "data doesn't exist, use json(), text(), arrayBuffer(), or body instead",
    "https://github.com/node-fetch/node-fetch/issues/1000 (response)"
  ) }
});
async function V(r) {
  if (r[m].disturbed)
    throw new TypeError(`body used already for: ${r.url}`);
  if (r[m].disturbed = !0, r[m].error)
    throw r[m].error;
  const { body: e } = r;
  if (e === null)
    return d.alloc(0);
  if (!(e instanceof S))
    return d.alloc(0);
  const t = [];
  let o = 0;
  try {
    for await (const n of e) {
      if (r.size > 0 && o + n.length > r.size) {
        const s = new T(`content size at ${r.url} over limit: ${r.size}`, "max-size");
        throw e.destroy(s), s;
      }
      o += n.length, t.push(n);
    }
  } catch (n) {
    throw n instanceof W ? n : new T(`Invalid response body while trying to fetch ${r.url}: ${n.message}`, "system", n);
  }
  if (e.readableEnded === !0 || e._readableState.ended === !0)
    try {
      return t.every((n) => typeof n == "string") ? d.from(t.join("")) : d.concat(t, o);
    } catch (n) {
      throw new T(`Could not create Buffer from response body for ${r.url}: ${n.message}`, "system", n);
    }
  else
    throw new T(`Premature close of server response while trying to fetch ${r.url}`);
}
const J = (r, e) => {
  let t, o, { body: n } = r[m];
  if (r.bodyUsed)
    throw new Error("cannot clone body after it is used");
  return n instanceof S && typeof n.getBoundary != "function" && (t = new F({ highWaterMark: e }), o = new F({ highWaterMark: e }), n.pipe(t), n.pipe(o), r[m].stream = t, n = o), n;
}, de = M(
  (r) => r.getBoundary(),
  "form-data doesn't follow the spec and requires special treatment. Use alternative package",
  "https://github.com/node-fetch/node-fetch/issues/1167"
), X = (r, e) => r === null ? null : typeof r == "string" ? "text/plain;charset=UTF-8" : Q(r) ? "application/x-www-form-urlencoded;charset=UTF-8" : D(r) ? r.type || null : d.isBuffer(r) || N.isAnyArrayBuffer(r) || ArrayBuffer.isView(r) ? null : r instanceof G ? `multipart/form-data; boundary=${e[m].boundary}` : r && typeof r.getBoundary == "function" ? `multipart/form-data;boundary=${de(r)}` : r instanceof S ? null : "text/plain;charset=UTF-8", pe = (r) => {
  const { body: e } = r[m];
  return e === null ? 0 : D(e) ? e.size : d.isBuffer(e) ? e.length : e && typeof e.getLengthSync == "function" && e.hasKnownLength && e.hasKnownLength() ? e.getLengthSync() : null;
}, me = async (r, { body: e }) => {
  e === null ? r.end() : await he(e, r);
}, O = typeof C.validateHeaderName == "function" ? C.validateHeaderName : (r) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(r)) {
    const e = new TypeError(`Header name must be a valid HTTP token [${r}]`);
    throw Object.defineProperty(e, "code", { value: "ERR_INVALID_HTTP_TOKEN" }), e;
  }
}, K = typeof C.validateHeaderValue == "function" ? C.validateHeaderValue : (r, e) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(e)) {
    const t = new TypeError(`Invalid character in header content ["${r}"]`);
    throw Object.defineProperty(t, "code", { value: "ERR_INVALID_CHAR" }), t;
  }
};
class P extends URLSearchParams {
  /**
   * Headers class
   *
   * @constructor
   * @param {HeadersInit} [init] - Response headers
   */
  constructor(e) {
    let t = [];
    if (e instanceof P) {
      const o = e.raw();
      for (const [n, s] of Object.entries(o))
        t.push(...s.map((i) => [n, i]));
    } else if (e != null) if (typeof e == "object" && !N.isBoxedPrimitive(e)) {
      const o = e[Symbol.iterator];
      if (o == null)
        t.push(...Object.entries(e));
      else {
        if (typeof o != "function")
          throw new TypeError("Header pairs must be iterable");
        t = [...e].map((n) => {
          if (typeof n != "object" || N.isBoxedPrimitive(n))
            throw new TypeError("Each header pair must be an iterable object");
          return [...n];
        }).map((n) => {
          if (n.length !== 2)
            throw new TypeError("Each header pair must be a name/value tuple");
          return [...n];
        });
      }
    } else
      throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
    return t = t.length > 0 ? t.map(([o, n]) => (O(o), K(o, String(n)), [String(o).toLowerCase(), String(n)])) : void 0, super(t), new Proxy(this, {
      get(o, n, s) {
        switch (n) {
          case "append":
          case "set":
            return (i, u) => (O(i), K(i, String(u)), URLSearchParams.prototype[n].call(
              o,
              String(i).toLowerCase(),
              String(u)
            ));
          case "delete":
          case "has":
          case "getAll":
            return (i) => (O(i), URLSearchParams.prototype[n].call(
              o,
              String(i).toLowerCase()
            ));
          case "keys":
            return () => (o.sort(), new Set(URLSearchParams.prototype.keys.call(o)).keys());
          default:
            return Reflect.get(o, n, s);
        }
      }
    });
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
  toString() {
    return Object.prototype.toString.call(this);
  }
  get(e) {
    const t = this.getAll(e);
    if (t.length === 0)
      return null;
    let o = t.join(", ");
    return /^content-encoding$/i.test(e) && (o = o.toLowerCase()), o;
  }
  forEach(e, t = void 0) {
    for (const o of this.keys())
      Reflect.apply(e, t, [this.get(o), o, this]);
  }
  *values() {
    for (const e of this.keys())
      yield this.get(e);
  }
  /**
   * @type {() => IterableIterator<[string, string]>}
   */
  *entries() {
    for (const e of this.keys())
      yield [e, this.get(e)];
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  /**
   * Node-fetch non-spec method
   * returning all headers and their values as array
   * @returns {Record<string, string[]>}
   */
  raw() {
    return [...this.keys()].reduce((e, t) => (e[t] = this.getAll(t), e), {});
  }
  /**
   * For better console.log(headers) and also to convert Headers into Node.js Request compatible format
   */
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this.keys()].reduce((e, t) => {
      const o = this.getAll(t);
      return t === "host" ? e[t] = o[0] : e[t] = o.length > 1 ? o : o[0], e;
    }, {});
  }
}
Object.defineProperties(
  P.prototype,
  ["get", "entries", "forEach", "values"].reduce((r, e) => (r[e] = { enumerable: !0 }, r), {})
);
function ye(r = []) {
  return new P(
    r.reduce((e, t, o, n) => (o % 2 === 0 && e.push(n.slice(o, o + 2)), e), []).filter(([e, t]) => {
      try {
        return O(e), K(e, String(t)), !0;
      } catch {
        return !1;
      }
    })
  );
}
const ge = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]), j = (r) => ge.has(r), w = /* @__PURE__ */ Symbol("Response internals");
class y extends k {
  constructor(e = null, t = {}) {
    super(e, t);
    const o = t.status != null ? t.status : 200, n = new P(t.headers);
    if (e !== null && !n.has("Content-Type")) {
      const s = X(e, this);
      s && n.append("Content-Type", s);
    }
    this[w] = {
      type: "default",
      url: t.url,
      status: o,
      statusText: t.statusText || "",
      headers: n,
      counter: t.counter,
      highWaterMark: t.highWaterMark
    };
  }
  get type() {
    return this[w].type;
  }
  get url() {
    return this[w].url || "";
  }
  get status() {
    return this[w].status;
  }
  /**
   * Convenience property representing if the request ended normally
   */
  get ok() {
    return this[w].status >= 200 && this[w].status < 300;
  }
  get redirected() {
    return this[w].counter > 0;
  }
  get statusText() {
    return this[w].statusText;
  }
  get headers() {
    return this[w].headers;
  }
  get highWaterMark() {
    return this[w].highWaterMark;
  }
  /**
   * Clone this response
   *
   * @return  Response
   */
  clone() {
    return new y(J(this, this.highWaterMark), {
      type: this.type,
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size,
      highWaterMark: this.highWaterMark
    });
  }
  /**
   * @param {string} url    The URL that the new response is to originate from.
   * @param {number} status An optional status code for the response (e.g., 302.)
   * @returns {Response}    A Response object.
   */
  static redirect(e, t = 302) {
    if (!j(t))
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    return new y(null, {
      headers: {
        location: new URL(e).toString()
      },
      status: t
    });
  }
  static error() {
    const e = new y(null, { status: 0, statusText: "" });
    return e[w].type = "error", e;
  }
  static json(e = void 0, t = {}) {
    const o = JSON.stringify(e);
    if (o === void 0)
      throw new TypeError("data is not JSON serializable");
    const n = new P(t && t.headers);
    return n.has("content-type") || n.set("content-type", "application/json"), new y(o, {
      ...t,
      headers: n
    });
  }
  get [Symbol.toStringTag]() {
    return "Response";
  }
}
Object.defineProperties(y.prototype, {
  type: { enumerable: !0 },
  url: { enumerable: !0 },
  status: { enumerable: !0 },
  ok: { enumerable: !0 },
  redirected: { enumerable: !0 },
  statusText: { enumerable: !0 },
  headers: { enumerable: !0 },
  clone: { enumerable: !0 }
});
const we = (r) => {
  if (r.search)
    return r.search;
  const e = r.href.length - 1, t = r.hash || (r.href[e] === "#" ? "#" : "");
  return r.href[e - t.length] === "?" ? "?" : "";
};
function _(r, e = !1) {
  return r == null || (r = new URL(r), /^(about|blob|data):$/.test(r.protocol)) ? "no-referrer" : (r.username = "", r.password = "", r.hash = "", e && (r.pathname = "", r.search = ""), r);
}
const q = /* @__PURE__ */ new Set([
  "",
  "no-referrer",
  "no-referrer-when-downgrade",
  "same-origin",
  "origin",
  "strict-origin",
  "origin-when-cross-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url"
]), be = "strict-origin-when-cross-origin";
function Te(r) {
  if (!q.has(r))
    throw new TypeError(`Invalid referrerPolicy: ${r}`);
  return r;
}
function Se(r) {
  if (/^(http|ws)s:$/.test(r.protocol))
    return !0;
  const e = r.host.replace(/(^\[)|(]$)/g, ""), t = ce(e);
  return t === 4 && /^127\./.test(e) || t === 6 && /^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(e) ? !0 : r.host === "localhost" || r.host.endsWith(".localhost") ? !1 : r.protocol === "file:";
}
function x(r) {
  return /^about:(blank|srcdoc)$/.test(r) || r.protocol === "data:" || /^(blob|filesystem):$/.test(r.protocol) ? !0 : Se(r);
}
function Re(r, { referrerURLCallback: e, referrerOriginCallback: t } = {}) {
  if (r.referrer === "no-referrer" || r.referrerPolicy === "")
    return null;
  const o = r.referrerPolicy;
  if (r.referrer === "about:client")
    return "no-referrer";
  const n = r.referrer;
  let s = _(n), i = _(n, !0);
  s.toString().length > 4096 && (s = i), e && (s = e(s)), t && (i = t(i));
  const u = new URL(r.url);
  switch (o) {
    case "no-referrer":
      return "no-referrer";
    case "origin":
      return i;
    case "unsafe-url":
      return s;
    case "strict-origin":
      return x(s) && !x(u) ? "no-referrer" : i.toString();
    case "strict-origin-when-cross-origin":
      return s.origin === u.origin ? s : x(s) && !x(u) ? "no-referrer" : i;
    case "same-origin":
      return s.origin === u.origin ? s : "no-referrer";
    case "origin-when-cross-origin":
      return s.origin === u.origin ? s : i;
    case "no-referrer-when-downgrade":
      return x(s) && !x(u) ? "no-referrer" : s;
    default:
      throw new TypeError(`Invalid referrerPolicy: ${o}`);
  }
}
function Ee(r) {
  const e = (r.get("referrer-policy") || "").split(/[,\s]+/);
  let t = "";
  for (const o of e)
    o && q.has(o) && (t = o);
  return t;
}
const l = /* @__PURE__ */ Symbol("Request internals"), A = (r) => typeof r == "object" && typeof r[l] == "object", Pe = M(
  () => {
  },
  ".data is not a valid RequestInit property, use .body instead",
  "https://github.com/node-fetch/node-fetch/issues/1000 (request)"
);
class z extends k {
  constructor(e, t = {}) {
    let o;
    if (A(e) ? o = new URL(e.url) : (o = new URL(e), e = {}), o.username !== "" || o.password !== "")
      throw new TypeError(`${o} is an url with embedded credentials.`);
    let n = t.method || e.method || "GET";
    if (/^(delete|get|head|options|post|put)$/i.test(n) && (n = n.toUpperCase()), !A(t) && "data" in t && Pe(), (t.body != null || A(e) && e.body !== null) && (n === "GET" || n === "HEAD"))
      throw new TypeError("Request with GET/HEAD method cannot have body");
    const s = t.body ? t.body : A(e) && e.body !== null ? J(e) : null;
    super(s, {
      size: t.size || e.size || 0
    });
    const i = new P(t.headers || e.headers || {});
    if (s !== null && !i.has("Content-Type")) {
      const a = X(s, this);
      a && i.set("Content-Type", a);
    }
    let u = A(e) ? e.signal : null;
    if ("signal" in t && (u = t.signal), u != null && !ue(u))
      throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
    let f = t.referrer == null ? e.referrer : t.referrer;
    if (f === "")
      f = "no-referrer";
    else if (f) {
      const a = new URL(f);
      f = /^about:(\/\/)?client$/.test(a) ? "client" : a;
    } else
      f = void 0;
    this[l] = {
      method: n,
      redirect: t.redirect || e.redirect || "follow",
      headers: i,
      parsedURL: o,
      signal: u,
      referrer: f
    }, this.follow = t.follow === void 0 ? e.follow === void 0 ? 20 : e.follow : t.follow, this.compress = t.compress === void 0 ? e.compress === void 0 ? !0 : e.compress : t.compress, this.counter = t.counter || e.counter || 0, this.agent = t.agent || e.agent, this.highWaterMark = t.highWaterMark || e.highWaterMark || 16384, this.insecureHTTPParser = t.insecureHTTPParser || e.insecureHTTPParser || !1, this.referrerPolicy = t.referrerPolicy || e.referrerPolicy || "";
  }
  /** @returns {string} */
  get method() {
    return this[l].method;
  }
  /** @returns {string} */
  get url() {
    return ae(this[l].parsedURL);
  }
  /** @returns {Headers} */
  get headers() {
    return this[l].headers;
  }
  get redirect() {
    return this[l].redirect;
  }
  /** @returns {AbortSignal} */
  get signal() {
    return this[l].signal;
  }
  // https://fetch.spec.whatwg.org/#dom-request-referrer
  get referrer() {
    if (this[l].referrer === "no-referrer")
      return "";
    if (this[l].referrer === "client")
      return "about:client";
    if (this[l].referrer)
      return this[l].referrer.toString();
  }
  get referrerPolicy() {
    return this[l].referrerPolicy;
  }
  set referrerPolicy(e) {
    this[l].referrerPolicy = Te(e);
  }
  /**
   * Clone this request
   *
   * @return  Request
   */
  clone() {
    return new z(this);
  }
  get [Symbol.toStringTag]() {
    return "Request";
  }
}
Object.defineProperties(z.prototype, {
  method: { enumerable: !0 },
  url: { enumerable: !0 },
  headers: { enumerable: !0 },
  redirect: { enumerable: !0 },
  clone: { enumerable: !0 },
  signal: { enumerable: !0 },
  referrer: { enumerable: !0 },
  referrerPolicy: { enumerable: !0 }
});
const Le = (r) => {
  const { parsedURL: e } = r[l], t = new P(r[l].headers);
  t.has("Accept") || t.set("Accept", "*/*");
  let o = null;
  if (r.body === null && /^(post|put)$/i.test(r.method) && (o = "0"), r.body !== null) {
    const u = pe(r);
    typeof u == "number" && !Number.isNaN(u) && (o = String(u));
  }
  o && t.set("Content-Length", o), r.referrerPolicy === "" && (r.referrerPolicy = be), r.referrer && r.referrer !== "no-referrer" ? r[l].referrer = Re(r) : r[l].referrer = "no-referrer", r[l].referrer instanceof URL && t.set("Referer", r.referrer), t.has("User-Agent") || t.set("User-Agent", "node-fetch"), r.compress && !t.has("Accept-Encoding") && t.set("Accept-Encoding", "gzip, deflate, br");
  let { agent: n } = r;
  typeof n == "function" && (n = n(e));
  const s = we(e), i = {
    // Overwrite search to retain trailing ? (issue #776)
    path: e.pathname + s,
    // The following options are not expressed in the URL
    method: r.method,
    headers: t[/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")](),
    insecureHTTPParser: r.insecureHTTPParser,
    agent: n
  };
  return {
    /** @type {URL} */
    parsedURL: e,
    options: i
  };
};
class ve extends W {
  constructor(e, t = "aborted") {
    super(e, t);
  }
}
const $e = /* @__PURE__ */ new Set(["data:", "http:", "https:"]);
async function Be(r, e) {
  return new Promise((t, o) => {
    const n = new z(r, e), { parsedURL: s, options: i } = Le(n);
    if (!$e.has(s.protocol))
      throw new TypeError(`node-fetch cannot load ${r}. URL scheme "${s.protocol.replace(/:$/, "")}" is not supported.`);
    if (s.protocol === "data:") {
      const c = se(n.url), R = new y(c, { headers: { "Content-Type": c.typeFull } });
      t(R);
      return;
    }
    const u = (s.protocol === "https:" ? te : C).request, { signal: f } = n;
    let a = null;
    const Y = () => {
      const c = new ve("The operation was aborted.");
      o(c), n.body && n.body instanceof S.Readable && n.body.destroy(c), !(!a || !a.body) && a.body.emit("error", c);
    };
    if (f && f.aborted) {
      Y();
      return;
    }
    const H = () => {
      Y(), v();
    }, L = u(s.toString(), i);
    f && f.addEventListener("abort", H);
    const v = () => {
      L.abort(), f && f.removeEventListener("abort", H);
    };
    L.on("error", (c) => {
      o(new T(`request to ${n.url} failed, reason: ${c.message}`, "system", c)), v();
    }), Ue(L, (c) => {
      a && a.body && a.body.destroy(c);
    }), process.version < "v14" && L.on("socket", (c) => {
      let R;
      c.prependListener("end", () => {
        R = c._eventsCount;
      }), c.prependListener("close", (h) => {
        if (a && R < c._eventsCount && !h) {
          const E = new Error("Premature close");
          E.code = "ERR_STREAM_PREMATURE_CLOSE", a.body.emit("error", E);
        }
      });
    }), L.on("response", (c) => {
      L.setTimeout(0);
      const R = ye(c.rawHeaders);
      if (j(c.statusCode)) {
        const p = R.get("Location");
        let b = null;
        try {
          b = p === null ? null : new URL(p, n.url);
        } catch {
          if (n.redirect !== "manual") {
            o(new T(`uri requested responds with an invalid redirect URL: ${p}`, "invalid-redirect")), v();
            return;
          }
        }
        switch (n.redirect) {
          case "error":
            o(new T(`uri requested responds with a redirect, redirect mode is set to error: ${n.url}`, "no-redirect")), v();
            return;
          case "manual":
            break;
          case "follow": {
            if (b === null)
              break;
            if (n.counter >= n.follow) {
              o(new T(`maximum redirect reached at: ${n.url}`, "max-redirect")), v();
              return;
            }
            const g = {
              headers: new P(n.headers),
              follow: n.follow,
              counter: n.counter + 1,
              agent: n.agent,
              compress: n.compress,
              method: n.method,
              body: J(n),
              signal: n.signal,
              size: n.size,
              referrer: n.referrer,
              referrerPolicy: n.referrerPolicy
            };
            if (!fe(n.url, b) || !le(n.url, b))
              for (const re of ["authorization", "www-authenticate", "cookie", "cookie2"])
                g.headers.delete(re);
            if (c.statusCode !== 303 && n.body && e.body instanceof S.Readable) {
              o(new T("Cannot follow redirect with body being a readable stream", "unsupported-redirect")), v();
              return;
            }
            (c.statusCode === 303 || (c.statusCode === 301 || c.statusCode === 302) && n.method === "POST") && (g.method = "GET", g.body = void 0, g.headers.delete("content-length"));
            const Z = Ee(R);
            Z && (g.referrerPolicy = Z), t(Be(new z(b, g))), v();
            return;
          }
          default:
            return o(new TypeError(`Redirect option '${n.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      f && c.once("end", () => {
        f.removeEventListener("abort", H);
      });
      let h = U(c, new F(), (p) => {
        p && o(p);
      });
      process.version < "v12.10" && c.on("aborted", H);
      const E = {
        url: n.url,
        status: c.statusCode,
        statusText: c.statusMessage,
        headers: R,
        size: n.size,
        counter: n.counter,
        highWaterMark: n.highWaterMark
      }, $ = R.get("Content-Encoding");
      if (!n.compress || n.method === "HEAD" || $ === null || c.statusCode === 204 || c.statusCode === 304) {
        a = new y(h, E), t(a);
        return;
      }
      const ee = {
        flush: B.Z_SYNC_FLUSH,
        finishFlush: B.Z_SYNC_FLUSH
      };
      if ($ === "gzip" || $ === "x-gzip") {
        h = U(h, B.createGunzip(ee), (p) => {
          p && o(p);
        }), a = new y(h, E), t(a);
        return;
      }
      if ($ === "deflate" || $ === "x-deflate") {
        const p = U(c, new F(), (b) => {
          b && o(b);
        });
        p.once("data", (b) => {
          (b[0] & 15) === 8 ? h = U(h, B.createInflate(), (g) => {
            g && o(g);
          }) : h = U(h, B.createInflateRaw(), (g) => {
            g && o(g);
          }), a = new y(h, E), t(a);
        }), p.once("end", () => {
          a || (a = new y(h, E), t(a));
        });
        return;
      }
      if ($ === "br") {
        h = U(h, B.createBrotliDecompress(), (p) => {
          p && o(p);
        }), a = new y(h, E), t(a);
        return;
      }
      a = new y(h, E), t(a);
    }), me(L, n).catch(o);
  });
}
function Ue(r, e) {
  const t = d.from(`0\r
\r
`);
  let o = !1, n = !1, s;
  r.on("response", (i) => {
    const { headers: u } = i;
    o = u["transfer-encoding"] === "chunked" && !u["content-length"];
  }), r.on("socket", (i) => {
    const u = () => {
      if (o && !n) {
        const a = new Error("Premature close");
        a.code = "ERR_STREAM_PREMATURE_CLOSE", e(a);
      }
    }, f = (a) => {
      n = d.compare(a.slice(-5), t) === 0, !n && s && (n = d.compare(s.slice(-3), t.slice(0, 3)) === 0 && d.compare(a.slice(-2), t.slice(3)) === 0), s = a;
    };
    i.prependListener("close", u), i.on("data", f), r.on("close", () => {
      i.removeListener("close", u), i.removeListener("data", f);
    });
  });
}
export {
  ve as AbortError,
  oe as Blob,
  T as FetchError,
  Me as File,
  G as FormData,
  P as Headers,
  z as Request,
  y as Response,
  Be as default,
  j as isRedirect
};
