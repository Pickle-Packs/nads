# Maybe and Outcome 'Nads

Monadic utilities for explicit control flow in TypeScript.

- `Maybe<T>` is the Option monad. It encodes presence or absence of a value.
- `Outcome<T>` is the Result monad. It encodes success or failure as data.

Use them to make every branch explicit, keep the happy path linear, and avoid throwing exceptions for routine control flow.

## Install

```sh
npm i @pickle-packer/nads
```

## Imports
Aliasing may be required if importing both
```ts
// Maybe (Option)
import { some, none, map, flatMap, match, coalesce, type Maybe } from "@pickle-packer/nads/maybe";

// Outcome (Result)
import {
  success,
  failure,
  map,
  flatMap,
  match,
  pipe,
  type Outcome,
  type IFailure
} from "@pickle-packer/nads/outcome";
```

## Why monads here

In this style you get total control flow because `match` forces you to handle every case, which makes it easy for reviews and tooling to spot gaps. The happy path stays linear since `map` and `flatMap` let you write top to bottom logic instead of nesting `if` or `try`.

You stop throwing for expected situations and keep `throw` for truly exceptional faults, returning `failure` for everything else. Tests become straightforward because you assert on plain data rather than reconstructing stack traces or wiring global handlers. Local reasoning improves too: a function that returns `Outcome<T>` cannot hide a thrown error on the success path.

## Maybe usage

### Basic flow

```ts
const m = some(2);

const m2 = map(m, x => x * 10);         // some(20)
const m3 = flatMap(m, x => some(x + 1)); // some(3)
const m4 = flatMap(none as Maybe<number>, x => some(x + 1)); // none

const text = match(
  m,
  x => `value:${x}`,
  "no value"
);
```

### Coalescing defaults

Use `coalesce` on multiple Maybe to filter and remove instances of `none` and extract values wrapped by `some`  

```ts
const a = some(0);
const b = none;
const c = some(3);

const values = coalesce(a, b, c); // [0, 3]
```
or 
```ts
const a = some(0);
const b = none;
const c = some(3);
const maybes = [a, b, c];

const values = coalesce(...maybes); // [0, 3]
```

### When to use Maybe

- Inputs that may be missing.
- Parsing or lookups that can fail silently.
- Optional relationships where `null` would leak into many call sites.

## Outcome usage

`Outcome<T>` carries `success(T)` or `failure(IFailure)`. Failures are plain data.

```ts
type User = { id: string };
type Profile = { label: string };

function getUser(id: string): Outcome<User> {
  return id ? success({ id }) : failure("missing id", "MISSING_ID");
}

function loadProfile(u: User): Outcome<Profile> {
  return success({ label: `user ${u.id}` });
}

const prof = flatMapOut(getUser("u1"), loadProfile);

const label = matchOut(
  prof,
  p => p.label,
  f => `error:${f.code}`
);
```

### Pipe for multi step flows

Short circuits on the first failure.

```ts
const result = pipe(
  success(1),
  n => success(n + 1),
  n => success(n * 2)
);
// success(4)
```

### Avoiding exceptions as control flow

Wrap exception sources at the boundary and keep the inside exception free.

```ts
function fromJson(s: string): Outcome<unknown> {
  try {
    return success(JSON.parse(s));
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return failure("invalid json", "PARSE", err);
  }
}
```

### Extending IFailure

`IFailure` has `code`, `detail`, and `maybeError`. Extend it when a domain needs more fields. Use `code` as a discriminant for duck typing across layers.

```ts
interface ValidationFailure extends IFailure {
  readonly code: "VALIDATION";
  readonly errors: Readonly<Record<string, ReadonlyArray<string>>>;
}

function validateName(name: string): Outcome<string> {
  if (name.trim().length === 0) {
    return failure<never>({
      code: "VALIDATION",
      detail: "name required",
      maybeError: none,
      errors: { name: ["required"] }
    } as ValidationFailure);
  }
  return success(name);
}

const msg = matchOut(
  validateName(""),
  v => v,
  f => {
    if (f.code === "VALIDATION") {
      const vf = f as ValidationFailure;
      return `invalid fields: ${Object.keys(vf.errors).join(", ")}`;
    }
    return `error:${f.code}`;
  }
);
```

You can also add a second discriminant for teams that prefer explicit types.

```ts
interface NotFoundFailure extends IFailure {
  readonly code: "NOT_FOUND";
  readonly entity: string;
  readonly kind: "NotFoundFailure";
}
```

### Interop with Maybe

`IFailure.maybeError` uses `Maybe<Error>`. This lets you attach a captured exception without forcing one to exist.

```ts
const logIfError = (o: Outcome<unknown>): void => {
  matchOut(
    o,
    () => undefined,
    f => match(f.maybeError, e => console.error(e), undefined)
  );
};
```

## Patterns and guidance

- Never throw for predictable outcomes. Return `failure` with a clear `code`.
- Keep `detail` readable for humans. Use `code` for programs and tests.
- Prefer one `match` at the boundary. Use `map` or `flatMap` internally to avoid nested matching.
- Keep failures stable. Treat `code` as part of your public surface so clients can branch without string parsing.
- Convert unexpected exceptions to `failure` at IO boundaries.

## API reference

### @pickle-packer/nads/maybe

- `some<T>(value: T): Maybe<T>`
- `none: Maybe<never>`
- `map<T, U>(m: Maybe<T>, f: (t: T) => U): Maybe<U>`
- `flatMap<T, U>(m: Maybe<T>, f: (t: T) => Maybe<U>): Maybe<U>`
- `match<T, U>(m: Maybe<T>, onSome: (t: T) => U, onNone: (() => U) | U): U`
- `coalesce<T>(...m: ReadonlyArray<Maybe<T>>): Array<T>`

### @pickle-packer/nads/outcome

- `success<T>(t: T): Outcome<T>`
- `failure<T>(detail: string, code: string, error?: Error): Outcome<T>`
- `failure<T>(f: IFailure): Outcome<T>`
- `map<T, U>(o: Outcome<T>, f: (t: T) => U): Outcome<U>`
- `flatMap<T, U>(o: Outcome<T>, f: (t: T) => Outcome<U>): Outcome<U>`
- `match<T, U>(o: Outcome<T>, onSuccess: (t: T) => U, onFailure: (f: IFailure) => U): U`
- `pipe(o: Outcome<unknown>, ...steps: ReadonlyArray<(x: unknown) => Outcome<unknown>>): Outcome<unknown>`

## Notes

- Uses module local Symbols to avoid accidental key collisions.
- All public objects are `Readonly` to discourage mutation.
- No runtime dependencies.
