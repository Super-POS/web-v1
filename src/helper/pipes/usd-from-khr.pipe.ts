import { Pipe, PipeTransform } from '@angular/core';

import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';

/** Converts stored KHR amounts to USD using KHR per $1 (passed from parent; falls back if missing). */
@Pipe({ name: 'usdFromKhr', standalone: true })
export class UsdFromKhrPipe implements PipeTransform {
    transform(khr: number | null | undefined, rate?: number | null): number {
        const r =
            rate != null && Number.isFinite(Number(rate)) && Number(rate) > 0
                ? Number(rate)
                : ExchangeRateSettingService.FALLBACK_KHR_PER_USD;
        return ExchangeRateSettingService.khrToUsd(Number(khr) || 0, r);
    }
}
