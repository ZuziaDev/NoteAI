import Z from "net";
import ne from "tls";
import oe from "assert";
import Q from "tty";
import se from "util";
import ie from "os";
import X from "http";
import ee from "https";
import ce from "url";
function ue(h, c) {
  for (var d = 0; d < c.length; d++) {
    const r = c[d];
    if (typeof r != "string" && !Array.isArray(r)) {
      for (const f in r)
        if (f !== "default" && !(f in h)) {
          const g = Object.getOwnPropertyDescriptor(r, f);
          g && Object.defineProperty(h, f, g.get ? g : {
            enumerable: !0,
            get: () => r[f]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(h, Symbol.toStringTag, { value: "Module" }));
}
var w = {}, j = { exports: {} }, T = { exports: {} }, q, k;
function ae() {
  if (k) return q;
  k = 1;
  var h = 1e3, c = h * 60, d = c * 60, r = d * 24, f = r * 7, g = r * 365.25;
  q = function(n, e) {
    e = e || {};
    var t = typeof n;
    if (t === "string" && n.length > 0)
      return m(n);
    if (t === "number" && isFinite(n))
      return e.long ? o(n) : b(n);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(n)
    );
  };
  function m(n) {
    if (n = String(n), !(n.length > 100)) {
      var e = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        n
      );
      if (e) {
        var t = parseFloat(e[1]), s = (e[2] || "ms").toLowerCase();
        switch (s) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return t * g;
          case "weeks":
          case "week":
          case "w":
            return t * f;
          case "days":
          case "day":
          case "d":
            return t * r;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return t * d;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return t * c;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return t * h;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return t;
          default:
            return;
        }
      }
    }
  }
  function b(n) {
    var e = Math.abs(n);
    return e >= r ? Math.round(n / r) + "d" : e >= d ? Math.round(n / d) + "h" : e >= c ? Math.round(n / c) + "m" : e >= h ? Math.round(n / h) + "s" : n + "ms";
  }
  function o(n) {
    var e = Math.abs(n);
    return e >= r ? l(n, e, r, "day") : e >= d ? l(n, e, d, "hour") : e >= c ? l(n, e, c, "minute") : e >= h ? l(n, e, h, "second") : n + " ms";
  }
  function l(n, e, t, s) {
    var u = e >= t * 1.5;
    return Math.round(n / t) + " " + s + (u ? "s" : "");
  }
  return q;
}
var B, H;
function te() {
  if (H) return B;
  H = 1;
  function h(c) {
    r.debug = r, r.default = r, r.coerce = l, r.disable = b, r.enable = g, r.enabled = o, r.humanize = ae(), r.destroy = n, Object.keys(c).forEach((e) => {
      r[e] = c[e];
    }), r.names = [], r.skips = [], r.formatters = {};
    function d(e) {
      let t = 0;
      for (let s = 0; s < e.length; s++)
        t = (t << 5) - t + e.charCodeAt(s), t |= 0;
      return r.colors[Math.abs(t) % r.colors.length];
    }
    r.selectColor = d;
    function r(e) {
      let t, s = null, u, C;
      function i(...a) {
        if (!i.enabled)
          return;
        const p = i, y = Number(/* @__PURE__ */ new Date()), v = y - (t || y);
        p.diff = v, p.prev = t, p.curr = y, t = y, a[0] = r.coerce(a[0]), typeof a[0] != "string" && a.unshift("%O");
        let O = 0;
        a[0] = a[0].replace(/%([a-zA-Z%])/g, (F, E) => {
          if (F === "%%")
            return "%";
          O++;
          const P = r.formatters[E];
          if (typeof P == "function") {
            const A = a[O];
            F = P.call(p, A), a.splice(O, 1), O--;
          }
          return F;
        }), r.formatArgs.call(p, a), (p.log || r.log).apply(p, a);
      }
      return i.namespace = e, i.useColors = r.useColors(), i.color = r.selectColor(e), i.extend = f, i.destroy = r.destroy, Object.defineProperty(i, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => s !== null ? s : (u !== r.namespaces && (u = r.namespaces, C = r.enabled(e)), C),
        set: (a) => {
          s = a;
        }
      }), typeof r.init == "function" && r.init(i), i;
    }
    function f(e, t) {
      const s = r(this.namespace + (typeof t > "u" ? ":" : t) + e);
      return s.log = this.log, s;
    }
    function g(e) {
      r.save(e), r.namespaces = e, r.names = [], r.skips = [];
      const t = (typeof e == "string" ? e : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const s of t)
        s[0] === "-" ? r.skips.push(s.slice(1)) : r.names.push(s);
    }
    function m(e, t) {
      let s = 0, u = 0, C = -1, i = 0;
      for (; s < e.length; )
        if (u < t.length && (t[u] === e[s] || t[u] === "*"))
          t[u] === "*" ? (C = u, i = s, u++) : (s++, u++);
        else if (C !== -1)
          u = C + 1, i++, s = i;
        else
          return !1;
      for (; u < t.length && t[u] === "*"; )
        u++;
      return u === t.length;
    }
    function b() {
      const e = [
        ...r.names,
        ...r.skips.map((t) => "-" + t)
      ].join(",");
      return r.enable(""), e;
    }
    function o(e) {
      for (const t of r.skips)
        if (m(e, t))
          return !1;
      for (const t of r.names)
        if (m(e, t))
          return !0;
      return !1;
    }
    function l(e) {
      return e instanceof Error ? e.stack || e.message : e;
    }
    function n() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return r.enable(r.load()), r;
  }
  return B = h, B;
}
var U;
function fe() {
  return U || (U = 1, (function(h, c) {
    c.formatArgs = r, c.save = f, c.load = g, c.useColors = d, c.storage = m(), c.destroy = /* @__PURE__ */ (() => {
      let o = !1;
      return () => {
        o || (o = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), c.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function d() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let o;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (o = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(o[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function r(o) {
      if (o[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + o[0] + (this.useColors ? "%c " : " ") + "+" + h.exports.humanize(this.diff), !this.useColors)
        return;
      const l = "color: " + this.color;
      o.splice(1, 0, l, "color: inherit");
      let n = 0, e = 0;
      o[0].replace(/%[a-zA-Z%]/g, (t) => {
        t !== "%%" && (n++, t === "%c" && (e = n));
      }), o.splice(e, 0, l);
    }
    c.log = console.debug || console.log || (() => {
    });
    function f(o) {
      try {
        o ? c.storage.setItem("debug", o) : c.storage.removeItem("debug");
      } catch {
      }
    }
    function g() {
      let o;
      try {
        o = c.storage.getItem("debug") || c.storage.getItem("DEBUG");
      } catch {
      }
      return !o && typeof process < "u" && "env" in process && (o = process.env.DEBUG), o;
    }
    function m() {
      try {
        return localStorage;
      } catch {
      }
    }
    h.exports = te()(c);
    const { formatters: b } = h.exports;
    b.j = function(o) {
      try {
        return JSON.stringify(o);
      } catch (l) {
        return "[UnexpectedJSONParseError]: " + l.message;
      }
    };
  })(T, T.exports)), T.exports;
}
var N = { exports: {} }, D, $;
function le() {
  return $ || ($ = 1, D = (h, c = process.argv) => {
    const d = h.startsWith("-") ? "" : h.length === 1 ? "-" : "--", r = c.indexOf(d + h), f = c.indexOf("--");
    return r !== -1 && (f === -1 || r < f);
  }), D;
}
var L, G;
function de() {
  if (G) return L;
  G = 1;
  const h = ie, c = Q, d = le(), { env: r } = process;
  let f;
  d("no-color") || d("no-colors") || d("color=false") || d("color=never") ? f = 0 : (d("color") || d("colors") || d("color=true") || d("color=always")) && (f = 1), "FORCE_COLOR" in r && (r.FORCE_COLOR === "true" ? f = 1 : r.FORCE_COLOR === "false" ? f = 0 : f = r.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(r.FORCE_COLOR, 10), 3));
  function g(o) {
    return o === 0 ? !1 : {
      level: o,
      hasBasic: !0,
      has256: o >= 2,
      has16m: o >= 3
    };
  }
  function m(o, l) {
    if (f === 0)
      return 0;
    if (d("color=16m") || d("color=full") || d("color=truecolor"))
      return 3;
    if (d("color=256"))
      return 2;
    if (o && !l && f === void 0)
      return 0;
    const n = f || 0;
    if (r.TERM === "dumb")
      return n;
    if (process.platform === "win32") {
      const e = h.release().split(".");
      return Number(e[0]) >= 10 && Number(e[2]) >= 10586 ? Number(e[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in r)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((e) => e in r) || r.CI_NAME === "codeship" ? 1 : n;
    if ("TEAMCITY_VERSION" in r)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(r.TEAMCITY_VERSION) ? 1 : 0;
    if (r.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in r) {
      const e = parseInt((r.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (r.TERM_PROGRAM) {
        case "iTerm.app":
          return e >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(r.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(r.TERM) || "COLORTERM" in r ? 1 : n;
  }
  function b(o) {
    const l = m(o, o && o.isTTY);
    return g(l);
  }
  return L = {
    supportsColor: b,
    stdout: g(m(!0, c.isatty(1))),
    stderr: g(m(!0, c.isatty(2)))
  }, L;
}
var z;
function pe() {
  return z || (z = 1, (function(h, c) {
    const d = Q, r = se;
    c.init = n, c.log = b, c.formatArgs = g, c.save = o, c.load = l, c.useColors = f, c.destroy = r.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), c.colors = [6, 2, 3, 4, 5, 1];
    try {
      const t = de();
      t && (t.stderr || t).level >= 2 && (c.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    c.inspectOpts = Object.keys(process.env).filter((t) => /^debug_/i.test(t)).reduce((t, s) => {
      const u = s.substring(6).toLowerCase().replace(/_([a-z])/g, (i, a) => a.toUpperCase());
      let C = process.env[s];
      return /^(yes|on|true|enabled)$/i.test(C) ? C = !0 : /^(no|off|false|disabled)$/i.test(C) ? C = !1 : C === "null" ? C = null : C = Number(C), t[u] = C, t;
    }, {});
    function f() {
      return "colors" in c.inspectOpts ? !!c.inspectOpts.colors : d.isatty(process.stderr.fd);
    }
    function g(t) {
      const { namespace: s, useColors: u } = this;
      if (u) {
        const C = this.color, i = "\x1B[3" + (C < 8 ? C : "8;5;" + C), a = `  ${i};1m${s} \x1B[0m`;
        t[0] = a + t[0].split(`
`).join(`
` + a), t.push(i + "m+" + h.exports.humanize(this.diff) + "\x1B[0m");
      } else
        t[0] = m() + s + " " + t[0];
    }
    function m() {
      return c.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function b(...t) {
      return process.stderr.write(r.formatWithOptions(c.inspectOpts, ...t) + `
`);
    }
    function o(t) {
      t ? process.env.DEBUG = t : delete process.env.DEBUG;
    }
    function l() {
      return process.env.DEBUG;
    }
    function n(t) {
      t.inspectOpts = {};
      const s = Object.keys(c.inspectOpts);
      for (let u = 0; u < s.length; u++)
        t.inspectOpts[s[u]] = c.inspectOpts[s[u]];
    }
    h.exports = te()(c);
    const { formatters: e } = h.exports;
    e.o = function(t) {
      return this.inspectOpts.colors = this.useColors, r.inspect(t, this.inspectOpts).split(`
`).map((s) => s.trim()).join(" ");
    }, e.O = function(t) {
      return this.inspectOpts.colors = this.useColors, r.inspect(t, this.inspectOpts);
    };
  })(N, N.exports)), N.exports;
}
var V;
function re() {
  return V || (V = 1, typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? j.exports = fe() : j.exports = pe()), j.exports;
}
var x = {}, _ = {}, J;
function he() {
  if (J) return _;
  J = 1;
  var h = _ && _.__createBinding || (Object.create ? (function(o, l, n, e) {
    e === void 0 && (e = n);
    var t = Object.getOwnPropertyDescriptor(l, n);
    (!t || ("get" in t ? !l.__esModule : t.writable || t.configurable)) && (t = { enumerable: !0, get: function() {
      return l[n];
    } }), Object.defineProperty(o, e, t);
  }) : (function(o, l, n, e) {
    e === void 0 && (e = n), o[e] = l[n];
  })), c = _ && _.__setModuleDefault || (Object.create ? (function(o, l) {
    Object.defineProperty(o, "default", { enumerable: !0, value: l });
  }) : function(o, l) {
    o.default = l;
  }), d = _ && _.__importStar || function(o) {
    if (o && o.__esModule) return o;
    var l = {};
    if (o != null) for (var n in o) n !== "default" && Object.prototype.hasOwnProperty.call(o, n) && h(l, o, n);
    return c(l, o), l;
  };
  Object.defineProperty(_, "__esModule", { value: !0 }), _.req = _.json = _.toBuffer = void 0;
  const r = d(X), f = d(ee);
  async function g(o) {
    let l = 0;
    const n = [];
    for await (const e of o)
      l += e.length, n.push(e);
    return Buffer.concat(n, l);
  }
  _.toBuffer = g;
  async function m(o) {
    const n = (await g(o)).toString("utf8");
    try {
      return JSON.parse(n);
    } catch (e) {
      const t = e;
      throw t.message += ` (input: ${n})`, t;
    }
  }
  _.json = m;
  function b(o, l = {}) {
    const e = ((typeof o == "string" ? o : o.href).startsWith("https:") ? f : r).request(o, l), t = new Promise((s, u) => {
      e.once("response", s).once("error", u).end();
    });
    return e.then = t.then.bind(t), e;
  }
  return _.req = b, _;
}
var W;
function Ce() {
  return W || (W = 1, (function(h) {
    var c = x && x.__createBinding || (Object.create ? (function(n, e, t, s) {
      s === void 0 && (s = t);
      var u = Object.getOwnPropertyDescriptor(e, t);
      (!u || ("get" in u ? !e.__esModule : u.writable || u.configurable)) && (u = { enumerable: !0, get: function() {
        return e[t];
      } }), Object.defineProperty(n, s, u);
    }) : (function(n, e, t, s) {
      s === void 0 && (s = t), n[s] = e[t];
    })), d = x && x.__setModuleDefault || (Object.create ? (function(n, e) {
      Object.defineProperty(n, "default", { enumerable: !0, value: e });
    }) : function(n, e) {
      n.default = e;
    }), r = x && x.__importStar || function(n) {
      if (n && n.__esModule) return n;
      var e = {};
      if (n != null) for (var t in n) t !== "default" && Object.prototype.hasOwnProperty.call(n, t) && c(e, n, t);
      return d(e, n), e;
    }, f = x && x.__exportStar || function(n, e) {
      for (var t in n) t !== "default" && !Object.prototype.hasOwnProperty.call(e, t) && c(e, n, t);
    };
    Object.defineProperty(h, "__esModule", { value: !0 }), h.Agent = void 0;
    const g = r(Z), m = r(X), b = ee;
    f(he(), h);
    const o = /* @__PURE__ */ Symbol("AgentBaseInternalState");
    class l extends m.Agent {
      constructor(e) {
        super(e), this[o] = {};
      }
      /**
       * Determine whether this is an `http` or `https` request.
       */
      isSecureEndpoint(e) {
        if (e) {
          if (typeof e.secureEndpoint == "boolean")
            return e.secureEndpoint;
          if (typeof e.protocol == "string")
            return e.protocol === "https:";
        }
        const { stack: t } = new Error();
        return typeof t != "string" ? !1 : t.split(`
`).some((s) => s.indexOf("(https.js:") !== -1 || s.indexOf("node:https:") !== -1);
      }
      // In order to support async signatures in `connect()` and Node's native
      // connection pooling in `http.Agent`, the array of sockets for each origin
      // has to be updated synchronously. This is so the length of the array is
      // accurate when `addRequest()` is next called. We achieve this by creating a
      // fake socket and adding it to `sockets[origin]` and incrementing
      // `totalSocketCount`.
      incrementSockets(e) {
        if (this.maxSockets === 1 / 0 && this.maxTotalSockets === 1 / 0)
          return null;
        this.sockets[e] || (this.sockets[e] = []);
        const t = new g.Socket({ writable: !1 });
        return this.sockets[e].push(t), this.totalSocketCount++, t;
      }
      decrementSockets(e, t) {
        if (!this.sockets[e] || t === null)
          return;
        const s = this.sockets[e], u = s.indexOf(t);
        u !== -1 && (s.splice(u, 1), this.totalSocketCount--, s.length === 0 && delete this.sockets[e]);
      }
      // In order to properly update the socket pool, we need to call `getName()` on
      // the core `https.Agent` if it is a secureEndpoint.
      getName(e) {
        return this.isSecureEndpoint(e) ? b.Agent.prototype.getName.call(this, e) : super.getName(e);
      }
      createSocket(e, t, s) {
        const u = {
          ...t,
          secureEndpoint: this.isSecureEndpoint(t)
        }, C = this.getName(u), i = this.incrementSockets(C);
        Promise.resolve().then(() => this.connect(e, u)).then((a) => {
          if (this.decrementSockets(C, i), a instanceof m.Agent)
            try {
              return a.addRequest(e, u);
            } catch (p) {
              return s(p);
            }
          this[o].currentSocket = a, super.createSocket(e, t, s);
        }, (a) => {
          this.decrementSockets(C, i), s(a);
        });
      }
      createConnection() {
        const e = this[o].currentSocket;
        if (this[o].currentSocket = void 0, !e)
          throw new Error("No socket was returned in the `connect()` function");
        return e;
      }
      get defaultPort() {
        return this[o].defaultPort ?? (this.protocol === "https:" ? 443 : 80);
      }
      set defaultPort(e) {
        this[o] && (this[o].defaultPort = e);
      }
      get protocol() {
        return this[o].protocol ?? (this.isSecureEndpoint() ? "https:" : "http:");
      }
      set protocol(e) {
        this[o] && (this[o].protocol = e);
      }
    }
    h.Agent = l;
  })(x)), x;
}
var M = {}, Y;
function ye() {
  if (Y) return M;
  Y = 1;
  var h = M && M.__importDefault || function(f) {
    return f && f.__esModule ? f : { default: f };
  };
  Object.defineProperty(M, "__esModule", { value: !0 }), M.parseProxyResponse = void 0;
  const d = (0, h(re()).default)("https-proxy-agent:parse-proxy-response");
  function r(f) {
    return new Promise((g, m) => {
      let b = 0;
      const o = [];
      function l() {
        const u = f.read();
        u ? s(u) : f.once("readable", l);
      }
      function n() {
        f.removeListener("end", e), f.removeListener("error", t), f.removeListener("readable", l);
      }
      function e() {
        n(), d("onend"), m(new Error("Proxy connection ended before receiving CONNECT response"));
      }
      function t(u) {
        n(), d("onerror %o", u), m(u);
      }
      function s(u) {
        o.push(u), b += u.length;
        const C = Buffer.concat(o, b), i = C.indexOf(`\r
\r
`);
        if (i === -1) {
          d("have not received end of HTTP headers yet..."), l();
          return;
        }
        const a = C.slice(0, i).toString("ascii").split(`\r
`), p = a.shift();
        if (!p)
          return f.destroy(), m(new Error("No header received from proxy CONNECT response"));
        const y = p.split(" "), v = +y[1], O = y.slice(2).join(" "), S = {};
        for (const F of a) {
          if (!F)
            continue;
          const E = F.indexOf(":");
          if (E === -1)
            return f.destroy(), m(new Error(`Invalid header from proxy CONNECT response: "${F}"`));
          const P = F.slice(0, E).toLowerCase(), A = F.slice(E + 1).trimStart(), I = S[P];
          typeof I == "string" ? S[P] = [I, A] : Array.isArray(I) ? I.push(A) : S[P] = A;
        }
        d("got proxy server response: %o %o", p, S), n(), g({
          connect: {
            statusCode: v,
            statusText: O,
            headers: S
          },
          buffered: C
        });
      }
      f.on("error", t), f.on("end", e), l();
    });
  }
  return M.parseProxyResponse = r, M;
}
var K;
function ge() {
  if (K) return w;
  K = 1;
  var h = w && w.__createBinding || (Object.create ? (function(i, a, p, y) {
    y === void 0 && (y = p);
    var v = Object.getOwnPropertyDescriptor(a, p);
    (!v || ("get" in v ? !a.__esModule : v.writable || v.configurable)) && (v = { enumerable: !0, get: function() {
      return a[p];
    } }), Object.defineProperty(i, y, v);
  }) : (function(i, a, p, y) {
    y === void 0 && (y = p), i[y] = a[p];
  })), c = w && w.__setModuleDefault || (Object.create ? (function(i, a) {
    Object.defineProperty(i, "default", { enumerable: !0, value: a });
  }) : function(i, a) {
    i.default = a;
  }), d = w && w.__importStar || function(i) {
    if (i && i.__esModule) return i;
    var a = {};
    if (i != null) for (var p in i) p !== "default" && Object.prototype.hasOwnProperty.call(i, p) && h(a, i, p);
    return c(a, i), a;
  }, r = w && w.__importDefault || function(i) {
    return i && i.__esModule ? i : { default: i };
  };
  Object.defineProperty(w, "__esModule", { value: !0 }), w.HttpsProxyAgent = void 0;
  const f = d(Z), g = d(ne), m = r(oe), b = r(re()), o = Ce(), l = ce, n = ye(), e = (0, b.default)("https-proxy-agent"), t = (i) => i.servername === void 0 && i.host && !f.isIP(i.host) ? {
    ...i,
    servername: i.host
  } : i;
  class s extends o.Agent {
    constructor(a, p) {
      super(p), this.options = { path: void 0 }, this.proxy = typeof a == "string" ? new l.URL(a) : a, this.proxyHeaders = p?.headers ?? {}, e("Creating new HttpsProxyAgent instance: %o", this.proxy.href);
      const y = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, ""), v = this.proxy.port ? parseInt(this.proxy.port, 10) : this.proxy.protocol === "https:" ? 443 : 80;
      this.connectOpts = {
        // Attempt to negotiate http/1.1 for proxy servers that support http/2
        ALPNProtocols: ["http/1.1"],
        ...p ? C(p, "headers") : null,
        host: y,
        port: v
      };
    }
    /**
     * Called when the node-core HTTP client library is creating a
     * new HTTP request.
     */
    async connect(a, p) {
      const { proxy: y } = this;
      if (!p.host)
        throw new TypeError('No "host" provided');
      let v;
      y.protocol === "https:" ? (e("Creating `tls.Socket`: %o", this.connectOpts), v = g.connect(t(this.connectOpts))) : (e("Creating `net.Socket`: %o", this.connectOpts), v = f.connect(this.connectOpts));
      const O = typeof this.proxyHeaders == "function" ? this.proxyHeaders() : { ...this.proxyHeaders }, S = f.isIPv6(p.host) ? `[${p.host}]` : p.host;
      let F = `CONNECT ${S}:${p.port} HTTP/1.1\r
`;
      if (y.username || y.password) {
        const R = `${decodeURIComponent(y.username)}:${decodeURIComponent(y.password)}`;
        O["Proxy-Authorization"] = `Basic ${Buffer.from(R).toString("base64")}`;
      }
      O.Host = `${S}:${p.port}`, O["Proxy-Connection"] || (O["Proxy-Connection"] = this.keepAlive ? "Keep-Alive" : "close");
      for (const R of Object.keys(O))
        F += `${R}: ${O[R]}\r
`;
      const E = (0, n.parseProxyResponse)(v);
      v.write(`${F}\r
`);
      const { connect: P, buffered: A } = await E;
      if (a.emit("proxyConnect", P), this.emit("proxyConnect", P, a), P.statusCode === 200)
        return a.once("socket", u), p.secureEndpoint ? (e("Upgrading socket connection to TLS"), g.connect({
          ...C(t(p), "host", "path", "port"),
          socket: v
        })) : v;
      v.destroy();
      const I = new f.Socket({ writable: !1 });
      return I.readable = !0, a.once("socket", (R) => {
        e("Replaying proxy buffer for failed request"), (0, m.default)(R.listenerCount("data") > 0), R.push(A), R.push(null);
      }), I;
    }
  }
  s.protocols = ["http", "https"], w.HttpsProxyAgent = s;
  function u(i) {
    i.resume();
  }
  function C(i, ...a) {
    const p = {};
    let y;
    for (y in i)
      a.includes(y) || (p[y] = i[y]);
    return p;
  }
  return w;
}
var me = ge();
const Re = /* @__PURE__ */ ue({
  __proto__: null
}, [me]);
export {
  Re as i
};
