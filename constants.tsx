import { ComponentType, AdvancedOptions } from './types';

// Helper type for icon mapping
type IconMap = {
  [key in ComponentType]: string;
};

export const COMPONENT_TYPE_ICONS: IconMap = {
  [ComponentType.Menu]: "fas fa-bars",
  [ComponentType.Section]: "fas fa-puzzle-piece",
  [ComponentType.Footer]: "fas fa-shoe-prints",
  [ComponentType.Cart]: "fas fa-shopping-cart",
  [ComponentType.Hero]: "fas fa-star",
  [ComponentType.FullPage]: "fas fa-window-maximize",
  [ComponentType.Card]: "fas fa-id-card",
  [ComponentType.Pricing]: "fas fa-tags",
  [ComponentType.Testimonial]: "fas fa-comment-dots",
  [ComponentType.Feature]: "fas fa-cogs",
  [ComponentType.ContactForm]: "fas fa-envelope-open-text",
  [ComponentType.Gallery]: "fas fa-images",
  [ComponentType.Newsletter]: "fas fa-paper-plane",
  [ComponentType.Team]: "fas fa-users",
  [ComponentType.FAQ]: "fas fa-question-circle",
  [ComponentType.Stats]: "fas fa-chart-bar",
  [ComponentType.Blog]: "fas fa-blog",
  [ComponentType.CTA]: "fas fa-bullhorn",
  [ComponentType.Timeline]: "fas fa-stream",
  [ComponentType.Stepper]: "fas fa-shoe-prints",
};

export const COMPONENT_TYPES_ARRAY: ComponentType[] = [
  ComponentType.Menu,
  ComponentType.Section,
  ComponentType.Footer,
  ComponentType.Cart,
  ComponentType.Hero,
  ComponentType.FullPage,
  ComponentType.Card,
  ComponentType.Pricing,
  ComponentType.Testimonial,
  ComponentType.Feature,
  ComponentType.ContactForm,
  ComponentType.Gallery,
  ComponentType.Newsletter,
  ComponentType.Team,
  ComponentType.FAQ,
  ComponentType.Stats,
  ComponentType.Blog,
  ComponentType.CTA,
  ComponentType.Timeline,
  ComponentType.Stepper,
];

export const INITIAL_ADVANCED_OPTIONS: AdvancedOptions = {
  responsive: true,
  performance: true,
  accessibility: false,
  javascript: false, // Added new option with default value
};

export const DEFAULT_COMPONENT_TYPE = ComponentType.Section;

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

export const SAMPLE_GENERATED_CODE = ``;