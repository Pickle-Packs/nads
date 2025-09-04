import { describe, expect, it } from 'vitest';
// @ts-ignore
import { pipe, flatMap, success, failure, map, match as matchOutcome, Failure, Outcome } from '../src/outcome';
// @ts-ignore
import { Maybe, some, match as matchMaybe } from '../src/maybe';

describe('outcome', () => {
    describe('failure', () => {
        describe('when detail and code provided', () => {
            it('should create failure', () => {
                const detail: string = 'detail';
                const code: string = 'code';

                const failureValue: Outcome<never> = failure(detail, code);

                matchOutcome(
                    failureValue,
                    () => {
                        expect(0).toBe(1);
                    }, (f: Failure) => {
                        expect(f.detail).toBe(detail);
                        expect(f.code).toBe(code);
                        const error: Error = matchMaybe(f.maybeError, (x: Error) => x, () => undefined);
                        expect(error).toBeUndefined();
                    }
                );
            });
        });
        describe('when detail, code, error provided', () => {
            it('should create failure', () => {
                const detail: string = 'detail';
                const code: string = 'code';
                const failureError: Error = new Error('Failure');

                const failureValue: Outcome<never> = failure(detail, code, failureError);

                matchOutcome(
                    failureValue,
                    () => {
                        expect(0).toBe(1);
                    }, (f: Failure) => {
                        expect(f.detail).toBe(detail);
                        expect(f.code).toBe(code);
                        const error: Error = matchMaybe(f.maybeError, (x: Error) => x, () => undefined);
                        expect(error).toBeDefined();
                        expect(error.message).toBe(failureError.message);
                    }
                );
            });
        });
        describe('when failure provided', () => {
            it('should create failure', () => {
                const detail: string = 'detail';
                const code: string = 'code';
                const failureError: Error = new Error('Failure');

                const failureValue: Outcome<never> = failure({
                    detail: detail,
                    code: code,
                    maybeError: some(failureError),
                } as Failure);

                matchOutcome(
                    failureValue,
                    () => {
                        expect(0).toBe(1);
                    }, (f: Failure) => {
                        expect(f.detail).toBe(detail);
                        expect(f.code).toBe(code);
                        const error: Error = matchMaybe(f.maybeError, (x: Error) => x, () => undefined);
                        expect(error).toBeDefined();
                        expect(error.message).toBe(failureError.message);
                    }
                );
            });
        });
        describe('when parameters not provided', () => {
            it('should create failure with defaults', () => {
                const failureValue: Outcome<never> = failure();

                matchOutcome(
                    failureValue,
                    () => {
                        expect(0).toBe(1);
                    }, (f: Failure) => {
                        expect(f.detail).toBe('');
                        expect(f.code).toBe('');
                        const error: Error = matchMaybe(f.maybeError, (x: Error) => x, () => undefined);
                        expect(error).toBeUndefined();
                    }
                );
            });
        });
    });

    describe('map', () => {
        describe('when some', () => {
           it('should map', () => {
               const value = 'value';
               const outcome = success(value);
               let isMapped = false;

               map(outcome, (x: string) => {
                   isMapped = true;
                   return x;
               });

               expect(isMapped).toBe(true);
           });
        });
        describe('when none', () => {
            it('should not map', () => {
                const outcome = failure('detail', 'code');
                let isMapped = false;

                map(outcome, (x: string) => {
                    isMapped = true;
                    return x;
                });

                expect(isMapped).toBe(false);
            });
        });
    });

    describe('flatMap', () => {
        describe('when some', () => {
            it('should map', () => {
                const value = 'value';
                const outcome = success(value);
                let isMapped = false;

                flatMap(outcome, (x: string) => {
                    isMapped = true;
                    return success(x);
                });

                expect(isMapped).toBe(true);
            });
        });
        describe('when none', () => {
            it('should not map', () => {
                const outcome = failure('detail', 'code');
                let isMapped = false;

                flatMap(outcome, (x: string) => {
                    isMapped = true;
                    return success(x);
                });

                expect(isMapped).toBe(false);
            });
        });
    });

    describe('match', () => {
        describe('when success', () => {
            it('should evaluate onSuccess', () => {
                const value = 'value';
                const fail = 'fail';
                const outcome = success(value);

                const matched = matchOutcome(outcome, (x: string) => x, () => fail);

                expect(matched).toBe(value);
            });
        });
        describe('when failure', () => {
            it('should evaluate onFailure', () => {
                const fail = 'fail';
                const outcome = failure('detail', 'code');

                const matched = matchOutcome(outcome, (x: string) => x, () => fail);

                expect(matched).toBe(fail);
            });
        });
    });

    describe('pipe', () => {
        describe('when all steps succeed', () => {
            it('should return the last outcome', () => {
                const initialOutcome = success(1);

                const finalOutcome: Outcome<number> = pipe(
                    initialOutcome // 1
                    , increment // 2
                    , increment // 3
                    , increment // 4
                    , increment // 5
                    , increment // 6
                    , increment // 7
                );

                const result = matchOutcome(finalOutcome, (x: number) => x, () => -1);

                expect(result).toBe(7);

                function increment(num: number): Outcome<number> {
                    return success(num + 1);
                }
            });
        });
        describe('when any step fails', () => {
            it('should fall through and return the failure outcome', () => {
                const initialOutcome = success(1);

                const finalOutcome: Outcome<number> = pipe(
                    initialOutcome // 1
                    , increment // 2
                    , increment // 3
                    , increment // 4
                    , (): Outcome<number> => failure('detail', 'code') // 5
                    , increment // 6
                    , increment // 7
                );

                const result = matchOutcome(finalOutcome, (x: number) => x, () => -1);

                expect(result).toBe(-1);

                function increment(num: number): Outcome<number> {
                    return success(num + 1);
                }
            });
        })
    });
});
