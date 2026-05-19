import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    inject,
    Input,
    OnChanges,
    SimpleChanges,
    ViewEncapsulation,
} from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HelperLoadingService } from 'helper/services/loading';
import { combineLatest, map } from 'rxjs';

/** View-model for the loading bar template (single async pipe → one CD pass). */
export interface LoadingBarViewModel {
    show: boolean;
    mode: 'determinate' | 'indeterminate';
    /** Clamped 0–100; Material's progress bar rejects / mis-reports negative values. */
    progress: number;
}

@Component({
    selector: 'helper-loading-bar',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    encapsulation: ViewEncapsulation.None,
    exportAs: 'helperLoadingBar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AsyncPipe, MatProgressBarModule],
})
export class HelperLoadingBarComponent implements OnChanges {
    private readonly _helperLoadingService = inject(HelperLoadingService);

    @Input() autoMode = true;

    /**
     * Combined stream so show/mode/progress update in one template binding.
     * Avoids NG0100 (ExpressionChangedAfterItHasBeenChecked) from three separate
     * manual subscriptions each calling markForCheck() in the same tick.
     */
    readonly vm$ = combineLatest({
        show: this._helperLoadingService.show$,
        mode: this._helperLoadingService.mode$,
        progress: this._helperLoadingService.progress$.pipe(
            map((v) => Math.max(0, Math.min(100, Number(v) || 0))),
        ),
    }).pipe(
        map(
            ({ show, mode, progress }): LoadingBarViewModel => ({
                show,
                mode,
                progress,
            }),
        ),
    );

    ngOnChanges(changes: SimpleChanges): void {
        if ('autoMode' in changes) {
            this._helperLoadingService.setAutoMode(
                coerceBooleanProperty(changes.autoMode.currentValue),
            );
        }
    }
}
