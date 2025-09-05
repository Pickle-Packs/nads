import { describe, expect, it } from 'vitest';
// @ts-ignore
import { coalesce, flatMap, none, some, map, match, maybe } from '../src/maybe';

describe('maybe', () => {
    describe('coalesce', () => {
        it('should filter and return some values', () => {
            const maybeOne = some(1);
            const maybeTwo = none;
            const maybeThree = some(3);

            const values = coalesce(
                maybeOne,
                maybeTwo,
                maybeThree,
            );

            expect(values).toContain(1);
            expect(values).toContain(3);
            expect(values.length).toBe(2);
        });
    });

    describe('flatMap', () => {
        describe('when some', () => {
            it('should map', () => {
                const value = 1;
                const maybeValue = some(value);
                let isMapped = false;

                flatMap(maybeValue, (x: number) => {
                    isMapped = true;
                    return some(doubleIt(x));
                });

                expect(isMapped).toBe(true);

                function doubleIt(num: number): number {
                    return num * 2;
                }
            });
        });
        describe('when none', () => {
            it('should not map', () => {
                const maybeValue = none;
                let isMapped = false;

                flatMap(maybeValue, (x: number) => {
                    isMapped = true;
                    return some(doubleIt(x));
                });

                expect(isMapped).toBe(false);

                function doubleIt(num: number): number {
                    return num * 2;
                }
            });
        });
    });

    describe('map', () => {
        describe('when some', () => {
            it('should map', () => {
                const value = 1;
                const maybeValue = some(value);
                let isMapped = false;

                map(maybeValue, (x: number) => {
                    isMapped = true;
                    return doubleIt(x);
                });

                expect(isMapped).toBe(true);

                function doubleIt(num: number): number {
                    return num * 2;
                }
            });
        });
        describe('when none', () => {
            it('should not map', () => {
                const maybeValue = none;
                let isMapped = false;

                map(maybeValue, (x: number) => {
                    isMapped = true;
                    return doubleIt(x);
                });

                expect(isMapped).toBe(false);

                function doubleIt(num: number): number {
                    return num * 2;
                }
            });
        });
    });

    describe('match', () => {
        describe('when some', () => {
            it('should evaluate onSome', () => {
                const value = 1;
                const noValue = -1;
                const maybeValue = some(value);

                const matched: number = match(
                    maybeValue,
                    (x: number) => x,
                    noValue,
                );

                expect(matched).toBe(value);
            });
        });
        describe('when none', () => {
            describe('and when onNone is a function', () => {
                it('should evaluate onNone', () => {
                    const noValue = -1;

                    const matched: number = match(
                        none,
                        (x: number) => x,
                        () => noValue,
                    );

                    expect(matched).toBe(noValue);
                });
            });
            describe('and when onNone is a literal', () => {
                it('should evaluate onNone', () => {
                    const noValue = -1;

                    const matched: number = match(
                        none,
                        (x: number) => x,
                        noValue,
                    );

                    expect(matched).toBe(noValue);
                });
            });
        });
    });
    describe('some', () => {
       describe('when null value is provided', () => {
           it('should return none', () => {
                const maybeValue = some<string>(null);

                const isNone = match(maybeValue, () => false, true);

                expect(isNone).toBe(true);
           });
       });
        describe('when undefined value is provided', () => {
            it('should return none', () => {
                const maybeValue = some<string>(undefined);

                const isNone = match(maybeValue, () => false, true);

                expect(isNone).toBe(true);
            });
        });
    });
    describe('maybe', () => {
        describe('when null value is provided', () => {
            it('should return none', () => {
                const maybeValue = maybe<string>(null);

                const isNone = match(maybeValue, () => false, true);

                expect(isNone).toBe(true);
            });
        });
        describe('when undefined value is provided', () => {
            it('should return none', () => {
                const maybeValue = maybe<string>(undefined);

                const isNone = match(maybeValue, () => false, true);

                expect(isNone).toBe(true);
            });
        });
    });
});
