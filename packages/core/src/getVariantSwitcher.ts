import type { CustomPropertyVariant } from './generateCustomPropertiesFromVariants.js';

export const getVariantSwitcher = <K extends string>(
  /** Object of variants */
  variants: Record<K, CustomPropertyVariant>,
  /** Element that will receive the override classname */
  overrideElement: {
    classList: {
      add(className: string): void;
      remove(className: string): void;
    };
  }
) => {
  const enableVariant = (newVariantName: K | null): void => {
    const newVariant = newVariantName ? variants[newVariantName] : null;
    for (const variantName in variants) {
      if (variantName === newVariantName) continue;
      const variant = variants[variantName];
      if (variant) {
        overrideElement.classList.remove(variant.className);
      }
    }
    if (newVariant) {
      overrideElement.classList.add(newVariant.className);
    }
  };

  return enableVariant;
};
