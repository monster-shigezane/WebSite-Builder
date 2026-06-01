# Sitemap & Website Builder 🎨🤖

Full-stack campaign and website structure workspace utilizing OpenAI and Gemini API for site blueprints, HTML/CSS templates, SEO metric simulations, and launch checklists.

Built with **React (Vite, Tailwind CSS, Motion)** on the client, and **Express (Node.js)** on the server, leveraging OpenAI's structured **Responses API** and **DALL-E 3**.

---

## 🏗️ Architectural Design & Boundaries

1. **Strict Client-Server Isolation**: The user's `OPENAI_API_KEY` is hosted exclusively inside the cloud sandbox environment. No secret tokens ever escape to client browsers or network logs.
2. **Stateless Operations**: Campaign results are created on the server transitively. No database or tracking metrics are kept within the template, making the system incredibly clean and compliant.
3. **Structured Schemas Validation**: Unlike traditional chat completion APIs which rely on general markdown or unstructured tags, this app uses OpenAI's high-leverage **Responses API** (`client.responses.parse`) with strict JSON schemas. Outputs are perfectly validated and mapped to typed TypeScript objects without any wrapper-handling code.
4. **Non-blocking Visuals Generation**: DALL-E 3 can take 4-10 seconds to generate a marketing graphic. To completely avoid server timeout gateways, the platform instantly returns the text-level blueprint first. The user then triggers background image generations asynchronously in the browser.

---

## 📁 System Requirements & Setup

### 1. Environment Secrets

The application requires an OpenAI API key.
In your workspace, go to the **Secrets panel** and add:

```env
OPENAI_API_KEY="your-sk-openai-key-here"
```

The server fetches this variable lazily during API action, preventing crashes on server startup.

### 2. Local Installation

To duplicate, test, or inspect the applet elsewhere, follow these terminal instructions:

```bash
# 1. Install all dependencies inside the project
npm install

# 2. Run the full-stack server under local development mode
npm run dev

# 3. Access the browser
# Open http://localhost:3000
```

### 3. Production Compilation & Packaging

To compile static client assets and bundle Express resources for high-speed container cold-starts:

```bash
# Compile client files + bundle Node assets via esbuild
npm run build

# Start the compiled CommonJS server standalone
npm run start
```

---

## 🛠️ Code Customization & Settings

### Adjusting Text Generation Settings
Open `/server.ts` and inspect the `/api/generate` route action:
- **Change Model**: Modify `model: "gpt-4o"` to any newer model like `gpt-4o-mini` or other valid responses-api target.
- **Change System Directives**: Adjust the `instructions` field to provide tighter brand constraints or formatting parameters.
- **Adjust Volume**: Add a `verbosity` control to `text`:
  ```typescript
  text: {
    format: { type: "json_schema", ... },
    verbosity: "medium" // Supports "low", "medium", or "high"
  }
  ```

### Adjusting Image Generation Settings
Open `/server.ts` and inspect the `/api/generate-image` route:
- **Modify Aspect Sizes**: Change `size: "1024x1024"` to `1024x1792` (portrait mobile formats) or `1792x1024` (landscape desktop hero formats).
- **Modify Quality**: Add `quality: "hd"` inside the generator arguments for ultra-fidelity branding.
- **Image Model**: Switch `model: "dall-e-3"` to older engines like `dall-e-2` if lower resolution tests are preferred.

---

## 📋 Technical Verification Plan

To verify components are operating smoothly in development or production containers:

1. **Empty State Validation**: Verify the dynamic template presets load on click & populate the request forms instantly.
2. **Pipeline Connectivity**: Enter a user request. If `OPENAI_API_KEY` is not present, confirm that a beautiful, actionable red instruction banner appears guiding setup.
3. **Structured Processing**: Submit the custom campaign request. Check that the multi-step progress bar animates. Once generated, confirm the four tabs appear containing the correct campaign structures.
4. **Copy Clipboard Controls**: Test clicking copy cards across variants to verify they write clean clipboard assets even inside container sandbox frames.
5. **Interactive Check-offs**: Interact with the checkboxes inside the launch checklist to verify items cross off seamlessly.
6. **Asynchronous Forging**: Go to the "Visual Assets" tab and click "Forge Visual". Confirm that DALL-E's spinner rotates and displays the completed high-quality marketing visual within seconds.
