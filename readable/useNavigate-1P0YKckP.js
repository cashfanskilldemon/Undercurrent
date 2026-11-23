import { V as e, ht as t, pt as n } from "./bits-CX_ZQ6ey.js";
var r = t(n(), 1);
function i(t) {
  let n = e();
  return r.useCallback(
    (e) => n.navigate({ ...e, from: e.from ?? t?.from }),
    [t?.from, n],
  );
}
export { i as t };
