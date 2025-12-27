
import { GoogleGenAI, Type } from "@google/genai";
import { FileEntry, ChatMessage, ChatAttachment, ProjectIssue, ProjectTask } from "../types";

const SYSTEM_INSTRUCTION = `
You are "Obsidian Plugin Architect," a specialized senior software engineer.
You follow a 2-step development process:

PHASE 1: PLANNING (Default for new requests)
- If the user asks for a new feature or plugin and 'PLAN.md' doesn't exist or is outdated, generate ONLY a 'PLAN.md' file.
- The 'PLAN.md' must include: ## Plugin Goal, ## Core Features, ## Technical Stack, ## File Structure, and ## Implementation Steps.
- Do NOT generate main code files in this phase.

PHASE 2: BUILDING (Triggered when user clicks 'Build' or asks to implement the plan)
- Read 'PLAN.md' provided in the context.
- Implement the full directory structure described.
- Ensure 'package.json', 'tsconfig.json', and 'esbuild.config.mjs' are robust.
- Provide a detailed 'main.ts'.

MANAGEMENT RULES:
1. Address ACTIVE ISSUES/ERRORS first.
2. Maintain a PROJECT ROADMAP.
3. Classify tasks into: "completed", "todo", "suggestion".
4. Output MUST be valid JSON.
`;

const DEBUG_SYSTEM_INSTRUCTION = `
You are the "Architect Debug Specialist." Your sole focus is identifying and fixing technical errors in Obsidian Plugins.

DEBUG PROTOCOL:
1. ANALYZE: Parse the error log. Identify Type (Runtime, Build, Type, Config). Locate File/Line.
2. RESEARCH: If the error involves specific Obsidian API versions or external dependencies, use Google Search to find modern solutions.
3. CONTEXTUALIZE: Look at the provided files to see how the error manifests in the code.
4. FIX: Generate MINIMAL, targeted changes to the specific files causing the error. Do not refactor unrelated code.

OUTPUT FORMAT:
Return a JSON object with:
- explanation: A concise summary of why the error happened.
- chatMessage: A summary of the fix applied.
- status: Set to 'resolved' if fixed.
- files: Array of {path, content} for affected files.
- tasks: Optional roadmap updates.
`;

export async function processArchitectRequest(
  userRequest: string,
  currentFiles: FileEntry[],
  chatHistory: ChatMessage[],
  modelName: string = 'gemini-3-pro-preview',
  attachments: ChatAttachment[] = [],
  openIssues: ProjectIssue[] = [],
  currentTasks: ProjectTask[] = [],
  retryCount = 0
): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const fileContext = currentFiles.map(f => `Path: ${f.path}\nContent:\n${f.content}`).join('\n\n---\n\n');
  const issuesContext = openIssues.length > 0 
    ? `Unresolved Issues:\n${openIssues.map(i => `- [${i.status}] ${i.errorLog}`).join('\n')}`
    : "No active issues.";
  const tasksContext = currentTasks.length > 0
    ? `Current Roadmap:\n${currentTasks.map(t => `- [${t.status}] ${t.title}`).join('\n')}`
    : "Roadmap is empty.";

  const isBuildRequest = userRequest.toLowerCase().includes('build plugin from specs') || 
                        userRequest.toLowerCase().includes('implement the plan');

  const phaseInstruction = isBuildRequest 
    ? "EXECUTION PHASE: Implement the code based on the PLAN.md provided."
    : "PLANNING PHASE: Analyze the user intent and update PLAN.md. Do not implement main code yet.";

  const parts: any[] = [
    { text: `Current Phase Context: ${phaseInstruction}` },
    { text: `Context:\nFiles:\n${fileContext}` },
    { text: `Error Memory:\n${issuesContext}` },
    { text: `Current Tasks:\n${tasksContext}` },
    { text: `History:\n${chatHistory.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}` }
  ];

  attachments.forEach(att => {
    parts.push({ inlineData: { mimeType: att.mimeType, data: att.data.split(',')[1] || att.data } });
  });

  parts.push({ text: `User Request: ${userRequest}` });

  try {
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          chatMessage: { type: Type.STRING },
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { path: { type: Type.STRING }, content: { type: Type.STRING } },
              required: ["path", "content"]
            }
          },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["todo", "completed", "suggestion"] },
                description: { type: Type.STRING }
              },
              required: ["id", "title", "status"]
            }
          }
        },
        required: ["explanation", "chatMessage", "files", "tasks"]
      }
    };

    if (modelName.includes('pro')) {
      config.tools = [{ googleSearch: {} }];
      config.thinkingConfig = { thinkingBudget: modelName.includes('2.5') ? 32768 : 16000 };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    if (retryCount < 1 && (error.message?.includes('429') || error.message?.includes('500'))) {
      await new Promise(r => setTimeout(r, 2000));
      return processArchitectRequest(userRequest, currentFiles, chatHistory, modelName, attachments, openIssues, currentTasks, retryCount + 1);
    }
    throw error;
  }
}

export async function processDebugRequest(
  errorLog: string,
  currentFiles: FileEntry[],
  modelName: string = 'gemini-3-pro-preview'
): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fileContext = currentFiles.map(f => `Path: ${f.path}\nContent:\n${f.content}`).join('\n\n---\n\n');

  const parts = [
    { text: `ERROR LOG TO FIX:\n${errorLog}` },
    { text: `CURRENT PROJECT CODE:\n${fileContext}` }
  ];

  try {
    const config: any = {
      systemInstruction: DEBUG_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          chatMessage: { type: Type.STRING },
          status: { type: Type.STRING },
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { path: { type: Type.STRING }, content: { type: Type.STRING } },
              required: ["path", "content"]
            }
          }
        },
        required: ["explanation", "chatMessage", "files", "status"]
      }
    };

    if (modelName.includes('pro')) {
      config.tools = [{ googleSearch: {} }];
      config.thinkingConfig = { thinkingBudget: 16000 };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Debug Analysis Failed", error);
    throw error;
  }
}
