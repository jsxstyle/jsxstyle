import * as s from 'superstruct';

export const packageJsonSchema = s.type({
  name: s.string(),
  main: s.optional(s.string()),
  module: s.optional(s.string()),
  types: s.optional(s.string()),
  type: s.optional(s.string()),
  private: s.optional(s.boolean()),
  files: s.optional(s.array(s.string())),
  dependencies: s.optional(s.record(s.string(), s.string())),
  devDependencies: s.optional(s.record(s.string(), s.string())),
  peerDependencies: s.optional(s.record(s.string(), s.string())),
});

export const workspacesSchema = s.array(
  s.assign(
    packageJsonSchema,
    s.type({
      realpath: s.string(),
    })
  )
);

export const tsconfigSchema = s.type({
  extends: s.optional(s.string()),
  include: s.optional(s.array(s.string())),
  exclude: s.optional(s.array(s.string())),
  compilerOptions: s.optional(
    s.type({
      paths: s.optional(s.record(s.string(), s.array(s.string()))),
      jsx: s.optional(s.string()),
      jsxFactory: s.optional(s.string()),
      jsxImportSource: s.optional(s.string()),
    })
  ),
  references: s.optional(
    s.array(
      s.object({
        path: s.string(),
      })
    )
  ),
});

const npmPackItemSchema = s.type({
  id: s.string(),
  name: s.string(),
  version: s.string(),
  size: s.number(),
  unpackedSize: s.number(),
  entryCount: s.number(),
  files: s.array(
    s.type({ path: s.string(), size: s.number(), mode: s.number() })
  ),
});

export const npmPackSchema = s.array(npmPackItemSchema);
