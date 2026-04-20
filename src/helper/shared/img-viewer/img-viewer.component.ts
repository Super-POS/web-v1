// ================================================================================>> Main Library
import { CommonModule } from '@angular/common';
import { Component, Inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

// ================================================================================>> Third Party Library
import { MatButtonModule } from '@angular/material/button';

import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'helpers-img-viewer',
    standalone: true,
    templateUrl: './img-viewer.component.html',
    styleUrls: ['./img-viewer.component.scss'],
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatInputModule,
        MatProgressSpinnerModule
    ]
})
export class HeplersImgViewerComponent implements AfterViewInit {
    zoom: number = 0.8;
    normalZoom: number = 1;
    maxZoom: number = 4;
    minZoom: number = 0.3;
    zoomStep: number = 0.1;
    originalWidth: number;
    originalHeight: number;
    imgWidth: number;
    imgHeight: number;
    containerWidth: number;
    isLoading: boolean = true; // Loading state

    @ViewChild('container') containerRef: ElementRef;

    constructor(@Inject(MAT_DIALOG_DATA) public file: { url: string, title: string }) { }

    ngOnInit() {
        const img = new Image();
        img.src = this.file.url;
        img.onload = () => {
            this.originalWidth = img.width;
            this.originalHeight = img.height;
            this.updateImageSize();
            this.isLoading = false; // Hide the loading spinner
        };
    }

    ngAfterViewInit() {
        this.containerWidth = this.containerRef.nativeElement.clientWidth;
    }

    downloadImage(): void {
        const link = document.createElement('a');
        link.href = this.file.url;
        link.download = this.file.title;
        link.click();
    }

    zoomIn(): void {
        const newZoom = this.zoom + this.zoomStep;
        if (newZoom <= this.maxZoom && (this.originalWidth * newZoom) <= this.containerWidth + 200) {
            this.zoom = newZoom;
            this.updateImageSize();
        }
    }

    zoomOut(): void {
        const newZoom = this.zoom - this.zoomStep;
        if (newZoom >= this.minZoom) {
            this.zoom = newZoom;
            this.updateImageSize();
        }
    }

    updateImageSize(): void {
        this.imgWidth = this.originalWidth * this.zoom;
        this.imgHeight = this.originalHeight * this.zoom;
    }

    get canZoomIn(): boolean {
        const newZoom = this.zoom + this.zoomStep;
        return this.zoom <= this.maxZoom && (this.originalWidth * newZoom) <= this.containerWidth + 200;
    }

    get canZoomOut(): boolean {
        const newZoom = this.zoom - this.zoomStep;
        return newZoom >= this.minZoom;
    }
}
