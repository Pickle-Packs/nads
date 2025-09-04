const kindSymbol = Symbol('kind');
const valueSymbol = Symbol('value');

const maybeKind = {
    none: 0,
    some: 1,
} as const;

export type Maybe<T> = Readonly<{
    [kindSymbol]: MaybeKind;
    [valueSymbol]: T | undefined;
}>;

type MaybeKind = (typeof maybeKind)[keyof typeof maybeKind];

export function coalesce<T>(...maybes: Readonly<Array<Maybe<T>>>): Array<T>;

export function coalesce(...maybes: Readonly<Array<Maybe<unknown>>>): Array<unknown> {
    return maybes.reduce<Array<unknown>>(
        appendIfSome,
        [],
    );
}

export function flatMap<T, TNext>(
    maybe: Maybe<T>,
    mapper: (inner: T) => Maybe<TNext>,
): Maybe<TNext> {
    return isSome(maybe)
        ? mapper(maybe[valueSymbol] as T)
        : maybe as Maybe<TNext>;
}

export function map<T, TNext>(
    maybe: Maybe<T>,
    mapper: (inner: T) => TNext,
): Maybe<TNext> {
    return isSome(maybe)
        ? some(mapper(maybe[valueSymbol] as T))
        : maybe as Maybe<TNext>;
}

export function match<T, TNext>(
    maybe: Maybe<T>,
    onSome: (successValue: T) => TNext,
    onNone: (() => TNext) | TNext,
): TNext {
    return isSome(maybe)
        ? onSome(maybe[valueSymbol] as T)
        : resolveOnNone(onNone);
}

export function some<T>(value: T): Maybe<T> {
    return {
        [kindSymbol]: maybeKind.some,
        [valueSymbol]: value,
    };
}

function appendIfSome<T>(
    array: Array<T>,
    maybe: Maybe<T>,
): Array<T>;
function appendIfSome(
    array: Array<unknown>,
    maybe: Maybe<unknown>,
): Array<unknown> {
    return match(
        maybe,
        x => [
            ...array,
            x,
        ],
        array,
    );
}

function isSome<T>(maybe: Maybe<T>): boolean {
    return maybe[kindSymbol] === maybeKind.some;
}

function resolveOnNone<T>(onNone: (() => T) | T): T {
    return 'function' === typeof onNone
        ? (onNone as () => T)()
        : onNone;
}

export const none: Maybe<never> = {
    [kindSymbol]: maybeKind.none,
    [valueSymbol]: undefined,
} as const;
