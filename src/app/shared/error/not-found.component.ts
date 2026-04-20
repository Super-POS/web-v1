import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'not-found',
    templateUrl: './template.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterLink],
})
export class Error404Component {
    /**
     * Constructor
     */
    constructor() { }
}
