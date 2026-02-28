import { promises as za } from "node:fs";
import "node:path";
import { c as zn } from "./index-BIgzVLw7.js";
function xa(C) {
  if (!/^data:/i.test(C))
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  C = C.replace(/\r?\n/g, "");
  const s = C.indexOf(",");
  if (s === -1 || s <= 4)
    throw new TypeError("malformed data: URI");
  const l = C.substring(5, s).split(";");
  let c = "", h = !1;
  const g = l[0] || "text/plain";
  let f = g;
  for (let w = 1; w < l.length; w++)
    l[w] === "base64" ? h = !0 : l[w] && (f += `;${l[w]}`, l[w].indexOf("charset=") === 0 && (c = l[w].substring(8)));
  !l[0] && !c.length && (f += ";charset=US-ASCII", c = "US-ASCII");
  const X = h ? "base64" : "ascii", J = unescape(C.substring(s + 1)), $ = Buffer.from(J, X);
  return $.type = g, $.typeFull = f, $.charset = c, $;
}
var jn = {}, Qe = { exports: {} };
var ja = Qe.exports, Dn;
function Da() {
  return Dn || (Dn = 1, (function(C, s) {
    (function(l, c) {
      c(s);
    })(ja, (function(l) {
      function c() {
      }
      function h(e) {
        return typeof e == "object" && e !== null || typeof e == "function";
      }
      const g = c;
      function f(e, t) {
        try {
          Object.defineProperty(e, "name", {
            value: t,
            configurable: !0
          });
        } catch {
        }
      }
      const X = Promise, J = Promise.prototype.then, $ = Promise.reject.bind(X);
      function w(e) {
        return new X(e);
      }
      function S(e) {
        return w((t) => t(e));
      }
      function d(e) {
        return $(e);
      }
      function E(e, t, r) {
        return J.call(e, t, r);
      }
      function v(e, t, r) {
        E(E(e, t, r), void 0, g);
      }
      function wt(e, t) {
        v(e, t);
      }
      function Ct(e, t) {
        v(e, void 0, t);
      }
      function N(e, t, r) {
        return E(e, t, r);
      }
      function Re(e) {
        E(e, void 0, g);
      }
      let fe = (e) => {
        if (typeof queueMicrotask == "function")
          fe = queueMicrotask;
        else {
          const t = S(void 0);
          fe = (r) => E(t, r);
        }
        return fe(e);
      };
      function de(e, t, r) {
        if (typeof e != "function")
          throw new TypeError("Argument is not a function");
        return Function.prototype.apply.call(e, t, r);
      }
      function K(e, t, r) {
        try {
          return S(de(e, t, r));
        } catch (n) {
          return d(n);
        }
      }
      const pr = 16384;
      class k {
        constructor() {
          this._cursor = 0, this._size = 0, this._front = {
            _elements: [],
            _next: void 0
          }, this._back = this._front, this._cursor = 0, this._size = 0;
        }
        get length() {
          return this._size;
        }
        // For exception safety, this method is structured in order:
        // 1. Read state
        // 2. Calculate required state mutations
        // 3. Perform state mutations
        push(t) {
          const r = this._back;
          let n = r;
          r._elements.length === pr - 1 && (n = {
            _elements: [],
            _next: void 0
          }), r._elements.push(t), n !== r && (this._back = n, r._next = n), ++this._size;
        }
        // Like push(), shift() follows the read -> calculate -> mutate pattern for
        // exception safety.
        shift() {
          const t = this._front;
          let r = t;
          const n = this._cursor;
          let o = n + 1;
          const a = t._elements, i = a[n];
          return o === pr && (r = t._next, o = 0), --this._size, this._cursor = o, t !== r && (this._front = r), a[n] = void 0, i;
        }
        // The tricky thing about forEach() is that it can be called
        // re-entrantly. The queue may be mutated inside the callback. It is easy to
        // see that push() within the callback has no negative effects since the end
        // of the queue is checked for on every iteration. If shift() is called
        // repeatedly within the callback then the next iteration may return an
        // element that has been removed. In this case the callback will be called
        // with undefined values until we either "catch up" with elements that still
        // exist or reach the back of the queue.
        forEach(t) {
          let r = this._cursor, n = this._front, o = n._elements;
          for (; (r !== o.length || n._next !== void 0) && !(r === o.length && (n = n._next, o = n._elements, r = 0, o.length === 0)); )
            t(o[r]), ++r;
        }
        // Return the element that would be returned if shift() was called now,
        // without modifying the queue.
        peek() {
          const t = this._front, r = this._cursor;
          return t._elements[r];
        }
      }
      const yr = /* @__PURE__ */ Symbol("[[AbortSteps]]"), _r = /* @__PURE__ */ Symbol("[[ErrorSteps]]"), Tt = /* @__PURE__ */ Symbol("[[CancelSteps]]"), Pt = /* @__PURE__ */ Symbol("[[PullSteps]]"), vt = /* @__PURE__ */ Symbol("[[ReleaseSteps]]");
      function Sr(e, t) {
        e._ownerReadableStream = t, t._reader = e, t._state === "readable" ? qt(e) : t._state === "closed" ? Yn(e) : gr(e, t._storedError);
      }
      function Et(e, t) {
        const r = e._ownerReadableStream;
        return j(r, t);
      }
      function U(e) {
        const t = e._ownerReadableStream;
        t._state === "readable" ? At(e, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")) : Vn(e, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")), t._readableStreamController[vt](), t._reader = void 0, e._ownerReadableStream = void 0;
      }
      function Ve(e) {
        return new TypeError("Cannot " + e + " a stream using a released reader");
      }
      function qt(e) {
        e._closedPromise = w((t, r) => {
          e._closedPromise_resolve = t, e._closedPromise_reject = r;
        });
      }
      function gr(e, t) {
        qt(e), At(e, t);
      }
      function Yn(e) {
        qt(e), Rr(e);
      }
      function At(e, t) {
        e._closedPromise_reject !== void 0 && (Re(e._closedPromise), e._closedPromise_reject(t), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0);
      }
      function Vn(e, t) {
        gr(e, t);
      }
      function Rr(e) {
        e._closedPromise_resolve !== void 0 && (e._closedPromise_resolve(void 0), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0);
      }
      const wr = Number.isFinite || function(e) {
        return typeof e == "number" && isFinite(e);
      }, Hn = Math.trunc || function(e) {
        return e < 0 ? Math.ceil(e) : Math.floor(e);
      };
      function Gn(e) {
        return typeof e == "object" || typeof e == "function";
      }
      function M(e, t) {
        if (e !== void 0 && !Gn(e))
          throw new TypeError(`${t} is not an object.`);
      }
      function O(e, t) {
        if (typeof e != "function")
          throw new TypeError(`${t} is not a function.`);
      }
      function xn(e) {
        return typeof e == "object" && e !== null || typeof e == "function";
      }
      function Cr(e, t) {
        if (!xn(e))
          throw new TypeError(`${t} is not an object.`);
      }
      function Q(e, t, r) {
        if (e === void 0)
          throw new TypeError(`Parameter ${t} is required in '${r}'.`);
      }
      function Wt(e, t, r) {
        if (e === void 0)
          throw new TypeError(`${t} is required in '${r}'.`);
      }
      function Bt(e) {
        return Number(e);
      }
      function Tr(e) {
        return e === 0 ? 0 : e;
      }
      function Zn(e) {
        return Tr(Hn(e));
      }
      function kt(e, t) {
        const n = Number.MAX_SAFE_INTEGER;
        let o = Number(e);
        if (o = Tr(o), !wr(o))
          throw new TypeError(`${t} is not a finite number`);
        if (o = Zn(o), o < 0 || o > n)
          throw new TypeError(`${t} is outside the accepted range of 0 to ${n}, inclusive`);
        return !wr(o) || o === 0 ? 0 : o;
      }
      function Ot(e, t) {
        if (!ie(e))
          throw new TypeError(`${t} is not a ReadableStream.`);
      }
      function we(e) {
        return new ee(e);
      }
      function Pr(e, t) {
        e._reader._readRequests.push(t);
      }
      function It(e, t, r) {
        const o = e._reader._readRequests.shift();
        r ? o._closeSteps() : o._chunkSteps(t);
      }
      function He(e) {
        return e._reader._readRequests.length;
      }
      function vr(e) {
        const t = e._reader;
        return !(t === void 0 || !te(t));
      }
      class ee {
        constructor(t) {
          if (Q(t, 1, "ReadableStreamDefaultReader"), Ot(t, "First parameter"), se(t))
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          Sr(this, t), this._readRequests = new k();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed,
         * or rejected if the stream ever errors or the reader's lock is released before the stream finishes closing.
         */
        get closed() {
          return te(this) ? this._closedPromise : d(Ge("closed"));
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(t = void 0) {
          return te(this) ? this._ownerReadableStream === void 0 ? d(Ve("cancel")) : Et(this, t) : d(Ge("cancel"));
        }
        /**
         * Returns a promise that allows access to the next chunk from the stream's internal queue, if available.
         *
         * If reading a chunk causes the queue to become empty, more data will be pulled from the underlying source.
         */
        read() {
          if (!te(this))
            return d(Ge("read"));
          if (this._ownerReadableStream === void 0)
            return d(Ve("read from"));
          let t, r;
          const n = w((a, i) => {
            t = a, r = i;
          });
          return Ie(this, {
            _chunkSteps: (a) => t({ value: a, done: !1 }),
            _closeSteps: () => t({ value: void 0, done: !0 }),
            _errorSteps: (a) => r(a)
          }), n;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamDefaultReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
          if (!te(this))
            throw Ge("releaseLock");
          this._ownerReadableStream !== void 0 && Xn(this);
        }
      }
      Object.defineProperties(ee.prototype, {
        cancel: { enumerable: !0 },
        read: { enumerable: !0 },
        releaseLock: { enumerable: !0 },
        closed: { enumerable: !0 }
      }), f(ee.prototype.cancel, "cancel"), f(ee.prototype.read, "read"), f(ee.prototype.releaseLock, "releaseLock"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ee.prototype, Symbol.toStringTag, {
        value: "ReadableStreamDefaultReader",
        configurable: !0
      });
      function te(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_readRequests") ? !1 : e instanceof ee;
      }
      function Ie(e, t) {
        const r = e._ownerReadableStream;
        r._disturbed = !0, r._state === "closed" ? t._closeSteps() : r._state === "errored" ? t._errorSteps(r._storedError) : r._readableStreamController[Pt](t);
      }
      function Xn(e) {
        U(e);
        const t = new TypeError("Reader was released");
        Er(e, t);
      }
      function Er(e, t) {
        const r = e._readRequests;
        e._readRequests = new k(), r.forEach((n) => {
          n._errorSteps(t);
        });
      }
      function Ge(e) {
        return new TypeError(`ReadableStreamDefaultReader.prototype.${e} can only be used on a ReadableStreamDefaultReader`);
      }
      const Jn = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
      }).prototype);
      class qr {
        constructor(t, r) {
          this._ongoingPromise = void 0, this._isFinished = !1, this._reader = t, this._preventCancel = r;
        }
        next() {
          const t = () => this._nextSteps();
          return this._ongoingPromise = this._ongoingPromise ? N(this._ongoingPromise, t, t) : t(), this._ongoingPromise;
        }
        return(t) {
          const r = () => this._returnSteps(t);
          return this._ongoingPromise ? N(this._ongoingPromise, r, r) : r();
        }
        _nextSteps() {
          if (this._isFinished)
            return Promise.resolve({ value: void 0, done: !0 });
          const t = this._reader;
          let r, n;
          const o = w((i, u) => {
            r = i, n = u;
          });
          return Ie(t, {
            _chunkSteps: (i) => {
              this._ongoingPromise = void 0, fe(() => r({ value: i, done: !1 }));
            },
            _closeSteps: () => {
              this._ongoingPromise = void 0, this._isFinished = !0, U(t), r({ value: void 0, done: !0 });
            },
            _errorSteps: (i) => {
              this._ongoingPromise = void 0, this._isFinished = !0, U(t), n(i);
            }
          }), o;
        }
        _returnSteps(t) {
          if (this._isFinished)
            return Promise.resolve({ value: t, done: !0 });
          this._isFinished = !0;
          const r = this._reader;
          if (!this._preventCancel) {
            const n = Et(r, t);
            return U(r), N(n, () => ({ value: t, done: !0 }));
          }
          return U(r), S({ value: t, done: !0 });
        }
      }
      const Ar = {
        next() {
          return Wr(this) ? this._asyncIteratorImpl.next() : d(Br("next"));
        },
        return(e) {
          return Wr(this) ? this._asyncIteratorImpl.return(e) : d(Br("return"));
        }
      };
      Object.setPrototypeOf(Ar, Jn);
      function Kn(e, t) {
        const r = we(e), n = new qr(r, t), o = Object.create(Ar);
        return o._asyncIteratorImpl = n, o;
      }
      function Wr(e) {
        if (!h(e) || !Object.prototype.hasOwnProperty.call(e, "_asyncIteratorImpl"))
          return !1;
        try {
          return e._asyncIteratorImpl instanceof qr;
        } catch {
          return !1;
        }
      }
      function Br(e) {
        return new TypeError(`ReadableStreamAsyncIterator.${e} can only be used on a ReadableSteamAsyncIterator`);
      }
      const kr = Number.isNaN || function(e) {
        return e !== e;
      };
      var Ft, zt, jt;
      function Fe(e) {
        return e.slice();
      }
      function Or(e, t, r, n, o) {
        new Uint8Array(e).set(new Uint8Array(r, n, o), t);
      }
      let Y = (e) => (typeof e.transfer == "function" ? Y = (t) => t.transfer() : typeof structuredClone == "function" ? Y = (t) => structuredClone(t, { transfer: [t] }) : Y = (t) => t, Y(e)), re = (e) => (typeof e.detached == "boolean" ? re = (t) => t.detached : re = (t) => t.byteLength === 0, re(e));
      function Ir(e, t, r) {
        if (e.slice)
          return e.slice(t, r);
        const n = r - t, o = new ArrayBuffer(n);
        return Or(o, 0, e, t, n), o;
      }
      function xe(e, t) {
        const r = e[t];
        if (r != null) {
          if (typeof r != "function")
            throw new TypeError(`${String(t)} is not a function`);
          return r;
        }
      }
      function eo(e) {
        const t = {
          [Symbol.iterator]: () => e.iterator
        }, r = (async function* () {
          return yield* t;
        })(), n = r.next;
        return { iterator: r, nextMethod: n, done: !1 };
      }
      const Dt = (jt = (Ft = Symbol.asyncIterator) !== null && Ft !== void 0 ? Ft : (zt = Symbol.for) === null || zt === void 0 ? void 0 : zt.call(Symbol, "Symbol.asyncIterator")) !== null && jt !== void 0 ? jt : "@@asyncIterator";
      function Fr(e, t = "sync", r) {
        if (r === void 0)
          if (t === "async") {
            if (r = xe(e, Dt), r === void 0) {
              const a = xe(e, Symbol.iterator), i = Fr(e, "sync", a);
              return eo(i);
            }
          } else
            r = xe(e, Symbol.iterator);
        if (r === void 0)
          throw new TypeError("The object is not iterable");
        const n = de(r, e, []);
        if (!h(n))
          throw new TypeError("The iterator method must return an object");
        const o = n.next;
        return { iterator: n, nextMethod: o, done: !1 };
      }
      function to(e) {
        const t = de(e.nextMethod, e.iterator, []);
        if (!h(t))
          throw new TypeError("The iterator.next() method must return an object");
        return t;
      }
      function ro(e) {
        return !!e.done;
      }
      function no(e) {
        return e.value;
      }
      function oo(e) {
        return !(typeof e != "number" || kr(e) || e < 0);
      }
      function zr(e) {
        const t = Ir(e.buffer, e.byteOffset, e.byteOffset + e.byteLength);
        return new Uint8Array(t);
      }
      function Mt(e) {
        const t = e._queue.shift();
        return e._queueTotalSize -= t.size, e._queueTotalSize < 0 && (e._queueTotalSize = 0), t.value;
      }
      function Lt(e, t, r) {
        if (!oo(r) || r === 1 / 0)
          throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
        e._queue.push({ value: t, size: r }), e._queueTotalSize += r;
      }
      function ao(e) {
        return e._queue.peek().value;
      }
      function ne(e) {
        e._queue = new k(), e._queueTotalSize = 0;
      }
      function jr(e) {
        return e === DataView;
      }
      function io(e) {
        return jr(e.constructor);
      }
      function so(e) {
        return jr(e) ? 1 : e.BYTES_PER_ELEMENT;
      }
      class ce {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the view for writing in to, or `null` if the BYOB request has already been responded to.
         */
        get view() {
          if (!$t(this))
            throw Vt("view");
          return this._view;
        }
        respond(t) {
          if (!$t(this))
            throw Vt("respond");
          if (Q(t, 1, "respond"), t = kt(t, "First parameter"), this._associatedReadableByteStreamController === void 0)
            throw new TypeError("This BYOB request has been invalidated");
          if (re(this._view.buffer))
            throw new TypeError("The BYOB request's buffer has been detached and so cannot be used as a response");
          Ke(this._associatedReadableByteStreamController, t);
        }
        respondWithNewView(t) {
          if (!$t(this))
            throw Vt("respondWithNewView");
          if (Q(t, 1, "respondWithNewView"), !ArrayBuffer.isView(t))
            throw new TypeError("You can only respond with array buffer views");
          if (this._associatedReadableByteStreamController === void 0)
            throw new TypeError("This BYOB request has been invalidated");
          if (re(t.buffer))
            throw new TypeError("The given view's buffer has been detached and so cannot be used as a response");
          et(this._associatedReadableByteStreamController, t);
        }
      }
      Object.defineProperties(ce.prototype, {
        respond: { enumerable: !0 },
        respondWithNewView: { enumerable: !0 },
        view: { enumerable: !0 }
      }), f(ce.prototype.respond, "respond"), f(ce.prototype.respondWithNewView, "respondWithNewView"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ce.prototype, Symbol.toStringTag, {
        value: "ReadableStreamBYOBRequest",
        configurable: !0
      });
      class V {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the current BYOB pull request, or `null` if there isn't one.
         */
        get byobRequest() {
          if (!he(this))
            throw je("byobRequest");
          return Yt(this);
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying byte source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
          if (!he(this))
            throw je("desiredSize");
          return Hr(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
          if (!he(this))
            throw je("close");
          if (this._closeRequested)
            throw new TypeError("The stream has already been closed; do not close it again!");
          const t = this._controlledReadableByteStream._state;
          if (t !== "readable")
            throw new TypeError(`The stream (in ${t} state) is not in the readable state and cannot be closed`);
          ze(this);
        }
        enqueue(t) {
          if (!he(this))
            throw je("enqueue");
          if (Q(t, 1, "enqueue"), !ArrayBuffer.isView(t))
            throw new TypeError("chunk must be an array buffer view");
          if (t.byteLength === 0)
            throw new TypeError("chunk must have non-zero byteLength");
          if (t.buffer.byteLength === 0)
            throw new TypeError("chunk's buffer must have non-zero byteLength");
          if (this._closeRequested)
            throw new TypeError("stream is closed or draining");
          const r = this._controlledReadableByteStream._state;
          if (r !== "readable")
            throw new TypeError(`The stream (in ${r} state) is not in the readable state and cannot be enqueued to`);
          Je(this, t);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(t = void 0) {
          if (!he(this))
            throw je("error");
          I(this, t);
        }
        /** @internal */
        [Tt](t) {
          Dr(this), ne(this);
          const r = this._cancelAlgorithm(t);
          return Xe(this), r;
        }
        /** @internal */
        [Pt](t) {
          const r = this._controlledReadableByteStream;
          if (this._queueTotalSize > 0) {
            Vr(this, t);
            return;
          }
          const n = this._autoAllocateChunkSize;
          if (n !== void 0) {
            let o;
            try {
              o = new ArrayBuffer(n);
            } catch (i) {
              t._errorSteps(i);
              return;
            }
            const a = {
              buffer: o,
              bufferByteLength: n,
              byteOffset: 0,
              byteLength: n,
              bytesFilled: 0,
              minimumFill: 1,
              elementSize: 1,
              viewConstructor: Uint8Array,
              readerType: "default"
            };
            this._pendingPullIntos.push(a);
          }
          Pr(r, t), be(this);
        }
        /** @internal */
        [vt]() {
          if (this._pendingPullIntos.length > 0) {
            const t = this._pendingPullIntos.peek();
            t.readerType = "none", this._pendingPullIntos = new k(), this._pendingPullIntos.push(t);
          }
        }
      }
      Object.defineProperties(V.prototype, {
        close: { enumerable: !0 },
        enqueue: { enumerable: !0 },
        error: { enumerable: !0 },
        byobRequest: { enumerable: !0 },
        desiredSize: { enumerable: !0 }
      }), f(V.prototype.close, "close"), f(V.prototype.enqueue, "enqueue"), f(V.prototype.error, "error"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(V.prototype, Symbol.toStringTag, {
        value: "ReadableByteStreamController",
        configurable: !0
      });
      function he(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledReadableByteStream") ? !1 : e instanceof V;
      }
      function $t(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_associatedReadableByteStreamController") ? !1 : e instanceof ce;
      }
      function be(e) {
        if (!ho(e))
          return;
        if (e._pulling) {
          e._pullAgain = !0;
          return;
        }
        e._pulling = !0;
        const r = e._pullAlgorithm();
        v(r, () => (e._pulling = !1, e._pullAgain && (e._pullAgain = !1, be(e)), null), (n) => (I(e, n), null));
      }
      function Dr(e) {
        Ut(e), e._pendingPullIntos = new k();
      }
      function Nt(e, t) {
        let r = !1;
        e._state === "closed" && (r = !0);
        const n = Mr(t);
        t.readerType === "default" ? It(e, n, r) : So(e, n, r);
      }
      function Mr(e) {
        const t = e.bytesFilled, r = e.elementSize;
        return new e.viewConstructor(e.buffer, e.byteOffset, t / r);
      }
      function Ze(e, t, r, n) {
        e._queue.push({ buffer: t, byteOffset: r, byteLength: n }), e._queueTotalSize += n;
      }
      function Lr(e, t, r, n) {
        let o;
        try {
          o = Ir(t, r, r + n);
        } catch (a) {
          throw I(e, a), a;
        }
        Ze(e, o, 0, n);
      }
      function $r(e, t) {
        t.bytesFilled > 0 && Lr(e, t.buffer, t.byteOffset, t.bytesFilled), Ce(e);
      }
      function Nr(e, t) {
        const r = Math.min(e._queueTotalSize, t.byteLength - t.bytesFilled), n = t.bytesFilled + r;
        let o = r, a = !1;
        const i = n % t.elementSize, u = n - i;
        u >= t.minimumFill && (o = u - t.bytesFilled, a = !0);
        const p = e._queue;
        for (; o > 0; ) {
          const b = p.peek(), y = Math.min(o, b.byteLength), _ = t.byteOffset + t.bytesFilled;
          Or(t.buffer, _, b.buffer, b.byteOffset, y), b.byteLength === y ? p.shift() : (b.byteOffset += y, b.byteLength -= y), e._queueTotalSize -= y, Ur(e, y, t), o -= y;
        }
        return a;
      }
      function Ur(e, t, r) {
        r.bytesFilled += t;
      }
      function Qr(e) {
        e._queueTotalSize === 0 && e._closeRequested ? (Xe(e), Ue(e._controlledReadableByteStream)) : be(e);
      }
      function Ut(e) {
        e._byobRequest !== null && (e._byobRequest._associatedReadableByteStreamController = void 0, e._byobRequest._view = null, e._byobRequest = null);
      }
      function Qt(e) {
        for (; e._pendingPullIntos.length > 0; ) {
          if (e._queueTotalSize === 0)
            return;
          const t = e._pendingPullIntos.peek();
          Nr(e, t) && (Ce(e), Nt(e._controlledReadableByteStream, t));
        }
      }
      function lo(e) {
        const t = e._controlledReadableByteStream._reader;
        for (; t._readRequests.length > 0; ) {
          if (e._queueTotalSize === 0)
            return;
          const r = t._readRequests.shift();
          Vr(e, r);
        }
      }
      function uo(e, t, r, n) {
        const o = e._controlledReadableByteStream, a = t.constructor, i = so(a), { byteOffset: u, byteLength: p } = t, b = r * i;
        let y;
        try {
          y = Y(t.buffer);
        } catch (T) {
          n._errorSteps(T);
          return;
        }
        const _ = {
          buffer: y,
          bufferByteLength: y.byteLength,
          byteOffset: u,
          byteLength: p,
          bytesFilled: 0,
          minimumFill: b,
          elementSize: i,
          viewConstructor: a,
          readerType: "byob"
        };
        if (e._pendingPullIntos.length > 0) {
          e._pendingPullIntos.push(_), Zr(o, n);
          return;
        }
        if (o._state === "closed") {
          const T = new a(_.buffer, _.byteOffset, 0);
          n._closeSteps(T);
          return;
        }
        if (e._queueTotalSize > 0) {
          if (Nr(e, _)) {
            const T = Mr(_);
            Qr(e), n._chunkSteps(T);
            return;
          }
          if (e._closeRequested) {
            const T = new TypeError("Insufficient bytes to fill elements in the given buffer");
            I(e, T), n._errorSteps(T);
            return;
          }
        }
        e._pendingPullIntos.push(_), Zr(o, n), be(e);
      }
      function fo(e, t) {
        t.readerType === "none" && Ce(e);
        const r = e._controlledReadableByteStream;
        if (Ht(r))
          for (; Xr(r) > 0; ) {
            const n = Ce(e);
            Nt(r, n);
          }
      }
      function co(e, t, r) {
        if (Ur(e, t, r), r.readerType === "none") {
          $r(e, r), Qt(e);
          return;
        }
        if (r.bytesFilled < r.minimumFill)
          return;
        Ce(e);
        const n = r.bytesFilled % r.elementSize;
        if (n > 0) {
          const o = r.byteOffset + r.bytesFilled;
          Lr(e, r.buffer, o - n, n);
        }
        r.bytesFilled -= n, Nt(e._controlledReadableByteStream, r), Qt(e);
      }
      function Yr(e, t) {
        const r = e._pendingPullIntos.peek();
        Ut(e), e._controlledReadableByteStream._state === "closed" ? fo(e, r) : co(e, t, r), be(e);
      }
      function Ce(e) {
        return e._pendingPullIntos.shift();
      }
      function ho(e) {
        const t = e._controlledReadableByteStream;
        return t._state !== "readable" || e._closeRequested || !e._started ? !1 : !!(vr(t) && He(t) > 0 || Ht(t) && Xr(t) > 0 || Hr(e) > 0);
      }
      function Xe(e) {
        e._pullAlgorithm = void 0, e._cancelAlgorithm = void 0;
      }
      function ze(e) {
        const t = e._controlledReadableByteStream;
        if (!(e._closeRequested || t._state !== "readable")) {
          if (e._queueTotalSize > 0) {
            e._closeRequested = !0;
            return;
          }
          if (e._pendingPullIntos.length > 0) {
            const r = e._pendingPullIntos.peek();
            if (r.bytesFilled % r.elementSize !== 0) {
              const n = new TypeError("Insufficient bytes to fill elements in the given buffer");
              throw I(e, n), n;
            }
          }
          Xe(e), Ue(t);
        }
      }
      function Je(e, t) {
        const r = e._controlledReadableByteStream;
        if (e._closeRequested || r._state !== "readable")
          return;
        const { buffer: n, byteOffset: o, byteLength: a } = t;
        if (re(n))
          throw new TypeError("chunk's buffer is detached and so cannot be enqueued");
        const i = Y(n);
        if (e._pendingPullIntos.length > 0) {
          const u = e._pendingPullIntos.peek();
          if (re(u.buffer))
            throw new TypeError("The BYOB request's buffer has been detached and so cannot be filled with an enqueued chunk");
          Ut(e), u.buffer = Y(u.buffer), u.readerType === "none" && $r(e, u);
        }
        if (vr(r))
          if (lo(e), He(r) === 0)
            Ze(e, i, o, a);
          else {
            e._pendingPullIntos.length > 0 && Ce(e);
            const u = new Uint8Array(i, o, a);
            It(r, u, !1);
          }
        else Ht(r) ? (Ze(e, i, o, a), Qt(e)) : Ze(e, i, o, a);
        be(e);
      }
      function I(e, t) {
        const r = e._controlledReadableByteStream;
        r._state === "readable" && (Dr(e), ne(e), Xe(e), wn(r, t));
      }
      function Vr(e, t) {
        const r = e._queue.shift();
        e._queueTotalSize -= r.byteLength, Qr(e);
        const n = new Uint8Array(r.buffer, r.byteOffset, r.byteLength);
        t._chunkSteps(n);
      }
      function Yt(e) {
        if (e._byobRequest === null && e._pendingPullIntos.length > 0) {
          const t = e._pendingPullIntos.peek(), r = new Uint8Array(t.buffer, t.byteOffset + t.bytesFilled, t.byteLength - t.bytesFilled), n = Object.create(ce.prototype);
          mo(n, e, r), e._byobRequest = n;
        }
        return e._byobRequest;
      }
      function Hr(e) {
        const t = e._controlledReadableByteStream._state;
        return t === "errored" ? null : t === "closed" ? 0 : e._strategyHWM - e._queueTotalSize;
      }
      function Ke(e, t) {
        const r = e._pendingPullIntos.peek();
        if (e._controlledReadableByteStream._state === "closed") {
          if (t !== 0)
            throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
        } else {
          if (t === 0)
            throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
          if (r.bytesFilled + t > r.byteLength)
            throw new RangeError("bytesWritten out of range");
        }
        r.buffer = Y(r.buffer), Yr(e, t);
      }
      function et(e, t) {
        const r = e._pendingPullIntos.peek();
        if (e._controlledReadableByteStream._state === "closed") {
          if (t.byteLength !== 0)
            throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
        } else if (t.byteLength === 0)
          throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
        if (r.byteOffset + r.bytesFilled !== t.byteOffset)
          throw new RangeError("The region specified by view does not match byobRequest");
        if (r.bufferByteLength !== t.buffer.byteLength)
          throw new RangeError("The buffer of view has different capacity than byobRequest");
        if (r.bytesFilled + t.byteLength > r.byteLength)
          throw new RangeError("The region specified by view is larger than byobRequest");
        const o = t.byteLength;
        r.buffer = Y(t.buffer), Yr(e, o);
      }
      function Gr(e, t, r, n, o, a, i) {
        t._controlledReadableByteStream = e, t._pullAgain = !1, t._pulling = !1, t._byobRequest = null, t._queue = t._queueTotalSize = void 0, ne(t), t._closeRequested = !1, t._started = !1, t._strategyHWM = a, t._pullAlgorithm = n, t._cancelAlgorithm = o, t._autoAllocateChunkSize = i, t._pendingPullIntos = new k(), e._readableStreamController = t;
        const u = r();
        v(S(u), () => (t._started = !0, be(t), null), (p) => (I(t, p), null));
      }
      function bo(e, t, r) {
        const n = Object.create(V.prototype);
        let o, a, i;
        t.start !== void 0 ? o = () => t.start(n) : o = () => {
        }, t.pull !== void 0 ? a = () => t.pull(n) : a = () => S(void 0), t.cancel !== void 0 ? i = (p) => t.cancel(p) : i = () => S(void 0);
        const u = t.autoAllocateChunkSize;
        if (u === 0)
          throw new TypeError("autoAllocateChunkSize must be greater than 0");
        Gr(e, n, o, a, i, r, u);
      }
      function mo(e, t, r) {
        e._associatedReadableByteStreamController = t, e._view = r;
      }
      function Vt(e) {
        return new TypeError(`ReadableStreamBYOBRequest.prototype.${e} can only be used on a ReadableStreamBYOBRequest`);
      }
      function je(e) {
        return new TypeError(`ReadableByteStreamController.prototype.${e} can only be used on a ReadableByteStreamController`);
      }
      function po(e, t) {
        M(e, t);
        const r = e?.mode;
        return {
          mode: r === void 0 ? void 0 : yo(r, `${t} has member 'mode' that`)
        };
      }
      function yo(e, t) {
        if (e = `${e}`, e !== "byob")
          throw new TypeError(`${t} '${e}' is not a valid enumeration value for ReadableStreamReaderMode`);
        return e;
      }
      function _o(e, t) {
        var r;
        M(e, t);
        const n = (r = e?.min) !== null && r !== void 0 ? r : 1;
        return {
          min: kt(n, `${t} has member 'min' that`)
        };
      }
      function xr(e) {
        return new oe(e);
      }
      function Zr(e, t) {
        e._reader._readIntoRequests.push(t);
      }
      function So(e, t, r) {
        const o = e._reader._readIntoRequests.shift();
        r ? o._closeSteps(t) : o._chunkSteps(t);
      }
      function Xr(e) {
        return e._reader._readIntoRequests.length;
      }
      function Ht(e) {
        const t = e._reader;
        return !(t === void 0 || !me(t));
      }
      class oe {
        constructor(t) {
          if (Q(t, 1, "ReadableStreamBYOBReader"), Ot(t, "First parameter"), se(t))
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          if (!he(t._readableStreamController))
            throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
          Sr(this, t), this._readIntoRequests = new k();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the reader's lock is released before the stream finishes closing.
         */
        get closed() {
          return me(this) ? this._closedPromise : d(tt("closed"));
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(t = void 0) {
          return me(this) ? this._ownerReadableStream === void 0 ? d(Ve("cancel")) : Et(this, t) : d(tt("cancel"));
        }
        read(t, r = {}) {
          if (!me(this))
            return d(tt("read"));
          if (!ArrayBuffer.isView(t))
            return d(new TypeError("view must be an array buffer view"));
          if (t.byteLength === 0)
            return d(new TypeError("view must have non-zero byteLength"));
          if (t.buffer.byteLength === 0)
            return d(new TypeError("view's buffer must have non-zero byteLength"));
          if (re(t.buffer))
            return d(new TypeError("view's buffer has been detached"));
          let n;
          try {
            n = _o(r, "options");
          } catch (b) {
            return d(b);
          }
          const o = n.min;
          if (o === 0)
            return d(new TypeError("options.min must be greater than 0"));
          if (io(t)) {
            if (o > t.byteLength)
              return d(new RangeError("options.min must be less than or equal to view's byteLength"));
          } else if (o > t.length)
            return d(new RangeError("options.min must be less than or equal to view's length"));
          if (this._ownerReadableStream === void 0)
            return d(Ve("read from"));
          let a, i;
          const u = w((b, y) => {
            a = b, i = y;
          });
          return Jr(this, t, o, {
            _chunkSteps: (b) => a({ value: b, done: !1 }),
            _closeSteps: (b) => a({ value: b, done: !0 }),
            _errorSteps: (b) => i(b)
          }), u;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamBYOBReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
          if (!me(this))
            throw tt("releaseLock");
          this._ownerReadableStream !== void 0 && go(this);
        }
      }
      Object.defineProperties(oe.prototype, {
        cancel: { enumerable: !0 },
        read: { enumerable: !0 },
        releaseLock: { enumerable: !0 },
        closed: { enumerable: !0 }
      }), f(oe.prototype.cancel, "cancel"), f(oe.prototype.read, "read"), f(oe.prototype.releaseLock, "releaseLock"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(oe.prototype, Symbol.toStringTag, {
        value: "ReadableStreamBYOBReader",
        configurable: !0
      });
      function me(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_readIntoRequests") ? !1 : e instanceof oe;
      }
      function Jr(e, t, r, n) {
        const o = e._ownerReadableStream;
        o._disturbed = !0, o._state === "errored" ? n._errorSteps(o._storedError) : uo(o._readableStreamController, t, r, n);
      }
      function go(e) {
        U(e);
        const t = new TypeError("Reader was released");
        Kr(e, t);
      }
      function Kr(e, t) {
        const r = e._readIntoRequests;
        e._readIntoRequests = new k(), r.forEach((n) => {
          n._errorSteps(t);
        });
      }
      function tt(e) {
        return new TypeError(`ReadableStreamBYOBReader.prototype.${e} can only be used on a ReadableStreamBYOBReader`);
      }
      function De(e, t) {
        const { highWaterMark: r } = e;
        if (r === void 0)
          return t;
        if (kr(r) || r < 0)
          throw new RangeError("Invalid highWaterMark");
        return r;
      }
      function rt(e) {
        const { size: t } = e;
        return t || (() => 1);
      }
      function nt(e, t) {
        M(e, t);
        const r = e?.highWaterMark, n = e?.size;
        return {
          highWaterMark: r === void 0 ? void 0 : Bt(r),
          size: n === void 0 ? void 0 : Ro(n, `${t} has member 'size' that`)
        };
      }
      function Ro(e, t) {
        return O(e, t), (r) => Bt(e(r));
      }
      function wo(e, t) {
        M(e, t);
        const r = e?.abort, n = e?.close, o = e?.start, a = e?.type, i = e?.write;
        return {
          abort: r === void 0 ? void 0 : Co(r, e, `${t} has member 'abort' that`),
          close: n === void 0 ? void 0 : To(n, e, `${t} has member 'close' that`),
          start: o === void 0 ? void 0 : Po(o, e, `${t} has member 'start' that`),
          write: i === void 0 ? void 0 : vo(i, e, `${t} has member 'write' that`),
          type: a
        };
      }
      function Co(e, t, r) {
        return O(e, r), (n) => K(e, t, [n]);
      }
      function To(e, t, r) {
        return O(e, r), () => K(e, t, []);
      }
      function Po(e, t, r) {
        return O(e, r), (n) => de(e, t, [n]);
      }
      function vo(e, t, r) {
        return O(e, r), (n, o) => K(e, t, [n, o]);
      }
      function en(e, t) {
        if (!Te(e))
          throw new TypeError(`${t} is not a WritableStream.`);
      }
      function Eo(e) {
        if (typeof e != "object" || e === null)
          return !1;
        try {
          return typeof e.aborted == "boolean";
        } catch {
          return !1;
        }
      }
      const qo = typeof AbortController == "function";
      function Ao() {
        if (qo)
          return new AbortController();
      }
      class ae {
        constructor(t = {}, r = {}) {
          t === void 0 ? t = null : Cr(t, "First parameter");
          const n = nt(r, "Second parameter"), o = wo(t, "First parameter");
          if (rn(this), o.type !== void 0)
            throw new RangeError("Invalid type is specified");
          const i = rt(n), u = De(n, 1);
          Uo(this, o, u, i);
        }
        /**
         * Returns whether or not the writable stream is locked to a writer.
         */
        get locked() {
          if (!Te(this))
            throw lt("locked");
          return Pe(this);
        }
        /**
         * Aborts the stream, signaling that the producer can no longer successfully write to the stream and it is to be
         * immediately moved to an errored state, with any queued-up writes discarded. This will also execute any abort
         * mechanism of the underlying sink.
         *
         * The returned promise will fulfill if the stream shuts down successfully, or reject if the underlying sink signaled
         * that there was an error doing so. Additionally, it will reject with a `TypeError` (without attempting to cancel
         * the stream) if the stream is currently locked.
         */
        abort(t = void 0) {
          return Te(this) ? Pe(this) ? d(new TypeError("Cannot abort a stream that already has a writer")) : ot(this, t) : d(lt("abort"));
        }
        /**
         * Closes the stream. The underlying sink will finish processing any previously-written chunks, before invoking its
         * close behavior. During this time any further attempts to write will fail (without erroring the stream).
         *
         * The method returns a promise that will fulfill if all remaining chunks are successfully written and the stream
         * successfully closes, or rejects if an error is encountered during this process. Additionally, it will reject with
         * a `TypeError` (without attempting to cancel the stream) if the stream is currently locked.
         */
        close() {
          return Te(this) ? Pe(this) ? d(new TypeError("Cannot close a stream that already has a writer")) : L(this) ? d(new TypeError("Cannot close an already-closing stream")) : nn(this) : d(lt("close"));
        }
        /**
         * Creates a {@link WritableStreamDefaultWriter | writer} and locks the stream to the new writer. While the stream
         * is locked, no other writer can be acquired until this one is released.
         *
         * This functionality is especially useful for creating abstractions that desire the ability to write to a stream
         * without interruption or interleaving. By getting a writer for the stream, you can ensure nobody else can write at
         * the same time, which would cause the resulting written data to be unpredictable and probably useless.
         */
        getWriter() {
          if (!Te(this))
            throw lt("getWriter");
          return tn(this);
        }
      }
      Object.defineProperties(ae.prototype, {
        abort: { enumerable: !0 },
        close: { enumerable: !0 },
        getWriter: { enumerable: !0 },
        locked: { enumerable: !0 }
      }), f(ae.prototype.abort, "abort"), f(ae.prototype.close, "close"), f(ae.prototype.getWriter, "getWriter"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ae.prototype, Symbol.toStringTag, {
        value: "WritableStream",
        configurable: !0
      });
      function tn(e) {
        return new H(e);
      }
      function Wo(e, t, r, n, o = 1, a = () => 1) {
        const i = Object.create(ae.prototype);
        rn(i);
        const u = Object.create(ve.prototype);
        return fn(i, u, e, t, r, n, o, a), i;
      }
      function rn(e) {
        e._state = "writable", e._storedError = void 0, e._writer = void 0, e._writableStreamController = void 0, e._writeRequests = new k(), e._inFlightWriteRequest = void 0, e._closeRequest = void 0, e._inFlightCloseRequest = void 0, e._pendingAbortRequest = void 0, e._backpressure = !1;
      }
      function Te(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_writableStreamController") ? !1 : e instanceof ae;
      }
      function Pe(e) {
        return e._writer !== void 0;
      }
      function ot(e, t) {
        var r;
        if (e._state === "closed" || e._state === "errored")
          return S(void 0);
        e._writableStreamController._abortReason = t, (r = e._writableStreamController._abortController) === null || r === void 0 || r.abort(t);
        const n = e._state;
        if (n === "closed" || n === "errored")
          return S(void 0);
        if (e._pendingAbortRequest !== void 0)
          return e._pendingAbortRequest._promise;
        let o = !1;
        n === "erroring" && (o = !0, t = void 0);
        const a = w((i, u) => {
          e._pendingAbortRequest = {
            _promise: void 0,
            _resolve: i,
            _reject: u,
            _reason: t,
            _wasAlreadyErroring: o
          };
        });
        return e._pendingAbortRequest._promise = a, o || xt(e, t), a;
      }
      function nn(e) {
        const t = e._state;
        if (t === "closed" || t === "errored")
          return d(new TypeError(`The stream (in ${t} state) is not in the writable state and cannot be closed`));
        const r = w((o, a) => {
          const i = {
            _resolve: o,
            _reject: a
          };
          e._closeRequest = i;
        }), n = e._writer;
        return n !== void 0 && e._backpressure && t === "writable" && nr(n), Qo(e._writableStreamController), r;
      }
      function Bo(e) {
        return w((r, n) => {
          const o = {
            _resolve: r,
            _reject: n
          };
          e._writeRequests.push(o);
        });
      }
      function Gt(e, t) {
        if (e._state === "writable") {
          xt(e, t);
          return;
        }
        Zt(e);
      }
      function xt(e, t) {
        const r = e._writableStreamController;
        e._state = "erroring", e._storedError = t;
        const n = e._writer;
        n !== void 0 && an(n, t), !zo(e) && r._started && Zt(e);
      }
      function Zt(e) {
        e._state = "errored", e._writableStreamController[_r]();
        const t = e._storedError;
        if (e._writeRequests.forEach((o) => {
          o._reject(t);
        }), e._writeRequests = new k(), e._pendingAbortRequest === void 0) {
          at(e);
          return;
        }
        const r = e._pendingAbortRequest;
        if (e._pendingAbortRequest = void 0, r._wasAlreadyErroring) {
          r._reject(t), at(e);
          return;
        }
        const n = e._writableStreamController[yr](r._reason);
        v(n, () => (r._resolve(), at(e), null), (o) => (r._reject(o), at(e), null));
      }
      function ko(e) {
        e._inFlightWriteRequest._resolve(void 0), e._inFlightWriteRequest = void 0;
      }
      function Oo(e, t) {
        e._inFlightWriteRequest._reject(t), e._inFlightWriteRequest = void 0, Gt(e, t);
      }
      function Io(e) {
        e._inFlightCloseRequest._resolve(void 0), e._inFlightCloseRequest = void 0, e._state === "erroring" && (e._storedError = void 0, e._pendingAbortRequest !== void 0 && (e._pendingAbortRequest._resolve(), e._pendingAbortRequest = void 0)), e._state = "closed";
        const r = e._writer;
        r !== void 0 && bn(r);
      }
      function Fo(e, t) {
        e._inFlightCloseRequest._reject(t), e._inFlightCloseRequest = void 0, e._pendingAbortRequest !== void 0 && (e._pendingAbortRequest._reject(t), e._pendingAbortRequest = void 0), Gt(e, t);
      }
      function L(e) {
        return !(e._closeRequest === void 0 && e._inFlightCloseRequest === void 0);
      }
      function zo(e) {
        return !(e._inFlightWriteRequest === void 0 && e._inFlightCloseRequest === void 0);
      }
      function jo(e) {
        e._inFlightCloseRequest = e._closeRequest, e._closeRequest = void 0;
      }
      function Do(e) {
        e._inFlightWriteRequest = e._writeRequests.shift();
      }
      function at(e) {
        e._closeRequest !== void 0 && (e._closeRequest._reject(e._storedError), e._closeRequest = void 0);
        const t = e._writer;
        t !== void 0 && tr(t, e._storedError);
      }
      function Xt(e, t) {
        const r = e._writer;
        r !== void 0 && t !== e._backpressure && (t ? Xo(r) : nr(r)), e._backpressure = t;
      }
      class H {
        constructor(t) {
          if (Q(t, 1, "WritableStreamDefaultWriter"), en(t, "First parameter"), Pe(t))
            throw new TypeError("This stream has already been locked for exclusive writing by another writer");
          this._ownerWritableStream = t, t._writer = this;
          const r = t._state;
          if (r === "writable")
            !L(t) && t._backpressure ? ft(this) : mn(this), ut(this);
          else if (r === "erroring")
            rr(this, t._storedError), ut(this);
          else if (r === "closed")
            mn(this), xo(this);
          else {
            const n = t._storedError;
            rr(this, n), hn(this, n);
          }
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the writer’s lock is released before the stream finishes closing.
         */
        get closed() {
          return pe(this) ? this._closedPromise : d(ye("closed"));
        }
        /**
         * Returns the desired size to fill the stream’s internal queue. It can be negative, if the queue is over-full.
         * A producer can use this information to determine the right amount of data to write.
         *
         * It will be `null` if the stream cannot be successfully written to (due to either being errored, or having an abort
         * queued up). It will return zero if the stream is closed. And the getter will throw an exception if invoked when
         * the writer’s lock is released.
         */
        get desiredSize() {
          if (!pe(this))
            throw ye("desiredSize");
          if (this._ownerWritableStream === void 0)
            throw Le("desiredSize");
          return No(this);
        }
        /**
         * Returns a promise that will be fulfilled when the desired size to fill the stream’s internal queue transitions
         * from non-positive to positive, signaling that it is no longer applying backpressure. Once the desired size dips
         * back to zero or below, the getter will return a new promise that stays pending until the next transition.
         *
         * If the stream becomes errored or aborted, or the writer’s lock is released, the returned promise will become
         * rejected.
         */
        get ready() {
          return pe(this) ? this._readyPromise : d(ye("ready"));
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.abort | stream.abort(reason)}.
         */
        abort(t = void 0) {
          return pe(this) ? this._ownerWritableStream === void 0 ? d(Le("abort")) : Mo(this, t) : d(ye("abort"));
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.close | stream.close()}.
         */
        close() {
          if (!pe(this))
            return d(ye("close"));
          const t = this._ownerWritableStream;
          return t === void 0 ? d(Le("close")) : L(t) ? d(new TypeError("Cannot close an already-closing stream")) : on(this);
        }
        /**
         * Releases the writer’s lock on the corresponding stream. After the lock is released, the writer is no longer active.
         * If the associated stream is errored when the lock is released, the writer will appear errored in the same way from
         * now on; otherwise, the writer will appear closed.
         *
         * Note that the lock can still be released even if some ongoing writes have not yet finished (i.e. even if the
         * promises returned from previous calls to {@link WritableStreamDefaultWriter.write | write()} have not yet settled).
         * It’s not necessary to hold the lock on the writer for the duration of the write; the lock instead simply prevents
         * other producers from writing in an interleaved manner.
         */
        releaseLock() {
          if (!pe(this))
            throw ye("releaseLock");
          this._ownerWritableStream !== void 0 && sn(this);
        }
        write(t = void 0) {
          return pe(this) ? this._ownerWritableStream === void 0 ? d(Le("write to")) : ln(this, t) : d(ye("write"));
        }
      }
      Object.defineProperties(H.prototype, {
        abort: { enumerable: !0 },
        close: { enumerable: !0 },
        releaseLock: { enumerable: !0 },
        write: { enumerable: !0 },
        closed: { enumerable: !0 },
        desiredSize: { enumerable: !0 },
        ready: { enumerable: !0 }
      }), f(H.prototype.abort, "abort"), f(H.prototype.close, "close"), f(H.prototype.releaseLock, "releaseLock"), f(H.prototype.write, "write"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(H.prototype, Symbol.toStringTag, {
        value: "WritableStreamDefaultWriter",
        configurable: !0
      });
      function pe(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_ownerWritableStream") ? !1 : e instanceof H;
      }
      function Mo(e, t) {
        const r = e._ownerWritableStream;
        return ot(r, t);
      }
      function on(e) {
        const t = e._ownerWritableStream;
        return nn(t);
      }
      function Lo(e) {
        const t = e._ownerWritableStream, r = t._state;
        return L(t) || r === "closed" ? S(void 0) : r === "errored" ? d(t._storedError) : on(e);
      }
      function $o(e, t) {
        e._closedPromiseState === "pending" ? tr(e, t) : Zo(e, t);
      }
      function an(e, t) {
        e._readyPromiseState === "pending" ? pn(e, t) : Jo(e, t);
      }
      function No(e) {
        const t = e._ownerWritableStream, r = t._state;
        return r === "errored" || r === "erroring" ? null : r === "closed" ? 0 : dn(t._writableStreamController);
      }
      function sn(e) {
        const t = e._ownerWritableStream, r = new TypeError("Writer was released and can no longer be used to monitor the stream's closedness");
        an(e, r), $o(e, r), t._writer = void 0, e._ownerWritableStream = void 0;
      }
      function ln(e, t) {
        const r = e._ownerWritableStream, n = r._writableStreamController, o = Yo(n, t);
        if (r !== e._ownerWritableStream)
          return d(Le("write to"));
        const a = r._state;
        if (a === "errored")
          return d(r._storedError);
        if (L(r) || a === "closed")
          return d(new TypeError("The stream is closing or closed and cannot be written to"));
        if (a === "erroring")
          return d(r._storedError);
        const i = Bo(r);
        return Vo(n, t, o), i;
      }
      const un = {};
      class ve {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * The reason which was passed to `WritableStream.abort(reason)` when the stream was aborted.
         *
         * @deprecated
         *  This property has been removed from the specification, see https://github.com/whatwg/streams/pull/1177.
         *  Use {@link WritableStreamDefaultController.signal}'s `reason` instead.
         */
        get abortReason() {
          if (!Jt(this))
            throw er("abortReason");
          return this._abortReason;
        }
        /**
         * An `AbortSignal` that can be used to abort the pending write or close operation when the stream is aborted.
         */
        get signal() {
          if (!Jt(this))
            throw er("signal");
          if (this._abortController === void 0)
            throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
          return this._abortController.signal;
        }
        /**
         * Closes the controlled writable stream, making all future interactions with it fail with the given error `e`.
         *
         * This method is rarely used, since usually it suffices to return a rejected promise from one of the underlying
         * sink's methods. However, it can be useful for suddenly shutting down a stream in response to an event outside the
         * normal lifecycle of interactions with the underlying sink.
         */
        error(t = void 0) {
          if (!Jt(this))
            throw er("error");
          this._controlledWritableStream._state === "writable" && cn(this, t);
        }
        /** @internal */
        [yr](t) {
          const r = this._abortAlgorithm(t);
          return it(this), r;
        }
        /** @internal */
        [_r]() {
          ne(this);
        }
      }
      Object.defineProperties(ve.prototype, {
        abortReason: { enumerable: !0 },
        signal: { enumerable: !0 },
        error: { enumerable: !0 }
      }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ve.prototype, Symbol.toStringTag, {
        value: "WritableStreamDefaultController",
        configurable: !0
      });
      function Jt(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledWritableStream") ? !1 : e instanceof ve;
      }
      function fn(e, t, r, n, o, a, i, u) {
        t._controlledWritableStream = e, e._writableStreamController = t, t._queue = void 0, t._queueTotalSize = void 0, ne(t), t._abortReason = void 0, t._abortController = Ao(), t._started = !1, t._strategySizeAlgorithm = u, t._strategyHWM = i, t._writeAlgorithm = n, t._closeAlgorithm = o, t._abortAlgorithm = a;
        const p = Kt(t);
        Xt(e, p);
        const b = r(), y = S(b);
        v(y, () => (t._started = !0, st(t), null), (_) => (t._started = !0, Gt(e, _), null));
      }
      function Uo(e, t, r, n) {
        const o = Object.create(ve.prototype);
        let a, i, u, p;
        t.start !== void 0 ? a = () => t.start(o) : a = () => {
        }, t.write !== void 0 ? i = (b) => t.write(b, o) : i = () => S(void 0), t.close !== void 0 ? u = () => t.close() : u = () => S(void 0), t.abort !== void 0 ? p = (b) => t.abort(b) : p = () => S(void 0), fn(e, o, a, i, u, p, r, n);
      }
      function it(e) {
        e._writeAlgorithm = void 0, e._closeAlgorithm = void 0, e._abortAlgorithm = void 0, e._strategySizeAlgorithm = void 0;
      }
      function Qo(e) {
        Lt(e, un, 0), st(e);
      }
      function Yo(e, t) {
        try {
          return e._strategySizeAlgorithm(t);
        } catch (r) {
          return Me(e, r), 1;
        }
      }
      function dn(e) {
        return e._strategyHWM - e._queueTotalSize;
      }
      function Vo(e, t, r) {
        try {
          Lt(e, t, r);
        } catch (o) {
          Me(e, o);
          return;
        }
        const n = e._controlledWritableStream;
        if (!L(n) && n._state === "writable") {
          const o = Kt(e);
          Xt(n, o);
        }
        st(e);
      }
      function st(e) {
        const t = e._controlledWritableStream;
        if (!e._started || t._inFlightWriteRequest !== void 0)
          return;
        if (t._state === "erroring") {
          Zt(t);
          return;
        }
        if (e._queue.length === 0)
          return;
        const n = ao(e);
        n === un ? Ho(e) : Go(e, n);
      }
      function Me(e, t) {
        e._controlledWritableStream._state === "writable" && cn(e, t);
      }
      function Ho(e) {
        const t = e._controlledWritableStream;
        jo(t), Mt(e);
        const r = e._closeAlgorithm();
        it(e), v(r, () => (Io(t), null), (n) => (Fo(t, n), null));
      }
      function Go(e, t) {
        const r = e._controlledWritableStream;
        Do(r);
        const n = e._writeAlgorithm(t);
        v(n, () => {
          ko(r);
          const o = r._state;
          if (Mt(e), !L(r) && o === "writable") {
            const a = Kt(e);
            Xt(r, a);
          }
          return st(e), null;
        }, (o) => (r._state === "writable" && it(e), Oo(r, o), null));
      }
      function Kt(e) {
        return dn(e) <= 0;
      }
      function cn(e, t) {
        const r = e._controlledWritableStream;
        it(e), xt(r, t);
      }
      function lt(e) {
        return new TypeError(`WritableStream.prototype.${e} can only be used on a WritableStream`);
      }
      function er(e) {
        return new TypeError(`WritableStreamDefaultController.prototype.${e} can only be used on a WritableStreamDefaultController`);
      }
      function ye(e) {
        return new TypeError(`WritableStreamDefaultWriter.prototype.${e} can only be used on a WritableStreamDefaultWriter`);
      }
      function Le(e) {
        return new TypeError("Cannot " + e + " a stream using a released writer");
      }
      function ut(e) {
        e._closedPromise = w((t, r) => {
          e._closedPromise_resolve = t, e._closedPromise_reject = r, e._closedPromiseState = "pending";
        });
      }
      function hn(e, t) {
        ut(e), tr(e, t);
      }
      function xo(e) {
        ut(e), bn(e);
      }
      function tr(e, t) {
        e._closedPromise_reject !== void 0 && (Re(e._closedPromise), e._closedPromise_reject(t), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0, e._closedPromiseState = "rejected");
      }
      function Zo(e, t) {
        hn(e, t);
      }
      function bn(e) {
        e._closedPromise_resolve !== void 0 && (e._closedPromise_resolve(void 0), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0, e._closedPromiseState = "resolved");
      }
      function ft(e) {
        e._readyPromise = w((t, r) => {
          e._readyPromise_resolve = t, e._readyPromise_reject = r;
        }), e._readyPromiseState = "pending";
      }
      function rr(e, t) {
        ft(e), pn(e, t);
      }
      function mn(e) {
        ft(e), nr(e);
      }
      function pn(e, t) {
        e._readyPromise_reject !== void 0 && (Re(e._readyPromise), e._readyPromise_reject(t), e._readyPromise_resolve = void 0, e._readyPromise_reject = void 0, e._readyPromiseState = "rejected");
      }
      function Xo(e) {
        ft(e);
      }
      function Jo(e, t) {
        rr(e, t);
      }
      function nr(e) {
        e._readyPromise_resolve !== void 0 && (e._readyPromise_resolve(void 0), e._readyPromise_resolve = void 0, e._readyPromise_reject = void 0, e._readyPromiseState = "fulfilled");
      }
      function Ko() {
        if (typeof globalThis < "u")
          return globalThis;
        if (typeof self < "u")
          return self;
        if (typeof zn < "u")
          return zn;
      }
      const or = Ko();
      function ea(e) {
        if (!(typeof e == "function" || typeof e == "object") || e.name !== "DOMException")
          return !1;
        try {
          return new e(), !0;
        } catch {
          return !1;
        }
      }
      function ta() {
        const e = or?.DOMException;
        return ea(e) ? e : void 0;
      }
      function ra() {
        const e = function(r, n) {
          this.message = r || "", this.name = n || "Error", Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
        };
        return f(e, "DOMException"), e.prototype = Object.create(Error.prototype), Object.defineProperty(e.prototype, "constructor", { value: e, writable: !0, configurable: !0 }), e;
      }
      const na = ta() || ra();
      function yn(e, t, r, n, o, a) {
        const i = we(e), u = tn(t);
        e._disturbed = !0;
        let p = !1, b = S(void 0);
        return w((y, _) => {
          let T;
          if (a !== void 0) {
            if (T = () => {
              const m = a.reason !== void 0 ? a.reason : new na("Aborted", "AbortError"), R = [];
              n || R.push(() => t._state === "writable" ? ot(t, m) : S(void 0)), o || R.push(() => e._state === "readable" ? j(e, m) : S(void 0)), W(() => Promise.all(R.map((P) => P())), !0, m);
            }, a.aborted) {
              T();
              return;
            }
            a.addEventListener("abort", T);
          }
          function D() {
            return w((m, R) => {
              function P(B) {
                B ? m() : E(We(), P, R);
              }
              P(!1);
            });
          }
          function We() {
            return p ? S(!0) : E(u._readyPromise, () => w((m, R) => {
              Ie(i, {
                _chunkSteps: (P) => {
                  b = E(ln(u, P), void 0, c), m(!1);
                },
                _closeSteps: () => m(!0),
                _errorSteps: R
              });
            }));
          }
          if (x(e, i._closedPromise, (m) => (n ? F(!0, m) : W(() => ot(t, m), !0, m), null)), x(t, u._closedPromise, (m) => (o ? F(!0, m) : W(() => j(e, m), !0, m), null)), A(e, i._closedPromise, () => (r ? F() : W(() => Lo(u)), null)), L(t) || t._state === "closed") {
            const m = new TypeError("the destination writable stream closed before all data could be piped to it");
            o ? F(!0, m) : W(() => j(e, m), !0, m);
          }
          Re(D());
          function ue() {
            const m = b;
            return E(b, () => m !== b ? ue() : void 0);
          }
          function x(m, R, P) {
            m._state === "errored" ? P(m._storedError) : Ct(R, P);
          }
          function A(m, R, P) {
            m._state === "closed" ? P() : wt(R, P);
          }
          function W(m, R, P) {
            if (p)
              return;
            p = !0, t._state === "writable" && !L(t) ? wt(ue(), B) : B();
            function B() {
              return v(m(), () => Z(R, P), (Be) => Z(!0, Be)), null;
            }
          }
          function F(m, R) {
            p || (p = !0, t._state === "writable" && !L(t) ? wt(ue(), () => Z(m, R)) : Z(m, R));
          }
          function Z(m, R) {
            return sn(u), U(i), a !== void 0 && a.removeEventListener("abort", T), m ? _(R) : y(void 0), null;
          }
        });
      }
      class G {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
          if (!dt(this))
            throw ht("desiredSize");
          return ar(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
          if (!dt(this))
            throw ht("close");
          if (!qe(this))
            throw new TypeError("The stream is not in a state that permits close");
          _e(this);
        }
        enqueue(t = void 0) {
          if (!dt(this))
            throw ht("enqueue");
          if (!qe(this))
            throw new TypeError("The stream is not in a state that permits enqueue");
          return Ee(this, t);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(t = void 0) {
          if (!dt(this))
            throw ht("error");
          z(this, t);
        }
        /** @internal */
        [Tt](t) {
          ne(this);
          const r = this._cancelAlgorithm(t);
          return ct(this), r;
        }
        /** @internal */
        [Pt](t) {
          const r = this._controlledReadableStream;
          if (this._queue.length > 0) {
            const n = Mt(this);
            this._closeRequested && this._queue.length === 0 ? (ct(this), Ue(r)) : $e(this), t._chunkSteps(n);
          } else
            Pr(r, t), $e(this);
        }
        /** @internal */
        [vt]() {
        }
      }
      Object.defineProperties(G.prototype, {
        close: { enumerable: !0 },
        enqueue: { enumerable: !0 },
        error: { enumerable: !0 },
        desiredSize: { enumerable: !0 }
      }), f(G.prototype.close, "close"), f(G.prototype.enqueue, "enqueue"), f(G.prototype.error, "error"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(G.prototype, Symbol.toStringTag, {
        value: "ReadableStreamDefaultController",
        configurable: !0
      });
      function dt(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledReadableStream") ? !1 : e instanceof G;
      }
      function $e(e) {
        if (!_n(e))
          return;
        if (e._pulling) {
          e._pullAgain = !0;
          return;
        }
        e._pulling = !0;
        const r = e._pullAlgorithm();
        v(r, () => (e._pulling = !1, e._pullAgain && (e._pullAgain = !1, $e(e)), null), (n) => (z(e, n), null));
      }
      function _n(e) {
        const t = e._controlledReadableStream;
        return !qe(e) || !e._started ? !1 : !!(se(t) && He(t) > 0 || ar(e) > 0);
      }
      function ct(e) {
        e._pullAlgorithm = void 0, e._cancelAlgorithm = void 0, e._strategySizeAlgorithm = void 0;
      }
      function _e(e) {
        if (!qe(e))
          return;
        const t = e._controlledReadableStream;
        e._closeRequested = !0, e._queue.length === 0 && (ct(e), Ue(t));
      }
      function Ee(e, t) {
        if (!qe(e))
          return;
        const r = e._controlledReadableStream;
        if (se(r) && He(r) > 0)
          It(r, t, !1);
        else {
          let n;
          try {
            n = e._strategySizeAlgorithm(t);
          } catch (o) {
            throw z(e, o), o;
          }
          try {
            Lt(e, t, n);
          } catch (o) {
            throw z(e, o), o;
          }
        }
        $e(e);
      }
      function z(e, t) {
        const r = e._controlledReadableStream;
        r._state === "readable" && (ne(e), ct(e), wn(r, t));
      }
      function ar(e) {
        const t = e._controlledReadableStream._state;
        return t === "errored" ? null : t === "closed" ? 0 : e._strategyHWM - e._queueTotalSize;
      }
      function oa(e) {
        return !_n(e);
      }
      function qe(e) {
        const t = e._controlledReadableStream._state;
        return !e._closeRequested && t === "readable";
      }
      function Sn(e, t, r, n, o, a, i) {
        t._controlledReadableStream = e, t._queue = void 0, t._queueTotalSize = void 0, ne(t), t._started = !1, t._closeRequested = !1, t._pullAgain = !1, t._pulling = !1, t._strategySizeAlgorithm = i, t._strategyHWM = a, t._pullAlgorithm = n, t._cancelAlgorithm = o, e._readableStreamController = t;
        const u = r();
        v(S(u), () => (t._started = !0, $e(t), null), (p) => (z(t, p), null));
      }
      function aa(e, t, r, n) {
        const o = Object.create(G.prototype);
        let a, i, u;
        t.start !== void 0 ? a = () => t.start(o) : a = () => {
        }, t.pull !== void 0 ? i = () => t.pull(o) : i = () => S(void 0), t.cancel !== void 0 ? u = (p) => t.cancel(p) : u = () => S(void 0), Sn(e, o, a, i, u, r, n);
      }
      function ht(e) {
        return new TypeError(`ReadableStreamDefaultController.prototype.${e} can only be used on a ReadableStreamDefaultController`);
      }
      function ia(e, t) {
        return he(e._readableStreamController) ? la(e) : sa(e);
      }
      function sa(e, t) {
        const r = we(e);
        let n = !1, o = !1, a = !1, i = !1, u, p, b, y, _;
        const T = w((A) => {
          _ = A;
        });
        function D() {
          return n ? (o = !0, S(void 0)) : (n = !0, Ie(r, {
            _chunkSteps: (W) => {
              fe(() => {
                o = !1;
                const F = W, Z = W;
                a || Ee(b._readableStreamController, F), i || Ee(y._readableStreamController, Z), n = !1, o && D();
              });
            },
            _closeSteps: () => {
              n = !1, a || _e(b._readableStreamController), i || _e(y._readableStreamController), (!a || !i) && _(void 0);
            },
            _errorSteps: () => {
              n = !1;
            }
          }), S(void 0));
        }
        function We(A) {
          if (a = !0, u = A, i) {
            const W = Fe([u, p]), F = j(e, W);
            _(F);
          }
          return T;
        }
        function ue(A) {
          if (i = !0, p = A, a) {
            const W = Fe([u, p]), F = j(e, W);
            _(F);
          }
          return T;
        }
        function x() {
        }
        return b = Ne(x, D, We), y = Ne(x, D, ue), Ct(r._closedPromise, (A) => (z(b._readableStreamController, A), z(y._readableStreamController, A), (!a || !i) && _(void 0), null)), [b, y];
      }
      function la(e) {
        let t = we(e), r = !1, n = !1, o = !1, a = !1, i = !1, u, p, b, y, _;
        const T = w((m) => {
          _ = m;
        });
        function D(m) {
          Ct(m._closedPromise, (R) => (m !== t || (I(b._readableStreamController, R), I(y._readableStreamController, R), (!a || !i) && _(void 0)), null));
        }
        function We() {
          me(t) && (U(t), t = we(e), D(t)), Ie(t, {
            _chunkSteps: (R) => {
              fe(() => {
                n = !1, o = !1;
                const P = R;
                let B = R;
                if (!a && !i)
                  try {
                    B = zr(R);
                  } catch (Be) {
                    I(b._readableStreamController, Be), I(y._readableStreamController, Be), _(j(e, Be));
                    return;
                  }
                a || Je(b._readableStreamController, P), i || Je(y._readableStreamController, B), r = !1, n ? x() : o && A();
              });
            },
            _closeSteps: () => {
              r = !1, a || ze(b._readableStreamController), i || ze(y._readableStreamController), b._readableStreamController._pendingPullIntos.length > 0 && Ke(b._readableStreamController, 0), y._readableStreamController._pendingPullIntos.length > 0 && Ke(y._readableStreamController, 0), (!a || !i) && _(void 0);
            },
            _errorSteps: () => {
              r = !1;
            }
          });
        }
        function ue(m, R) {
          te(t) && (U(t), t = xr(e), D(t));
          const P = R ? y : b, B = R ? b : y;
          Jr(t, m, 1, {
            _chunkSteps: (ke) => {
              fe(() => {
                n = !1, o = !1;
                const Oe = R ? i : a;
                if (R ? a : i)
                  Oe || et(P._readableStreamController, ke);
                else {
                  let Fn;
                  try {
                    Fn = zr(ke);
                  } catch (fr) {
                    I(P._readableStreamController, fr), I(B._readableStreamController, fr), _(j(e, fr));
                    return;
                  }
                  Oe || et(P._readableStreamController, ke), Je(B._readableStreamController, Fn);
                }
                r = !1, n ? x() : o && A();
              });
            },
            _closeSteps: (ke) => {
              r = !1;
              const Oe = R ? i : a, Rt = R ? a : i;
              Oe || ze(P._readableStreamController), Rt || ze(B._readableStreamController), ke !== void 0 && (Oe || et(P._readableStreamController, ke), !Rt && B._readableStreamController._pendingPullIntos.length > 0 && Ke(B._readableStreamController, 0)), (!Oe || !Rt) && _(void 0);
            },
            _errorSteps: () => {
              r = !1;
            }
          });
        }
        function x() {
          if (r)
            return n = !0, S(void 0);
          r = !0;
          const m = Yt(b._readableStreamController);
          return m === null ? We() : ue(m._view, !1), S(void 0);
        }
        function A() {
          if (r)
            return o = !0, S(void 0);
          r = !0;
          const m = Yt(y._readableStreamController);
          return m === null ? We() : ue(m._view, !0), S(void 0);
        }
        function W(m) {
          if (a = !0, u = m, i) {
            const R = Fe([u, p]), P = j(e, R);
            _(P);
          }
          return T;
        }
        function F(m) {
          if (i = !0, p = m, a) {
            const R = Fe([u, p]), P = j(e, R);
            _(P);
          }
          return T;
        }
        function Z() {
        }
        return b = Rn(Z, x, W), y = Rn(Z, A, F), D(t), [b, y];
      }
      function ua(e) {
        return h(e) && typeof e.getReader < "u";
      }
      function fa(e) {
        return ua(e) ? ca(e.getReader()) : da(e);
      }
      function da(e) {
        let t;
        const r = Fr(e, "async"), n = c;
        function o() {
          let i;
          try {
            i = to(r);
          } catch (p) {
            return d(p);
          }
          const u = S(i);
          return N(u, (p) => {
            if (!h(p))
              throw new TypeError("The promise returned by the iterator.next() method must fulfill with an object");
            if (ro(p))
              _e(t._readableStreamController);
            else {
              const y = no(p);
              Ee(t._readableStreamController, y);
            }
          });
        }
        function a(i) {
          const u = r.iterator;
          let p;
          try {
            p = xe(u, "return");
          } catch (_) {
            return d(_);
          }
          if (p === void 0)
            return S(void 0);
          let b;
          try {
            b = de(p, u, [i]);
          } catch (_) {
            return d(_);
          }
          const y = S(b);
          return N(y, (_) => {
            if (!h(_))
              throw new TypeError("The promise returned by the iterator.return() method must fulfill with an object");
          });
        }
        return t = Ne(n, o, a, 0), t;
      }
      function ca(e) {
        let t;
        const r = c;
        function n() {
          let a;
          try {
            a = e.read();
          } catch (i) {
            return d(i);
          }
          return N(a, (i) => {
            if (!h(i))
              throw new TypeError("The promise returned by the reader.read() method must fulfill with an object");
            if (i.done)
              _e(t._readableStreamController);
            else {
              const u = i.value;
              Ee(t._readableStreamController, u);
            }
          });
        }
        function o(a) {
          try {
            return S(e.cancel(a));
          } catch (i) {
            return d(i);
          }
        }
        return t = Ne(r, n, o, 0), t;
      }
      function ha(e, t) {
        M(e, t);
        const r = e, n = r?.autoAllocateChunkSize, o = r?.cancel, a = r?.pull, i = r?.start, u = r?.type;
        return {
          autoAllocateChunkSize: n === void 0 ? void 0 : kt(n, `${t} has member 'autoAllocateChunkSize' that`),
          cancel: o === void 0 ? void 0 : ba(o, r, `${t} has member 'cancel' that`),
          pull: a === void 0 ? void 0 : ma(a, r, `${t} has member 'pull' that`),
          start: i === void 0 ? void 0 : pa(i, r, `${t} has member 'start' that`),
          type: u === void 0 ? void 0 : ya(u, `${t} has member 'type' that`)
        };
      }
      function ba(e, t, r) {
        return O(e, r), (n) => K(e, t, [n]);
      }
      function ma(e, t, r) {
        return O(e, r), (n) => K(e, t, [n]);
      }
      function pa(e, t, r) {
        return O(e, r), (n) => de(e, t, [n]);
      }
      function ya(e, t) {
        if (e = `${e}`, e !== "bytes")
          throw new TypeError(`${t} '${e}' is not a valid enumeration value for ReadableStreamType`);
        return e;
      }
      function _a(e, t) {
        return M(e, t), { preventCancel: !!e?.preventCancel };
      }
      function gn(e, t) {
        M(e, t);
        const r = e?.preventAbort, n = e?.preventCancel, o = e?.preventClose, a = e?.signal;
        return a !== void 0 && Sa(a, `${t} has member 'signal' that`), {
          preventAbort: !!r,
          preventCancel: !!n,
          preventClose: !!o,
          signal: a
        };
      }
      function Sa(e, t) {
        if (!Eo(e))
          throw new TypeError(`${t} is not an AbortSignal.`);
      }
      function ga(e, t) {
        M(e, t);
        const r = e?.readable;
        Wt(r, "readable", "ReadableWritablePair"), Ot(r, `${t} has member 'readable' that`);
        const n = e?.writable;
        return Wt(n, "writable", "ReadableWritablePair"), en(n, `${t} has member 'writable' that`), { readable: r, writable: n };
      }
      class q {
        constructor(t = {}, r = {}) {
          t === void 0 ? t = null : Cr(t, "First parameter");
          const n = nt(r, "Second parameter"), o = ha(t, "First parameter");
          if (ir(this), o.type === "bytes") {
            if (n.size !== void 0)
              throw new RangeError("The strategy for a byte stream cannot have a size function");
            const a = De(n, 0);
            bo(this, o, a);
          } else {
            const a = rt(n), i = De(n, 1);
            aa(this, o, i, a);
          }
        }
        /**
         * Whether or not the readable stream is locked to a {@link ReadableStreamDefaultReader | reader}.
         */
        get locked() {
          if (!ie(this))
            throw Se("locked");
          return se(this);
        }
        /**
         * Cancels the stream, signaling a loss of interest in the stream by a consumer.
         *
         * The supplied `reason` argument will be given to the underlying source's {@link UnderlyingSource.cancel | cancel()}
         * method, which might or might not use it.
         */
        cancel(t = void 0) {
          return ie(this) ? se(this) ? d(new TypeError("Cannot cancel a stream that already has a reader")) : j(this, t) : d(Se("cancel"));
        }
        getReader(t = void 0) {
          if (!ie(this))
            throw Se("getReader");
          return po(t, "First parameter").mode === void 0 ? we(this) : xr(this);
        }
        pipeThrough(t, r = {}) {
          if (!ie(this))
            throw Se("pipeThrough");
          Q(t, 1, "pipeThrough");
          const n = ga(t, "First parameter"), o = gn(r, "Second parameter");
          if (se(this))
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
          if (Pe(n.writable))
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
          const a = yn(this, n.writable, o.preventClose, o.preventAbort, o.preventCancel, o.signal);
          return Re(a), n.readable;
        }
        pipeTo(t, r = {}) {
          if (!ie(this))
            return d(Se("pipeTo"));
          if (t === void 0)
            return d("Parameter 1 is required in 'pipeTo'.");
          if (!Te(t))
            return d(new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"));
          let n;
          try {
            n = gn(r, "Second parameter");
          } catch (o) {
            return d(o);
          }
          return se(this) ? d(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream")) : Pe(t) ? d(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream")) : yn(this, t, n.preventClose, n.preventAbort, n.preventCancel, n.signal);
        }
        /**
         * Tees this readable stream, returning a two-element array containing the two resulting branches as
         * new {@link ReadableStream} instances.
         *
         * Teeing a stream will lock it, preventing any other consumer from acquiring a reader.
         * To cancel the stream, cancel both of the resulting branches; a composite cancellation reason will then be
         * propagated to the stream's underlying source.
         *
         * Note that the chunks seen in each branch will be the same object. If the chunks are not immutable,
         * this could allow interference between the two branches.
         */
        tee() {
          if (!ie(this))
            throw Se("tee");
          const t = ia(this);
          return Fe(t);
        }
        values(t = void 0) {
          if (!ie(this))
            throw Se("values");
          const r = _a(t, "First parameter");
          return Kn(this, r.preventCancel);
        }
        [Dt](t) {
          return this.values(t);
        }
        /**
         * Creates a new ReadableStream wrapping the provided iterable or async iterable.
         *
         * This can be used to adapt various kinds of objects into a readable stream,
         * such as an array, an async generator, or a Node.js readable stream.
         */
        static from(t) {
          return fa(t);
        }
      }
      Object.defineProperties(q, {
        from: { enumerable: !0 }
      }), Object.defineProperties(q.prototype, {
        cancel: { enumerable: !0 },
        getReader: { enumerable: !0 },
        pipeThrough: { enumerable: !0 },
        pipeTo: { enumerable: !0 },
        tee: { enumerable: !0 },
        values: { enumerable: !0 },
        locked: { enumerable: !0 }
      }), f(q.from, "from"), f(q.prototype.cancel, "cancel"), f(q.prototype.getReader, "getReader"), f(q.prototype.pipeThrough, "pipeThrough"), f(q.prototype.pipeTo, "pipeTo"), f(q.prototype.tee, "tee"), f(q.prototype.values, "values"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(q.prototype, Symbol.toStringTag, {
        value: "ReadableStream",
        configurable: !0
      }), Object.defineProperty(q.prototype, Dt, {
        value: q.prototype.values,
        writable: !0,
        configurable: !0
      });
      function Ne(e, t, r, n = 1, o = () => 1) {
        const a = Object.create(q.prototype);
        ir(a);
        const i = Object.create(G.prototype);
        return Sn(a, i, e, t, r, n, o), a;
      }
      function Rn(e, t, r) {
        const n = Object.create(q.prototype);
        ir(n);
        const o = Object.create(V.prototype);
        return Gr(n, o, e, t, r, 0, void 0), n;
      }
      function ir(e) {
        e._state = "readable", e._reader = void 0, e._storedError = void 0, e._disturbed = !1;
      }
      function ie(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_readableStreamController") ? !1 : e instanceof q;
      }
      function se(e) {
        return e._reader !== void 0;
      }
      function j(e, t) {
        if (e._disturbed = !0, e._state === "closed")
          return S(void 0);
        if (e._state === "errored")
          return d(e._storedError);
        Ue(e);
        const r = e._reader;
        if (r !== void 0 && me(r)) {
          const o = r._readIntoRequests;
          r._readIntoRequests = new k(), o.forEach((a) => {
            a._closeSteps(void 0);
          });
        }
        const n = e._readableStreamController[Tt](t);
        return N(n, c);
      }
      function Ue(e) {
        e._state = "closed";
        const t = e._reader;
        if (t !== void 0 && (Rr(t), te(t))) {
          const r = t._readRequests;
          t._readRequests = new k(), r.forEach((n) => {
            n._closeSteps();
          });
        }
      }
      function wn(e, t) {
        e._state = "errored", e._storedError = t;
        const r = e._reader;
        r !== void 0 && (At(r, t), te(r) ? Er(r, t) : Kr(r, t));
      }
      function Se(e) {
        return new TypeError(`ReadableStream.prototype.${e} can only be used on a ReadableStream`);
      }
      function Cn(e, t) {
        M(e, t);
        const r = e?.highWaterMark;
        return Wt(r, "highWaterMark", "QueuingStrategyInit"), {
          highWaterMark: Bt(r)
        };
      }
      const Tn = (e) => e.byteLength;
      f(Tn, "size");
      class bt {
        constructor(t) {
          Q(t, 1, "ByteLengthQueuingStrategy"), t = Cn(t, "First parameter"), this._byteLengthQueuingStrategyHighWaterMark = t.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
          if (!vn(this))
            throw Pn("highWaterMark");
          return this._byteLengthQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by returning the value of its `byteLength` property.
         */
        get size() {
          if (!vn(this))
            throw Pn("size");
          return Tn;
        }
      }
      Object.defineProperties(bt.prototype, {
        highWaterMark: { enumerable: !0 },
        size: { enumerable: !0 }
      }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(bt.prototype, Symbol.toStringTag, {
        value: "ByteLengthQueuingStrategy",
        configurable: !0
      });
      function Pn(e) {
        return new TypeError(`ByteLengthQueuingStrategy.prototype.${e} can only be used on a ByteLengthQueuingStrategy`);
      }
      function vn(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_byteLengthQueuingStrategyHighWaterMark") ? !1 : e instanceof bt;
      }
      const En = () => 1;
      f(En, "size");
      class mt {
        constructor(t) {
          Q(t, 1, "CountQueuingStrategy"), t = Cn(t, "First parameter"), this._countQueuingStrategyHighWaterMark = t.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
          if (!An(this))
            throw qn("highWaterMark");
          return this._countQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by always returning 1.
         * This ensures that the total queue size is a count of the number of chunks in the queue.
         */
        get size() {
          if (!An(this))
            throw qn("size");
          return En;
        }
      }
      Object.defineProperties(mt.prototype, {
        highWaterMark: { enumerable: !0 },
        size: { enumerable: !0 }
      }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(mt.prototype, Symbol.toStringTag, {
        value: "CountQueuingStrategy",
        configurable: !0
      });
      function qn(e) {
        return new TypeError(`CountQueuingStrategy.prototype.${e} can only be used on a CountQueuingStrategy`);
      }
      function An(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_countQueuingStrategyHighWaterMark") ? !1 : e instanceof mt;
      }
      function Ra(e, t) {
        M(e, t);
        const r = e?.cancel, n = e?.flush, o = e?.readableType, a = e?.start, i = e?.transform, u = e?.writableType;
        return {
          cancel: r === void 0 ? void 0 : Pa(r, e, `${t} has member 'cancel' that`),
          flush: n === void 0 ? void 0 : wa(n, e, `${t} has member 'flush' that`),
          readableType: o,
          start: a === void 0 ? void 0 : Ca(a, e, `${t} has member 'start' that`),
          transform: i === void 0 ? void 0 : Ta(i, e, `${t} has member 'transform' that`),
          writableType: u
        };
      }
      function wa(e, t, r) {
        return O(e, r), (n) => K(e, t, [n]);
      }
      function Ca(e, t, r) {
        return O(e, r), (n) => de(e, t, [n]);
      }
      function Ta(e, t, r) {
        return O(e, r), (n, o) => K(e, t, [n, o]);
      }
      function Pa(e, t, r) {
        return O(e, r), (n) => K(e, t, [n]);
      }
      class pt {
        constructor(t = {}, r = {}, n = {}) {
          t === void 0 && (t = null);
          const o = nt(r, "Second parameter"), a = nt(n, "Third parameter"), i = Ra(t, "First parameter");
          if (i.readableType !== void 0)
            throw new RangeError("Invalid readableType specified");
          if (i.writableType !== void 0)
            throw new RangeError("Invalid writableType specified");
          const u = De(a, 0), p = rt(a), b = De(o, 1), y = rt(o);
          let _;
          const T = w((D) => {
            _ = D;
          });
          va(this, T, b, y, u, p), qa(this, i), i.start !== void 0 ? _(i.start(this._transformStreamController)) : _(void 0);
        }
        /**
         * The readable side of the transform stream.
         */
        get readable() {
          if (!Wn(this))
            throw In("readable");
          return this._readable;
        }
        /**
         * The writable side of the transform stream.
         */
        get writable() {
          if (!Wn(this))
            throw In("writable");
          return this._writable;
        }
      }
      Object.defineProperties(pt.prototype, {
        readable: { enumerable: !0 },
        writable: { enumerable: !0 }
      }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(pt.prototype, Symbol.toStringTag, {
        value: "TransformStream",
        configurable: !0
      });
      function va(e, t, r, n, o, a) {
        function i() {
          return t;
        }
        function u(T) {
          return Ba(e, T);
        }
        function p(T) {
          return ka(e, T);
        }
        function b() {
          return Oa(e);
        }
        e._writable = Wo(i, u, b, p, r, n);
        function y() {
          return Ia(e);
        }
        function _(T) {
          return Fa(e, T);
        }
        e._readable = Ne(i, y, _, o, a), e._backpressure = void 0, e._backpressureChangePromise = void 0, e._backpressureChangePromise_resolve = void 0, yt(e, !0), e._transformStreamController = void 0;
      }
      function Wn(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_transformStreamController") ? !1 : e instanceof pt;
      }
      function Bn(e, t) {
        z(e._readable._readableStreamController, t), sr(e, t);
      }
      function sr(e, t) {
        St(e._transformStreamController), Me(e._writable._writableStreamController, t), lr(e);
      }
      function lr(e) {
        e._backpressure && yt(e, !1);
      }
      function yt(e, t) {
        e._backpressureChangePromise !== void 0 && e._backpressureChangePromise_resolve(), e._backpressureChangePromise = w((r) => {
          e._backpressureChangePromise_resolve = r;
        }), e._backpressure = t;
      }
      class le {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the desired size to fill the readable side’s internal queue. It can be negative, if the queue is over-full.
         */
        get desiredSize() {
          if (!_t(this))
            throw gt("desiredSize");
          const t = this._controlledTransformStream._readable._readableStreamController;
          return ar(t);
        }
        enqueue(t = void 0) {
          if (!_t(this))
            throw gt("enqueue");
          kn(this, t);
        }
        /**
         * Errors both the readable side and the writable side of the controlled transform stream, making all future
         * interactions with it fail with the given error `e`. Any chunks queued for transformation will be discarded.
         */
        error(t = void 0) {
          if (!_t(this))
            throw gt("error");
          Aa(this, t);
        }
        /**
         * Closes the readable side and errors the writable side of the controlled transform stream. This is useful when the
         * transformer only needs to consume a portion of the chunks written to the writable side.
         */
        terminate() {
          if (!_t(this))
            throw gt("terminate");
          Wa(this);
        }
      }
      Object.defineProperties(le.prototype, {
        enqueue: { enumerable: !0 },
        error: { enumerable: !0 },
        terminate: { enumerable: !0 },
        desiredSize: { enumerable: !0 }
      }), f(le.prototype.enqueue, "enqueue"), f(le.prototype.error, "error"), f(le.prototype.terminate, "terminate"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(le.prototype, Symbol.toStringTag, {
        value: "TransformStreamDefaultController",
        configurable: !0
      });
      function _t(e) {
        return !h(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledTransformStream") ? !1 : e instanceof le;
      }
      function Ea(e, t, r, n, o) {
        t._controlledTransformStream = e, e._transformStreamController = t, t._transformAlgorithm = r, t._flushAlgorithm = n, t._cancelAlgorithm = o, t._finishPromise = void 0, t._finishPromise_resolve = void 0, t._finishPromise_reject = void 0;
      }
      function qa(e, t) {
        const r = Object.create(le.prototype);
        let n, o, a;
        t.transform !== void 0 ? n = (i) => t.transform(i, r) : n = (i) => {
          try {
            return kn(r, i), S(void 0);
          } catch (u) {
            return d(u);
          }
        }, t.flush !== void 0 ? o = () => t.flush(r) : o = () => S(void 0), t.cancel !== void 0 ? a = (i) => t.cancel(i) : a = () => S(void 0), Ea(e, r, n, o, a);
      }
      function St(e) {
        e._transformAlgorithm = void 0, e._flushAlgorithm = void 0, e._cancelAlgorithm = void 0;
      }
      function kn(e, t) {
        const r = e._controlledTransformStream, n = r._readable._readableStreamController;
        if (!qe(n))
          throw new TypeError("Readable side is not in a state that permits enqueue");
        try {
          Ee(n, t);
        } catch (a) {
          throw sr(r, a), r._readable._storedError;
        }
        oa(n) !== r._backpressure && yt(r, !0);
      }
      function Aa(e, t) {
        Bn(e._controlledTransformStream, t);
      }
      function On(e, t) {
        const r = e._transformAlgorithm(t);
        return N(r, void 0, (n) => {
          throw Bn(e._controlledTransformStream, n), n;
        });
      }
      function Wa(e) {
        const t = e._controlledTransformStream, r = t._readable._readableStreamController;
        _e(r);
        const n = new TypeError("TransformStream terminated");
        sr(t, n);
      }
      function Ba(e, t) {
        const r = e._transformStreamController;
        if (e._backpressure) {
          const n = e._backpressureChangePromise;
          return N(n, () => {
            const o = e._writable;
            if (o._state === "erroring")
              throw o._storedError;
            return On(r, t);
          });
        }
        return On(r, t);
      }
      function ka(e, t) {
        const r = e._transformStreamController;
        if (r._finishPromise !== void 0)
          return r._finishPromise;
        const n = e._readable;
        r._finishPromise = w((a, i) => {
          r._finishPromise_resolve = a, r._finishPromise_reject = i;
        });
        const o = r._cancelAlgorithm(t);
        return St(r), v(o, () => (n._state === "errored" ? Ae(r, n._storedError) : (z(n._readableStreamController, t), ur(r)), null), (a) => (z(n._readableStreamController, a), Ae(r, a), null)), r._finishPromise;
      }
      function Oa(e) {
        const t = e._transformStreamController;
        if (t._finishPromise !== void 0)
          return t._finishPromise;
        const r = e._readable;
        t._finishPromise = w((o, a) => {
          t._finishPromise_resolve = o, t._finishPromise_reject = a;
        });
        const n = t._flushAlgorithm();
        return St(t), v(n, () => (r._state === "errored" ? Ae(t, r._storedError) : (_e(r._readableStreamController), ur(t)), null), (o) => (z(r._readableStreamController, o), Ae(t, o), null)), t._finishPromise;
      }
      function Ia(e) {
        return yt(e, !1), e._backpressureChangePromise;
      }
      function Fa(e, t) {
        const r = e._transformStreamController;
        if (r._finishPromise !== void 0)
          return r._finishPromise;
        const n = e._writable;
        r._finishPromise = w((a, i) => {
          r._finishPromise_resolve = a, r._finishPromise_reject = i;
        });
        const o = r._cancelAlgorithm(t);
        return St(r), v(o, () => (n._state === "errored" ? Ae(r, n._storedError) : (Me(n._writableStreamController, t), lr(e), ur(r)), null), (a) => (Me(n._writableStreamController, a), lr(e), Ae(r, a), null)), r._finishPromise;
      }
      function gt(e) {
        return new TypeError(`TransformStreamDefaultController.prototype.${e} can only be used on a TransformStreamDefaultController`);
      }
      function ur(e) {
        e._finishPromise_resolve !== void 0 && (e._finishPromise_resolve(), e._finishPromise_resolve = void 0, e._finishPromise_reject = void 0);
      }
      function Ae(e, t) {
        e._finishPromise_reject !== void 0 && (Re(e._finishPromise), e._finishPromise_reject(t), e._finishPromise_resolve = void 0, e._finishPromise_reject = void 0);
      }
      function In(e) {
        return new TypeError(`TransformStream.prototype.${e} can only be used on a TransformStream`);
      }
      l.ByteLengthQueuingStrategy = bt, l.CountQueuingStrategy = mt, l.ReadableByteStreamController = V, l.ReadableStream = q, l.ReadableStreamBYOBReader = oe, l.ReadableStreamBYOBRequest = ce, l.ReadableStreamDefaultController = G, l.ReadableStreamDefaultReader = ee, l.TransformStream = pt, l.TransformStreamDefaultController = le, l.WritableStream = ae, l.WritableStreamDefaultController = ve, l.WritableStreamDefaultWriter = H;
    }));
  })(Qe, Qe.exports)), Qe.exports;
}
var Mn;
function Ma() {
  if (Mn) return jn;
  Mn = 1;
  const C = 65536;
  if (!globalThis.ReadableStream)
    try {
      const s = require("node:process"), { emitWarning: l } = s;
      try {
        s.emitWarning = () => {
        }, Object.assign(globalThis, require("node:stream/web")), s.emitWarning = l;
      } catch (c) {
        throw s.emitWarning = l, c;
      }
    } catch {
      Object.assign(globalThis, Da());
    }
  try {
    const { Blob: s } = require("buffer");
    s && !s.prototype.stream && (s.prototype.stream = function(c) {
      let h = 0;
      const g = this;
      return new ReadableStream({
        type: "bytes",
        async pull(f) {
          const J = await g.slice(h, Math.min(g.size, h + C)).arrayBuffer();
          h += J.byteLength, f.enqueue(new Uint8Array(J)), h === g.size && f.close();
        }
      });
    });
  } catch {
  }
  return jn;
}
Ma();
const Ln = 65536;
async function* dr(C, s = !0) {
  for (const l of C)
    if ("stream" in l)
      yield* (
        /** @type {AsyncIterableIterator<Uint8Array>} */
        l.stream()
      );
    else if (ArrayBuffer.isView(l))
      if (s) {
        let c = l.byteOffset;
        const h = l.byteOffset + l.byteLength;
        for (; c !== h; ) {
          const g = Math.min(h - c, Ln), f = l.buffer.slice(c, c + g);
          c += f.byteLength, yield new Uint8Array(f);
        }
      } else
        yield l;
    else {
      let c = 0, h = (
        /** @type {Blob} */
        l
      );
      for (; c !== h.size; ) {
        const f = await h.slice(c, Math.min(h.size, c + Ln)).arrayBuffer();
        c += f.byteLength, yield new Uint8Array(f);
      }
    }
}
const Qn = class br {
  /** @type {Array.<(Blob|Uint8Array)>} */
  #e = [];
  #t = "";
  #r = 0;
  #n = "transparent";
  /**
   * The Blob() constructor returns a new Blob object. The content
   * of the blob consists of the concatenation of the values given
   * in the parameter array.
   *
   * @param {*} blobParts
   * @param {{ type?: string, endings?: string }} [options]
   */
  constructor(s = [], l = {}) {
    if (typeof s != "object" || s === null)
      throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
    if (typeof s[Symbol.iterator] != "function")
      throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
    if (typeof l != "object" && typeof l != "function")
      throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
    l === null && (l = {});
    const c = new TextEncoder();
    for (const g of s) {
      let f;
      ArrayBuffer.isView(g) ? f = new Uint8Array(g.buffer.slice(g.byteOffset, g.byteOffset + g.byteLength)) : g instanceof ArrayBuffer ? f = new Uint8Array(g.slice(0)) : g instanceof br ? f = g : f = c.encode(`${g}`), this.#r += ArrayBuffer.isView(f) ? f.byteLength : f.size, this.#e.push(f);
    }
    this.#n = `${l.endings === void 0 ? "transparent" : l.endings}`;
    const h = l.type === void 0 ? "" : String(l.type);
    this.#t = /^[\x20-\x7E]*$/.test(h) ? h : "";
  }
  /**
   * The Blob interface's size property returns the
   * size of the Blob in bytes.
   */
  get size() {
    return this.#r;
  }
  /**
   * The type property of a Blob object returns the MIME type of the file.
   */
  get type() {
    return this.#t;
  }
  /**
   * The text() method in the Blob interface returns a Promise
   * that resolves with a string containing the contents of
   * the blob, interpreted as UTF-8.
   *
   * @return {Promise<string>}
   */
  async text() {
    const s = new TextDecoder();
    let l = "";
    for await (const c of dr(this.#e, !1))
      l += s.decode(c, { stream: !0 });
    return l += s.decode(), l;
  }
  /**
   * The arrayBuffer() method in the Blob interface returns a
   * Promise that resolves with the contents of the blob as
   * binary data contained in an ArrayBuffer.
   *
   * @return {Promise<ArrayBuffer>}
   */
  async arrayBuffer() {
    const s = new Uint8Array(this.size);
    let l = 0;
    for await (const c of dr(this.#e, !1))
      s.set(c, l), l += c.length;
    return s.buffer;
  }
  stream() {
    const s = dr(this.#e, !0);
    return new globalThis.ReadableStream({
      // @ts-ignore
      type: "bytes",
      async pull(l) {
        const c = await s.next();
        c.done ? l.close() : l.enqueue(c.value);
      },
      async cancel() {
        await s.return();
      }
    });
  }
  /**
   * The Blob interface's slice() method creates and returns a
   * new Blob object which contains data from a subset of the
   * blob on which it's called.
   *
   * @param {number} [start]
   * @param {number} [end]
   * @param {string} [type]
   */
  slice(s = 0, l = this.size, c = "") {
    const { size: h } = this;
    let g = s < 0 ? Math.max(h + s, 0) : Math.min(s, h), f = l < 0 ? Math.max(h + l, 0) : Math.min(l, h);
    const X = Math.max(f - g, 0), J = this.#e, $ = [];
    let w = 0;
    for (const d of J) {
      if (w >= X)
        break;
      const E = ArrayBuffer.isView(d) ? d.byteLength : d.size;
      if (g && E <= g)
        g -= E, f -= E;
      else {
        let v;
        ArrayBuffer.isView(d) ? (v = d.subarray(g, Math.min(E, f)), w += v.byteLength) : (v = d.slice(g, Math.min(E, f)), w += v.size), f -= E, $.push(v), g = 0;
      }
    }
    const S = new br([], { type: String(c).toLowerCase() });
    return S.#r = X, S.#e = $, S;
  }
  get [Symbol.toStringTag]() {
    return "Blob";
  }
  static [Symbol.hasInstance](s) {
    return s && typeof s == "object" && typeof s.constructor == "function" && (typeof s.stream == "function" || typeof s.arrayBuffer == "function") && /^(Blob|File)$/.test(s[Symbol.toStringTag]);
  }
};
Object.defineProperties(Qn.prototype, {
  size: { enumerable: !0 },
  type: { enumerable: !0 },
  slice: { enumerable: !0 }
});
const mr = Qn, La = class extends mr {
  #e = 0;
  #t = "";
  /**
   * @param {*[]} fileBits
   * @param {string} fileName
   * @param {{lastModified?: number, type?: string}} options
   */
  // @ts-ignore
  constructor(s, l, c = {}) {
    if (arguments.length < 2)
      throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`);
    super(s, c), c === null && (c = {});
    const h = c.lastModified === void 0 ? Date.now() : Number(c.lastModified);
    Number.isNaN(h) || (this.#e = h), this.#t = String(l);
  }
  get name() {
    return this.#t;
  }
  get lastModified() {
    return this.#e;
  }
  get [Symbol.toStringTag]() {
    return "File";
  }
  static [Symbol.hasInstance](s) {
    return !!s && s instanceof mr && /^(File)$/.test(s[Symbol.toStringTag]);
  }
}, $a = La;
var { toStringTag: Ye, iterator: Na, hasInstance: Ua } = Symbol, $n = Math.random, Qa = "append,set,get,getAll,delete,keys,values,entries,forEach,constructor".split(","), Nn = (C, s, l) => (C += "", /^(Blob|File)$/.test(s && s[Ye]) ? [(l = l !== void 0 ? l + "" : s[Ye] == "File" ? s.name : "blob", C), s.name !== l || s[Ye] == "blob" ? new $a([s], l, s) : s] : [C, s + ""]), cr = (C, s) => (s ? C : C.replace(/\r?\n|\r/g, `\r
`)).replace(/\n/g, "%0A").replace(/\r/g, "%0D").replace(/"/g, "%22"), ge = (C, s, l) => {
  if (s.length < l)
    throw new TypeError(`Failed to execute '${C}' on 'FormData': ${l} arguments required, but only ${s.length} present.`);
};
const Xa = class {
  #e = [];
  constructor(...s) {
    if (s.length) throw new TypeError("Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.");
  }
  get [Ye]() {
    return "FormData";
  }
  [Na]() {
    return this.entries();
  }
  static [Ua](s) {
    return s && typeof s == "object" && s[Ye] === "FormData" && !Qa.some((l) => typeof s[l] != "function");
  }
  append(...s) {
    ge("append", arguments, 2), this.#e.push(Nn(...s));
  }
  delete(s) {
    ge("delete", arguments, 1), s += "", this.#e = this.#e.filter(([l]) => l !== s);
  }
  get(s) {
    ge("get", arguments, 1), s += "";
    for (var l = this.#e, c = l.length, h = 0; h < c; h++) if (l[h][0] === s) return l[h][1];
    return null;
  }
  getAll(s, l) {
    return ge("getAll", arguments, 1), l = [], s += "", this.#e.forEach((c) => c[0] === s && l.push(c[1])), l;
  }
  has(s) {
    return ge("has", arguments, 1), s += "", this.#e.some((l) => l[0] === s);
  }
  forEach(s, l) {
    ge("forEach", arguments, 1);
    for (var [c, h] of this) s.call(l, h, c, this);
  }
  set(...s) {
    ge("set", arguments, 2);
    var l = [], c = !0;
    s = Nn(...s), this.#e.forEach((h) => {
      h[0] === s[0] ? c && (c = !l.push(s)) : l.push(h);
    }), c && l.push(s), this.#e = l;
  }
  *entries() {
    yield* this.#e;
  }
  *keys() {
    for (var [s] of this) yield s;
  }
  *values() {
    for (var [, s] of this) yield s;
  }
};
function Ka(C, s = mr) {
  var l = `${$n()}${$n()}`.replace(/\./g, "").slice(-28).padStart(32, "-"), c = [], h = `--${l}\r
Content-Disposition: form-data; name="`;
  return C.forEach((g, f) => typeof g == "string" ? c.push(h + cr(f) + `"\r
\r
${g.replace(new RegExp("\\r(?!\\n)|(?<!\\r)\\n", "g"), `\r
`)}\r
`) : c.push(h + cr(f) + `"; filename="${cr(g.name, 1)}"\r
Content-Type: ${g.type || "application/octet-stream"}\r
\r
`, g, `\r
`)), c.push(`--${l}--`), new s(c, { type: "multipart/form-data; boundary=" + l });
}
var hr, Un;
function Ya() {
  if (Un) return hr;
  if (Un = 1, !globalThis.DOMException)
    try {
      const { MessageChannel: C } = require("worker_threads"), s = new C().port1, l = new ArrayBuffer();
      s.postMessage(l, [l, l]);
    } catch (C) {
      C.constructor.name === "DOMException" && (globalThis.DOMException = C.constructor);
    }
  return hr = globalThis.DOMException, hr;
}
Ya();
const { stat: ei } = za;
export {
  mr as B,
  Xa as F,
  $a as a,
  xa as d,
  Ka as f
};
