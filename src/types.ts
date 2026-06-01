export interface ThemePalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface StylingData {
  css_library: string;
  main_css: string;
  theme_palette: ThemePalette;
}

export interface PageData {
  page_name: string;
  file_name: string;
  html_template: string;
  alt_text_suggestions: string[];
}

export interface HeadingVariant {
  heading: string;
  body_block: string;
}

export interface SeoComponents {
  heading_variants: HeadingVariant[];
}

export interface WebsiteData {
  website_name: string;
  meta_info: {
    title: string;
    description: string;
    deployment_platform: string;
  };
  styling: StylingData;
  pages: PageData[];
  main_js: string;
  seo_components: SeoComponents;
  launch_checklist: string[];
  image_prompts: string[];
  alt_text_meta_description: string;
}

export interface WebsiteRequest {
  website_overview: string;
  target_keywords: string;
  page_details: string[];
  css_theme: string;
  deployment_platform: string;
  provider: "openai" | "gemini";
}
