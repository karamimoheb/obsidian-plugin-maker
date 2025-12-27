
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
You are the "Architect Debug Specialist." Your focus is identifying, fixing, and learning from technical errors.

DEBUG PROTOCOL:
1. ANALYZE: Parse the error log. Identify Type (Runtime, Build, Type, Config). Locate File/Line.
2. RESEARCH: If the error is complex, use Google Search to find modern solutions.
3. EXPERIENCE CHECK: Review "Resolved History" to see if this pattern has occurred before. 
4. REGRESSION PREVENTION: Before finalizing a fix, ensure it doesn't break previous fixes or project logic.
5. CONTEXTUALIZE: Look at current project files.
6. FIX & LEARN: Generate MINIMAL changes. Record the root cause and final resolution.

OUTPUT FORMAT:
Return a JSON object with:
- explanation: Concise summary of why it happened.
- chatMessage: Summary of the fix.
- status: 'resolved' if fixed.
- errorType: 'runtime'|'build'|'type'|'config'.
- rootCause: Deep technical reason.
- resolution: Specific fix strategy.
- affectedFilesPaths: Array of paths changed.
- files: Array of {path, content}.
`;

const LEARNING_SYSTEM_INSTRUCTION = `
You are in "Learning Mode" as the Obsidian Plugin Architect.
Your mission is to analyze the provided source code and extract high-quality technical knowledge.

CORE RULES:
- Code-Grounded Only: Never guess.
- Traceable: Link logic across files.
- Deliverables: Generate LEARNING_NOTES.md and PLUGIN_RULES.md at the final step.

STEP-SPECIFIC TASKS:
1. Project Tree & Tech Stack: Identify core dependencies and overall structure.
2. Entry Points: Find main.ts, plugin lifecycle methods (onload, onunload).
3. Core Modules: Analyze the business logic and primary features.
4. Integration Points: How does it talk to Obsidian API or external services?
5. Quality Review: Note design patterns, best practices, and risks.
6. Extraction: Consolidate everything into LEARNING_NOTES.md and PLUGIN_RULES.md.

OUTPUT FORMAT:
Return a JSON object:
- resultMarkdown: A detailed markdown summary of this specific step's findings.
- statusUpdate: Brief status text.
- generatedFiles: ONLY for step 6, array of {path, content} for LEARNING_NOTES.md and PLUGIN_RULES.md.
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
  resolvedIssues: ProjectIssue[] = [],
  modelName: string = 'gemini-3-pro-preview'
): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fileContext = currentFiles.map(f => `Path: ${f.path}\nContent:\n${f.content}`).join('\n\n---\n\n');
  const historyContext = resolvedIssues.length > 0 
    ? `RESOLVED HISTORY (EXPERIENCE):\n${resolvedIssues.map(i => `- Type: ${i.errorType}, Root Cause: ${i.rootCause}, Fix: ${i.resolution}`).join('\n')}`
    : "No resolved history yet.";

  const parts = [
    { text: `ERROR LOG TO FIX:\n${errorLog}` },
    { text: historyContext },
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
          errorType: { type: Type.STRING },
          rootCause: { type: Type.STRING },
          resolution: { type: Type.STRING },
          affectedFilesPaths: { type: Type.ARRAY, items: { type: Type.STRING } },
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { path: { type: Type.STRING }, content: { type: Type.STRING } },
              required: ["path", "content"]
            }
          }
        },
        required: ["explanation", "chatMessage", "files", "status", "errorType", "rootCause", "resolution"]
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

export async function processLearningStep(
  stepIndex: number,
  stepTitle: string,
  currentFiles: FileEntry[],
  previousFindings: string = "",
  modelName: string = 'gemini-3-pro-preview'
): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fileContext = currentFiles.map(f => `Path: ${f.path}\nContent:\n${f.content}`).join('\n\n---\n\n');

  const parts = [
    { text: `CURRENT STEP: ${stepIndex + 1}. ${stepTitle}` },
    { text: `PREVIOUS FINDINGS:\n${previousFindings}` },
    { text: `PROJECT SOURCE CODE:\n${fileContext}` }
  ];

  try {
    const config: any = {
      systemInstruction: LEARNING_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          resultMarkdown: { type: Type.STRING },
          statusUpdate: { type: Type.STRING },
          generatedFiles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { path: { type: Type.STRING }, content: { type: Type.STRING } },
              required: ["path", "content"]
            }
          }
        },
        required: ["resultMarkdown", "statusUpdate"]
      }
    };

    // Use higher budget for extraction
    if (modelName.includes('pro')) {
      config.thinkingConfig = { thinkingBudget: 16000 };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Learning Mode Step Failed", error);
    throw error;
  }
}
