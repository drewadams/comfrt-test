interface VariantOption {
  name: string;
  value: string;
  isSelected: boolean;
  isAvailable: boolean;
  inputId: string;
}

interface VariantGroup {
  type: string; // 'Size', 'Color', etc.
  options: VariantOption[];
}

export { VariantOption, VariantGroup };
