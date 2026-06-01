import { useState, FormEvent, useRef, useId, useMemo } from "react";
import JSZip from "jszip";
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
  Lock,
  Globe,
  Server,
  Layers,
  ListChecks,
  Image as ImageIcon,
  Rocket,
  ArrowRight,
  RefreshCw,
  Send,
  HelpCircle,
  ExternalLink,
  Info,
  TrendingUp,
  Settings,
  Code,
  Layout,
  MessageSquare,
  Cpu,
  Monitor,
  Share2,
  Upload,
  Download,
  FolderArchive
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { WebsiteData, PageData, WebsiteRequest } from "./types";

const PRESETS = [
  {
    title: "🔋 Natura Matcha Organic Shopify Store",
    overview: "An elegant, high-converting direct-to-consumer store for premium cold-milled ceremonial matcha and organic green tea wellness snacks, focusing on urban corporate remote professionals.",
    keywords: "organic matcha online, premium green tea powder, clean natural energy bar, ceremonial grade organic matcha",
    pages: ["Home", "Product Details", "Heritage & Process", "Contact Us"],
    css_theme: "Emerald Tech",
    deployment_platform: "Cloud Run"
  },
  {
    title: "⌚ Velo Swiss Minimal Analog Smartwatch",
    overview: "A premium, distraction-free landing page for handcrafted mechanical analog watches that track advanced body metrics invisibly without screens.",
    keywords: "luxury mechanical analog, health tracking smartwatch, swiss biohacking chronometer, minimalist luxury watches",
    pages: ["Home", "Biometric Technology", "Heritage Gallery", "Secure Pre-Order"],
    css_theme: "Slate Dark",
    deployment_platform: "Vercel"
  },
  {
    title: "🌙 Aura Distilled Aromatherapy Mist",
    overview: "A calming wellness experience presenting aromatherapy sleep sprays, hand-blended organic lavender diffusers, and sensory guide kits for stress reduction.",
    keywords: "aromatherapy sleep mist, organic relaxation spray, lavender bedroom diffuse, cedarwood anxiety release",
    pages: ["Home", "Relaxation Library", "Lavender Gift Collections", "Client Reviews"],
    css_theme: "Warm Editorial",
    deployment_platform: "Netlify"
  }
];

const AVAILABLE_PAGES = [
  "Home",
  "Product Details",
  "About Process",
  "Biometric Technology",
  "Customer Reviews",
  "Pre-Order",
  "Pricing",
  "FAQ Helpdesk",
  "Contact Us"
];

const CSS_THEMES = [
  "Emerald Tech",
  "Slate Dark",
  "Warm Editorial",
  "Modern Minimalist",
  "Neobrutalist Space"
];

const DEPLOYMENT_PLATFORMS = [
  "Cloud Run (Ingress Edge)",
  "Vercel (Serverless Edge)",
  "Netlify (Jamstack)",
  "AWS Amplify",
  "GitHub Pages (Static)"
];

