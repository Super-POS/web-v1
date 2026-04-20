// ================================================================================>> Main Library
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";

// ================================================================================>> Third Party Library
// Material
import { MatButtonModule } from "@angular/material/button";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { HeplersImgViewerComponent } from "helper/shared/img-viewer/img-viewer.component";
import { HeplersPdfViewerComponent } from "helper/shared/pdf-viewer/pdf-viewer.component";
import { HeplersWordViewerComponent } from "helper/shared/word-viewer/word-viewer.component";

// ================================================================================>> Custom Library
// Helper
// Ng
import { PdfViewerModule } from "ng2-pdf-viewer";
import { NgxFileDropEntry, NgxFileDropModule } from "ngx-file-drop";

@Component({
    selector: 'files-list',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [
        CommonModule,
        MatIconModule,
        MatMenuModule,
        MatButtonModule,
        PdfViewerModule,
        NgxFileDropModule
    ]
})
export class FilesComponent {

    @Input() sending: boolean = false;
    @Output() filesChange = new EventEmitter<{ file: File, url: string, type: string }[]>();

    private _matDialog = inject(MatDialog);

    files: NgxFileDropEntry[] = [];
    previewFiles: { file: File, url: string, type: string }[] = [];

    isGridView = false; // Initially set to list view

    toggleView() {
        this.isGridView = !this.isGridView;
    }
    // ===>> File Drop
    dropped(files: NgxFileDropEntry[]): void {
        this.files = files;
        for (const droppedFile of files) {
            if (droppedFile.fileEntry.isFile) {
                const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
                fileEntry.file((file: File) => {
                    const url = URL.createObjectURL(file);
                    this.previewFiles.push({ file: file, url, type: file.type });
                });
            }
        }
        this.filesChange.emit(this.previewFiles);

    }

    // ===>> File Over
    openFileSelectorHandler(event: Event, openFileSelector: Function) {
        event.preventDefault();
        if (!this.sending) {
            openFileSelector();
        }
    }
    // ===>> Preview File
    viewFile(previewFile: { file: File, url: string, type: string }): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = {
            url: previewFile.url,
            title: previewFile.file.name
        };
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '100dvw';
        dialogConfig.panelClass = 'custom-mat-dialog-full';
        dialogConfig.enterAnimationDuration = '0s';

        if (previewFile.type === 'application/pdf') {
            this._matDialog.open(HeplersPdfViewerComponent, dialogConfig);
        } else if (
            previewFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            previewFile.type === 'application/msword' ||
            previewFile.type === 'application/rtf'
        ) {
            this._matDialog.open(HeplersWordViewerComponent, dialogConfig);
        } else {
            this._matDialog.open(HeplersImgViewerComponent, dialogConfig);
        }
    }


    // ===>> Remove File
    removeFile(name: string): void {
        this.previewFiles = this.previewFiles.filter(v => v.file.name != name);
        this.filesChange.emit(this.previewFiles);
    }
}
