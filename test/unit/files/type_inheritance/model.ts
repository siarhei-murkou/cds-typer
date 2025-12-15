// Ensure that generated declarations correctly model multiple includes for CDS types
// Both runtime classes and type interfaces should be available under the same name.

import type { A, B, C, ABC, BC } from '#cds-models/model'

// Using the types: ABC should have a, b, c; BC should have b, c
function useABC(x: ABC) {
  const aa: string = x.a
  const bb: string = x.b
  const cc: string = x.c
  return aa + bb + cc
}

function useBC(x: BC) {
  const bb: string = x.b
  const cc: string = x.c
  return bb + cc
}

// Narrowing checks: A should be compatible with the A part of ABC, but not with BC
const takeA = (a: A) => a.a
const takeB = (b: B) => b.b
const takeC = (c: C) => c.c

declare const abc: ABC
declare const bc: BC

// These calls should type-check
takeA(abc)
takeB(abc)
takeC(abc)
takeB(bc)
takeC(bc)

// ensure file emits some JS for runtime test runner (even though content isn't used at runtime)
export default function run() {
  return useABC(abc as any) + useBC(bc as any)
}
