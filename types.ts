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
  Card = 'Card',
  Pricing = 'Pricing',
  Testimonial = 'Testimonial',
  Feature = 'Feature',
  ContactForm = 'Contact Form',
  Gallery = 'Gallery',
  Newsletter = 'Newsletter',
  Team = 'Team',
  FAQ = 'FAQ',
  Stats = 'Stats',
  Blog = 'Blog',
  CTA = 'Call To Action',
  Timeline = 'Timeline',
  Stepper = 'Stepper',
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
  advancedOptions: AdvancedOptions;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
 web: GroundingChunkWeb;
}