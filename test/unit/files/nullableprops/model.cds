namespace nullable_props_test;

// Define a CDS type with nested struct and arrays

type T {
  // scalar props
  a: Integer;               // nullable -> optional in TS (types only)
  b: Integer not null;      // required
  c: Integer @mandatory;    // required

  // nested struct
  s: {
    x: String;              // nullable -> optional
    y: String not null;     // required
    z: String @mandatory;   // required
    arr: array of String;   // nullable array -> optional
    arrM: array of String @mandatory; // required (property is mandatory)
  };

  // top-level arrays
  d: array of Integer;             // nullable array -> optional
  e: array of Integer @mandatory;  // required (property mandatory)
}

// Define an entity with a similar shape to validate entity behavior stays with required ':'
entity E {
  a: Integer;               // nullable but required in entities
  b: Integer not null;      // required
  c: Integer @mandatory;    // required
  s: {
    x: String;              // nullable but required in entities
    y: String not null;     // required
    z: String @mandatory;   // required
    arr: array of String;   // array -> required in entities
    arrM: array of String @mandatory; // required
  };
  d: array of Integer;             // required in entities
  e: array of Integer @mandatory;  // required
}
