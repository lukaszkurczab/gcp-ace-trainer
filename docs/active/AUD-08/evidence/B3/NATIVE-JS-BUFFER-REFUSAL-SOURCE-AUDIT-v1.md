# AUD-08-B3 native JS buffer refusal source audit v1

**Verdict: cause undetermined.** This is a source-only analysis; it does not identify the failing runtime guard.

## Evidence

The public sanitized `NATIVE-JS-BUFFER-ACTUAL-v1.json` records one attempt. It reports a stopped process at the approved main/source frame, `REFUSED`, empty source/Metro hashes and byte counts, process killed, and no post-process. Its limitations explicitly say the refusal category does not identify which guard/getter failed. Therefore the evidence proves neither that buffer capture succeeded nor that a getter, memory read, URL check, or fetch was reached. Do not infer a specific cause from this attempt.

Pinned React Native source shows `loadScript` moves `script` into a `std::shared_ptr<const jsi::Buffer>` named `buffer`, then captures both `buffer` and `sourceURL` by value into a scheduled lambda. At the `evaluateJavaScript(buffer, sourceURL)` call site these are closure captures. The helper calls `frame.FindVariable("buffer")` and `frame.FindVariable("sourceURL")`. Public LLDB documentation describes `FindVariable` as returning an `SBValue` for a frame variable, but does not promise that C++ lambda capture fields are exposed as local variables by these names. This is a plausible refusal stage, not a confirmed failure.

The public LLDB API documents `SBValue.GetDynamicValue`, `SBFrame.FindVariable`, and `SBProcess.ReadMemory`; that establishes API surface, not that this Xcode LLDB build will expose the particular optimized lambda captures or dynamic pointer. Online documentation may differ from the bundled Xcode LLDB. No LLDB process or actual frame values were inspected for this audit.

## Generic refusal map

The helper maps many distinct failures to the same fixed `REFUSED` status. The stage map below follows the current source; it does not say which branch the actual attempt took.

| Stage | Refusal sources |
| --- | --- |
| `STOP_OR_MODULE` | Process not stopped; module invalid; module UUID mismatch. A pending/malformed UUID has the separate `EXPECTED_MODULE_PENDING` status. |
| `FRAME_MAPPING` | Function name, source filename, or source line does not match the expected call site. |
| `CAPTURE_BUFFER` / `CAPTURE_SOURCE_URL` | `FindVariable` returns invalid for either closure capture. |
| `CAPTURE_TYPES` | Buffer or URL type name fails the expected shared-pointer/string checks. |
| `BUFFER_POINTER` | `buffer.get()` expression fails, pointer type is unexpected, dynamic pointer is invalid, or dynamic type is not `NSDataBigString *`. |
| `URL_VIEW` | URL size/address expression fails, size is zero/too large, address is zero, or URL memory read fails/short-reads. |
| `URL_POLICY` | URL parser reports invalid/disallowed input; `URL_INVALID` and `URL_DISALLOWED` are already distinct statuses. |
| `BUFFER_VIEW` | Buffer size/address expression fails, size is zero/too large, address is zero, or buffer memory read fails/short-reads. |
| `METRO_FETCH` | Direct connection error, response status other than 200 (including redirects), empty body, or oversized body. |
| `POSTCHECK` | Final source pins or stopped-module identity no longer match. Source changes already use `SOURCE_CHANGED`. |
| `UNEXPECTED` | The top-level catch converts any uncaught exception to `REFUSED`. |

## Smallest diagnostic proposal

If the existing private debugger output cannot identify the failing guard, add a fixed `refusal_stage` enum to the safe result for `REFUSED` only. Keep `status` as `REFUSED`; emit one stage from the table, never LLDB error text, expression output, type strings, addresses, local values, URL, source bytes, or hashes on refusal. Keep existing `SOURCE_CHANGED`, `RUNTIME_GATE_PENDING`, `EXPECTED_MODULE_PENDING`, `URL_INVALID`, and `URL_DISALLOWED` statuses unchanged. Do not weaken the stopped/module, exact-frame, pointer/dynamic-type, byte-size, URL, or source-pin checks.

Extend fake-only tests so each mapped guard yields exactly its fixed enum and stops before later reads/fetches. In particular model invalid `FindVariable` results for each captured name, invalid `buffer.get()` evaluation, base-pointer dynamic-type failure, short `ReadMemory`, rejected URL, and Metro non-200/oversize response. Include an unknown exception test that maps to `UNEXPECTED` without exposing its text. These tests verify diagnostic plumbing only; they cannot prove that the installed LLDB exposes closure captures.

No helper implementation change or new native attempt is proposed here. The existing runtime gate and module UUID remain pending. If further inspection is needed, the owning root can privately inspect already-collected debugger output; do not infer or publish raw frame/debug data.

## References

- [React Native `ReactInstance.cpp` pinned source](/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/node_modules/react-native/ReactCommon/react/runtime/ReactInstance.cpp)
- [LLDB `SBFrame` Python API](https://lldb.llvm.org/python_api/lldb.SBFrame.html)
- [LLDB `SBValue` Python API](https://lldb.llvm.org/python_api/lldb.SBValue.html)
- [LLDB `SBProcess` Python API](https://lldb.llvm.org/python_api/lldb.SBProcess.html)
