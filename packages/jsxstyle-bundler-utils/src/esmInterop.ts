// TODO(meyer) rollup should do this automatically
export const esmInterop = <T>(mod: T): T => {
  return (
    mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod
  ) as any;
};
