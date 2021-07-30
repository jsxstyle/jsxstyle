import invariant from 'invariant';
import path = require('path');
import { getExportsFromModuleSource } from './utils/getExportsFromModuleSource';
import { assetPrefix } from './constants';

interface EntrypointMetadata {
  hash: string | null;
  modulePath: string;
  key: string;
  module: unknown | null;
}

interface PromiseObj<T> {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
}

const makePromise = <T extends any>(): PromiseObj<T> => {
  const result: PromiseObj<T> = {} as any;

  result.promise = new Promise<T>((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
};

export class EntrypointCache {
  public entrypoints: Record<string, EntrypointMetadata> = {};

  private thingPromise = makePromise<Record<string, unknown>>();
  private modulesByKey: Record<string, EntrypointMetadata> = {};

  public reset = () => {
    // close out the old promise just in case
    this.thingPromise.resolve({});
    this.thingPromise = makePromise();
  };

  public reject = (err?: any) => {
    this.thingPromise.reject(err);
  };

  public getModules = async (): Promise<Record<string, unknown>> => {
    return this.thingPromise.promise;
  };

  public setModules = (
    /** An object of webpack assets objects keyed by filename */
    assetObject: Record<string, unknown>
  ) => {
    const modulesByAbsolutePath = Object.entries(assetObject).reduce<
      Record<string, unknown>
    >((prev, [moduleFileName, asset]) => {
      const key = path.basename(moduleFileName, '.js');

      const moduleForKey = this.modulesByKey[key];
      if (!moduleForKey) {
        console.error('Unexpected asset name: `%s`', key);
        return prev;
      }

      const assetSource: string = (asset as any).source().toString();

      const assetModule = getExportsFromModuleSource(
        moduleForKey.modulePath,
        assetSource
      );

      prev[moduleForKey.modulePath] = assetModule;
      return prev;
    }, {});

    this.thingPromise.resolve(modulesByAbsolutePath);
  };

  public addEntrypoint = (modulePaths: string[]): void => {
    let index = 0;

    for (const modulePath of modulePaths) {
      invariant(
        path.isAbsolute(modulePath),
        'Module path `%s` is expected to be an absolute path',
        modulePath
      );

      if (this.entrypoints.hasOwnProperty(modulePath)) {
        return;
      }

      const key = assetPrefix + ++index;

      this.entrypoints[modulePath] = {
        key,
        modulePath,
        hash: null,
        module: null,
      };

      this.modulesByKey[key] = this.entrypoints[modulePath];
    }
  };
}
