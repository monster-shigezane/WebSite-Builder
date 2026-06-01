import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { OpenAI } from "openai";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded OpenAI client to prevent crash if key is missing
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI | null {
  if (!openaiClient) {
    const key = process.env.OPENAI_API_KEY;
    if (key) {
      openaiClient = new OpenAI({ apiKey: key });
    }
  }
  return openaiClient;
}

// Lazy-loaded Gemini client to prevent crash if key is missing
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please set it in Settings > Secrets.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Structured output schema definition matching types.ts
const websiteResponseSchema = {
  type: "object",
  properties: {
    website_name: {
      type: "string",
      description: "A professional design or firm brand name tailored to the website's theme.",
    },
    meta_info: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Descriptive, keyword-rich SEO title tag under 60 characters.",
        },
        description: {
          type: "string",
          description: "A high-conversion meta description containing primary keywords under 160 characters.",
        },
        deployment_platform: {
          type: "string",
          description: "Platform guidelines and quick start tip for deployment.",
        },
      },
      required: ["title", "description", "deployment_platform"],
      additionalProperties: false,
    },
    styling: {
      type: "object",
      properties: {
        css_library: {
          type: "string",
          description: "Recommended external library link or description (e.g. Tailwind CSS via unpkg or Bootstrap CDN).",
        },
        main_css: {
          type: "string",
          description: "Clean, robust custom CSS rule definitions containing root theme variables and responsive overrides to align the style.",
        },
        theme_palette: {
          type: "object",
          properties: {
            primary: { type: "string", description: "Primary Brand Hex color code" },
            secondary: { type: "string", description: "Secondary Active Hex color code" },
            background: { type: "string", description: "Core canvas background Hex color" },
            text: { type: "string", description: "Body narrative text Hex color" },
          },
          required: ["primary", "secondary", "background", "text"],
          additionalProperties: false,
        },
      },
      required: ["css_library", "main_css", "theme_palette"],
      additionalProperties: false,
    },
    pages: {
      type: "array",
      description: "A list of separate static pages built out as high fidelity responsive HTML blueprints.",
      items: {
        type: "object",
        properties: {
          page_name: { type: "string", description: "e.g., Home, Contact Us, or About" },
          file_name: { type: "string", description: "e.g., index.html, contact.html" },
          html_template: {
            type: "string",
            description: "A complete, valid static HTML markup code. Must contain fully styled navbar, hero banner with a clear header, grid sections, realistic marketing copy with actual words (no Lorem Ipsum), and a responsive unified footer. Uses standard utility classes corresponding to the chosen CSS library.",
          },
          alt_text_suggestions: {
            type: "array",
            description: "List of 2-3 descriptive, keyword-rich image alt tags needed for core sections on this page.",
            items: { type: "string" },
          },
        },
        required: ["page_name", "file_name", "html_template", "alt_text_suggestions"],
        additionalProperties: false,
      },
    },
    main_js: {
      type: "string",
      description: "Vanilla ES6 JavaScript library for mobile menus, popups, and mock dark/light triggers on this website.",
    },
    seo_components: {
      type: "object",
      properties: {
        heading_variants: {
          type: "array",
          description: "Exactly 3 distinct variants of SEO landing block copies (each with a catchy keyword-rich H1/H2 heading and an accompanying persuasive body copy block).",
          items: {
            type: "object",
            properties: {
              heading: { type: "string", description: "SEO optimized display header." },
              body_block: { type: "string", description: "Accompanying high-conversion narrative paragraph block." },
            },
            required: ["heading", "body_block"],
            additionalProperties: false,
          },
        },
      },
      required: ["heading_variants"],
      additionalProperties: false,
    },
    launch_checklist: {
      type: "array",
      description: "A sequence of exactly 6 technical website testing, analytics, sitemap validation, and SEO audit checklists.",
      items: { type: "string" },
    },
    image_prompts: {
      type: "array",
      description: "Array of exactly 3 descriptive DALL-E image prompts representing the website's brand aesthetics, UI layouts, or product shots.",
      items: { type: "string" },
    },
    alt_text_meta_description: {
      type: "string",
      description: "Detailed, technical SEO advice concerning sitemap structure, keyword placement advice, and site speed variables.",
    },
  },
  required: [
    "website_name",
    "meta_info",
    "styling",
    "pages",
    "main_js",
    "seo_components",
    "launch_checklist",
    "image_prompts",
    "alt_text_meta_description",
  ],
  additionalProperties: false,
};

