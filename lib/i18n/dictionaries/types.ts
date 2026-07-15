import { englishAppStrings } from "./en";

export type AppStringsDictionary = typeof englishAppStrings;

export type AppStringsOverrides = {
  [Section in keyof AppStringsDictionary]?: Partial<
    AppStringsDictionary[Section]
  >;
};
