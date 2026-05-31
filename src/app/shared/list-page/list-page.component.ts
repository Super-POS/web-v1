import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'pos-list-page',
    standalone: true,
    imports: [NgClass],
    template: `
        <div
            class="list-sale-section pos-list-page bg-white dark:bg-gray-800 rounded-tl-lg rounded-tr-lg"
            [ngClass]="pageClasses">
            <div
                class="pos-list-toolbar"
                [class.border-b]="toolbarBorder"
                [class.border-slate-100]="toolbarBorder"
                [class.dark:border-gray-700]="toolbarBorder">
                <ng-content select="[posBreadcrumb]" />
                <div class="pos-list-toolbar__actions flex items-center gap-2 flex-shrink-0">
                    <ng-content select="[posActions]" />
                </div>
            </div>
            <div class="list-sale-body" [ngClass]="bodyClass">
                <ng-content />
            </div>
        </div>
    `,
})
export class PosListPageComponent {
    /** Extra classes on the root shell (e.g. flex-1 min-w-0, w-full) */
    @Input() extraClass = '';

    /** Classes on the scrollable body region */
    @Input() bodyClass = '';

    /** Show a bottom border under the toolbar */
    @Input() toolbarBorder = false;

    /** When false, omit default horizontal margin (meeting rooms full-bleed layout) */
    @Input() inset = true;

    get pageClasses(): string {
        const base = this.inset ? 'mt-4 mx-4' : 'mt-4 w-full min-h-0 flex-1 flex flex-col';
        return [base, this.extraClass].filter(Boolean).join(' ');
    }
}
