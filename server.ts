import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load env variables
import dotenv from "dotenv";
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  let aiClient: GoogleGenAI | null = null;

  function getAiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
    return aiClient;
  }

  // API endpoint for Gemini Intelligence
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, context, useHighThinking } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const client = getAiClient();
      
      const systemInstruction = `You are "Frame Cut Studio AI Intelligence", a brilliant studio management and enterprise resource planning (ERP) expert for Frame Cut Studio, a premier wedding video editing house.
Your audience consists of System Admins (like Satish Tiwari), Video Editors (like Vansh), and Wedding Studio clients (like Wedding By KK).
You have access to real-time workspace context about projects, editors, studios, finances, and calendar events.
Use this context to answer user questions, analyze team productivity, evaluate financial health, draft client emails, optimize editing queues, and troubleshoot wedding video project timelines.
Always give elegant, professional, and clear answers. Keep answers structured using Markdown (bullet points, tables, bold highlights).
If no context is provided, politely ask the user what they would like to analyze.

Real-Time Studio Database Context:
${JSON.stringify(context || {}, null, 2)}`;

      const modelName = useHighThinking ? "gemini-3.1-pro-preview" : "gemini-3.5-flash";

      const config: any = {
        systemInstruction,
      };

      if (useHighThinking) {
        config.thinkingConfig = {
          thinkingLevel: "HIGH",
        };
      }

      let response;
      let finalModel = modelName;
      let finalHighThinking = useHighThinking;
      let fallbackOccurred = false;

      try {
        response = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config,
        });
      } catch (firstError: any) {
        console.warn(`Primary model ${modelName} failed, attempting fallback...`, firstError.message || firstError);
        
        // Check if the error is related to quota or 3.1 pro availability
        if (useHighThinking && modelName === "gemini-3.1-pro-preview") {
          fallbackOccurred = true;
          try {
            finalModel = "gemini-2.5-pro";
            console.log("Attempting fallback to gemini-2.5-pro...");
            
            // Setup fallback config for gemini-2.5-pro with thinking budget
            const fallbackConfig: any = {
              systemInstruction,
              thinkingConfig: {
                thinkingBudget: 2048,
              }
            };
            
            response = await client.models.generateContent({
              model: "gemini-2.5-pro",
              contents: prompt,
              config: fallbackConfig,
            });
          } catch (secondError: any) {
            console.warn("Fallback to gemini-2.5-pro failed. Falling back to gemini-3.5-flash standard mode...", secondError.message || secondError);
            
            finalModel = "gemini-3.5-flash";
            finalHighThinking = false;
            
            response = await client.models.generateContent({
              model: "gemini-3.5-flash",
              contents: prompt,
              config: { systemInstruction },
            });
          }
        } else {
          // If 3.5 flash itself failed or it's not a 3.1 pro thinking error, rethrow
          throw firstError;
        }
      }

      let responseText = response.text || "";
      if (fallbackOccurred && finalModel !== "gemini-3.1-pro-preview") {
        responseText += `\n\n*(Note: Automatic fallback to **${finalModel}** occurred due to your current Gemini API Key quota restrictions for the preview model.)*`;
      }

      res.json({
        text: responseText,
        model: finalModel,
        useHighThinking: finalHighThinking,
        quotaLimited: fallbackOccurred,
      });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const isQuotaError = error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED") || error.status === "RESOURCE_EXHAUSTED" || error.code === 429;
      res.status(isQuotaError ? 429 : 500).json({
        error: error.message || "An error occurred while generating content from Gemini API.",
        quotaLimited: isQuotaError
      });
    }
  });

  // API endpoint for AI Receipt Scanner (Gemini OCR / multimodal extraction)
  app.post("/api/gemini/scan-receipt", async (req, res) => {
    try {
      const { text, imageBase64, mimeType } = req.body;

      if (!text && !imageBase64) {
        return res.status(400).json({ error: "Please provide either receipt text or an image." });
      }

      const client = getAiClient();

      const systemInstruction = `You are "Frame Cut Studio AI Receipt Scanner", an expert automated financial assistant for a premier wedding video production house.
Your goal is to accurately extract financial details from receipts, invoices, bills, SMS payment alerts, email receipts, equipment purchase invoices, food/travel bills, software subscriptions, or free-form expense descriptions.
Valid studio expense categories:
1. "Equipment / Hard Disk" (Hard drives, SSDs, cameras, SD cards, cables, monitors, hardware)
2. "Travel & Conveyance" (Flights, trains, cabs, Uber, Ola, fuel, hotel stays for destination weddings)
3. "Editor Payouts" (Freelancer payments, contractor fees, editing stipends)
4. "Office & Rent" (Studio rent, electricity, maintenance, office tea/coffee)
5. "Software / Tools" (Adobe CC, DaVinci Resolve, Envato, Artlist, Musicbed, cloud storage)
6. "Miscellaneous" (Any other studio expense)

Today's date is ${new Date().toISOString().split('T')[0]}.
Return all fields in clean structured JSON according to the schema. If any field cannot be determined, make a reasonable estimate (e.g. today's date for date, "UPI" or "Bank Transfer" for payment mode).`;

      const contents: any[] = [];
      const parts: any[] = [];

      if (imageBase64) {
        // Strip data URI header if present
        const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: cleanBase64
          }
        });
      }

      if (text) {
        parts.push({
          text: `Please scan and parse this receipt / expense details:\n${text}`
        });
      } else {
        parts.push({
          text: "Please scan this receipt image and extract all key financial information including amount, date, category, title, payee, and payment method."
        });
      }

      contents.push({ parts });

      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: {
                type: Type.NUMBER,
                description: "The total numeric amount in INR/currency without symbols"
              },
              date: {
                type: Type.STRING,
                description: "Transaction date in YYYY-MM-DD format"
              },
              category: {
                type: Type.STRING,
                description: "One of: Equipment / Hard Disk, Travel & Conveyance, Editor Payouts, Office & Rent, Software / Tools, Miscellaneous"
              },
              title: {
                type: Type.STRING,
                description: "Short, clean descriptive title of the expense item"
              },
              payee: {
                type: Type.STRING,
                description: "Merchant, vendor, service, or recipient name"
              },
              paymentMode: {
                type: Type.STRING,
                description: "Payment mode (UPI, Bank Transfer, Cash, Card)"
              },
              confidence: {
                type: Type.STRING,
                description: "Confidence level: High, Medium, or Low"
              },
              notes: {
                type: Type.STRING,
                description: "Reference ID, bill number, or brief line-item note"
              }
            },
            required: ["amount", "date", "category", "title"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText);

      res.json({
        success: true,
        data: parsedData
      });
    } catch (error: any) {
      console.error("Gemini Receipt Scanner API Error:", error);
      const isQuotaError = error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED") || error.status === "RESOURCE_EXHAUSTED" || error.code === 429;
      res.status(isQuotaError ? 429 : 500).json({
        error: error.message || "Failed to scan receipt with Gemini AI.",
        quotaLimited: isQuotaError
      });
    }
  });

  // API endpoint for Smart Expense Category Prediction
  app.post("/api/gemini/predict-category", async (req, res) => {
    try {
      const { title, description, payee, projectName } = req.body;

      if (!title && !description && !payee) {
        return res.status(400).json({ error: "Title, payee, or description is required for category prediction." });
      }

      const client = getAiClient();

      const prompt = `Analyze this expense item for Frame Cut Studio:
- Title: ${title || 'N/A'}
- Payee/Vendor: ${payee || 'N/A'}
- Description: ${description || 'N/A'}
- Associated Project: ${projectName || 'N/A'}

Predict the most accurate expense category among:
1. "Equipment / Hard Disk"
2. "Travel & Conveyance"
3. "Editor Payouts"
4. "Office & Rent"
5. "Software / Tools"
6. "Miscellaneous"`;

      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a specialized financial categorization AI for video production studios. Accurately map expenses to their standard category.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "The best fitting category"
              },
              confidence: {
                type: Type.STRING,
                description: "High, Medium, or Low"
              },
              reasoning: {
                type: Type.STRING,
                description: "One short sentence explaining why this category fits"
              }
            },
            required: ["category"]
          }
        }
      });

      const parsedData = JSON.parse(response.text || "{}");
      res.json({
        success: true,
        data: parsedData
      });
    } catch (error: any) {
      console.error("Gemini Category Prediction API Error:", error);
      res.status(500).json({
        error: error.message || "Failed to predict category."
      });
    }
  });

  // API endpoint for AI Project Health Analysis
  app.post("/api/gemini/project-health", async (req, res) => {
    try {
      const { projects = [], stats = {}, currentDate = new Date().toISOString().split('T')[0] } = req.body;

      if (!Array.isArray(projects) || projects.length === 0) {
        return res.json({
          success: true,
          data: {
            healthScore: 100,
            healthStatus: "Optimal",
            healthStatusColor: "emerald",
            executiveSummary: "All systems clear. No active project bottlenecks or overdue balances detected.",
            urgentActions: [],
            keyHighlights: [
              {
                title: "Clear Queue",
                detail: "No active production issues detected in the pipeline.",
                type: "positive"
              }
            ],
            financialRiskSummary: {
              totalUnpaidAtRisk: 0,
              unpaidNearDeadlineCount: 0,
              insight: "Healthy financial flow with zero high-risk unpaid balances."
            },
            timelineRiskSummary: {
              overdueCount: 0,
              dueWithin3DaysCount: 0,
              insight: "All delivery schedules are on track."
            }
          }
        });
      }

      const client = getAiClient();

      const prompt = `You are Frame Cut Studio AI Project Health Evaluator. Analyze these wedding video editing projects and studio financial/timeline metrics as of ${currentDate}:

Projects Data:
${JSON.stringify(projects.slice(0, 40), null, 2)}

Overall Aggregate Stats:
${JSON.stringify(stats, null, 2)}

Evaluate:
1. Overall Health Score (0-100 where 100 is flawless, 0 is total operational crisis).
2. Health Status ("Optimal" / "Good" / "Needs Attention" / "Critical Risk").
3. Executive Summary: 2-3 crisp sentences summarizing overall editing progress, pending payments, and timeline risks.
4. Urgent Actions: Specific prioritized list of actionable steps for projects with high remaining balances near/past deadlines, overdue delivery dates, or stalled editing stages.
5. Key Highlights: 2-4 key takeaways (mix of positive wins, cautionary warnings, and alerts).
6. Financial Risk Summary: Total unpaid balance at risk, count of projects with unpaid balances near/past delivery deadline, and actionable insight.
7. Timeline Risk Summary: Overdue project count, count of projects due within 3 days, and timeline insight.`;

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert production supervisor and CFO for wedding film studios. Provide structured, accurate, and deeply insightful health assessments based on project statuses, remaining balances, and delivery dates.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              healthScore: {
                type: Type.NUMBER,
                description: "Overall health score from 0 to 100"
              },
              healthStatus: {
                type: Type.STRING,
                description: "One of: Optimal, Good, Needs Attention, Critical Risk"
              },
              healthStatusColor: {
                type: Type.STRING,
                description: "One of: emerald, amber, rose"
              },
              executiveSummary: {
                type: Type.STRING,
                description: "2-3 concise sentences summarizing production and financial health"
              },
              urgentActions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    urgency: { type: Type.STRING, description: "critical, high, or medium" },
                    category: { type: Type.STRING, description: "balance_due, deadline_risk, editor_delay, or overdue_delivery" },
                    relatedProjectId: { type: Type.STRING },
                    relatedProjectName: { type: Type.STRING },
                    actionType: { type: Type.STRING, description: "collect_payment, remind_editor, whatsapp_client, or reschedule" },
                    suggestedActionText: { type: Type.STRING }
                  },
                  required: ["title", "description", "urgency", "suggestedActionText"]
                }
              },
              keyHighlights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    detail: { type: Type.STRING },
                    type: { type: Type.STRING, description: "positive, warning, or alert" }
                  },
                  required: ["title", "detail", "type"]
                }
              },
              financialRiskSummary: {
                type: Type.OBJECT,
                properties: {
                  totalUnpaidAtRisk: { type: Type.NUMBER },
                  unpaidNearDeadlineCount: { type: Type.NUMBER },
                  insight: { type: Type.STRING }
                },
                required: ["totalUnpaidAtRisk", "insight"]
              },
              timelineRiskSummary: {
                type: Type.OBJECT,
                properties: {
                  overdueCount: { type: Type.NUMBER },
                  dueWithin3DaysCount: { type: Type.NUMBER },
                  insight: { type: Type.STRING }
                },
                required: ["overdueCount", "insight"]
              }
            },
            required: ["healthScore", "healthStatus", "healthStatusColor", "executiveSummary", "urgentActions", "keyHighlights", "financialRiskSummary", "timelineRiskSummary"]
          }
        }
      });

      const parsedData = JSON.parse(response.text || "{}");
      res.json({
        success: true,
        data: parsedData
      });
    } catch (error: any) {
      console.error("Gemini Project Health API Error:", error);
      res.status(500).json({
        error: error.message || "Failed to analyze project health with Gemini AI."
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development or static server for production
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
