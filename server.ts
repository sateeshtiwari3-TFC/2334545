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

  // Resilient multi-tier fallback runner for Gemini API
  async function callGeminiWithFallback(
    client: GoogleGenAI,
    params: {
      primaryModel?: string;
      fallbackModels?: string[];
      contents: any;
      config?: any;
    }
  ): Promise<{ response: any; modelUsed: string; fallbackOccurred: boolean }> {
    const candidateModels = [
      params.primaryModel || "gemini-flash-latest",
      ...(params.fallbackModels || ["gemini-3.8-flash", "gemini-3.1-flash-lite"])
    ];
    // Deduplicate candidate models
    const modelsToTry = Array.from(new Set(candidateModels));

    let lastError: any = null;
    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        const activeConfig = { ...(params.config || {}) };
        // If falling back from Pro thinking to a Flash model, safely strip thinkingConfig
        if (i > 0 && activeConfig.thinkingConfig && !model.includes("pro")) {
          delete activeConfig.thinkingConfig;
        }

        const response = await client.models.generateContent({
          model,
          contents: params.contents,
          config: activeConfig
        });
        return { response, modelUsed: model, fallbackOccurred: i > 0 };
      } catch (err: any) {
        lastError = err;
        // Continue to the next fallback model in the list
      }
    }
    throw lastError;
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

      const primaryModel = useHighThinking ? "gemini-3.1-pro-preview" : "gemini-flash-latest";

      const config: any = {
        systemInstruction,
      };

      if (useHighThinking) {
        config.thinkingConfig = {
          thinkingLevel: "HIGH",
        };
      }

      const { response, modelUsed, fallbackOccurred } = await callGeminiWithFallback(client, {
        primaryModel,
        fallbackModels: ["gemini-flash-latest", "gemini-3.8-flash", "gemini-3.1-flash-lite"],
        contents: prompt,
        config
      });

      let responseText = response.text || "";
      if (fallbackOccurred && modelUsed !== "gemini-3.1-pro-preview") {
        responseText += `\n\n*(Note: Executed with **${modelUsed}** to ensure fast, continuous response availability.)*`;
      }

      res.json({
        text: responseText,
        model: modelUsed,
        useHighThinking: modelUsed.includes("pro"),
        quotaLimited: fallbackOccurred,
      });
    } catch (error: any) {
      console.error("Gemini API Error:", error.message || error);
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

      const receiptConfig: any = {
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
      };

      const { response } = await callGeminiWithFallback(client, {
        primaryModel: "gemini-flash-latest",
        fallbackModels: ["gemini-3.8-flash", "gemini-3.1-flash-lite"],
        contents,
        config: receiptConfig
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

      const categoryConfig: any = {
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
      };

      const { response } = await callGeminiWithFallback(client, {
        primaryModel: "gemini-flash-latest",
        fallbackModels: ["gemini-3.8-flash", "gemini-3.1-flash-lite"],
        contents: prompt,
        config: categoryConfig
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

      const healthConfig: any = {
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
      };

      let parsedData: any = null;
      try {
        const { response } = await callGeminiWithFallback(client, {
          primaryModel: "gemini-flash-latest",
          fallbackModels: ["gemini-3.8-flash", "gemini-3.1-flash-lite"],
          contents: prompt,
          config: healthConfig
        });
        parsedData = JSON.parse(response.text || "{}");
      } catch (aiErr: any) {
        // Compute high-reliability deterministic health metrics if models encounter temporary high demand
        const projectsList = Array.isArray(projects) ? projects : [];
        const todayStr = currentDate || new Date().toISOString().split('T')[0];

        let overdueCount = 0;
        let dueWithin3DaysCount = 0;
        let totalUnpaidAtRisk = 0;
        let unpaidNearDeadlineCount = 0;
        const urgentActions: any[] = [];

        projectsList.forEach((p: any) => {
          const remaining = Number(p.remainingBalance) || 0;
          const deliveryDate = p.deliveryDate || '';
          const isCompleted = p.status === 'Completed' || p.status === 'Delivered';

          if (!isCompleted && deliveryDate) {
            if (deliveryDate < todayStr) {
              overdueCount++;
              if (remaining > 0) {
                totalUnpaidAtRisk += remaining;
                unpaidNearDeadlineCount++;
              }
              if (urgentActions.length < 5) {
                urgentActions.push({
                  id: `act-${p.id || Math.random()}`,
                  title: `Overdue Delivery: ${p.projectName || p.clientName || 'Wedding Project'}`,
                  description: `Project delivery was scheduled for ${deliveryDate}. Remaining balance: ₹${remaining.toLocaleString('en-IN')}.`,
                  urgency: 'critical',
                  category: 'overdue_delivery',
                  relatedProjectId: p.id,
                  relatedProjectName: p.projectName || p.clientName,
                  actionType: 'remind_editor',
                  suggestedActionText: `Expedite editing with ${p.assignedEditorName || 'lead editor'} immediately.`
                });
              }
            } else {
              const diffDays = Math.ceil((new Date(deliveryDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= 0 && diffDays <= 3) {
                dueWithin3DaysCount++;
                if (remaining > 0) {
                  totalUnpaidAtRisk += remaining;
                  unpaidNearDeadlineCount++;
                }
                if (urgentActions.length < 5) {
                  urgentActions.push({
                    id: `act-${p.id || Math.random()}`,
                    title: `Upcoming Deadline (In ${diffDays}d): ${p.projectName || p.clientName || 'Wedding Project'}`,
                    description: `Delivery due on ${deliveryDate}. Status is currently "${p.status || 'In Progress'}".`,
                    urgency: 'high',
                    category: 'deadline_risk',
                    relatedProjectId: p.id,
                    relatedProjectName: p.projectName || p.clientName,
                    actionType: 'whatsapp_client',
                    suggestedActionText: `Review timeline & confirm rough cut schedule.`
                  });
                }
              }
            }
          }
        });

        let healthScore = Math.max(25, 100 - (overdueCount * 18) - (dueWithin3DaysCount * 6) - (unpaidNearDeadlineCount * 5));
        healthScore = Math.min(100, healthScore);

        const healthStatus = healthScore >= 80 ? 'Optimal' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Needs Attention' : 'Critical Risk';
        const healthStatusColor = healthScore >= 80 ? 'emerald' : healthScore >= 60 ? 'amber' : 'rose';

        parsedData = {
          healthScore,
          healthStatus,
          healthStatusColor,
          executiveSummary: overdueCount > 0
            ? `Production alert: ${overdueCount} project(s) past delivery schedule with ₹${totalUnpaidAtRisk.toLocaleString('en-IN')} pending at risk. Priority action recommended.`
            : `Production queue is operating with high discipline. ${projectsList.length} total projects tracked with ${dueWithin3DaysCount} upcoming milestones this week.`,
          urgentActions,
          keyHighlights: [
            {
              title: overdueCount === 0 ? "Zero Overdue Backlog" : `${overdueCount} Overdue Projects`,
              detail: overdueCount === 0 ? "All editing suites are on or ahead of schedule." : "Overdue deliveries require immediate editor contact.",
              type: overdueCount === 0 ? "positive" : "alert"
            },
            {
              title: "Receivables Watch",
              detail: `₹${totalUnpaidAtRisk.toLocaleString('en-IN')} in remaining balances associated with urgent deadlines.`,
              type: totalUnpaidAtRisk > 50000 ? "warning" : "positive"
            }
          ],
          financialRiskSummary: {
            totalUnpaidAtRisk,
            unpaidNearDeadlineCount,
            insight: totalUnpaidAtRisk > 0
              ? `Follow up with client studios for milestone receipts prior to final video export.`
              : `All upcoming deadline projects are financially clear.`
          },
          timelineRiskSummary: {
            overdueCount,
            dueWithin3DaysCount,
            insight: overdueCount > 0
              ? `Reallocate editing capacity to clear delayed wedding films.`
              : `Timeline milestones well distributed over the next 7 days.`
          }
        };
      }

      res.json({
        success: true,
        data: parsedData
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to analyze project health."
      });
    }
  });

  // API endpoint for AI Wedding Soundtrack Suggester
  app.post("/api/gemini/suggest-soundtrack", async (req, res) => {
    try {
      const {
        weddingStyle = "Royal Rajasthani",
        ceremony = "Full Wedding Film Arc",
        mood = "Royal & Grandeur",
        languagePreference = "Hindi / Bollywood & Folk",
        coupleNames = "Rahul & Priya",
        notes = ""
      } = req.body;

      const client = getAiClient();

      const prompt = `Wedding Production Music Curation Request:
- Wedding Style / Aesthetic: ${weddingStyle}
- Couple Names: ${coupleNames}
- Ceremony Focus / Deliverable: ${ceremony}
- Desired Emotional Mood: ${mood}
- Language & Genre Preference: ${languagePreference}
- Custom Editor Notes: ${notes || "None"}

As the Chief Sound Designer for 'The Frame Cut Studio' (elite wedding cinema), curate a high-impact soundtrack sequence (5 to 7 tracks) specifically tailored for video editors editing this wedding in Premiere Pro / DaVinci Resolve.
Include a variety of tracks covering the cinematic flow (e.g. Teaser Opener, Couple Entry, Varmala / Sacred Pheras, Energetic Sangeet, Emotional Send-off / Bidaai).
Provide accurate song titles, artists, tempo BPM, mood keywords, why it fits this specific style, practical video editing cutting/transition tips, and clean streaming search queries.`;

      const systemInstruction = `You are the Master Sound Supervisor & Music Director for "The Frame Cut Studio", a luxury wedding video production agency.
You have encyclopedic knowledge of Bollywood wedding classics, trending Indian indie music, Coke Studio, Sufi soul tracks, Punjabi wedding anthems, Rajasthani royal folk, South Indian classical fusion (Shehnai/Nadaswaram/Violin), and acoustic romantic indie ballads.
You know how video editors sync edits to beat drops, emotional crescendos, and dialogue audio ducking.
Always provide realistic, culturally resonant, and trending tracks.`;

      const soundtrackConfig: any = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weddingThemeVibe: {
              type: Type.STRING,
              description: "2-3 sentences describing the musical atmosphere and aesthetic identity"
            },
            colorPaletteSuggestion: {
              type: Type.STRING,
              description: "Recommended visual color grading palette matching this soundtrack mood"
            },
            soundtracks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  segment: {
                    type: Type.STRING,
                    description: "e.g. Teaser Opener, Bridal Entry (Varmala), Sacred Pheras / Vows, Sangeet Blast, Emotional Bidaai, Grand Finale"
                  },
                  songTitle: {
                    type: Type.STRING,
                    description: "Exact song title or track name"
                  },
                  artist: {
                    type: Type.STRING,
                    description: "Singer, music producer or composer"
                  },
                  genre: {
                    type: Type.STRING,
                    description: "Genre e.g. Royal Sufi Folk, Punjabi Pop, Cinematic Orchestral, Acoustic Indie"
                  },
                  tempoBpm: {
                    type: Type.STRING,
                    description: "e.g. 78 BPM (Slow Emotional), 105 BPM (Medium Sway), 128 BPM (High Energy Drop)"
                  },
                  mood: {
                    type: Type.STRING,
                    description: "Mood keywords e.g. Ethereal, Grandeur, Heartfelt, Euphoric"
                  },
                  whyItFits: {
                    type: Type.STRING,
                    description: "Why this song elevates this wedding style and couple"
                  },
                  editingTip: {
                    type: Type.STRING,
                    description: "Specific video editor tip (e.g., cut to speed-ramp on the drop, leave 6dB headroom for bride vows)"
                  },
                  searchQuery: {
                    type: Type.STRING,
                    description: "Clean search string for YouTube / Spotify"
                  }
                },
                required: ["segment", "songTitle", "artist", "genre", "tempoBpm", "mood", "whyItFits", "editingTip", "searchQuery"]
              }
            },
            mixingTips: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "3-4 pro audio mixing / mastering tips for the editor"
            }
          },
          required: ["weddingThemeVibe", "soundtracks", "mixingTips"]
        }
      };

      const { response } = await callGeminiWithFallback(client, {
        primaryModel: "gemini-flash-latest",
        fallbackModels: ["gemini-3.8-flash", "gemini-3.1-flash-lite"],
        contents: prompt,
        config: soundtrackConfig
      });

      const parsedData = JSON.parse(response.text || "{}");
      res.json({
        success: true,
        data: parsedData
      });
    } catch (error: any) {
      console.error("Gemini Soundtrack Suggester Error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate wedding soundtrack suggestions."
      });
    }
  });

  // API endpoint for AI Reels & YouTube Caption Generator
  app.post("/api/gemini/generate-captions", async (req, res) => {
    try {
      const {
        coupleNames = "Rahul & Priya",
        weddingStyle = "Royal Rajasthani",
        eventType = "Wedding Film",
        deliverablesType = "30s-60s Instagram Reel",
        tone = "Cinematic & Poetic",
        location = "Udaipur, Rajasthan",
        studioName = "Frame Cut Studio",
        editorName = "Vansh Tiwari",
        customNotes = ""
      } = req.body;

      const client = getAiClient();

      const prompt = `Wedding Video Social Media Package Request:
- Couple: ${coupleNames}
- Wedding Style / Vibe: ${weddingStyle}
- Event Type: ${eventType}
- Deliverable: ${deliverablesType}
- Tone / Voice: ${tone}
- Venue / City: ${location || "India"}
- Production Studio: ${studioName || "The Frame Cut Studio"}
- Lead Editor: ${editorName || "Creative Team"}
- Additional Story Details: ${customNotes || "A celebration filled with emotional rituals, high energy dancing, and everlasting promises."}

Generate a viral, high-converting social media distribution package for Instagram Reels and YouTube.
Requirements:
1. Three distinct Instagram Reels captions (one Hook-first viral style, one Deeply Emotional & Poetic style, one Modern & Fun style).
   Each must include:
   - hookLine: Attention-grabbing first 3 seconds hook for the video overlay
   - caption: Engaging body with clean line breaks and emojis
   - hashtags: 15-20 trending, high-reach wedding & filmmaking hashtags
   - callToAction: Clear prompt for engagement (saving, sharing, commenting)
2. YouTube Video Package:
   - 3 High-CTR YouTube Video Titles (optimized for search and emotional intrigue)
   - description: Fully formatted YouTube description including a captivating story intro, film synopsis, crew credits (cinematography, editing, music placeholder), and gear/production notes
   - chapterTemplate: Ready-to-use chapter timestamps (e.g. 00:00 Intro, 00:45 Haldi madness, etc.)
   - tags: 12-16 YouTube search tags
3. WhatsApp Status Blurb: A warm, exciting 2-3 line announcement that the couple or studio can paste directly into WhatsApp status or family groups with a link placeholder.
4. Story Post Text: Short, punchy 2-line teaser for 24-hour Instagram Stories.`;

      const systemInstruction = `You are the Viral Social Media Strategist & Storyteller for "The Frame Cut Studio".
You specialize in Indian and international luxury wedding video marketing. You know what makes wedding reels go viral on Instagram (hooks that stop the scroll, relatable emotion, trending audio callouts, aesthetic formatting) and what makes YouTube wedding films rank and get millions of organic views.`;

      const captionsConfig: any = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            instagramReels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hookLine: {
                    type: Type.STRING,
                    description: "Compelling hook for on-screen text in first 3 seconds"
                  },
                  caption: {
                    type: Type.STRING,
                    description: "Engaging storytelling caption formatted with spacing and emojis"
                  },
                  hashtags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "15-20 trending hashtags"
                  },
                  callToAction: {
                    type: Type.STRING,
                    description: "Call to action prompt"
                  }
                },
                required: ["hookLine", "caption", "hashtags", "callToAction"]
              }
            },
            youtube: {
              type: Type.OBJECT,
              properties: {
                titleOptions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3 high-CTR YouTube video titles"
                },
                description: {
                  type: Type.STRING,
                  description: "Full YouTube description with story, credits, and links"
                },
                chapterTemplate: {
                  type: Type.STRING,
                  description: "Timestamps formatted for YouTube chapters"
                },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "12-16 search tags"
                }
              },
              required: ["titleOptions", "description", "chapterTemplate", "tags"]
            },
            whatsappStatusBlurb: {
              type: Type.STRING,
              description: "Short ready-to-send WhatsApp broadcast / status text"
            },
            storyPostText: {
              type: Type.STRING,
              description: "2-line punchy Instagram story teaser text"
            }
          },
          required: ["instagramReels", "youtube", "whatsappStatusBlurb", "storyPostText"]
        }
      };

      const { response } = await callGeminiWithFallback(client, {
        primaryModel: "gemini-flash-latest",
        fallbackModels: ["gemini-3.8-flash", "gemini-3.1-flash-lite"],
        contents: prompt,
        config: captionsConfig
      });

      const parsedData = JSON.parse(response.text || "{}");
      res.json({
        success: true,
        data: parsedData
      });
    } catch (error: any) {
      console.error("Gemini Caption Generator Error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate social media captions."
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
