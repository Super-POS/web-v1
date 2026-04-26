// ================================================================>> Core Library (Angular)
import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

// ================================================================>> Third-Party Libraries
import { MatIconModule } from '@angular/material/icon';

// ================================================================>> Custom Libraries (Application-specific)
import { env } from 'envs/env';
import { MenuItem } from '../interface';


@Component({

    selector: 'menu-item',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [

        MatIconModule,
        DecimalPipe
    ],
})
export class MenuItemComponent {

    @Input() data: MenuItem;
    @Output() result = new EventEmitter<MenuItem>;
    public fileUrl: string = env.FILE_BASE_URL;

    // ===> Method to emit the data to the parent component
    onOutput() {
        this.result.emit(this.data);
    }

}
