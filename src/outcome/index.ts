import {
    type Maybe, none, some,
} from '../maybe/index.js';

const kindSymbol = Symbol('kind');
const valueSymbol = Symbol('value');

const outcomeKind = {
    failure: 0,
    success: 1,
} as const;

export interface IFailure {
    readonly code: string;
    readonly detail: string;
    readonly maybeError: Maybe<Error>;
}

export type Outcome<T> = Readonly<{
    [kindSymbol]: OutcomeKind;
    [valueSymbol]: IFailure | T;
}>;

type OutcomeKind = (typeof outcomeKind)[keyof typeof outcomeKind];

type Step<TA, TB> = (outcome: TA) => Outcome<TB>;

type UnknownStep = (outcome: unknown) => Outcome<unknown>;

export function failure<T>(detail: string, code: string): Outcome<T>;

export function failure<T>(detail: string, code: string, error: Error): Outcome<T>;

export function failure<T>(failureValue: IFailure): Outcome<T>;

export function failure<T>(
    detailOrFailure: IFailure | string,
    code?: string,
    error?: Error,
): Outcome<T> {
    const failureValue: IFailure
        = (undefined === detailOrFailure
          || null === detailOrFailure
          || 'string' === typeof detailOrFailure)
            ? createFailure(
                detailOrFailure ?? '',
                code ?? '',
                error
                    ? some(error)
                    : none,
            )
            : detailOrFailure;

    return {
        [kindSymbol]: outcomeKind.failure,
        [valueSymbol]: failureValue,
    } as const;
}

export function flatMap<T, TNext>(
    outcome: Outcome<T>,
    mapper: (inner: T) => Outcome<TNext>,
): Outcome<TNext> {
    return isSuccess(outcome)
        ? mapper(outcome[valueSymbol] as T)
        : outcome as Outcome<TNext>;
}

export function map<T, TNext>(
    outcome: Outcome<T>,
    mapper: (inner: T) => TNext,
): Outcome<TNext> {
    return isSuccess(outcome)
        ? success(mapper(outcome[valueSymbol] as T))
        : outcome as Outcome<TNext>;
}

export function match<T, TNext>(
    outcome: Outcome<T>,
    onSuccess: (successValue: T) => TNext,
    onFailure: (failureValue: IFailure) => TNext,
): TNext {
    return isSuccess(outcome)
        ? onSuccess(outcome[valueSymbol] as T)
        : onFailure(outcome[valueSymbol] as IFailure);
}

export function pipe<T1, T2>(
    outcome: Outcome<T1>,
    fn2: Step<T1, T2>,
): Outcome<T2>;

export function pipe<T1, T2, T3>(
    outcome: Outcome<T1>,
    fn2: Step<T1, T2>,
    fn3: Step<T2, T3>,
): Outcome<T3>;

export function pipe<T1, T2, T3, T4>(
    outcome: Outcome<T1>,
    fn2: Step<T1, T2>,
    fn3: Step<T2, T3>,
    fn4: Step<T3, T4>,
): Outcome<T4>;

export function pipe<T1, T2, T3, T4, T5>(
    outcome: Outcome<T1>,
    fn2: Step<T1, T2>,
    fn3: Step<T2, T3>,
    fn4: Step<T3, T4>,
    fn5: Step<T4, T5>,
): Outcome<T5>;

export function pipe<T1, T2, T3, T4, T5, T6>(
    outcome: Outcome<T1>,
    fn2: Step<T1, T2>,
    fn3: Step<T2, T3>,
    fn4: Step<T3, T4>,
    fn5: Step<T4, T5>,
    fn6: Step<T5, T6>,
): Outcome<T6>;

export function pipe(
    outcome: Outcome<unknown>,
    ...steps: Readonly<Array<UnknownStep>>
): Outcome<unknown> {
    return steps.reduce<Outcome<unknown>>(
        flatMap,
        outcome,
    );
}

export function success<T>(successValue: T): Outcome<T> {
    return {
        [kindSymbol]: outcomeKind.success,
        [valueSymbol]: successValue,
    };
}

function createFailure(
    detail: string, code: string, error: Maybe<Error>,
): Readonly<IFailure> {
    return {
        code: code,
        detail: detail,
        maybeError: error,
    };
}

function isSuccess<T>(outcome: Outcome<T>): boolean {
    return outcome[kindSymbol] === outcomeKind.success;
}
