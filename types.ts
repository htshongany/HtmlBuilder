
export enum UploadOption {
  Basic = 'basic',
  CustomPrompt = 'customPrompt',
}

export enum ComponentType {
  Menu = 'Menu',
  Section = 'Section',
  Footer = 'Footer',
  Cart = 'Cart',
  Hero = 'Hero',
  FullPage = 'Full Page',
}

export enum TemplateOption {
  DefaultTailwind = 'Default Tailwind Structure',
  ModernLandingPage = 'Modern Landing Page',
  EcommerceProductCard = 'E-commerce Product Card',
  DashboardLayout = 'Dashboard Layout',
  MinimalPortfolio = 'Minimal Portfolio',
}

export interface AdvancedOptions {
  responsive: boolean;
  performance: boolean;
  accessibility: boolean;
  javascript: boolean; // Added new option
}

export interface GenerationParams {
  imageDataBase64: string;
  mimeType: string;
  customPromptText: string;
  componentType: ComponentType;
  templateStructure: TemplateOption;
  advancedOptions: AdvancedOptions;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
 web: GroundingChunkWeb;
}