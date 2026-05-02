import { Injectable } from '@angular/core';

export interface PrintableOrder {
    receipt_number: number;
    total_price: number;
    ordered_at?: Date | string;
    cashier?: { name?: string };
    details?: PrintableDetail[];
    orderDetails?: PrintableDetail[];
}

export interface PrintableDetailModifier {
    option_label?: string;
    group_name?: string;
}

export interface PrintableDetail {
    unit_price: number;
    qty: number;
    product?: { name?: string };
    menu?: { name?: string };
    line_note?: string;
    /** Sequelize JSON (camelCase) */
    detailModifiers?: PrintableDetailModifier[];
    /** Some payloads use snake_case */
    detail_modifiers?: PrintableDetailModifier[];
}

const CLUB54_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAABAKADAAQAAAABAAABAAAAAABn6hpJAABAAElEQVR4Ae29B9xtRXW/TxJFFCsKYgEuXLBhC3ZULFhiT9TYYokaMRq7SUw0scUSYxI1tr8YuzHRYM/PEgsISAQU7LR7KdJBRaUjyv955sz3sM95T33v2y531uez9pq6Zs2aWWtmz95nn622atA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DTQNNA00DSwkhq44oorfmcl22ttNQ00DawRDWD8v7tGRGliNA00DaykBmL80BuCV1vJtltbTQNNA6uogY7xv4zwd8FrKQ603Q6s4ri0ppsGll0DGPnv2Qj0b0Dh9TVe0pddgNZA00DTwOpoAGOP8f9pMf0rrjgFuoPSQNvqvzrD0lptGlh+DWDg5cAPeifwPFD4S1uGttV/+YegtdA0sDoawMDL6g7dGjwEFE4Et1ciaFv9V2doWqtNA8uvAQw8W/8XEA68yZaJtNV/+YegtdA0sDoawMCz+m9HeGO1/suhd1YiaHsXYHWGprXaNLD8GsDAs/o/txq/5CiwPPuHtu3/8g/DolponnlRamuVogGNG/hNjT8h6dDvkO4u4PegV3TSW3ANaaA5gDU0GJupKNn+74n89wB/W/vxg820P1uU2M0BbFHDvSydzfZ+H7i75c9u4PR5WnMn0W4V5tHY0pRtDmBp9Ni4bLXVXaoSsgO4cF6ltFuFeTW26eWbA9h0HW6xHIbu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';

@Injectable({ providedIn: 'root' })
export class PrintReceiptService {

