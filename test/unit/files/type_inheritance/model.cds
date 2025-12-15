namespace test.types;

type A {
  a: String not null;
}

type B {
  b: String not null;
}

type C {
  c: String not null;
}

type ABC : A, B, C {}
type BC  : B, C {}
