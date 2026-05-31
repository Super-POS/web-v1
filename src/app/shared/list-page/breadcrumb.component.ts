import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'pos-breadcrumb',
    standalone: true,
    imports: [MatIconModule],
    template: `
        <nav class="pos-list-toolbar__breadcrumb" aria-label="Breadcrumb">
            <mat-icon class="icon-size-5 -mb-0.5" svgIcon="heroicons_outline:home" />
            @for (label of segments; track $index; let i = $index) {
                @if (i > 0) {
                    <mat-icon class="-mb-0.5" svgIcon="mat_solid:chevron_right" />
                }
                <span [class.ml-1.5]="i === 0" class="-mb-0.5">{{ label }}</span>
            }
        </nav>
    `,
})
export class PosBreadcrumbComponent {
    @Input({ required: true }) segments: string[] = [];
}