// Website structures builder generation endpoint
app.post("/api/generate", async (req, res) => {
  try {
    const { website_overview, target_keywords, page_details, css_theme, deployment_platform, provider } = req.body;

    if (!website_overview || !target_keywords || !page_details || !Array.isArray(page_details) || page_details.length === 0) {
      return res.status(400).json({ error: "Missing required attributes. Ensure Overview, Keywords, and at least one Selected Page are provided." });
    }

    const requestedProvider = provider || "openai";
    const openAIClient = getOpenAIClient();

    const systemInstructions = `You are an elite Lead Web Architect and Senior SEO Growth Specialist. You construct bulletproof responsive website structures, pixel-perfect clean static HTML templates, structured CSS files, dynamic vanilla JavaScript libraries, and comprehensive meta-descriptions. Write copy with realistic promotional information (never default placeholder text like Lorem Ipsum), and align all generated copy heavily with the target SEO keywords provided. Ensure HTML templates render properly and feature modern containers, typography styles, contact buttons, and heroes.`;

    const userPrompt = `Create a fully functional website structure based on these specifications:
    - Overview: ${website_overview}
    - Primary SEO Target Keywords: ${target_keywords}
    - Required Site Pages: ${page_details.join(", ")}
    - Preset Theme Aesthetic Style: ${css_theme}
    - Chosen Deployment Platform target: ${deployment_platform}`;

    // Try OpenAI if requested and available
    if (requestedProvider === "openai" && openAIClient) {
      try {
        console.log("Generating website structure using OpenAI Responses API...");
        const response = await openAIClient.responses.parse({
          model: "gpt-4o",
          instructions: systemInstructions,
          input: [{ role: "user", content: userPrompt }],
          text: {
            format: {
              type: "json_schema",
              name: "website_response",
              schema: websiteResponseSchema,
              strict: true,
            },
          },
        });

        if (response.output_parsed) {
          return res.json({ ...(response.output_parsed as any), generated_by: "OpenAI GPT-4o" });
        }
      } catch (openaiError: any) {
        console.warn("OpenAI generate failed, falling back to Gemini API:", openaiError.message);
      }
    }

    // Fallback or explicit call using Google Gen AI SDK
    console.log("Generating website structure using Gemini 3.5 Flash API...");
    const gemini = getGeminiClient();

    // Convert OpenAI schema to Gemini responseSchema format
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        website_name: { type: Type.STRING },
        meta_info: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            deployment_platform: { type: Type.STRING },
          },
          required: ["title", "description", "deployment_platform"],
        },
        styling: {
          type: Type.OBJECT,
          properties: {
            css_library: { type: Type.STRING },
            main_css: { type: Type.STRING },
            theme_palette: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                background: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ["primary", "secondary", "background", "text"],
            },
          },
          required: ["css_library", "main_css", "theme_palette"],
        },
        pages: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              page_name: { type: Type.STRING },
              file_name: { type: Type.STRING },
              html_template: { type: Type.STRING },
              alt_text_suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["page_name", "file_name", "html_template", "alt_text_suggestions"],
          },
        },
        main_js: { type: Type.STRING },
        seo_components: {
          type: Type.OBJECT,
          properties: {
            heading_variants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  body_block: { type: Type.STRING },
                },
                required: ["heading", "body_block"],
              },
            },
          },
          required: ["heading_variants"],
        },
        launch_checklist: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        image_prompts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        alt_text_meta_description: { type: Type.STRING },
      },
      required: [
        "website_name",
        "meta_info",
        "styling",
        "pages",
        "main_js",
        "seo_components",
        "launch_checklist",
        "image_prompts",
        "alt_text_meta_description",
      ],
    };

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstructions}\n\nClient Request:\n${userPrompt}` }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Gemini returned empty text.");
    }

    const parsedData = JSON.parse(textOutput.trim());
    res.json({ ...parsedData, generated_by: "Gemini 3.5 Flash" });
  } catch (error: any) {
    console.error("Error in website structure generation route:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred during structure compiling." });
  }
});

// A Second Assistant Agent designed to view and optimize app attribute settings dynamically
app.post("/api/agent-settings", async (req, res) => {
  try {
    const { prompt, currentSettings } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Instruction prompt to settings agent is required." });
    }

    const gemini = getGeminiClient();

    const configSchema = {
      type: Type.OBJECT,
      properties: {
        website_overview: { type: Type.STRING, description: "Highly compelling, detailed, SEO-aligned website summary overview." },
        target_keywords: { type: Type.STRING, description: "Comma-separated target SEO keywords, refined based on request." },
        page_details: {
          type: Type.ARRAY,
          description: "List of relevant structural pages to build.",
          items: { type: Type.STRING },
        },
        css_theme: { type: Type.STRING, description: "Selected CSS design style choice." },
        deployment_platform: { type: Type.STRING, description: "Recommended deployment platform name." },
        explanation: { type: Type.STRING, description: "Clear commentary explaining why the agent refined these attributes for optimal indexing." },
      },
      required: ["website_overview", "target_keywords", "page_details", "css_theme", "deployment_platform", "explanation"],
    };

    const systemPrompt = `You are 'PixelSEO Assistant', an elite AI Consulting developer who monitors and fine-tunes website parameters for web design teams.
    Your sole task is to analyze user queries, view their current workspace configuration parameters (if any), and return updated optimal values for:
    1. website_overview (refined and expanded into a clear creative mandate)
    2. target_keywords (highly valuable, high-intent seed SEO terms)
    3. page_details (an array of pages, e.g. ["Home", "About Us", "Product Tour", "Contact"])
    4. css_theme (align with design, e.g. "Slate Dark", "Emerald Tech", "Warm Editorial", "Modern Minimalist", "Neobrutalist")
    5. deployment_platform (align with ease, e.g. "Cloud Run", "Vercel", "Netlify", "AWS Amplify")
    
    Current workspace configuration:
    - Overview: ${currentSettings?.website_overview || "Empty"}
    - Keywords: ${currentSettings?.target_keywords || "Empty"}
    - Pages: ${(currentSettings?.page_details || []).join(", ") || "Empty"}
    - Style Theme: ${currentSettings?.css_theme || "Empty"}
    - Plaftorm: ${currentSettings?.deployment_platform || "Empty"}`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUser request: "${prompt}"` }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: configSchema,
      },
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("Failed to receive structured config response from PixelSEO Assistant.");
    }

    const updatedConfig = JSON.parse(textResult.trim());
    res.json(updatedConfig);
  } catch (error: any) {
    console.error("Error in /api/agent-settings:", error);
    res.status(500).json({ error: error.message || "An error occurred with PixelSEO Assistant." });
  }
});

// REST API endpoint for image generation proxy using OpenAI DALL-E 3
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Image prompt is required." });
    }

    const openAIClient = getOpenAIClient();
    if (!openAIClient) {
      return res.status(503).json({ error: "OpenAI client is offline. Set OPENAI_API_KEY inside AI Studio UI to generate image assets." });
    }

    // Generate quality images using DALL-E 3
    console.log("Generating visual using DALL-E 3 for prompt:", prompt);
    const imageResponse = await openAIClient.images.generate({
      model: "dall-e-3",
      prompt: `${prompt}. Clean isometric illustration, high resolution modern app interface, pixel-perfect layout content banner.`,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    const imageUrl = imageResponse.data[0]?.url;
    if (!imageUrl) {
      return res.status(500).json({ error: "DALL-E 3 did not return any image data URL." });
    }

    res.json({ url: imageUrl });
  } catch (error: any) {
    console.error("Error in /api/generate-image:", error);
    res.status(500).json({ error: error.message || "An error occurred during DALL-E 3 visual forge." });
  }
});

// Start integration with Vite in development, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on http://0.0.0.0:${PORT}`);
  });
}

startServer();
