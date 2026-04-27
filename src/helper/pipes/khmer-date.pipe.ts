import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

@Pipe({
    name: 'khmerDate',
    standalone: true
})
export class KhmerDatePipe implements PipeTransform {
    transform(value: string | Date, format: string = 'default'): string {
        if (!value) {
            return '';
        }
        if (typeof value === 'string' && value.endsWith('Z')) {
            const { date, month, year, days, hours, minutes, seconds } = this.parseDateStringUTC(value);
            return this.formatDate(date, month, year, days, hours, minutes, seconds, format);
        } else if (value instanceof Date || (typeof value === 'string' && !value.endsWith('Z'))) {
            const { date, month, year, days, hours, minutes, seconds } = this.parseDateOrString(value);
            return this.formatDate(date, month, year, days, hours, minutes, seconds, format);
        }
        return '';
    }

    private parseDateStringUTC(dateString: string) {
        const date: number = moment.utc(dateString).date();
        const month: number = moment.utc(dateString).month() + 1;
        const year: number = moment.utc(dateString).year();
        const days: number = moment.utc(dateString).days();
        const hours: number = moment.utc(dateString).hours();
        const minutes: number = moment.utc(dateString).minutes();
        const seconds: number = moment.utc(dateString).seconds();
        return { date, month, year, days, hours, minutes, seconds };

    }

    private parseDateOrString(dateString: string | Date) {
        const date: number = moment(dateString).date();
        const month: number = moment(dateString).month() + 1;
        const year: number = moment(dateString).year();
        const days: number = moment(dateString).days();
        const hours: number = moment(dateString).hours();
        const minutes: number = moment(dateString).minutes();
        const seconds: number = moment(dateString).seconds();
        return { date, month, year, days, hours, minutes, seconds };
    }

    private formatDate(date: number, month: number, year: number, days: number, hours: number, minutes: number, seconds: number, format: string): string {

        const yearStr: string = year.toString();
        const dateStr: string = date.toString().padStart(2, '0');

        const khmerYear = this.convertToKhmerNumeral(yearStr);
        const khmerMonth = this.convertToKhmerMonth(month);
        const khmerDay = this.convertToKhmerNumeral(dateStr);
        const khmerDayOfWeek = this.convertToKhmerDayOfWeek(days);

        switch (format) {
            case 'd':
            case 'D':
                return `Date${khmerDay}`;
            case 'dd':
            case 'DD':
                return `Day ${khmerDayOfWeek} ${khmerDay}`;
            case 'm':
            case 'M':
                return `Month${khmerMonth}`;
            case 'y':
            case 'Y':
                return `Years${khmerYear}`;
            case 'd m':
            case 'D M':
                return `Date${khmerDay} Month${khmerMonth}`;
            case 'dd m':
            case 'DD M':
                return `Day ${khmerDayOfWeek} ${khmerDay} Month ${khmerMonth}`;
            case 'd m y':
            case 'D M Y':
                return `${khmerDay} ${khmerMonth} ${khmerYear}`;
            case 'dd m y':
            case 'DD M Y':
                return `Day ${khmerDayOfWeek} ${khmerDay} Month ${khmerMonth} Year ${khmerYear}`;
            case 'h:m':
            case 'H:m':
                return `${this.convertToKhmerTime(hours, minutes, seconds, false)}`;
            case 'h:m:s':
            case 'H:M:S':
                return `${this.convertToKhmerTime(hours, minutes, seconds, true)}`;
            case 'd m y h:m':
            case 'D M Y H:M':
                return `Date${khmerDay} Month${khmerMonth} Years${khmerYear} ${this.convertToKhmerTime(hours, minutes, seconds, false)}`;
            case 'd-m-y-h-m':
            case 'D-M-Y-H-M':
                return `${khmerDay} ${khmerMonth} ${khmerYear} ${this.convertToKhmerTime(hours, minutes, seconds, false)}`;
            case 'd m y h:m:s':
            case 'D M Y H:M:S':
                return `Date${khmerDay} Month${khmerMonth} Years${khmerYear} ${this.convertToKhmerTime(hours, minutes, seconds, true)}`;
            case 'dd m y h:m':
            case 'DD M Y H:M':
                return `Day ${khmerDayOfWeek} ${khmerDay} Month ${khmerMonth} Year ${khmerYear} ${this.convertToKhmerTime(hours, minutes, seconds, false)}`;
            case 'dd m y h:m:s':
            case 'DD M Y H:M:S':
                return `Day ${khmerDayOfWeek} ${khmerDay} Month ${khmerMonth} Year ${khmerYear} ${this.convertToKhmerTime(hours, minutes, seconds, true)}`;
            default:
                return `Date${khmerDay} Month${khmerMonth} Years${khmerYear}`;
        }
    }


    private convertToKhmerDayOfWeek(dayOfWeek: number): string {
        const khmerDaysOfWeek = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
        ];
        return khmerDaysOfWeek[dayOfWeek];
    }

    private convertToKhmerNumeral(number: string): string {
        const khmerNumerals = {
            '0': '0',
            '1': '1',
            '2': '2',
            '3': '3',
            '4': '4',
            '5': '5',
            '6': '6',
            '7': '7',
            '8': '8',
            '9': '9'
        };
        return number.split('').map(digit => khmerNumerals[digit]).join('');
    }

    private convertToKhmerMonth(month: number): string {
        const khmerMonths = {
            1: 'January',
            2: 'February',
            3: 'March',
            4: 'April',
            5: 'May',
            6: 'June',
            7: 'July',
            8: 'August',
            9: 'Miss',
            10: 'October',
            11: 'November',
            12: 'December'
        };

        return khmerMonths[month] || '';
    }

    private convertToKhmerTime(hours: number, minutes: number, seconds: number, includeSeconds: boolean = true): string {
        let hoursNum = hours;
        if (hoursNum > 12) {
            hoursNum = hoursNum - 12;
        }
        let khmerHours = this.convertToKhmerNumeral(hoursNum.toString().padStart(2, '0'));
        const khmerMinutes = this.convertToKhmerNumeral(minutes.toString().padStart(2, '0'));
        const khmerSeconds = includeSeconds ? this.convertToKhmerNumeral(seconds.toString().padStart(2, '0')) : '';

        // Define the Khmer time periods
        const khmerPeriods = ['Morning', 'Evening'];

        // Adjust the hours to be in the range of 0 to 23
        hours %= 24;

        // Determine the Khmer period based on the hours
        const periodIndex = Math.floor(hours / 12) % 2;

        const khmerPeriod = khmerPeriods[periodIndex];

        khmerHours = khmerHours === '00' ? '12' : khmerHours;

        if (includeSeconds) return `${khmerHours}:${khmerMinutes}:${khmerSeconds} ${khmerPeriod}`;

        return `${khmerHours}:${khmerMinutes} ${khmerPeriod}`;
    }

}
