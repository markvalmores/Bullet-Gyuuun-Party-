import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Gacha Route
  app.post("/api/gacha/generate", async (req, res) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: "Generate a unique, cute, and crazy 'Usagyuuun' style rhythm game target object. It should be something like a food item, a cosmic object, or a funny toy. Return a name, rarity (COMMON, RARE, EPIC, LEGENDARY), and a very detailed prompt for generating an image of this object on a clean transparent background.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              rarity: { type: Type.STRING },
              imagePrompt: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["name", "rarity", "imagePrompt", "description"]
          }
        }
      });

      const data = JSON.parse(response.text);
      
      // For the image, we'll use a high-quality placeholder for now that reflects the prompt
      // In a real app, you might use an image generation API here
      const seed = Math.random().toString(36).substring(7);
      const imageUrl = `https://picsum.photos/seed/${seed}/400/400`;

      res.json({
        ...data,
        image: imageUrl
      });
    } catch (error) {
      console.error("Gacha error:", error);
      res.status(500).json({ error: "Failed to generate gacha item" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
