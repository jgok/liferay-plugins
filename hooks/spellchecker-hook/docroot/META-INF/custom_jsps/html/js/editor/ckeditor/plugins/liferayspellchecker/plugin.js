(function() {

	var A = AUI();

	var baseJscPluginPath = themeDisplay.getPathJavaScript() +
		'/editor/ckeditor/plugins/liferayspellchecker';

	var jscCssPath = baseJscPluginPath + '/css/liferay.spellchecker.css';

	CKEDITOR.document.appendStyleSheet(CKEDITOR.getUrl(jscCssPath));

	CKEDITOR.config.contentsCss = [CKEDITOR.config.contentsCss, jscCssPath];

	CKEDITOR.plugins.add(
		'liferayspellchecker',
		{
			config: {
				suggestBox: {
					numWords: undefined
				}
			},

			create: function() {
				var instance = this;

				instance.editor.setReadOnly(true);
				instance.editor.commands.liferayspellchecker.toggleState();
				instance.editorWindow = instance.editor.document.getWindow().$;

				instance.createSpellchecker();
				instance.spellchecker.checkSpelling();
			},

			createSpellchecker: function() {
				var instance = this;

				instance.config.destroy = function() {
					alert(
						Liferay.Language.get('there-are-no-incorrectly-spelled-words')
					);

					instance.destroy();
				};

				instance.config.getText = function() {
					var node = A.Node.create('<div />');
					var text = instance.editor.getData();

					return node.append(text).attr('textContent');
				};

				instance.config.containerId = 'cke_' + instance.editor.name;

				instance.spellchecker = new A.SpellChecker(
					instance.editor.document.$.body,
					instance.config
				);
			},

			destroy: function() {
				var instance = this;

				if (!instance.spellchecker) {
					return;
				}

				instance.spellchecker.destroy();
				instance.spellchecker = null;

				instance.editor.setReadOnly(false);
				instance.editor.commands.liferayspellchecker.toggleState();
			},

			init: function(editor) {
				var instance = this;

				var dependencies = [
					CKEDITOR.getUrl(instance.path + 'js/aui-replacetext.js'),
					CKEDITOR.getUrl(instance.path + 'js/liferay.spellchecker.js')
				];

				CKEDITOR.scriptLoader.load(dependencies);

				editor.addCommand(
					'liferayspellchecker',
					{
						canUndo: false,
						exec: function() {
							instance.toggle(editor);
						},
						readOnly: 1
					}
				);

				editor.ui.addButton(
					'liferayspellchecker',
					{
						command: 'liferayspellchecker',
						icon: baseJscPluginPath + '/assets/spellchecker.png',
						label: Liferay.Language.get('spell-check'),
						toolbar: 'spellchecker,10'
					}
				);

				editor.on(
					'saveSnapshot',
					function() {
						instance.destroy();
					}
				);
			},

			toggle: function(editor) {
				var instance = this;

				instance.editor = editor;

				if (!instance.spellchecker) {
					instance.create();
				}
				else {
					instance.destroy();
				}
			}
		}
	);

})();