import { App, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile, Editor} from 'obsidian';
import { inspect } from 'util'

interface PluginSettings {
	invertingOn: boolean;
	delay: number
}

const DEFAULT_SETTINGS: PluginSettings = {
	invertingOn: true,
	delay: 30
}

const VALID_TARGET_REGEX = /!\[\[[^\]]+\.(png|jpg|jpeg|svg)\]\]/

export default class InvertPastedImagePlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
	
		this.registerEvent(
				this.app.workspace.on('editor-paste', async (evt, editor)=>{
					console.log(evt.clipboardData)
					if(this.settings.invertingOn){
						
						await sleep(this.settings.delay)
						let cursor = editor.getCursor()
						if(VALID_TARGET_REGEX.test(editor.getLine(cursor.line))){
							cursor = editor.offsetToPos(editor.posToOffset(cursor)-2)
							editor.replaceRange('#invert', cursor)
							
						}
					}
				})
		)


		this.addCommand({
			id: 'toggle-pasted-image-dark-mode',
			name: 'Toggle inverting pasted images',
			callback: ()=>{
				this.settings.invertingOn = !this.settings.invertingOn
			}
		})

		this.addSettingTab(new SettingsTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

}

class SettingsTab extends PluginSettingTab {
	plugin: InvertPastedImagePlugin;

	constructor(app: App, plugin: InvertPastedImagePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Toggle inverting pasted images')
			.addToggle((toggle) =>{
				toggle.setValue(this.plugin.settings.invertingOn)
				.onChange(async (value)=>{
					this.plugin.settings.invertingOn = value;
					await this.plugin.saveSettings();
				})
			})
		
			let delaySettings = new Setting(containerEl)
			.setName('Delay')
			.setDesc("Increase this value if inverting isn't applied")
			.addText((text)=>{
				text.setValue(String(this.plugin.settings.delay))
			.onChange(async (value)=>{
				this.plugin.settings.delay = Number(value);
				await this.plugin.saveSettings();
			})
			})
			delaySettings.addButton((button)=>{
				button.setButtonText("Reset")
				button.onClick(async (evt)=>{
					this.plugin.settings.delay = DEFAULT_SETTINGS.delay
					delaySettings.components[0].inputEl.value = DEFAULT_SETTINGS.delay
					await this.plugin.saveSettings();
				})
			})
	}
}