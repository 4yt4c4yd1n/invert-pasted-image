import { App, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile, Editor} from 'obsidian';
import { inspect } from 'util'

interface PluginSettings {
	invertingOn: boolean;
	invertAmount: string,
	hueRotate: string
}

const DEFAULT_SETTINGS: PluginSettings = {
	invertingOn: true,
	invertAmount: '0.88235294117',
	hueRotate: '180'
}

const VALID_TARGET_REGEX = /!\[\[[^\]]+\.(png|jpg|jpeg|svg)\]\]/

export default class InvertPastedImagePlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
	
		this.registerEvent(
				this.app.workspace.on('editor-paste', async (evt, editor)=>{
					
					if(this.settings.invertingOn){
						
						await sleep(10)
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
		changeInvertAmount(this.settings.invertAmount);
		changeHueRotateAmount(this.settings.hueRotate);
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
		
			let invertSettings = new Setting(containerEl)
			.setName('Inverting strength(0-1)')
			.addText((text)=>{
				text.setValue(this.plugin.settings.invertAmount)
			.onChange(async (value)=>{
				if(value[value.length-1] != '.' && value[value.length-1] != '0'){
					value = String(Math.clamp(Number(value), 0, 1))
				}
				invertSettings.components[0].inputEl.value = value
				this.plugin.settings.invertAmount = value;
				await this.plugin.saveSettings();
				changeInvertAmount(value)
			})
			})
			invertSettings.addButton((button)=>{
				button.setButtonText("Reset")
				button.onClick(async (evt)=>{
					this.plugin.settings.invertAmount = DEFAULT_SETTINGS.invertAmount
					changeInvertAmount(DEFAULT_SETTINGS.invertAmount)
					invertSettings.components[0].inputEl.value = DEFAULT_SETTINGS.invertAmount
					await this.plugin.saveSettings();
				})
			})

			let hueRotationSettings = new Setting(containerEl)
			.setName('Hue rotation(0-360)')
			.addText((text)=>{
				text.setValue(this.plugin.settings.hueRotate)
			.onChange(async (value)=>{
				value = String(Math.clamp(Number(value), 0, 360))
				this.plugin.settings.hueRotate = value;
				hueRotationSettings.components[0].inputEl.value = value
				await this.plugin.saveSettings();
				changeHueRotateAmount(value)
			})
			})
			hueRotationSettings.addButton((button)=>{
				button.setButtonText("Reset")
				button.onClick(async (evt)=>{
					this.plugin.settings.hueRotate = DEFAULT_SETTINGS.hueRotate
					changeHueRotateAmount(DEFAULT_SETTINGS.hueRotate)
					hueRotationSettings.components[0].inputEl.value = DEFAULT_SETTINGS.hueRotate
					await this.plugin.saveSettings();
				})
			})
	}
}

function changeInvertAmount(value:string){
	let b = document.body
	b.style.setProperty("--invert-amount", value)
}
function changeHueRotateAmount(value:string){
	let b = document.body
	b.style.setProperty("--hue-rotate", value+'deg')
}