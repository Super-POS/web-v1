// ================================================================================>> Core Library
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

// ================================================================================>> Thrid Party Library

// ================================================================================>> Custom Library

@Component({
    selector: 'user-list-skeleton',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="list-user-content px-4 pb-4 bg-white rounded-bl-xl rounded-br-xl animate-pulse overflow-hidden">
        
        <div class="h-14 w-full border-b">
            <div class="w-full pl-2 md:pr-28 h-full grid grid-cols-6 gap-4 items-center">
                <div class=" w-20 h-2.5 rounded-full bg-gray-300"></div>
                <div class="w-24 h-2.5 rounded-full bg-gray-200"></div>
                <div class="w-18 h-2.5 rounded-full bg-gray-300"></div>
                <div class="w-30 h-2.5 rounded-full bg-gray-200"></div>
                <div class="w-20 h-2.5 rounded-full bg-gray-300"></div>
                <div class="flex justify-center">
                    <div class="w-20 h-2.5 rounded-full bg-gray-200"></div>
                </div>
            </div>
        </div>
        <ng-container *ngFor="let box of boxes">
            <div class="h-20 w-full border-b pl-6">
                <div class="w-full pl-2 md:pr-28 h-full grid grid-cols-6 gap-4 justify-center items-center">
                    <div class="flex items-center gap-3">
                        <div class="min-h-10 min-w-10 bg-gray-200 rounded-full"></div>
                        <div class="flex flex-col gap-3">
                            <div [ngClass]="box.widthClass" class="h-2.5 rounded-full bg-gray-200"></div>
                            <div class="w-20 h-2.5 rounded-full bg-gray-200"></div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-3">
                        <div [ngClass]="box.widthClass" class="h-2.5 rounded-full bg-gray-300"></div>
                        <div class="w-20 h-2.5 rounded-full bg-gray-200"></div>
                    </div>
                    <div class="w-20 h-2.5 rounded-full bg-gray-200"></div>
                    <div class="w-20 h-2.5 rounded-full bg-gray-300"></div>
                    <div class="w-12 h-5 rounded-full bg-gray-200"></div>
                    <div class="flex justify-center">
                        <div class="w-20 h-2.5 rounded-full bg-gray-300"></div>
                    </div>
                </div>
            </div>
        </ng-container>
    </div>
    `
})
export class SkeletonComponent implements OnInit {
    boxes = [];
    widthClasses = ['w-10', 'w-20', 'w-30', 'w-40', 'w-50'];

    ngOnInit() {
        this.boxes = Array.from({ length: 15 }, (_, i) => ({
            id: i + 1,
            widthClass: this.getRandomWidthClass(),
        }));
    }

    getRandomWidthClass(): string {
        const randomIndex = Math.floor(Math.random() * this.widthClasses.length);
        return this.widthClasses[randomIndex];
    }
}