    /**
     * Prints one continuous strip (roll-friendly): Customer, Cashier, Barista sections
     * in order. Total height grows with line items (no forced page breaks between sections).
     * Use @page 80mm auto; in the OS print dialog use a tall custom paper or roll preset
     * (avoid square sizes like 80x80 mm, which clip each "page" to a fixed height).
     */
    print(order: PrintableOrder): void {
        const html = this._buildHtml(order);
        const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
        const url  = URL.createObjectURL(blob);

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
        iframe.src = url;

        iframe.onload = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch {
                window.open(url, '_blank');
            } finally {
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    document.body.removeChild(iframe);
                }, 60_000);
            }
        };

        document.body.appendChild(iframe);
    }

    private _buildHtml(order: PrintableOrder): string {
        const customerSlip = this._buildSlip(order, 'Customer Copy');
        const cashierSlip  = this._buildSlip(order, 'Cashier Copy');
        const baristaSlip  = this._buildBaristaSlip(order);

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @page { size: 80mm auto; margin: 0; }
  html, body { height: auto; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 80mm; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #111; }
  .slip { padding: 6mm 5mm 8mm; break-inside: auto; }
  .slip + .slip {
    margin-top: 5mm;
    padding-top: 6mm;
    border-top: 3px double #111;
  }
  .copy-banner { font-size: 9px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #333; margin: 0 0 4px; }
  .center { text-align: center; }
  .logo-wrap { text-align: center; margin-bottom: 6px; }
  .logo-circle {
    display: inline-block;
    background: #111;
    border-radius: 50%;
    width: 56px; height: 56px;
    line-height: 56px;
    text-align: center;
    overflow: hidden;
  }
  .logo-circle img { width: 44px; height: 44px; object-fit: contain; vertical-align: middle; }
  .shop-name { font-size: 18px; font-weight: bold; letter-spacing: 4px; text-transform: uppercase; margin: 2px 0 1px; }
  .tagline   { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #555; margin-bottom: 1px; }
  .address   { font-size: 9px; color: #555; margin: 1px 0; }
  .solid { border-top: 1px solid #111; margin: 5px 0; }
  .dash  { border-top: 1px dashed #888; margin: 5px 0; }
  .section-label { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #555; margin: 4px 0 2px; }
  .meta { width: 100%; font-size: 10px; border-collapse: collapse; }
  .meta td { padding: 1px 0; }
  .meta td:last-child { text-align: right; font-weight: bold; }
  table.items { width: 100%; border-collapse: collapse; font-size: 10px; margin: 3px 0; }
  table.items thead th {
    font-weight: bold; padding: 2px 1px;
    border-bottom: 1px solid #111;
    text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;
  }
  table.items thead th.r { text-align: right; }
  table.items tbody td { padding: 3px 1px; vertical-align: top; }
  table.items tbody td.num { text-align: right; }
  .item-name { max-width: 24mm; word-break: break-word; }
  .total-tbl { width: 100%; border-collapse: collapse; font-size: 11px; margin: 3px 0; }
  .total-tbl td { padding: 2px 1px; }
  .total-tbl td:last-child { text-align: right; }
  .grand td { font-weight: bold; font-size: 13px; border-top: 1px solid #111; padding-top: 3px; }
  .thanks { font-size: 10px; letter-spacing: 1px; margin-top: 3px; font-weight: bold; }
  .footer { font-size: 9px; color: #666; margin-top: 2px; }
  .barista-slip .prep-title { font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin: 2px 0 4px; }
  .barista-slip .prep-sub { font-size: 9px; color: #333; margin-bottom: 2px; }
  table.prep { width: 100%; border-collapse: collapse; font-size: 11px; margin: 4px 0; }
  table.prep td { padding: 4px 2px 2px 0; vertical-align: top; border-bottom: 1px dashed #bbb; }
  table.prep td.qty { width: 10mm; font-weight: bold; font-size: 13px; text-align: right; padding-right: 4px; }
  table.prep td.body { word-break: break-word; }
  .prep-drink { font-weight: bold; font-size: 12px; }
  .prep-mod { font-size: 9px; color: #333; margin-top: 2px; padding-left: 1px; }
  .prep-note { font-size: 9px; font-style: italic; color: #444; margin-top: 2px; }
</style>
</head>
<body>
  ${customerSlip}
  ${cashierSlip}
  ${baristaSlip}
</body>
</html>`;
    }

    private _escapeHtml(s: string): string {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /** Kitchen / barista: drinks only (qty, name, modifiers, line notes). No prices. */
    private _buildBaristaSlip(order: PrintableOrder): string {
        const lines = order.details ?? order.orderDetails ?? [];
        const receiptNo = String(order.receipt_number).padStart(6, '0');
        const saleDate = order.ordered_at
            ? new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Phnom_Penh',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(order.ordered_at as string)).replace(',', '')
            : '-';

        const rows = lines.map((d) => {
            const name = d.product?.name ?? d.menu?.name ?? '-';
            const qty = Math.max(1, Math.round(Number(d.qty) || 1));
            const modList = d.detailModifiers ?? d.detail_modifiers ?? [];
            const mods = modList
                .map((m) => {
                    const label = (m.option_label ?? '').trim();
                    const grp = (m.group_name ?? '').trim();
                    if (label && grp) return `${grp}: ${label}`;
                    return label || grp || '';
                })
                .filter(Boolean);
            const modHtml = mods.length
                ? `<div class="prep-mod">${mods.map((t) => this._escapeHtml(t)).join('<br>')}</div>`
                : '';
            const note = (d.line_note ?? '').trim();
            const noteHtml = note
                ? `<div class="prep-note">${this._escapeHtml(note)}</div>`
                : '';
            return `<tr>
                <td class="qty">${qty}</td>
                <td class="body">
                  <div class="prep-drink">${this._escapeHtml(name)}</div>
                  ${modHtml}
                  ${noteHtml}
                </td>
            </tr>`;
        }).join('');

        return `<div class="slip barista-slip">
  <div class="center prep-title">Barista prep</div>
  <div class="center prep-sub">Receipt #${this._escapeHtml(receiptNo)}</div>
  <div class="center prep-sub">${this._escapeHtml(saleDate)}</div>
  <hr class="solid">
  <table class="prep">
    <tbody>${rows}</tbody>
  </table>
  <hr class="dash">
  <div class="center section-label">Make in order listed</div>
</div>`;
    }

    private _buildSlip(order: PrintableOrder, copyLabel: string): string {
        const lines = order.details ?? order.orderDetails ?? [];
        const cashierName = order.cashier?.name ?? '-';
        const receiptNo = String(order.receipt_number).padStart(6, '0');
        const saleDate = order.ordered_at
            ? new Intl.DateTimeFormat('en-GB', {
                timeZone   : 'Asia/Phnom_Penh',
                year       : 'numeric',
                month      : '2-digit',
                day        : '2-digit',
                hour       : '2-digit',
                minute     : '2-digit',
              }).format(new Date(order.ordered_at as string)).replace(',', '')
            : '-';

        const rows = lines.map(d => {
            const name  = d.product?.name ?? d.menu?.name ?? '-';
            const price = this._fmt(d.unit_price);
            const total = this._fmt(d.unit_price * d.qty);
            return `<tr>
                <td class="item-name">${this._escapeHtml(name)}</td>
                <td class="num">${price}</td>
                <td class="num">x${d.qty}</td>
                <td class="num">${total}</td>
            </tr>`;
        }).join('');

        return `<div class="slip">
  <div class="logo-wrap">
    <div class="logo-circle"><img src="${CLUB54_LOGO}" alt="Club 54"></div>
  </div>
  <div class="center shop-name">Club 54</div>
  <div class="center tagline">Coffee &amp; Bakery Shop</div>
  <div class="center address">Phnom Penh, Cambodia</div>
  <div class="center address">Tel: 010542654 </div>
  <hr class="solid">
  <div class="center copy-banner">${this._escapeHtml(copyLabel)}</div>
  <div class="center section-label">Tax Invoice</div>

  <table class="meta">
    <tr><td>Receipt No</td><td>#${this._escapeHtml(receiptNo)}</td></tr>
    <tr><td>Cashier</td><td>${this._escapeHtml(cashierName)}</td></tr>
    <tr><td>Date</td><td>${this._escapeHtml(saleDate)}</td></tr>
  </table>

  <hr class="dash">

  <table class="items">
    <thead>
      <tr>
        <th style="text-align:left">Item</th>
        <th class="r">Price</th>
        <th class="r">Qty</th>
        <th class="r">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <hr class="solid">

  <table class="total-tbl">
    <tr><td>Subtotal</td><td>${this._fmt(order.total_price)} &#x17DB;</td></tr>
    <tr><td style="font-size:10px;color:#555">Tax (0%)</td><td style="font-size:10px;color:#555">-</td></tr>
    <tr class="grand"><td>TOTAL</td><td>${this._fmt(order.total_price)} &#x17DB;</td></tr>
  </table>

  <hr class="dash">
  <div class="center thanks">Thank you for visiting!</div>
  <div class="center footer">Please come again &bull; club54.com</div>
</div>`;
    }

    private _fmt(n: number): string {
        return Math.round(Number(n)).toLocaleString('en-US');
    }
}