export default function App() {
  const uniqPageId = useId();
  const uniqThemeId = useId();
  const uniqPlatId = useId();
  // Form Input States
  const [websiteOverview, setWebsiteOverview] = useState("");
  const [targetKeywords, setTargetKeywords] = useState("");
  const [selectedPages, setSelectedPages] = useState<string[]>(["Home", "Product Details", "Contact Us"]);
  const [cssTheme, setCssTheme] = useState("Emerald Tech");
  const [deploymentPlatform, setDeploymentPlatform] = useState("Cloud Run (Ingress Edge)");
  const [provider, setProvider] = useState<"openai" | "gemini">("openai");

  // Custom Page constructor
  const [customPageInput, setCustomPageInput] = useState("");

  // AI Assistant Settings Agent "PixelSEO Assistant" State
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentIsResponding, setAgentIsResponding] = useState(false);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [agentSuggestedConfig, setAgentSuggestedConfig] = useState<{
    website_overview?: string;
    target_keywords?: string;
    page_details?: string[];
    css_theme?: string;
    deployment_platform?: string;
    explanation?: string;
  } | null>(null);

  // Core Application Generation States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);

  // Active Tab navigation
  const [activeTab, setActiveTab] = useState<"blueprints" | "styling" | "seo" | "simulator" | "milestones" | "images" | "marketing">("blueprints");
  const [selectedBlueprintIndex, setSelectedBlueprintIndex] = useState(0);

  // Marketing, Social Accounts and Custom Sharing State
  const [twitterHandle, setTwitterHandle] = useState(() => localStorage.getItem("marketing_twitter_handle") || "BrandPulse");
  const [facebookPage, setFacebookPage] = useState(() => localStorage.getItem("marketing_facebook_page") || "brandpulse.co");
  const [linkedinName, setLinkedinName] = useState(() => localStorage.getItem("marketing_linkedin_name") || "Senior Brand Lead");
  const [pinterestUser, setPinterestUser] = useState(() => localStorage.getItem("marketing_pinterest_user") || "brandpulse_pins");

  const [selectedMarketingPlatform, setSelectedMarketingPlatform] = useState<"twitter" | "linkedin" | "facebook" | "pinterest">("twitter");
  const [marketingTone, setMarketingTone] = useState<"hype" | "professional" | "minimalist" | "educational">("professional");
  const [campaignUrl, setCampaignUrl] = useState("https://conceptstudio.ai/my-blueprint");

  // Shared Image selection states
  const [attachedImageType, setAttachedImageType] = useState<"none" | "generated" | "uploaded">("none");
  const [selectedGeneratedIndex, setSelectedGeneratedIndex] = useState(0);
  const [customUploadedUrl, setCustomUploadedUrl] = useState("");
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string | null>(null);

  // Custom text override
  const [editedShareText, setEditedShareText] = useState("");
  const [userHasEditedText, setUserHasEditedText] = useState(false);

  // Image assets generator states
  const [images, setImages] = useState<{ [index: number]: { url?: string; loading: boolean; error?: string } }>({});

  // Interactive checklist status helper
  const [checkedMilestones, setCheckedMilestones] = useState<{ [index: number]: boolean }>({});

  // Copied indicator
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedConceptText, setCopiedConceptText] = useState(false);
  const [copiedHtmlCheck, setCopiedHtmlCheck] = useState(false);

  // ZIP Project Starter state
  const [zippingProgress, setZippingProgress] = useState<"idle" | "zipping" | "success" | "error">("idle");

  // Apply Presets helper
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setWebsiteOverview(preset.overview);
    setTargetKeywords(preset.keywords);
    setSelectedPages(preset.pages);
    setCssTheme(preset.css_theme);
    setDeploymentPlatform(preset.deployment_platform);
    setError(null);
  };

  const handlePageToggle = (page: string) => {
    if (selectedPages.includes(page)) {
      if (selectedPages.length > 1) {
        setSelectedPages(selectedPages.filter((p) => p !== page));
      }
    } else {
      setSelectedPages([...selectedPages, page]);
    }
  };

  const handleAddCustomPage = () => {
    const trimmed = customPageInput.trim();
    if (trimmed && !selectedPages.includes(trimmed)) {
      setSelectedPages([...selectedPages, trimmed]);
      setCustomPageInput("");
    }
  };

  // Triggers secondary settings consultant agent
  const handleQuerySettingsAgent = async (e: FormEvent) => {
    e.preventDefault();
    if (!agentPrompt.trim()) return;

    setAgentIsResponding(true);
    setAgentResponse(null);
    setAgentSuggestedConfig(null);

    try {
      const response = await fetch("/api/agent-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: agentPrompt,
          currentSettings: {
            website_overview: websiteOverview,
            target_keywords: targetKeywords,
            page_details: selectedPages,
            css_theme: cssTheme,
            deployment_platform: deploymentPlatform
          }
        })
      });

      if (!response.ok) {
        throw new Error("Settings optimizer agent returned offline response.");
      }

      const parsed = await response.json();
      setAgentSuggestedConfig(parsed);
      setAgentResponse(parsed.explanation || "Settings optimized successfully.");
    } catch (err: any) {
      console.error(err);
      setAgentResponse(`Consultant offline: ${err.message || "Could not reach settings assistant."}`);
    } finally {
      setAgentIsResponding(false);
    }
  };

  const applyAgentSuggestions = () => {
    if (!agentSuggestedConfig) return;
    if (agentSuggestedConfig.website_overview) setWebsiteOverview(agentSuggestedConfig.website_overview);
    if (agentSuggestedConfig.target_keywords) setTargetKeywords(agentSuggestedConfig.target_keywords);
    if (agentSuggestedConfig.page_details) setSelectedPages(agentSuggestedConfig.page_details);
    if (agentSuggestedConfig.css_theme) setCssTheme(agentSuggestedConfig.css_theme);
    if (agentSuggestedConfig.deployment_platform) setDeploymentPlatform(agentSuggestedConfig.deployment_platform);
    
    // Clear agent overlay with a charming success feel
    setAgentSuggestedConfig(null);
    setAgentResponse(null);
    setAgentPrompt("");
  };

  // Main full-stack generate call
  const handleGenerateWebsiteStructure = async (e: FormEvent) => {
    e.preventDefault();
    if (!websiteOverview.trim() || !targetKeywords.trim() || selectedPages.length === 0) {
      setError("Please ensure Overview is input, Keywords exist, and at least one Page is checked.");
      return;
    }

    setLoading(true);
    setError(null);
    setWebsiteData(null);
    setImages({});
    setCheckedMilestones({});
    setActiveTab("blueprints");
    setSelectedBlueprintIndex(0);

    const steps = [
      "Securing master cloud sandbox session...",
      "Analyzing target seed keyword vectors and crawling metrics...",
      "Parsing requested page count and site routing structures...",
      "Connecting to full-stack Responses API endpoint...",
      "Synthesizing customized responsive HTML templates with mock contents...",
      "Validating output parameters to strict developer guidelines...",
      "Compiling main.js dynamic callbacks and meta data alt indices..."
    ];

    let currentStep = 0;
    setLoadingStep(steps[0]);

    const stepTimer = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setLoadingStep(steps[currentStep]);
      }
    }, 1100);

    try {
      const payload: WebsiteRequest = {
        website_overview: websiteOverview,
        target_keywords: targetKeywords,
        page_details: selectedPages,
        css_theme: cssTheme,
        deployment_platform: deploymentPlatform,
        provider: provider
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      clearInterval(stepTimer);

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Blueprint forging failed. Verify server key status.");
      }

      const generated = await res.json();
      setWebsiteData(generated);
    } catch (err: any) {
      clearInterval(stepTimer);
      console.error(err);
      setError(err.message || "An error occurred compiling the website blueprint workspace.");
    } finally {
      setLoading(false);
    }
  };

  // DALL-E image generation trigger
  const handleGenerateImagePart = async (prompt: string, index: number) => {
    setImages((prev) => ({
      ...prev,
      [index]: { loading: true }
    }));

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Image builder timed out.");
      }

      const data = await res.json();
      setImages((prev) => ({
        ...prev,
        [index]: { loading: false, url: data.url }
      }));
    } catch (err: any) {
      console.error(err);
      setImages((prev) => ({
        ...prev,
        [index]: { loading: false, error: err.message || "Visual forge is offline. Set API KEY." }
      }));
    }
  };

  // Utility to copy to clipboard safely
  const copyTextToClipboard = (text: string, index: number | null = null, type: "concept" | "html" | "normal" = "normal") => {
    navigator.clipboard.writeText(text);
    if (type === "concept") {
      setCopiedConceptText(true);
      setTimeout(() => setCopiedConceptText(false), 2000);
    } else if (type === "html") {
      setCopiedHtmlCheck(true);
      setTimeout(() => setCopiedHtmlCheck(false), 2000);
    } else {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const toggleChecklistMilestone = (idx: number) => {
    setCheckedMilestones((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleDownloadZip = async () => {
    if (!websiteData) return;
    try {
      setZippingProgress("zipping");
      const zip = new JSZip();

      // Folder structure: css/style.css
      const cssContent = `/* Custom Theme Colors for ${websiteData.website_name} */
:root {
  --brand-primary: ${websiteData.styling.theme_palette.primary || "#3b82f6"};
  --brand-secondary: ${websiteData.styling.theme_palette.secondary || "#10b981"};
  --brand-background: ${websiteData.styling.theme_palette.background || "#ffffff"};
  --brand-text: ${websiteData.styling.theme_palette.text || "#334155"};
}

/* Helper Utilities */
.brand-primary { color: var(--brand-primary); }
.bg-brand-primary { background-color: var(--brand-primary); }
.brand-secondary { color: var(--brand-secondary); }
.bg-brand-secondary { background-color: var(--brand-secondary); }

${websiteData.styling.main_css || ""}
`;
      zip.folder("css")?.file("style.css", cssContent);

      // Folder structure: js/main.js
      const jsContent = `// Interaction scripts for ${websiteData.website_name}
// Generated via AI Studio Build

document.addEventListener('DOMContentLoaded', () => {
  console.log('"${websiteData.website_name}" interactive scripts initialized successfully.');
  
  ${websiteData.main_js || ""}
});
`;
      zip.folder("js")?.file("main.js", jsContent);

      // Create beautiful boilerplate wrapper for every HTML file
      websiteData.pages.forEach((page) => {
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.page_name} | ${websiteData.website_name}</title>
  <meta name="description" content="${websiteData.meta_info?.description || ""}">
  <!-- Tailwind Play CDN for interactive styling without high setup build steps -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              primary: '${websiteData.styling.theme_palette.primary || "#3b82f6"}',
              secondary: '${websiteData.styling.theme_palette.secondary || "#10b981"}',
              background: '${websiteData.styling.theme_palette.background || "#ffffff"}',
              text: '${websiteData.styling.theme_palette.text || "#334155"}'
            }
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <!-- Stylesheet custom overrides -->
  <link rel="stylesheet" href="css/style.css">
  <!-- Google Font: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
  </style>
</head>
<body class="bg-brand-background text-brand-text min-h-screen">

  <!-- ================= PAGE CONTENT START ================= -->
  ${page.html_template}
  <!-- ================= PAGE CONTENT END ================= -->

  <!-- Javascript entry bundle -->
  <script src="js/main.js"></script>
</body>
</html>
`;
        const sanitizedFileName = page.file_name || `${page.page_name.toLowerCase().replace(/\s+/g, "-")}.html`;
        zip.file(sanitizedFileName, fullHtml);
      });

      // README.md project guide
      const readmeContent = `# 🚀 ${websiteData.website_name} - Fully Generated Project Starter

Welcome to your custom web prototype and launch blueprints! This project packages high-performance HTML5, styling directives, and custom interaction signals built for scale.

## 📦 Project Contents

The package includes:
- **HTML layouts**: All core navigation sitemap pages (e.g. \`index.html\`) wrapped in clean Tailwind configurations.
- **\`css/style.css\`**: Inline custom stylesheets, custom theme coloring, and custom layout utility rules.
- **\`js/main.js\`**: Javascript scripts for user interactions and microdynamic behaviors.

## ⚙️ How To Run

No compilation, NPM commands, or server architecture required. 

### Method A: Single click (Preview)
Simply double click **\`index.html\`** or other HTML files in this folder to open them instantly in any web browser.

### Method B: Micro Static Server (Production simulation)
Run any basic routing server from within the root folder directory to support absolute links and secure script queries:

**Using NPM (Node.js)**:
\`\`\`bash
npx serve .
\`\`\`

**Using Python**:
\`\`\`bash
python -m http.server 8000
\`\`\`

## 📊 Campaign Targeting Profile
- Brand Name: **${websiteData.website_name}**
- Target Audience Focus: \`${websiteData.meta_info?.description || "Commercial Web Growth"}\`
- High-Value SEO Keywords: \`${targetKeywords || "SEO Optimization, User Intent Layout"}\`
- Palette Specification:
  - Primary Accent Color: \`${websiteData.styling.theme_palette.primary}\`
  - Secondary Accent Color: \`${websiteData.styling.theme_palette.secondary}\`
  - Background Base Canvas: \`${websiteData.styling.theme_palette.background}\`

*Generated via AI Studio Build.*
`;
      zip.file("README.md", readmeContent);

      // Generate ZIP and trigger local download
      const blob = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${websiteData.website_name.toLowerCase().replace(/\s+/g, "-")}-project-starter.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setZippingProgress("success");
      setTimeout(() => setZippingProgress("idle"), 3000);
    } catch (err) {
      console.error("ZIP packaging error:", err);
      setZippingProgress("error");
      setTimeout(() => setZippingProgress("idle"), 3000);
    }
  };

  // DYNAMIC COMPONENT - Math metric simulator based on keywords, page count, and deployment metrics
  const simulatedSEOMetrics = useMemo(() => {
    const defaultVal = {
      searchVolume: 2400,
      avgPosition: 4.8,
      ctr: 5.2,
      cvr: 2.3,
      clicks: 124,
      conversions: 3,
      difficulty: 45,
      chartData: [] as any[]
    };

    const targetKws = targetKeywords || "website development";
    const pagesCount = selectedPages.length || 1;
    const platform = deploymentPlatform;
    const theme = cssTheme;

    // Split target keywords to evaluate density and estimate search intensity
    const cleanKeywords = targetKws.split(",").map(k => k.trim()).filter(Boolean);
    const keywordCount = cleanKeywords.length || 1;
    const avgKeywordLength = cleanKeywords.reduce((acc, k) => acc + k.length, 0) / keywordCount || 10;

    // More pages provide dynamic crawls base, longer keywords rank easier
    const baseSearchVolume = Math.min(25000, Math.max(800, Math.floor(6500 * (pagesCount / 3.2) * (14 / Math.max(4, avgKeywordLength)))));
    
    // Ingress pipeline platform boost
    let platformFactor = 1.0;
    if (platform.includes("Cloud Run")) platformFactor = 1.20; // swift Docker routing 
    else if (platform.includes("Vercel")) platformFactor = 1.15; // fast CDN edge
    else if (platform.includes("Netlify")) platformFactor = 1.10;

    // CSS styling converts differently
    let conversionFactor = 2.2;
    if (theme.includes("Modern Minimalist")) conversionFactor = 2.75;
    else if (theme.includes("Slate Dark")) conversionFactor = 2.45;
    else if (theme.includes("Warm Editorial")) conversionFactor = 2.60;
    else if (theme.includes("Neobrutalist")) conversionFactor = 1.65; // high friction user UI

    const estimatedDifficulty = Math.min(99, Math.max(10, Math.floor((220 / Math.max(4, avgKeywordLength)) * 7 + (keywordCount * 4.5))));
    const estimatedAvgPosition = Math.max(1.1, parseFloat(((estimatedDifficulty / 18) + 1.2).toFixed(1)));

    // CTR curve
    let estimatedCTR = 2.2;
    if (estimatedAvgPosition < 1.8) estimatedCTR = 31.4;
    else if (estimatedAvgPosition < 2.5) estimatedCTR = 18.1;
    else if (estimatedAvgPosition < 3.8) estimatedCTR = 11.2;
    else if (estimatedAvgPosition < 5.0) estimatedCTR = 6.8;
    else if (estimatedAvgPosition < 7.0) estimatedCTR = 4.1;

    estimatedCTR = parseFloat((estimatedCTR * platformFactor).toFixed(2));
    const totalClicks = Math.floor(baseSearchVolume * (estimatedCTR / 100));

    const finalCVR = parseFloat((conversionFactor * (platformFactor * 0.96)).toFixed(2));
    const totalConversions = Math.floor(totalClicks * (finalCVR / 100));

    // Generate month projections
    const months = ["M1: Crawling", "M2: Indexing", "M3: Growth", "M4: Staged", "M5: Optimized", "M6: Peak"];
    const chartData = months.map((m, idx) => {
      const growthFactor = [0.15, 0.40, 0.62, 0.85, 1.0, 1.22][idx];
      const monthTraffic = Math.floor(totalClicks * growthFactor);
      const monthConversions = Math.max(1, Math.floor(monthTraffic * (finalCVR / 100)));
      return {
        name: m,
        "Simulated Traffic (Clicks)": monthTraffic,
        "Simulated Conversions": monthConversions
      };
    });

    return {
      searchVolume: baseSearchVolume,
      avgPosition: estimatedAvgPosition,
      ctr: estimatedCTR,
      cvr: finalCVR,
      clicks: totalClicks,
      conversions: totalConversions,
      difficulty: estimatedDifficulty,
      chartData
    };
  }, [targetKeywords, selectedPages, deploymentPlatform, cssTheme]);

  // Pre-set sharing copy structures tailored for platforms
  const defaultShareText = useMemo(() => {
    if (!websiteData) return "";
    
    const siteName = websiteData.website_name || "New Site";
    const keywordsList = targetKeywords || "business, seo, design";
    const keyHash = keywordsList.split(",").slice(0, 3).map(k => "#" + k.trim().replace(/\s+/g, "")).join(" ");
    const platform = deploymentPlatform || "Cloud Run";
    const overviewSummary = websiteOverview ? (websiteOverview.length > 80 ? websiteOverview.substring(0, 80) + "..." : websiteOverview) : "";
    
    const templates = {
      twitter: {
        hype: `🔥 My latest launch ${siteName} is live! Speed & design dialed perfectly for ${keywordsList.split(",")[0]}. Powered by ${platform}! Check the sitemaps at once! ${keyHash} #buildinpublic`,
        professional: `🚀 Excited to release the official wireframe and SEO launch map for ${siteName}. Structured specifically to discover organic search traffic on key terms: ${keywordsList}. Platform: ${platform}. ${keyHash}`,
        minimalist: `Release announcement: ${siteName}. Functional blueprint, tailored styling, search indexes prepared. ${keyHash}`,
        educational: `💡 Designing a website? See how we structured ${siteName}'s sitemaps and page routes to maximize crawlability and Lighthouse scores under ${platform}. ${keyHash}`
      },
      linkedin: {
        hype: `🚀 THE FUTURE OF FAST DEPLOYMENTS IS HERE! I am extremely excited to share our brand-new website architecture blueprint: ${siteName}.\n\nFormulated with custom layout configurations, semantic SEO mapping targeting "${keywordsList}", and high priority assets. Live metrics optimized for ${platform}.\n\nTake a look inside ConceptStudio AI! ${keyHash} #marketing #branding`,
        professional: `📈 I am pleased to share the comprehensive website layout and SEO sitemap blueprint for ${siteName}.\n\nOur architecture focuses heavily on organic search engine signals matching high-intent queries like "${keywordsList}" and is constructed for extreme-speed performance on ${platform}. We have established full HTML page wireframes with interactive scripts. Feedback welcome. ${keyHash} #SEOGrowth #WebDesign`,
        minimalist: `A brief look into our latest production-grade sitemap wireframes for ${siteName}. Styled under standard guidelines, lightweight structure, tailored and fast. ${keyHash} #webdevelopment`,
        educational: `📊 Successful web initiatives start at the core schema level. For ${siteName}, we built a detailed page index matching user intent for: ${keywordsList}.\n\nSee our performance simulators and structured html previews. Built for speed on ${platform}. ${keyHash} #SitemapGuide #Crawlability`
      },
      facebook: {
        hype: `✨ It is happening! Check out our next-generation web blueprint for ${siteName}! ⚡ Formulated with awesome aesthetic color systems and target SEO optimization for key search words: ${keywordsList}! Ready to rock.`,
        professional: `We have finalized the core sitemap layout and descriptive copy assets for ${siteName}. This responsive map targets strategic search keywords (${keywordsList}) to drive organic traction. ${keyHash}`,
        minimalist: `Fresh layout launch plan: ${siteName}. Fluid styling, simple interface, and complete meta descriptors.`,
        educational: `Did you know page load speed is a massive rank signal? That is why our sitemap for ${siteName} features optimized assets, clean inline blocks, and edge hosting ready. Take a peek!`
      },
      pinterest: {
        hype: `Incredible website design layout ideas for ${siteName}! Features custom high contrast aesthetic pairings. Beautiful page mockups. ${keyHash}`,
        professional: `Sophisticated digital blueprint for ${siteName}. Mapped page blocks, clear conversion widgets, and custom branding palette guidelines.`,
        minimalist: `Aesthetic, minimal website sitemap design structure: ${siteName}. Super clean.`,
        educational: `Guide: How to structure a high-converting landing page. Visual hierarchy mockup blueprint for ${siteName}.`
      }
    };
    
    return templates[selectedMarketingPlatform]?.[marketingTone] || templates.twitter.professional;
  }, [websiteData, selectedMarketingPlatform, marketingTone, targetKeywords, deploymentPlatform, websiteOverview]);

  const activeShareText = userHasEditedText ? editedShareText : defaultShareText;

  // Sync handles with localStorage
  const updateHandles = (platform: "twitter" | "facebook" | "linkedin" | "pinterest", value: string) => {
    if (platform === "twitter") {
      setTwitterHandle(value);
      localStorage.setItem("marketing_twitter_handle", value);
    } else if (platform === "facebook") {
      setFacebookPage(value);
      localStorage.setItem("marketing_facebook_page", value);
    } else if (platform === "linkedin") {
      setLinkedinName(value);
      localStorage.setItem("marketing_linkedin_name", value);
    } else if (platform === "pinterest") {
      setPinterestUser(value);
      localStorage.setItem("marketing_pinterest_user", value);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Dynamic Header Hub */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
              <Layers className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-black uppercase tracking-wider text-slate-800 font-display">ConceptStudio AI</span>
                <span className="text-[9px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">WEB SHEETS</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Full-Stack Site Architect Pipeline</p>
            </div>
          </div>

          {/* Core Latency / Engine Status */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-slate-600 font-mono">Gemini 3.5 Fallback Ready</span>
            </div>
            <div className="hidden sm:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[10px] text-slate-600 font-mono">OpenAI structured Responses API v4</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Workspace Intro Card */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative max-w-2xl space-y-3">
            <span className="text-[10px] font-mono bg-blue-500/25 text-blue-300 border border-blue-400/20 px-3 py-1 rounded-full uppercase tracking-widest font-bold">
              WORKSPACE ACTIVE
            </span>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight leading-none text-white">
              Sitemap & Website Builder
            </h1>
            <p className="text-sm text-slate-350 leading-relaxed font-sans">
              Deploy high-conversion SEO sitemaps configured with complete responsive HTML structures, custom scripts, external stylesheet links, semantic layouts, launch checklists, and real-time organic traffic projections.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 font-medium mr-2">Click template specs to pre-populate inputs:</span>
            {PRESETS.map((preset, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => applyPreset(preset)}
                className="text-xs bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-500 transition px-3.5 py-1.5 rounded-xl text-slate-300 font-medium cursor-pointer"
              >
                {preset.title.split(" ")[0]} {preset.title.split(" ").slice(1, 3).join(" ")}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Inputs Layout (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Input Specifications Module */}
            <section className="bg-white rounded-3xl border border-shadow border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h2 className="text-md font-extrabold text-slate-800 tracking-tight">Technical Specifications</h2>
                </div>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setProvider("openai")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      provider === "openai" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    GPT-4o
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("gemini")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      provider === "gemini" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    Gemini 3.5
                  </button>
                </div>
              </div>

              <form onSubmit={handleGenerateWebsiteStructure} className="space-y-5">
                {/* Website Overview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label id="lbl-overview" htmlFor="overview-textarea" className="text-xs font-bold text-slate-700 tracking-tight">Website Overview</label>
                    <span className="text-[10px] text-slate-400 font-mono">Main value proposition</span>
                  </div>
                  <textarea
                    id="overview-textarea"
                    aria-describedby="lbl-overview"
                    value={websiteOverview}
                    onChange={(e) => setWebsiteOverview(e.target.value)}
                    placeholder="We are building a bespoke organic nutrition store that focuses heavily on custom matcha..."
                    rows={4}
                    className="w-full text-xs font-sans p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>

                {/* Primary SEO Keywords */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="keywords-input" className="text-xs font-bold text-slate-700 tracking-tight">Target SEO Keywords</label>
                    <span className="text-[10px] text-slate-400 font-mono">Comma-separated</span>
                  </div>
                  <input
                    id="keywords-input"
                    type="text"
                    value={targetKeywords}
                    onChange={(e) => setTargetKeywords(e.target.value)}
                    placeholder="e.g. organic matcha, premium tea powder, biohacking watch"
                    className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* CSS Styling Theme */}
                  <div className="space-y-1.5">
                    <label htmlFor={uniqThemeId} className="text-xs font-bold text-slate-700 tracking-tight">Design Theme Style</label>
                    <select
                      id={uniqThemeId}
                      value={cssTheme}
                      onChange={(e) => setCssTheme(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden transition font-medium"
                    >
                      {CSS_THEMES.map((theme, i) => (
                        <option key={i} value={theme}>{theme}</option>
                      ))}
                    </select>
                  </div>

                  {/* Deployment Platform */}
                  <div className="space-y-1.5">
                    <label htmlFor={uniqPlatId} className="text-xs font-bold text-slate-700 tracking-tight">Deployment Ingress</label>
                    <select
                      id={uniqPlatId}
                      value={deploymentPlatform}
                      onChange={(e) => setDeploymentPlatform(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden transition font-medium"
                    >
                      {DEPLOYMENT_PLATFORMS.map((plat, i) => (
                        <option key={i} value={plat}>{plat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Page Selection checkboxes */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 tracking-tight">Site Routing (Selected Pages)</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{selectedPages.length} pages structured</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 max-h-36 overflow-y-auto">
                    {AVAILABLE_PAGES.map((page, idx) => {
                      const isChecked = selectedPages.includes(page);
                      return (
                        <button
                          type="button"
                          key={idx}
                          role="checkbox"
                          aria-checked={isChecked}
                          onClick={() => handlePageToggle(page)}
                          className={`flex items-center justify-center p-2 rounded-lg text-[10px] font-bold border transition cursor-pointer select-none ${
                            isChecked
                              ? "bg-blue-605 bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Page */}
                  <div className="flex space-x-2">
                    <input
                      id={uniqPageId}
                      type="text"
                      aria-label="Custom page title"
                      value={customPageInput}
                      onChange={(e) => setCustomPageInput(e.target.value)}
                      placeholder="e.g. Portfolio Gallery, Career"
                      className="flex-1 text-[11px] p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomPage}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Add Page
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs tracking-wide rounded-2xl transition shadow-md shadow-blue-200 flex items-center justify-center space-x-2 select-none cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Forging Studio Blueprint...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Forge Website Code Blueprint</span>
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* SECOND AGENT: PixelSEO Assistant (Consultant/Optimizer Sidebar Widget) */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-800">PixelSEO Consultant</h2>
                    <p className="text-[9px] text-slate-400 font-mono">Agent #2 · Setting Tuning Expert</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  ● ONLINE
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed leading-relaxed font-sans">
                Tell PixelSEO Agent what site you want to refine, and the agent will automatically optimize your keywords, overview, and platform selection variables.
              </p>

              <form onSubmit={handleQuerySettingsAgent} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    placeholder="e.g. Suggest killers keys for an eco boutique"
                    className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={agentIsResponding || !agentPrompt.trim()}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer disabled:opacity-40"
                  >
                    {agentIsResponding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              {/* Speech box response from Agent */}
              <AnimatePresence mode="wait">
                {agentResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-3.5 space-y-3"
                  >
                    <div className="flex items-start space-x-2.5 text-xs text-slate-700 leading-relaxed">
                      <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="font-sans text-[11px] font-medium leading-relaxed">
                        <em>{agentResponse}</em>
                      </p>
                    </div>

                    {agentSuggestedConfig && (
                      <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800">New optimized specs prepared!</span>
                        <button
                          type="button"
                          onClick={applyAgentSuggestions}
                          className="text-[10px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg border border-emerald-500 shadow-xs cursor-pointer"
                        >
                          Apply Agent's Recommendations
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          {/* Right Panel: Output Results Panel (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[520px]">
            
            <div className="bg-white rounded-3xl border border-slate-250/80 shadow-xs overflow-hidden h-full flex flex-col justify-start">
              
              <AnimatePresence mode="wait">
                {websiteData ? (
                  <motion.div
                    key="content-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col h-full"
                  >
                    
                    {/* Header bar on campaign output card */}
                    <div className="bg-slate-50 p-4 border-b border-slate-200/85 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-blue-600 font-mono uppercase tracking-widest block font-extrabold">
                          DEPLOYMENT PIPELINE READY
                        </span>
                        <h2 className="text-lg font-display font-extrabold text-slate-950 tracking-tight">
                          {websiteData.website_name}
                        </h2>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="hidden sm:inline-block text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-250/70 px-2.5 py-1.5 rounded-xl font-bold shadow-xs">
                          {websiteData.generated_by || "AI Studio Build"}
                        </span>
                        <button
                          type="button"
                          onClick={handleDownloadZip}
                          disabled={zippingProgress === "zipping"}
                          className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition duration-150 select-none shadow-xs border cursor-pointer ${
                            zippingProgress === "zipping"
                              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                              : zippingProgress === "success"
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : zippingProgress === "error"
                              ? "bg-rose-600 border-rose-600 text-white"
                              : "bg-blue-600 border-blue-700 text-white hover:bg-blue-700 active:scale-95"
                          }`}
                        >
                          {zippingProgress === "zipping" ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Zipping Starter...</span>
                            </>
                          ) : zippingProgress === "success" ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Downloaded!</span>
                            </>
                          ) : zippingProgress === "error" ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Zipping Failed</span>
                            </>
                          ) : (
                            <>
                              <FolderArchive className="w-3.5 h-3.5 shrink-0" />
                              <span>Download ZIP Starter</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Navbar Tabs for Output Blueprint */}
                    <div className="border-b border-slate-200 bg-slate-50/40 flex overflow-x-auto min-h-12 scrollbar-none scroll-smooth">
                      <button
                        type="button"
                        onClick={() => setActiveTab("blueprints")}
                        className={`flex-1 min-w-[124px] px-4 py-3 text-xs font-bold border-b-2 transition duration-200 flex items-center justify-center space-x-1 px-4 cursor-pointer ${
                          activeTab === "blueprints"
                            ? "border-blue-600 text-blue-600 bg-slate-100/40"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Layout className="w-3.5 h-3.5 shrink-0" />
                        <span>HTML Files</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("styling")}
                        className={`flex-1 min-w-[124px] px-4 py-3 text-xs font-bold border-b-2 transition duration-200 flex items-center justify-center space-x-1 px-4 cursor-pointer ${
                          activeTab === "styling"
                            ? "border-blue-600 text-blue-600 bg-slate-100/40"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Code className="w-3.5 h-3.5 shrink-0" />
                        <span>Main.css & JS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("seo")}
                        className={`flex-1 min-w-[124px] px-4 py-3 text-xs font-bold border-b-2 transition duration-200 flex items-center justify-center space-x-1 px-4 cursor-pointer ${
                          activeTab === "seo"
                            ? "border-blue-600 text-blue-600 bg-slate-100/40"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>SEO Copies</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("simulator")}
                        className={`flex-1 min-w-[124px] px-4 py-3 text-xs font-bold border-b-2 transition duration-200 flex items-center justify-center space-x-1 px-4 cursor-pointer ${
                          activeTab === "simulator"
                            ? "border-blue-600 text-blue-600 bg-slate-100/40"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5 shrink-0" />
                        <span>SEO Simulator</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("milestones")}
                        className={`flex-1 min-w-[124px] px-4 py-3 text-xs font-bold border-b-2 transition duration-200 flex items-center justify-center space-x-1 px-4 cursor-pointer ${
                          activeTab === "milestones"
                            ? "border-blue-600 text-blue-600 bg-slate-100/40"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <ListChecks className="w-3.5 h-3.5 shrink-0" />
                        <span>Launch Audit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("images")}
                        className={`flex-1 min-w-[124px] px-4 py-3 text-xs font-bold border-b-2 transition duration-200 flex items-center justify-center space-x-1 px-4 cursor-pointer ${
                          activeTab === "images"
                            ? "border-blue-600 text-blue-600 bg-slate-100/40"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>Visual Forge</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("marketing")}
                        className={`flex-1 min-w-[124px] px-4 py-3 text-xs font-bold border-b-2 transition duration-200 flex items-center justify-center space-x-1 px-4 cursor-pointer ${
                          activeTab === "marketing"
                            ? "border-blue-600 text-blue-600 bg-slate-100/40"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Share2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Marketing Board</span>
                      </button>
                    </div>

                    {/* Tab Body Contents */}
                    <div className="p-6 overflow-y-auto max-h-[85vh] h-full">

                      {/* TAB 1: HTML templates with sub page navigation */}
                      {activeTab === "blueprints" && (
                        <motion.div
                          key="tab-blueprints"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Readable HTML Prototypes</h3>
                              <p className="text-[11px] text-slate-500 font-sans">Toggle generated static layouts below:</p>
                            </div>
                            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                              {websiteData.pages.length} Pages Created
                            </span>
                          </div>

                          {/* Sub Tabs For HTML Pages */}
                          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                            {websiteData.pages.map((p, idx) => (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => setSelectedBlueprintIndex(idx)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer select-none ${
                                  selectedBlueprintIndex === idx
                                    ? "bg-white text-slate-900 shadow-md"
                                    : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                {p.page_name} ({p.file_name})
                              </button>
                            ))}
                          </div>

                          {/* Live Dynamic IFrame Render */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-blue-600 uppercase tracking-widest block font-extrabold">
                              Live Interactive Blueprint Preview
                            </span>
                            <div className="w-full h-80 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative">
                              <iframe
                                title="Website Structure Layout Preview"
                                srcDoc={`
                                  <html>
                                    <head>
                                      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css">
                                      <style>
                                        body {
                                          font-family: 'Inter', system-ui, sans-serif;
                                          background-color: ${websiteData.styling.theme_palette.background || "#ffffff"};
                                          color: ${websiteData.styling.theme_palette.text || "#334155"};
                                        }
                                        .brand-primary { color: ${websiteData.styling.theme_palette.primary || "#3b82f6"}; }
                                        .bg-brand-primary { background-color: ${websiteData.styling.theme_palette.primary || "#3b82f6"}; }
                                        .brand-secondary { color: ${websiteData.styling.theme_palette.secondary || "#10b981"}; }
                                        ${websiteData.styling.main_css || ""}
                                      </style>
                                    </head>
                                    <body class="p-0 m-0">
                                      ${websiteData.pages[selectedBlueprintIndex]?.html_template || "<div>Mock Layout is empty.</div>"}
                                      <script>
                                        ${websiteData.main_js || ""}
                                      </script>
                                    </body>
                                  </html>
                                `}
                                className="w-full h-full border-0"
                              />
                            </div>
                          </div>

                          {/* Raw HTML Code Box */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-blue-600 uppercase tracking-widest block font-extrabold">
                                Raw {websiteData.pages[selectedBlueprintIndex]?.file_name} HTML markup
                              </span>
                              <button
                                type="button"
                                onClick={() => copyTextToClipboard(websiteData.pages[selectedBlueprintIndex]?.html_template || "", null, "html")}
                                className="text-xs text-slate-600 hover:text-slate-950 transition flex items-center space-x-1 p-1 bg-slate-100 border border-slate-200 rounded cursor-pointer"
                              >
                                {copiedHtmlCheck ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Template</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-[10px] leading-relaxed rounded-2xl overflow-x-auto max-h-80 border border-slate-800">
                              <code>
                                {websiteData.pages[selectedBlueprintIndex]?.html_template}
                              </code>
                            </pre>
                          </div>

                          {/* Page Image Alt Tags and Meta description */}
                          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                            <h4 className="text-xs font-bold text-blue-800 flex items-center">
                              <Info className="w-4 h-4 mr-1 text-blue-600" />
                              Required SEO Image Alt Tags (Page Slot Level)
                            </h4>
                            <ul className="list-disc leading-relaxed pl-5 text-xs text-slate-700 space-y-1">
                              {websiteData.pages[selectedBlueprintIndex]?.alt_text_suggestions?.map((alt, idx) => (
                                <li key={idx} className="italic">"{alt}"</li>
                              ))}
                            </ul>
                          </div>

                        </motion.div>
                      )}

                      {/* TAB 2: Custom CSS & JavaScript scripts */}
                      {activeTab === "styling" && (
                        <motion.div
                          key="tab-styling"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="space-y-6"
                        >
                          {/* Palette Details */}
                          <div className="space-y-2.5">
                            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Theme Color Palette</h3>
                            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                              <div className="flex flex-col items-center space-y-1">
                                <div className="w-10 h-10 rounded-xl shadow-xs border border-slate-300" style={{ backgroundColor: websiteData.styling.theme_palette.primary }} />
                                <span className="text-[10px] font-bold text-slate-700">Primary</span>
                                <span className="text-[9px] font-mono text-slate-500 uppercase">{websiteData.styling.theme_palette.primary}</span>
                              </div>
                              <div className="flex flex-col items-center space-y-1">
                                <div className="w-10 h-10 rounded-xl shadow-xs border border-slate-300" style={{ backgroundColor: websiteData.styling.theme_palette.secondary }} />
                                <span className="text-[10px] font-bold text-slate-700">Secondary</span>
                                <span className="text-[9px] font-mono text-slate-500 uppercase">{websiteData.styling.theme_palette.secondary}</span>
                              </div>
                              <div className="flex flex-col items-center space-y-1">
                                <div className="w-10 h-10 rounded-xl shadow-xs border border-slate-300" style={{ backgroundColor: websiteData.styling.theme_palette.background }} />
                                <span className="text-[10px] font-bold text-slate-700">BG Canvas</span>
                                <span className="text-[9px] font-mono text-slate-500 uppercase">{websiteData.styling.theme_palette.background}</span>
                              </div>
                              <div className="flex flex-col items-center space-y-1">
                                <div className="w-10 h-10 rounded-xl shadow-xs border border-slate-300" style={{ backgroundColor: websiteData.styling.theme_palette.text }} />
                                <span className="text-[10px] font-bold text-slate-700">Font Canvas</span>
                                <span className="text-[9px] font-mono text-slate-500 uppercase">{websiteData.styling.theme_palette.text}</span>
                              </div>
                            </div>
                          </div>

                          {/* CSS Library block */}
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                            <span className="text-[10px] font-mono text-blue-600 uppercase tracking-widest block font-bold mb-1">
                              External CSS Library Import
                            </span>
                            <blockquote className="text-xs font-mono text-slate-700">
                              {websiteData.styling.css_library}
                            </blockquote>
                          </div>

                          {/* Main.css code block */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-blue-600 uppercase tracking-widest block font-extrabold">
                                Main.css stylesheet rules
                              </span>
                              <button
                                type="button"
                                onClick={() => copyTextToClipboard(websiteData.styling.main_css, 888)}
                                className="text-xs text-slate-600 hover:text-slate-950 transition flex items-center space-x-1 text-[11px]"
                              >
                                {copiedIndex === 888 ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>Copy CSS</span>
                              </button>
                            </div>
                            <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-[10px] leading-relaxed rounded-2xl overflow-x-auto max-h-60 border border-slate-800">
                              <code>{websiteData.styling.main_css}</code>
                            </pre>
                          </div>

                          {/* Main.js library blocks */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-blue-600 uppercase tracking-widest block font-extrabold">
                                Main.js interactive library
                              </span>
                              <button
                                type="button"
                                onClick={() => copyTextToClipboard(websiteData.main_js, 999)}
                                className="text-xs text-slate-600 hover:text-slate-950 transition flex items-center space-x-1 text-[11px]"
                              >
                                {copiedIndex === 999 ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>Copy JS</span>
                              </button>
                            </div>
                            <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-[10px] leading-relaxed rounded-2xl overflow-x-auto max-h-60 border border-slate-800">
                              <code>{websiteData.main_js}</code>
                            </pre>
                          </div>

                        </motion.div>
                      )}

                      {/* TAB 3: Heading & copy block variants optimized for SEO */}
                      {activeTab === "seo" && (
                        <motion.div
                          key="tab-seo"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="space-y-5"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-800">Landing SEO Copy Blocks</h3>
                              <p className="text-[11px] text-slate-500 font-sans">Headline/Body variations optimized for target keywords:</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {websiteData.seo_components.heading_variants.map((variant, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-blue-300 transition rounded-2xl p-5 relative group"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-[10px] font-mono bg-blue-105 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                                    Variation #{idx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyTextToClipboard(`H1: ${variant.heading}\nBody: ${variant.body_block}`, idx)}
                                    className="text-slate-500 hover:text-slate-950 transition opacity-100 sm:opacity-0 group-hover:opacity-100 p-1.5 bg-white shadow-sm border border-slate-200 rounded cursor-pointer"
                                  >
                                    {copiedIndex === idx ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="text-base font-display font-extrabold text-slate-900 leading-snug">
                                    {variant.heading}
                                  </h4>
                                  <p className="text-xs text-slate-600 leading-relaxed leading-relaxed font-sans whitespace-pre-line">
                                    {variant.body_block}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-4 border-t border-slate-100">
                            <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest block font-bold mb-1">
                              General Head Tag Optimization Summary
                            </span>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs leading-relaxed leading-relaxed leading-relaxed text-slate-700">
                              <p><strong>SEO Page Title:</strong> {websiteData.meta_info.title}</p>
                              <p><strong>Meta Description Suggestions:</strong> {websiteData.meta_info.description}</p>
                              <p className="italic text-slate-500 font-mono text-[10px]">{websiteData.alt_text_meta_description}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* TAB 4: Core SEO Metrics Simulator & Analytics projection with Recharts */}
                      {activeTab === "simulator" && (
                        <motion.div
                          key="tab-simulator"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-800">SEO Metric Simulator</h3>
                              <p className="text-[11px] text-slate-500 font-sans">Simulated performance vectors based on target keywords:</p>
                            </div>
                          </div>

                          {/* Stat Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Est. Search Vol</span>
                              <span className="text-lg font-black text-slate-950 tracking-tight">{simulatedSEOMetrics.searchVolume}</span>
                              <span className="text-[9px] block text-slate-400 font-mono">Monthly total searches</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Avg. Rank Pos</span>
                              <span className="text-lg font-black text-slate-950 tracking-tight">#{simulatedSEOMetrics.avgPosition}</span>
                              <span className="text-[9px] block text-slate-400 font-mono">Simulated index target</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Estimated CTR</span>
                              <span className="text-lg font-black text-emerald-600 tracking-tight">{simulatedSEOMetrics.ctr}%</span>
                              <span className="text-[9px] block text-slate-400 font-mono">Speed factor optimized</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Simulated CVR</span>
                              <span className="text-lg font-black text-blue-600 tracking-tight">{simulatedSEOMetrics.cvr}%</span>
                              <span className="text-[9px] block text-slate-400 font-mono">Style palette factor</span>
                            </div>
                          </div>

                          {/* Recharts Traffic Projection Chart */}
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl space-y-2">
                            <span className="text-[10px] font-mono text-blue-600 uppercase tracking-widest block font-extrabold">
                              6-Month Organic Traffic & conversions Curve
                            </span>
                            <div className="w-full h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={simulatedSEOMetrics.chartData}
                                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                  <defs>
                                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorConvs" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e2e8f0" }} />
                                  <Legend wrapperStyle={{ fontSize: 10 }} />
                                  <Area type="monotone" dataKey="Simulated Traffic (Clicks)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClicks)" strokeWidth={2.5} />
                                  <Area type="monotone" dataKey="Simulated Conversions" stroke="#10b981" fillOpacity={1} fill="url(#colorConvs)" strokeWidth={2.5} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Assumptions and Limitations Column Section REQUIRED */}
                          <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-5 space-y-3">
                            <h4 className="text-xs font-bold text-blue-950 flex items-center">
                              <Info className="w-4 h-4 mr-1 text-blue-600" />
                              Simulation Parameters: Assumptions & Limitations
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
                              <div className="space-y-1.5">
                                <span className="font-bold text-blue-900 block font-mono text-[10px] uppercase">1. Core Assumptions</span>
                                <p><strong>Search Layout:</strong> Employs position-by-position organic CTR algorithms extracted from aggregated SERP click streams on commercial search terms.</p>
                                <p><strong>Infrastructure Boost:</strong> Modifies ranking curves assuming standard lighthouse score above 90 (attained through lightweight server environments like Cloud Run & Vercel edge caching).</p>
                              </div>
                              <div className="space-y-1.5">
                                <span className="font-bold text-indigo-900 block font-mono text-[10px] uppercase">2. Model Limitations</span>
                                <p><strong>Algorithm Shifts:</strong> Search engines modify crawler ranking factors hundreds of times yearly. Static projections cannot account for unexpected system changes.</p>
                                <p><strong>Competitor Bidding:</strong> Aggressive paid PPC competitor campaigns bid-competing for similar target keywords will deplete prospective organic CTRs drastically.</p>
                              </div>
                            </div>
                          </div>

                        </motion.div>
                      )}

                      {/* TAB 5: Launch checklist milestones */}
                      {activeTab === "milestones" && (
                        <motion.div
                          key="tab-milestones"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center space-x-3 text-xs text-slate-700">
                            <Info className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Interactive Launch Milestones. Complete checklist items below to verify publication steps:</span>
                          </div>

                          <div className="space-y-2.5">
                            {websiteData.launch_checklist.map((item, idx) => {
                              const isChecked = !!checkedMilestones[idx];
                              return (
                                <button
                                  type="button"
                                  key={idx}
                                  onClick={() => toggleChecklistMilestone(idx)}
                                  className={`w-full text-left p-4 rounded-xl border transition flex items-center space-x-3.5 cursor-pointer select-none ${
                                    isChecked
                                      ? "bg-slate-50 border-slate-200/60 opacity-60 text-slate-500"
                                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50/50"
                                  }`}
                                >
                                  <div
                                    className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                                      isChecked
                                        ? "bg-emerald-600 border-emerald-500 text-white"
                                        : "border-slate-300 bg-white"
                                    }`}
                                  >
                                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                  </div>
                                  <span className={`text-[13px] font-semibold tracking-tight ${isChecked ? "line-through text-slate-405" : "text-slate-800"}`}>
                                    {item}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {/* TAB 6: DALL-E image prompt slots and active asset forge */}
                      {activeTab === "images" && (
                        <motion.div
                          key="tab-images"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="space-y-6"
                        >
                          <div>
                            <h3 className="text-xs font-mono text-blue-600 uppercase tracking-wider font-bold block mb-1">
                              Creative direction prompts & visuals
                            </h3>
                            <p className="text-xs text-slate-500 font-sans">
                              These visual sets represent high-end photography briefs generated dynamically based on chosen CSS themes. Click "Forge Visual" to generate real-time commercial image assets.
                            </p>
                          </div>

                          <div className="space-y-4">
                            {websiteData.image_prompts.map((prompt, idx) => {
                              const imgState = images[idx] || { loading: false };
                              return (
                                <div
                                  key={idx}
                                  className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden p-5 flex flex-col md:flex-row gap-5 items-start md:items-center"
                                >
                                  {/* Left visual mock box */}
                                  <div className="w-full md:w-40 h-40 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shrink-0 shadow-xs">
                                    {imgState.loading ? (
                                      <div className="flex flex-col items-center space-y-2.5 p-3 text-center">
                                        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                                        <span className="text-[10px] text-slate-500 font-mono">DALL-E 3 crafting...</span>
                                      </div>
                                    ) : imgState.url ? (
                                      <a
                                        href={imgState.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full block group"
                                      >
                                        <img
                                          src={imgState.url}
                                          alt={`DALL-E Generated Site Illustration Asset ${idx + 1}`}
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover transition duration-350 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                          <span className="text-[10px] uppercase font-mono tracking-wider font-bold flex items-center text-white">
                                            Open Original <ExternalLink className="w-3 h-3 ml-1" />
                                          </span>
                                        </div>
                                      </a>
                                    ) : (
                                      <div className="flex flex-col items-center space-y-1.5 p-3 text-center text-slate-450 select-none">
                                        <ImageIcon className="w-6 h-6 text-slate-300" />
                                        <span className="text-[10px] font-semibold font-mono text-slate-400">Section Slot #{idx + 1} Visual</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right visual prompt specifications */}
                                  <div className="flex-1 space-y-3 w-full">
                                    <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-150 px-2.5 py-0.5 rounded uppercase tracking-wider font-bold">
                                      Asset Prompt Slot #{idx + 1}
                                    </span>
                                    <p className="text-xs text-slate-600 italic font-mono bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                                      "{prompt}"
                                    </p>

                                    {imgState.error && (
                                      <p className="text-xs text-rose-600 flex items-center font-medium">
                                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> {imgState.error}
                                      </p>
                                    )}

                                    {!imgState.url && !imgState.loading && (
                                      <button
                                        type="button"
                                        onClick={() => handleGenerateImagePart(prompt, idx)}
                                        className="h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                                      >
                                        <Sparkles className="w-3 h-3 text-white" />
                                        <span>Forge Visual</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        </motion.div>
                      )}

                      {/* TAB 7: Social Media Marketing Board */}
                      {activeTab === "marketing" && (
                        <motion.div
                          key="tab-marketing"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="space-y-8"
                        >
                          <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Social Media Campaign Launcher</h3>
                            <p className="text-[11px] text-slate-500 font-sans">
                              Configure brand profiles, generate platform-optimized drafts, attach commercial photography, and launch posts directly in 1-click.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                            {/* Column 1: Profiles & Configuration (5 cols) */}
                            <div className="xl:col-span-5 space-y-6">
                              
                              {/* SOCIAL PROFILES CARD */}
                              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center">
                                  <Settings className="w-4 h-4 mr-1.5 text-blue-600" />
                                  1. Connected Brand Handles
                                </h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                  These profile handles are securely stored in your workspace to brand custom live post mockups.
                                </p>
                                
                                <div className="space-y-3 pt-1">
                                  {/* Twitter Handle */}
                                  <div className="space-y-1">
                                    <label htmlFor="input-twitter" className="text-[10px] font-bold text-slate-700 flex justify-between">
                                      <span>X (Twitter) Username</span>
                                      <span className="text-slate-400 font-normal">Stored locally</span>
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-405 text-slate-500 font-semibold">@</span>
                                      <input
                                        id="input-twitter"
                                        type="text"
                                        value={twitterHandle}
                                        onChange={(e) => updateHandles("twitter", e.target.value)}
                                        placeholder="MyBrand"
                                        className="w-full text-xs p-2.5 pl-7 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                                      />
                                    </div>
                                  </div>

                                  {/* LinkedIn Profile */}
                                  <div className="space-y-1">
                                    <label htmlFor="input-linkedin" className="text-[10px] font-bold text-slate-700">LinkedIn Author / Brand Name</label>
                                    <input
                                      id="input-linkedin"
                                      type="text"
                                      value={linkedinName}
                                      onChange={(e) => updateHandles("linkedin", e.target.value)}
                                      placeholder="Brand Founder"
                                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                                    />
                                  </div>

                                  {/* Facebook Page */}
                                  <div className="space-y-1">
                                    <label htmlFor="input-facebook" className="text-[10px] font-bold text-slate-700">Facebook Page Slug</label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-[10px] font-mono text-slate-400 font-bold">facebook.com/</span>
                                      <input
                                        id="input-facebook"
                                        type="text"
                                        value={facebookPage}
                                        onChange={(e) => updateHandles("facebook", e.target.value)}
                                        placeholder="mybrand.seo"
                                        className="w-full text-[11px] p-2.5 pl-24 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                                      />
                                    </div>
                                  </div>

                                  {/* Pinterest Hub */}
                                  <div className="space-y-1">
                                    <label htmlFor="input-pinterest" className="text-[10px] font-bold text-slate-700">Pinterest Username</label>
                                    <input
                                      id="input-pinterest"
                                      type="text"
                                      value={pinterestUser}
                                      onChange={(e) => updateHandles("pinterest", e.target.value)}
                                      placeholder="brandpulse_pins"
                                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* SHARING CONTROLS CARD */}
                              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center">
                                  <TrendingUp className="w-4 h-4 mr-1.5 text-emerald-600" />
                                  2. Campaign & Copy Configurator
                                </h4>

                                {/* Target Landing URL */}
                                <div className="space-y-1">
                                  <label htmlFor="input-campaign-url" className="text-[10px] font-bold text-slate-700">Target Shared Backlink URL</label>
                                  <input
                                    id="input-campaign-url"
                                    type="text"
                                    value={campaignUrl}
                                    onChange={(e) => setCampaignUrl(e.target.value)}
                                    placeholder="https://conceptstudio.ai/my-blueprint"
                                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-mono"
                                  />
                                </div>

                                {/* Platform Selector Row */}
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-slate-700 block">Switch Platform Engine</span>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {(["twitter", "linkedin", "facebook", "pinterest"] as const).map((plat) => (
                                      <button
                                        type="button"
                                        key={plat}
                                        onClick={() => setSelectedMarketingPlatform(plat)}
                                        className={`py-2 text-[10px] font-bold rounded-lg border transition capitalize cursor-pointer ${
                                          selectedMarketingPlatform === plat
                                            ? plat === "twitter" ? "bg-black text-white border-black" :
                                              plat === "linkedin" ? "bg-blue-750 bg-[#0a66c2] text-white border-[#0a66c2]" :
                                              plat === "facebook" ? "bg-[#1877f2] text-white border-[#1877f2]" :
                                              "bg-[#bd081c] text-white border-[#bd081c]"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                        }`}
                                      >
                                        {plat === "twitter" ? "X / Twitter" : plat}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Copy Tone Selector */}
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-slate-700 block">Preset Copy Writing Tone</span>
                                  <select
                                    value={marketingTone}
                                    onChange={(e) => {
                                      setMarketingTone(e.target.value as any);
                                      setUserHasEditedText(false); // Reset custom edits so it auto-loads
                                    }}
                                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                                  >
                                    <option value="professional">🎯 Corporate Professional</option>
                                    <option value="hype">🔥 High Excitement / Hype</option>
                                    <option value="minimalist">📝 Short / Minimalist</option>
                                    <option value="educational">💡 Informative / Educational</option>
                                  </select>
                                </div>

                                {/* Attached Image Type */}
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-slate-700 block">Media Attachment Choice</span>
                                  
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setAttachedImageType("none")}
                                      className={`py-1.5 text-[9px] font-bold rounded-lg border cursor-pointer ${
                                        attachedImageType === "none"
                                          ? "bg-slate-900 border-slate-950 text-white"
                                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      No Image
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAttachedImageType("generated")}
                                      className={`py-1.5 text-[9px] font-bold rounded-lg border cursor-pointer ${
                                        attachedImageType === "generated"
                                          ? "bg-slate-900 border-slate-950 text-white"
                                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      Visual Forge
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAttachedImageType("uploaded")}
                                      className={`py-1.5 text-[9px] font-bold rounded-lg border cursor-pointer ${
                                        attachedImageType === "uploaded"
                                          ? "bg-slate-900 border-slate-950 text-white"
                                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      Custom Preferred
                                    </button>
                                  </div>

                                  {/* Content for Generated Type (Visual Forge Slot) */}
                                  {attachedImageType === "generated" && (
                                    <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                                      <span className="text-[9px] font-bold text-slate-500 block">Choose Visual Slot:</span>
                                      
                                      <div className="grid grid-cols-3 gap-2">
                                        {[0, 1, 2].map((idx) => {
                                          const item = images[idx];
                                          const hasImg = item && item.url;
                                          return (
                                            <button
                                              type="button"
                                              key={idx}
                                              disabled={!hasImg}
                                              onClick={() => setSelectedGeneratedIndex(idx)}
                                              className={`relative h-14 bg-slate-100 rounded-lg overflow-hidden border-2 cursor-pointer transition flex items-center justify-center ${
                                                selectedGeneratedIndex === idx && hasImg
                                                  ? "border-blue-650 border-blue-600 shadow-xs"
                                                  : "border-transparent opacity-80 hover:opacity-100"
                                              } ${!hasImg ? "opacity-30 cursor-not-allowed" : ""}`}
                                            >
                                              {hasImg ? (
                                                <img
                                                  src={item.url}
                                                  alt={`Generated asset slot placeholder ${idx + 1}`}
                                                  referrerPolicy="no-referrer"
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <span className="text-[8px] font-mono font-bold text-slate-400">Empty #{idx + 1}</span>
                                              )}
                                              {selectedGeneratedIndex === idx && hasImg && (
                                                <div className="absolute top-0.5 right-0.5 bg-blue-600 text-white rounded-full p-0.5">
                                                  <CheckCircle className="w-2.5 h-2.5 text-white" />
                                                </div>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      <span className="text-[8px] text-slate-400 block font-mono">
                                        *Requires first generating an image inside the "Visual Forge" tab.
                                      </span>
                                    </div>
                                  )}

                                  {/* Content for Custom URL / Upload Uploaded */}
                                  {attachedImageType === "uploaded" && (
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3.5">
                                      <div className="space-y-1">
                                        <label htmlFor="uploaded-input-url" className="text-[9px] font-bold text-slate-500 block">Paste Preferred Image URL</label>
                                        <input
                                          id="uploaded-input-url"
                                          type="text"
                                          placeholder="https://images.unsplash.com/photo-..."
                                          value={customUploadedUrl}
                                          onChange={(e) => {
                                            setCustomUploadedUrl(e.target.value);
                                            setUploadedFileBase64(null); // Clear file base64 so URL takes priority
                                          }}
                                          className="w-full text-[10px] p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                                        />
                                      </div>

                                      <div className="relative border border-dashed border-slate-350 hover:bg-slate-50 transition rounded-xl p-3 text-center cursor-pointer">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                setUploadedFileBase64(reader.result as string);
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                                        <span className="text-[10px] font-bold text-slate-600 block">
                                          {uploadedFileBase64 ? "✓ Custom Image Loaded" : "Upload File (Drag & Drop)"}
                                        </span>
                                        <span className="text-[8px] text-slate-400 block">PNG, JPG up to 5MB</span>
                                      </div>

                                      {uploadedFileBase64 && (
                                        <div className="relative h-16 w-full rounded-lg overflow-hidden border border-slate-200">
                                          <img src={uploadedFileBase64} alt="Pre-render upload preferred source" className="w-full h-full object-cover" />
                                          <button
                                            type="button"
                                            onClick={() => setUploadedFileBase64(null)}
                                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full h-4 w-4 flex items-center justify-center text-white text-[8px] font-bold transition cursor-pointer"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Active Share Copy Input */}
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex justify-between items-center">
                                    <label htmlFor="user-share-textarea" className="text-[10px] font-bold text-slate-700">Write Sharing Copy</label>
                                    {userHasEditedText && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setUserHasEditedText(false);
                                          setEditedShareText("");
                                        }}
                                        className="text-[9px] text-blue-600 font-bold hover:underline cursor-pointer"
                                      >
                                        Use AI Preset Text
                                      </button>
                                    )}
                                  </div>
                                  <textarea
                                    id="user-share-textarea"
                                    value={activeShareText}
                                    onChange={(e) => {
                                      setEditedShareText(e.target.value);
                                      setUserHasEditedText(true);
                                    }}
                                    rows={4}
                                    placeholder="Enter copy description here..."
                                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-sans leading-relaxed"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Column 2: Live Simulator Card & Posting keys (7 cols) */}
                            <div className="xl:col-span-7 space-y-6">
                              <span className="text-[10px] font-mono text-blue-600 uppercase tracking-widest block font-extrabold mb-1">
                                Real-Time Feed post Mockup
                              </span>

                              {/* MOCK PLATFORMS PANEL */}
                              <div className="transition-all duration-300">
                                
                                {/* TWITTER STYLE */}
                                {selectedMarketingPlatform === "twitter" && (
                                  <div className="bg-[#15181c] text-white border border-slate-800 p-5 rounded-3xl space-y-3 shadow-md font-sans">
                                    <div className="flex items-start space-x-3">
                                      <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-indigo-700 text-white rounded-full flex items-center justify-center text-xs font-bold leading-none uppercase select-none font-display">
                                        {twitterHandle.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-1">
                                          <span className="text-sm font-extrabold text-white tracking-tight line-clamp-1">{websiteData.website_name} Agency</span>
                                          <div className="w-3.5 h-3.5 bg-sky-500 text-white rounded-full flex items-center justify-center shrink-0">
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                                          </div>
                                          <span className="text-xs text-zinc-400 font-mono">@{twitterHandle} · 1m</span>
                                        </div>
                                        
                                        <p className="mt-1.5 text-[13px] text-zinc-100 leading-relaxed font-sans whitespace-pre-wrap select-text">
                                          {activeShareText.split(" ").map((word, idx) => {
                                            if (word.startsWith("#") || word.startsWith("@")) {
                                              return <span key={idx} className="text-sky-400 font-medium hover:underline">{word} </span>;
                                            }
                                            return word + " ";
                                          })}
                                        </p>

                                        <p className="mt-2 text-xs font-mono text-sky-400 hover:underline cursor-pointer select-text font-semibold">{campaignUrl}</p>

                                        {/* Attachment Preview Box */}
                                        {attachedImageType !== "none" && (
                                          <div className="mt-3 rounded-2xl overflow-hidden border border-zinc-800 relative bg-zinc-900 flex items-center justify-center aspect-video">
                                            {attachedImageType === "generated" && images[selectedGeneratedIndex]?.url ? (
                                              <img
                                                src={images[selectedGeneratedIndex].url}
                                                alt="Social shared asset preview"
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover"
                                              />
                                            ) : attachedImageType === "uploaded" && (uploadedFileBase64 || customUploadedUrl) ? (
                                              <img
                                                src={uploadedFileBase64 || customUploadedUrl}
                                                alt="Social shared custom preview"
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="p-4 text-center text-zinc-550 space-y-0.5">
                                                <ImageIcon className="w-6 h-6 text-zinc-700 mx-auto" />
                                                <span className="text-[10px] font-semibold text-zinc-500 font-mono block">Image Attachment Is Blank</span>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Action details mockup */}
                                        <div className="flex items-center justify-between text-zinc-500 text-[11px] pt-4 border-t border-zinc-850 mt-4 max-w-sm">
                                          <span className="hover:text-sky-400 cursor-pointer flex items-center space-x-1 font-mono">
                                            <span>💬</span> <span className="font-semibold">24</span>
                                          </span>
                                          <span className="hover:text-emerald-400 cursor-pointer flex items-center space-x-1 font-mono">
                                            <span>🔁</span> <span className="font-semibold">89</span>
                                          </span>
                                          <span className="hover:text-rose-400 cursor-pointer flex items-center space-x-1 font-mono">
                                            <span>❤️</span> <span className="font-semibold">512</span>
                                          </span>
                                          <span className="hover:text-sky-400 cursor-pointer flex items-center font-mono">
                                            <span>📊</span> <span>18.9K Views</span>
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* LINKEDIN STYLE */}
                                {selectedMarketingPlatform === "linkedin" && (
                                  <div className="bg-white text-slate-800 border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4 font-sans text-left">
                                    <div className="flex items-start space-x-3">
                                      <div className="w-10 h-10 bg-blue-105 bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center text-xs font-bold leading-none select-none uppercase font-display border border-slate-250">
                                        {linkedinName.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <h4 className="text-[13px] font-black text-slate-900 tracking-tight leading-none">{linkedinName}</h4>
                                            <p className="text-[10px] text-slate-500 font-sans mt-1">Lead Growth Partner • ConceptStudio Pipeline</p>
                                          </div>
                                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.0 py-0.5 rounded">Promoted</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-2 select-text">
                                      <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                                        {activeShareText}
                                      </p>
                                    </div>

                                    {/* Link and Image Attachment Box */}
                                    <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50">
                                      {attachedImageType !== "none" && (
                                        <div className="w-full bg-slate-100 flex items-center justify-center border-b border-slate-200 overflow-hidden aspect-video relative">
                                          {attachedImageType === "generated" && images[selectedGeneratedIndex]?.url ? (
                                            <img src={images[selectedGeneratedIndex].url} alt="Share attachment" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                          ) : attachedImageType === "uploaded" && (uploadedFileBase64 || customUploadedUrl) ? (
                                            <img src={uploadedFileBase64 || customUploadedUrl} alt="Custom preferred preview" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="p-4 text-center text-slate-400 space-y-0.5">
                                              <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                                              <span className="text-[9px] font-bold text-slate-400 block font-mono">Awaiting attached image forge</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div className="p-3">
                                        <span className="text-[9px] font-mono text-blue-600 font-extrabold uppercase tracking-widest">{campaignUrl}</span>
                                        <h5 className="text-xs font-black text-slate-800 tracking-tight mt-1 truncate">{websiteData.website_name} Launch Blueprint</h5>
                                        <p className="text-[10px] text-slate-600 font-sans mt-0.5 leading-snug line-clamp-1">{websiteData.meta_info.description}</p>
                                      </div>
                                    </div>

                                    {/* Interaction bar */}
                                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-450 border-b border-slate-100 pb-2 bg-slate-25 hover:bg-slate-50 transition cursor-pointer">
                                      <span>👍 👏 ❤️</span>
                                      <span className="font-mono font-medium text-slate-500">You, Sarah Jenkins, and 124 others</span>
                                    </div>

                                    <div className="flex items-center justify-around text-slate-600 text-xs font-semibold pt-1">
                                      <button className="flex items-center space-x-1 hover:bg-slate-50 py-1.5 px-3 rounded-lg cursor-pointer">
                                        <span>👍</span> <span className="text-[11px]">Like</span>
                                      </button>
                                      <button className="flex items-center space-x-1 hover:bg-slate-50 py-1.5 px-3 rounded-lg cursor-pointer">
                                        <span>💬</span> <span className="text-[11px]">Comment</span>
                                      </button>
                                      <button className="flex items-center space-x-1 hover:bg-slate-50 py-1.5 px-3 rounded-lg cursor-pointer">
                                        <span>🔁</span> <span className="text-[11px]">Repost</span>
                                      </button>
                                      <button className="flex items-center space-x-1 hover:bg-slate-50 py-1.5 px-3 rounded-lg cursor-pointer">
                                        <span>📤</span> <span className="text-[11px]">Send</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* FACEBOOK STYLE */}
                                {selectedMarketingPlatform === "facebook" && (
                                  <div className="bg-white text-slate-800 border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4 font-sans text-left">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm leading-none select-none uppercase shadow-xs">
                                        F
                                      </div>
                                      <div>
                                        <h4 className="text-[13px] font-black text-slate-900 tracking-tight leading-none">facebook.com/{facebookPage}</h4>
                                        <p className="text-[10px] text-slate-500 font-sans mt-1">Sponsored · 🌐 Public</p>
                                      </div>
                                    </div>

                                    <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap select-text">
                                      {activeShareText}
                                    </p>

                                    {/* Preview container */}
                                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                      {attachedImageType !== "none" && (
                                        <div className="w-full bg-slate-100 flex items-center justify-center bg-zinc-50 border-b border-slate-200 overflow-hidden aspect-video relative">
                                          {attachedImageType === "generated" && images[selectedGeneratedIndex]?.url ? (
                                            <img src={images[selectedGeneratedIndex].url} alt="Share attachment" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                          ) : attachedImageType === "uploaded" && (uploadedFileBase64 || customUploadedUrl) ? (
                                            <img src={uploadedFileBase64 || customUploadedUrl} alt="Custom preferred preview" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="p-4 text-center text-slate-400 space-y-1">
                                              <ImageIcon className="w-6 h-6 text-slate-350 mx-auto" />
                                              <span className="text-[9px] font-bold text-slate-400 block font-mono">Asset placement container</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div className="p-3 bg-white">
                                        <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">{new URL(campaignUrl).hostname || "mybrand.com"}</span>
                                        <h5 className="text-xs font-black text-slate-800 tracking-tight mt-0.5">{websiteData.website_name} | Full Sitemap Blueprint Setup</h5>
                                        <p className="text-[10px] text-slate-500 font-sans mt-0.5">{websiteData.meta_info.description}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-450 pt-2 border-t border-slate-100 font-medium">
                                      <span className="hover:underline cursor-pointer">👍😃 142 Likes</span>
                                      <span className="hover:underline cursor-pointer">18 Comments · 4 Shares</span>
                                    </div>
                                  </div>
                                )}

                                {/* PINTEREST STYLE */}
                                {selectedMarketingPlatform === "pinterest" && (
                                  <div className="bg-white text-slate-800 border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4 font-sans text-left max-w-sm mx-auto">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono text-rose-600 font-extrabold uppercase tracking-wide">pinterest.com/{pinterestUser}</span>
                                      <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">Pins Board</span>
                                    </div>

                                    {/* Pin Visual slot (tall layout typical of pinterest) */}
                                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[3/4] relative flex items-center justify-center">
                                      {attachedImageType !== "none" && (
                                        attachedImageType === "generated" && images[selectedGeneratedIndex]?.url ? (
                                          <img src={images[selectedGeneratedIndex].url} alt="Pinterest pin visual" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                        ) : attachedImageType === "uploaded" && (uploadedFileBase64 || customUploadedUrl) ? (
                                          <img src={uploadedFileBase64 || customUploadedUrl} alt="Custom uploaded pin visual" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="p-4 text-center text-slate-400 space-y-1">
                                            <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                                            <span className="text-[10px] font-bold text-slate-400 block font-mono">Attachment Slot # Pinterest</span>
                                          </div>
                                        )
                                      )}
                                      {!attachedImageType || attachedImageType === "none" ? (
                                        <div className="p-6 text-center text-slate-400 space-y-1.5">
                                          <ImageIcon className="w-8 h-8 text-slate-350 mx-auto" />
                                          <span className="text-xs font-bold text-slate-400 block">Attach an active Image</span>
                                          <span className="text-[9px] text-slate-400 block leading-snug">Pinterest pins require high contrast portrait elements.</span>
                                        </div>
                                      ) : null}
                                    </div>

                                    <div className="space-y-1.5 pt-1.5 select-text">
                                      <h4 className="text-[14px] font-black text-slate-900 tracking-tight leading-snug">{websiteData.website_name} Ideas</h4>
                                      <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-wrap leading-relaxed">
                                        {activeShareText}
                                      </p>
                                      <a href={campaignUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-rose-600 hover:underline font-bold block pt-1">
                                        ↗ {campaignUrl.length > 32 ? campaignUrl.substring(0, 32) + "..." : campaignUrl}
                                      </a>
                                    </div>
                                  </div>
                                )}

                              </div>

                              {/* LAUNCH ACTIONS CARD */}
                              <div className="bg-blue-50/50 border border-blue-150 p-6 rounded-2xl space-y-5">
                                <div>
                                  <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider font-mono flex items-center">
                                    <Rocket className="w-4 h-4 mr-1.5 text-blue-600 animate-pulse" />
                                    3. Launch Campaign Post Directly
                                  </h4>
                                  <p className="text-[11px] text-slate-700 leading-relaxed mt-1">
                                    Instead of storing private access keys, ConceptStudio AI redirects securely to the direct share editor on each platform. Click to launch below!
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
                                  {/* Copy Text Value Button */}
                                  <button
                                    type="button"
                                    onClick={() => copyTextToClipboard(activeShareText, 1001)}
                                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2"
                                  >
                                    {copiedIndex === 1001 ? (
                                      <>
                                        <Check className="w-4 h-4 text-emerald-600" />
                                        <span className="text-emerald-700">Copied text!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-4 h-4 text-slate-500" />
                                        <span>Copy Post Text</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Direct Redirect Share Button */}
                                  <a
                                    href={
                                      selectedMarketingPlatform === "twitter"
                                        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(activeShareText)}&url=${encodeURIComponent(campaignUrl)}`
                                        : selectedMarketingPlatform === "linkedin"
                                        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(campaignUrl)}`
                                        : selectedMarketingPlatform === "facebook"
                                        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`
                                        : `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(campaignUrl)}&media=${encodeURIComponent(
                                            attachedImageType === "generated" && images[selectedGeneratedIndex]?.url
                                              ? images[selectedGeneratedIndex].url || ""
                                              : attachedImageType === "uploaded" && (uploadedFileBase64 || customUploadedUrl)
                                              ? uploadedFileBase64 || customUploadedUrl
                                              : "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
                                          )}&description=${encodeURIComponent(activeShareText)}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`p-3 font-bold text-xs rounded-xl transition cursor-pointer text-center flex items-center justify-center space-x-2 text-white shadow-xs ${
                                      selectedMarketingPlatform === "twitter" ? "bg-black hover:bg-zinc-900" :
                                      selectedMarketingPlatform === "linkedin" ? "bg-[#0a66c2] hover:bg-[#084e93]" :
                                      selectedMarketingPlatform === "facebook" ? "bg-[#1877f2] hover:bg-[#0f54bd]" :
                                      "bg-[#bd081c] hover:bg-[#8f0412]"
                                    }`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>Share on {selectedMarketingPlatform === "twitter" ? "X / Twitter" : selectedMarketingPlatform.charAt(0).toUpperCase() + selectedMarketingPlatform.slice(1)}</span>
                                  </a>
                                </div>

                                <div className="p-3 bg-white/70 rounded-xl border border-blue-100 flex items-start space-x-2 text-[10px] text-slate-650 leading-relaxed font-sans">
                                  <Info className="w-3.5 h-3.5 text-blue-601 text-blue-600 shrink-0 mt-0.5" />
                                  <span>
                                    <strong>Tip:</strong> Facebook and LinkedIn sharers read the live URL’s open-graph tags to display the thumbnail image in their feeds. If you are sharing a local blueprint, use the **Copy Post Text** button, click the share link, and drag your file into the platform posting window!
                                  </span>
                                </div>
                              </div>

                            </div>
                          </div>
                        </motion.div>
                      )}

                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6"
                  >
                    {loading ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                          <Sparkles className="w-6 h-6 text-blue-550 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div className="space-y-1 max-w-sm">
                          <h3 className="text-base font-extrabold text-slate-800">Compiling Full-Stack Structure</h3>
                          <p className="text-xs text-blue-600 font-mono tracking-wide">{loadingStep}</p>
                          <p className="text-[11px] text-slate-400">
                            Our server is parsing semantic layouts and aligning keyword indices using structured schema controls.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-5 py-12">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 font-bold shadow-xs">
                          <Rocket className="w-8 h-8 text-blue-500 animate-bounce" />
                        </div>
                        <div className="space-y-2 max-w-md">
                          <h3 className="text-lg font-display font-extrabold text-slate-800">No Blueprint Active</h3>
                          <p className="text-xs text-slate-500 leading-relaxed font-sans">
                            Configure your sitemap details on the left, or apply one of our presets to quickly preview highly tuned site blueprints and SEO simulations.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 max-w-sm text-left border-t border-slate-100 pt-6">
                          <div className="space-y-1">
                            <span className="text-xs font-mono font-bold text-blue-600 flex items-center">
                              <Lock className="w-3.5 h-3.5 mr-1" /> Core Fallback
                            </span>
                            <p className="text-[10px] text-slate-400 font-sans">
                              Failsafe fallback system instantly forwards generation route tasks to Gemini 3.5 if connection bottlenecks occur.
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-mono font-bold text-emerald-600 flex items-center">
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Scheme Checked
                            </span>
                            <p className="text-[10px] text-slate-400 font-sans">
                              Structured parsing guarantees that all custom script templates, style indices, and checklist rules map exactly.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>

        {/* Informative Guidance Footer */}
        <section className="mt-16 border-t border-slate-200 pt-10">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight text-center">
              Web Architect Pipeline Workflow Design
            </h2>
            <p className="text-sm text-slate-600 text-center font-sans leading-relaxed">
              This interactive platform empowers web design agencies with rapid prototyping and SEO forecasting. Here is how our full-stack pipeline processes attributes behind the scenes:
            </p>

            <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-5 text-sm leading-relaxed text-slate-700">
              <div>
                <dt className="font-mono font-bold text-blue-600 uppercase tracking-wide text-xs">
                  1. Structured Responses API Integration
                </dt>
                <dd className="mt-1 bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
                  The application routes data directly through OpenAI’s <code>client.responses.parse</code> with a strictly typed JSON schema in high priority. If key errors arise, our backup engine switches seamlessly to Gemini <code>gemini-3.5-flash</code> utilizing native <code>responseSchema</code> variables, returning identical blueprint states without data drift.
                </dd>
              </div>

              <div>
                <dt className="font-mono font-bold text-emerald-600 uppercase tracking-wide text-xs">
                  2. Dynamic SEO performance simulation metrics mapping
                </dt>
                <dd className="mt-1 bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
                  The simulation calculations utilize mathematical curves based on position click-through intensities (as identified by Google and Serpstat SERP analysis). Fast deployment platforms give page speed leverage, modifying the estimated Average Position and Click factors dynamically to projection vectors.
                </dd>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-200 bg-white mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 ConceptStudio AI. Web Architect Workspace Pipeline. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono">Stateless Container Node Proxied On Ingress Port :3000</p>
        </div>
      </footer>

    </div>
  );
}
