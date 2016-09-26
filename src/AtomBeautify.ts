import { newUnibeautify, Unibeautify, Beautifier, Language } from "unibeautify";
import { CompositeDisposable, Disposable } from "atom";
import Config from "./config";
import * as Promise from "bluebird";
import * as path from "path";

declare const atom: any;
declare type IEditor = any;

export class AtomBeautify {
    private unibeautify: Unibeautify;
    private subscriptions: CompositeDisposable;

    public activate(state: any): void {
        console.log("activated!!");
        this.unibeautify = newUnibeautify();
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add(this.handleSaveEvent());
        this.subscriptions.add(atom.commands.add("atom-workspace", "atom-beautify:beautify-editor", this.beautifyEditor.bind(this)));
        this.subscriptions.add(atom.commands.add("atom-workspace", "atom-beautify:help-debug-editor", this.debug.bind(this)));
        this.subscriptions.add(atom.commands.add(".tree-view .file .name", "atom-beautify:beautify-file", this.beautifyFile.bind(this)));
        this.subscriptions.add(atom.commands.add(".tree-view .directory .name", "atom-beautify:beautify-directory", this.beautifyDirectory.bind(this)));

    }

    public deactivate(): void {
        return this.subscriptions.dispose();
    }

    public consumeBeautifier(beautifiers: Beautifier | Beautifier[]) {
        if (!Array.isArray(beautifiers)) {
          beautifiers = [beautifiers];
        }
        console.log("beautifiers", beautifiers);
        this.unibeautify.loadBeautifiers(beautifiers);
    }

    public get config() {
        console.log("config");
        return Config;
    }

    /**
    TODO
    */
    private handleSaveEvent(): CompositeDisposable {
      return atom.workspace.observeTextEditors((editor: IEditor) => {
        const disposable: CompositeDisposable = editor.onDidSave(({ path: filePath }: { path: string }) =>
          // TODO: Implement debouncing
          this.beautifyOnSaveHandler({path: filePath})
        );
        return this.subscriptions.add(disposable);
      });
    }

    private beautifyOnSaveHandler({ path }: { path: string }) {
      console.log("Beautify file on save", path);
    }

    private beautifyEditor(event: CustomEvent) {
      const editor: IEditor = atom.workspace.getActiveTextEditor();
      let text: string = null;
      // FIXME
      const forceEntireFile = false;
      const isSelection = false;
      if (!forceEntireFile && isSelection) {
        text = editor.getSelectedText();
      } else {
        text = editor.getText();
      }
      const grammarName = editor.getGrammar().name;
      const editedFilePath: string = editor.getPath();
      let fileExtension = path.extname(editedFilePath);
      // Remove prefix "." (period) in fileExtension
      fileExtension = fileExtension.substr(1);
      return this.unibeautify.beautify({
        fileExtension,
        atomGrammar: grammarName,
        options: {},
        text: text,
      }).then((result) => {
        editor.setText(result);
      });
    }

    private beautifyFile() {

    }

    private beautifyDirectory() {

    }

    private debug() {

    }

    // ===== Helpers =====
    private getLoadedLanguages() {
      return this.unibeautify.getLoadedLanguages();
    }
    private getScrollTop(editor: any): any {
      const view = atom.views.getView(editor);
      return view && view.getScrollTop();
    }
    private setScrollTop(editor: any, value: any): void {
      const view = atom.views.getView(editor);
      view && view.setScrollTop(value);
    }

    private getCursors(editor: any) {
      const cursors: any[] = editor.getCursors();
      let posArray: any[] = [];
      for (let j = 0, len = cursors.length; j < len; j++) {
        const cursor: any = cursors[j];
        const bufferPosition: any = cursor.getBufferPosition();
        posArray.push([bufferPosition.row, bufferPosition.column]);
      }
      return posArray;
    };

    private setCursors(editor: any, posArray: any[]) {
      for (let i = 0, j = 0, len = posArray.length; j < len; i = ++j) {
        const bufferPosition = posArray[i];
        if (i === 0) {
          editor.setCursorBufferPosition(bufferPosition);
          continue;
        }
        editor.addCursorAtBufferPosition(bufferPosition);
      }
    };

    private showError(error: any, show: boolean = false) {
      if (show || !atom.config.get("atom-beautify.general.muteAllErrors")) {
        const stack: any = error.stack;
        const detail: string = error.description || error.message;
        return atom.notifications.addError(error.message, {
          stack: stack,
          detail: detail,
          dismissable: true
        });
      }
    };


};