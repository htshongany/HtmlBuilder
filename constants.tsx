
import { ComponentType, TemplateOption, AdvancedOptions } from './types';
import React from 'react'; // Required for JSX type if used, even if not directly using JSX here

// Helper type for icon mapping
type IconMap = {
  [key in ComponentType]: string;
};

export const COMPONENT_TYPE_ICONS: IconMap = {
  [ComponentType.Menu]: "fas fa-bars",
  [ComponentType.Section]: "fas fa-puzzle-piece", // Changed from fa-square for better semantics
  [ComponentType.Footer]: "fas fa-shoe-prints",
  [ComponentType.Cart]: "fas fa-shopping-cart",
  [ComponentType.Hero]: "fas fa-star",
  [ComponentType.FullPage]: "fas fa-window-maximize",
};

export const COMPONENT_TYPES_ARRAY: ComponentType[] = [
  ComponentType.Menu,
  ComponentType.Section,
  ComponentType.Footer,
  ComponentType.Cart,
  ComponentType.Hero,
  ComponentType.FullPage,
];

export const TEMPLATE_OPTIONS_ARRAY: TemplateOption[] = [
  TemplateOption.DefaultTailwind,
  TemplateOption.ModernLandingPage,
  TemplateOption.EcommerceProductCard,
  TemplateOption.DashboardLayout,
  TemplateOption.MinimalPortfolio,
];

export const INITIAL_ADVANCED_OPTIONS: AdvancedOptions = {
  responsive: true,
  performance: true,
  accessibility: false,
  javascript: false, // Added new option with default value
};

export const DEFAULT_COMPONENT_TYPE = ComponentType.Section;
export const DEFAULT_TEMPLATE_OPTION = TemplateOption.DefaultTailwind;

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';
// export const GEMINI_MODEL_IMAGE = 'imagen-3.0-generate-002'; // Not used for HTML generation directly here

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export const SAMPLE_HTML_PREVIEW = `
<div class="flex flex-col items-center justify-center h-full text-gray-400">
  <i class="fas fa-eye-slash text-4xl mb-3"></i>
  <p class="text-lg">Preview will appear here</p>
  <p class="text-sm">Generate code to see it live</p>
</div>
`;

export const SAMPLE_GENERATED_CODE = `<!-- Generated HTML will appear here -->
<div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden my-4">
  <div class="p-8">
    <div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Example Component</div>
    <h2 class="mt-2 text-2xl font-bold text-gray-800">Sample Card</h2>
    <p class="mt-2 text-gray-500">This is a placeholder for AI-generated content.</p>
    <button class="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition">
      Example Button
    </button>
  </div>
</div>`;