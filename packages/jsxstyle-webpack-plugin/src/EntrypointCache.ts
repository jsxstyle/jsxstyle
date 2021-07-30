import invariant from 'invariant';
import path = require('path');
import { getExportsFromModuleSource } from './utils/getExportsFromModuleSource';
import { makePromise } from './utils/makePromise';
import { stringHash } from 'jsxstyle-utils';

interface EntrypointMetadata {
  hash: string | null;
  modulePath: string;
  key: string;
  module: unknown | null;
}

export class EntrypointCache {
  constructor(modulePaths: string[]) {
    for (const modulePath of modulePaths) {
      invariant(
        path.isAbsolute(modulePath),
        'Module path `%s` is expected to be an absolute path',
        modulePath
      );

      if (this.entrypoints.hasOwnProperty(modulePath)) {
        continue;
      }

      const ext = path.extname(modulePath);
      const basename = path.basename(modulePath, ext);

      const key =
        basename +
        (this.modulesByKey.hasOwnProperty(basename + ext)
          ? // add a hash to duplicate keys
            '-' + stringHash(modulePath).toString(36)
          : '') +
        ext;

      this.entrypoints[modulePath] = {
        key,
        modulePath,
        hash: null,
        module: null,
      };

      this.modulesByKey[key] = this.entrypoints[modulePath];
    }
  }

  public entrypoints: Record<string, EntrypointMetadata> = {};

  private thingPromise = makePromise<Record<string, unknown>>();
  private modulesByKey: Record<string, EntrypointMetadata> = {};

  public reset = (): void => {
    // close out the old promise just in case
    this.thingPromise.resolve({});
    this.thingPromise = makePromise();
  };

  public reject = (err?: any): void => {
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
    >((prev, [key, asset]) => {
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
}
