
import { FileEntry } from './types';

export const DEFAULT_FILES: FileEntry[] = [
  {
    name: 'README.md',
    path: 'README.md',
    type: 'file',
    content: `# معمار پلاگین ابسیدین (Obsidian Plugin Architect)

این یک محیط توسعه یکپارچه (IDE) هوشمند برای ساخت پلاگین‌های اختصاصی ابسیدین است.

## امکانات کلیدی
- **معمار هوش مصنوعی**: چت مستقیم با مدل‌های پیشرفته برای تولید و اصلاح کد پلاگین.
- **مدیریت فایل**: ساختار درختی فایل‌ها (main.ts، manifest.json و غیره).
- **پشتیبانی از چندین مدل**: امکان اضافه کردن API Key و URLهای سفارشی برای مدل‌های مختلف.
- **خروجی مستقیم**: دانلود کل پروژه به صورت فایل ZIP آماده نصب.
- **ذخیره‌سازی محلی**: استفاده از IndexedDB برای حفظ وضعیت پروژه حتی پس از بستن مرورگر.

## نحوه استفاده
1. از بخش **Explorer** فایل‌های مورد نظر را انتخاب و ویرایش کنید.
2. از طریق **Architect Chat** درخواست‌های خود را برای تغییر کد یا اضافه کردن ویژگی جدید بنویسید.
3. پس از اتمام کار، روی دکمه **Download Plugin** کلیک کنید.
4. فایل ZIP را در مسیر \`.obsidian/plugins/your-plugin-name\` در مخزن ابسیدین خود استخراج کنید.

## تسک‌های انجام شده
- [x] پیاده‌سازی محیط کدنویسی
- [x] اتصال به API جمینای برای معماری کد
- [x] سیستم مدیریت فایل‌های پلاگین
- [x] قابلیت خروجی ZIP
- [x] سیستم ذخیره‌سازی ابری/محلی با IndexedDB
- [x] مدیریت مدل‌های سفارشی هوش مصنوعی
`
  },
  {
    name: 'BUILD_GUIDE.md',
    path: 'BUILD_GUIDE.md',
    type: 'file',
    content: `# راهنمای بیلد و راه‌اندازی پلاگین

این راهنما شامل دستورات لازم برای تبدیل کدهای منبع (Source Code) به فایل‌های قابل اجرا در ابسیدین است.

## پیش‌نیازها
قبل از شروع، مطمئن شوید که **Node.js** و **npm** روی سیستم شما نصب است.

## دستورات اجرایی

### ۱. نصب پکیج‌های مورد نیاز
برای نصب تمام وابستگی‌های تعریف شده در پروژه، دستور زیر را در ترمینال اجرا کنید:
\`\`\`bash
npm install
\`\`\`

### ۲. بیلد نهایی (Production Build)
برای تولید فایل \`main.js\` نهایی و بهینه‌سازی شده، از این دستور استفاده کنید:
\`\`\`bash
npm run build
\`\`\`

### ۳. حالت توسعه (Development Mode)
اگر در حال ویرایش کد هستید و می‌خواهید تغییرات بلافاصله بیلد شوند (Watch mode):
\`\`\`bash
npm run dev
\`\`\`

## ساختار خروجی پلاگین
پس از اجرای دستور بیلد، فایل‌های ضروری برای کارکرد پلاگین عبارتند از:
- \`main.js\`: کد کامپایل شده پلاگین.
- \`manifest.json\`: اطلاعات شناسایی پلاگین.
- \`styles.css\`: استایل‌های ظاهری (در صورت وجود).

این فایل‌ها باید در پوشه پلاگین شما در مسیر زیر قرار گیرند:
\`.obsidian/plugins/[نام-پلاگین-شما]/\`
`
  },
  {
    name: 'manifest.json',
    path: 'manifest.json',
    type: 'file',
    content: `{
  "id": "obsidian-sample-plugin",
  "name": "Sample Plugin",
  "version": "1.0.0",
  "minAppVersion": "0.15.0",
  "description": "It's a sample plugin for Obsidian.",
  "author": "Obsidian Developer",
  "authorUrl": "https://obsidian.md",
  "isDesktopOnly": false
}`
  },
  {
    name: 'main.ts',
    path: 'main.ts',
    type: 'file',
    content: `import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			new Notice('This is a notice!');
		});

		this.addCommand({
			id: 'display-modal-command',
			name: 'Display modal',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('A test setting')
			.addText(text => text
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
`
  },
  {
    name: 'styles.css',
    path: 'styles.css',
    type: 'file',
    content: `.my-plugin-ribbon-class { color: var(--text-accent); }`
  }
];
