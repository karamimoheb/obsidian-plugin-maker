
import { GoogleGenAI, Type } from "@google/genai";
import { FileEntry, ChatMessage, ChatAttachment, ProjectIssue, ProjectTask } from "../types";

const SYSTEM_INSTRUCTION = `
You are "Obsidian Plugin Architect," a specialized senior software engineer.
Your role is to help the user build, modify, and optimize professional Obsidian plugins.

MANAGEMENT RULES:
1. Address ACTIVE ISSUES/ERRORS first.
2. Maintain a PROJECT ROADMAP. You must return an updated list of tasks.
3. INFRASTRUCTURE: Always ensure 'package.json', 'tsconfig.json', and 'esbuild.config.mjs' are present and correctly configured with build scripts.
4. If the user reports a "Missing script" error, fix the 'package.json' file.
5. Classify tasks into: 
   - "completed": Features already implemented in the code.
   - "todo": Features requested but not yet finished.
   - "suggestion": Smart improvements or advanced features the user might want next.
6. If the user asks for an "Audit", review the existing code for bugs, performance leaks (especially in onunload), and Obsidian API best practices.

Output MUST be valid JSON:
1. "explanation": Technical summary.
2. "files": Array of { path, content } updated files.
3. "tasks": Array of { id, title, status, description } representing the full roadmap.
4. "chatMessage": Friendly professional response.
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

  const parts: any[] = [
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
