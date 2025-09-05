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
    maybeInstance: Maybe<T>,
    mapper: (inner: T) => Maybe<TNext>,
): Maybe<TNext> {
    return isSome(maybeInstance)
        ? mapper(maybeInstance[valueSymbol] as T)
        : maybeInstance as Maybe<TNext>;
}

export function map<T, TNext>(
    maybeInstance: Maybe<T>,
    mapper: (inner: T) => TNext,
): Maybe<TNext> {
    return isSome(maybeInstance)
        ? some(mapper(maybeInstance[valueSymbol] as T))
        : maybeInstance as Maybe<TNext>;
}

export function match<T, TNext>(
    maybeInstance: Maybe<T>,
    onSome: (successValue: T) => TNext,
    onNone: (() => TNext) | TNext,
): TNext {
    return isSome(maybeInstance)
        ? onSome(maybeInstance[valueSymbol] as T)
        : resolveOnNone(onNone);
}

export function maybe<T>(maybeValue?: T): Maybe<T> {
    return (undefined !== maybeValue && null !== maybeValue)
        ? {
            [kindSymbol]: maybeKind.some,
            [valueSymbol]: maybeValue,
        }
        : none;
}

// eslint-disable-next-line @functional/prefer-tacit
export function some<T>(value: T): Maybe<T> {
    return maybe(value);
}

function appendIfSome<T>(
    array: Array<T>,
    maybe: Maybe<T>,
): Array<T>;
function appendIfSome(
    array: Array<unknown>,
    maybeInstance: Maybe<unknown>,
): Array<unknown> {
    return match(
        maybeInstance,
        x => [
            ...array,
            x,
        ],
        array,
    );
}

function isSome<T>(maybeInstance: Maybe<T>): boolean {
    return maybeInstance[kindSymbol] === maybeKind.some;
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
