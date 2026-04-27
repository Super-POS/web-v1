// ================================================================>> Core Library
import { DecimalPipe, NgForOf, NgIf }   from '@angular/common';
import { HttpErrorResponse }            from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule }                  from '@angular/forms';

// ================================================================>> Third party Library
import { MatButtonModule }              from '@angular/material/button';
import { MatDialog, MatDialogConfig }   from '@angular/material/dialog';
import { MatIconModule }                from '@angular/material/icon';
import { MatProgressSpinnerModule }     from '@angular/material/progress-spinner';
import { MatTabsModule }                from '@angular/material/tabs';

import { Subject, takeUntil, take, Subscription }           from 'rxjs';

// ================================================================>> Custom Library
import { UserService }      from 'app/core/user/service';
import { User }             from 'app/core/user/interface';
import { env }              from 'envs/env';
import { SnackbarService }  from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants      from 'helper/shared/constants';
import { Data as OrderReceiptData } from '../c2-sale/interface';
import { MenuItemComponent }    from './item/component';
import { BarayPaidWatcherService } from './baray-paid-watcher.service';
import { OrderService }     from './service';
import { Data, MenuItem, MenuItemType, NormalizedModifierGroup, OrderCartLine } from './interface';
import { ModifierPickDialogComponent, ModifierPickResult } from './modifier-dialog/component';
import { ViewDetailSaleComponent } from 'app/shared/view/component';


@Component({

    selector: 'app-order',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'], // Note: Corrected from 'styleUrl' to 'styleUrls'

    imports: [
        DecimalPipe,
        MatIconModule,
        MatTabsModule,
        MenuItemComponent,
        FormsModule,
        NgIf,
        NgForOf,
        MatButtonModule,
        MatProgressSpinnerModule
    ]
})

export class OrderComponent implements OnInit, OnDestroy {

    // Create a private subject to handle unsubscription
    private _unsubscribeAll: Subject<User> = new Subject<User>();

    // Define the base URL for file uploads
    fileUrl: string = env.FILE_BASE_URL;
    data: Data[] = [];
    allMenuItems: MenuItem[] = [];
    isLoading: boolean = false;
    carts: OrderCartLine[] = [];
    user: User;
    isOrderBeingMade: boolean = false;
    /** Full-screen wait after Baray pay link opens until paid, timeout, or cashier cancels. */
    isAwaitingBarayPayment: boolean = false;
    private _barayPendingOrderId: number | null = null;
    private _barayWaitSub: Subscription | null = null;
    canSubmit: boolean = false;
    totalPrice: number = 0;
    selectedTab: any;
    menuSearchTerm: string = '';
    isCartSidebarOpen: boolean = false;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _userService: UserService,
        private _service: OrderService,
        private _snackBarService: SnackbarService,
        private _barayPaid: BarayPaidWatcherService,
    ) {

        // Subscribe to changes in the user's data
        this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user: User) => {

            this.user = user;
            // Mark for check - triggers change detection manually
            this._changeDetectorRef.markForCheck();
        });
    }

    // ===> onInit method to initialize the component
    ngOnInit(): void {

        // Set isLoading to true to indicate that data is being loaded
        this.isLoading = true;

        // Subscribe to the list method of the orderService
        this._service.getData().subscribe({
            next: (response) => {
                // API groups by menu type with `menus`; legacy UI used `products`
                this.data = (response.data || []).map((cat: Data) => {
                    const menus = ((cat as Data & { menus?: unknown[] }).menus || cat.products || []) as unknown[];
                    return {
                        ...cat,
                        products: menus.map((m) => this._normalizeMenuItem(m as MenuItem)),
                    };
                });

                this.allMenuItems = this.data.reduce((all: MenuItem[], item: Data) => {
                    return all.concat(item.products || (item as Data & { menus?: MenuItem[] }).menus || []);
                }, []);

                this.data.unshift({
                    id: 0,
                    name: 'All Categories',
                    products: this.allMenuItems
                } as Data);
                if (this.data && this.data.length > 0) {
                    this.selectedTab = this.data[0];
                    this._changeDetectorRef.detectChanges();
                }
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                this._snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });

    }

    trackById(_index: number, item: { id: number }): number {
        return item?.id;
    }

    trackByLineKey(_index: number, line: OrderCartLine): string {
        return line?.lineKey;
    }

    trackByMenuItemId(_index: number, row: { id: number }): number {
        return row?.id;
    }

    /** Map API / Sequelize menu JSON into `MenuItem` + normalized modifier groups. */
    private _normalizeMenuItem(raw: unknown): MenuItem {
        const m = raw as Record<string, unknown> & {
            id: number;
            name: string;
            code: string;
        };
        const typeSource = m['type'] ?? m['MenuType'] ?? m['menuType'];
        const type: MenuItemType =
            typeof typeSource === 'object' && typeSource !== null && 'name' in (typeSource as object)
                ? (typeSource as MenuItemType)
                : { name: String((typeSource as { name?: string } | undefined)?.name ?? 'Menu') };

        const rawGroups = (m['modifierGroups'] as unknown[]) || [];
        const groups: NormalizedModifierGroup[] = (rawGroups as Record<string, unknown>[])
            .map((g) => {
                const gr = g as Record<string, unknown> & { id: number; name: string; code: string; sort_order?: number };
                const through =
                    (gr['MenuModifierGroup'] as Record<string, unknown> | undefined) ||
                    (gr['menuModifierGroup'] as Record<string, unknown> | undefined) ||
                    (gr['menu_modifier_group'] as Record<string, unknown> | undefined) ||
                    {};
                const sortOrder = Number(
                    through['sort_order'] ?? (gr as { sort_order?: number }).sort_order ?? gr['sort_order'] ?? 0,
                );
                const isRequired = Boolean(
                    through['is_required'] ?? (gr as { is_required?: boolean }).is_required ?? false,
                );
                const options = ((gr['options'] as unknown[]) || [])
                    .map((o) => o as Record<string, unknown> & { id: number; label: string })
                    .filter((o) => o['is_active'] !== false)
                    .map((o) => ({
                        id: o.id,
                        label: String(o['label'] ?? ''),
                        code: o['code'] != null ? String(o['code']) : undefined,
                        price_delta: Number(o['price_delta'] ?? 0),
                        sort_order: Number(o['sort_order'] ?? 0),
                        is_active: o['is_active'] !== false,
                        is_default: Boolean(o['is_default']),
                    }))
                    .sort((a, b) => a.sort_order - b.sort_order);

                return {
                    id: gr.id,
                    name: String(gr['name'] ?? ''),
                    code: String(gr['code'] ?? ''),
                    sort_order: sortOrder,
                    is_required: isRequired,
                    options,
                };
            })
            .filter((g) => g.id != null)
            .sort((a, b) => a.sort_order - b.sort_order);

        return {
            id: m.id,
            name: String(m['name'] ?? ''),
            image: String(m['image'] ?? ''),
            unit_price: Number(m['unit_price'] ?? 0),
            code: m.code,
            type,
            modifierGroups: groups.length > 0 ? groups : undefined,
        };
    }

    private _lineKey(menuId: number, optionIds: number[], lineNote?: string): string {
        const sorted = [...optionIds].filter((n) => n > 0).sort((a, b) => a - b);
        const note = (lineNote || '').trim();
        return `${menuId}|${sorted.join(',')}|${note}`;
    }

    private _unitPriceForOptions(menu: MenuItem, optionIds: number[]): number {
        const base = Number(menu.unit_price ?? 0);
        const set = new Set(optionIds);
        let delta = 0;
        for (const g of menu.modifierGroups || []) {
            for (const o of g.options || []) {
                if (set.has(o.id)) {
                    delta += Number(o.price_delta || 0);
                }
            }
        }
        return base + delta;
    }

    private _modifierSummary(menu: MenuItem, optionIds: number[]): string {
        if (!optionIds.length) {
            return '';
        }
        const set = new Set(optionIds);
        const parts: string[] = [];
        for (const g of [...(menu.modifierGroups || [])].sort((a, b) => a.sort_order - b.sort_order)) {
            const opt = (g.options || []).find((o) => set.has(o.id));
            if (opt) {
                parts.push(`${g.name}: ${opt.label}`);
            }
        }
        return parts.join(' · ');
    }

    private _mergeOrPushLine(line: OrderCartLine): void {
        const existing = this.carts.find((c) => c.lineKey === line.lineKey);
        if (existing) {
            existing.qty += line.qty;
            existing.temp_qty = existing.qty;
        } else {
            this.carts.push(line);
        }
        this.canSubmit = true;
        this.isCartSidebarOpen = true;
    }

    toggleCartSidebar(): void {
        this.isCartSidebarOpen = !this.isCartSidebarOpen;
    }

    closeCartSidebar(): void {
        this.isCartSidebarOpen = false;
    }

    // Function to handle tab selection
    selectTab(item: any): void {
        this.selectedTab = item;
        this._changeDetectorRef.detectChanges(); // Trigger change detection manually
    }

    get filteredSelectedTabProducts(): MenuItem[] {
        const products = this.selectedTab?.products || [];
        const keyword = this.menuSearchTerm.trim().toLowerCase();
        if (!keyword) {
            return products;
        }

        return products.filter((item: MenuItem) => {
            const name = String(item?.name || '').toLowerCase();
            const code = String(item?.code || '').toLowerCase();
            const typeName = String(item?.type?.name || '').toLowerCase();
            return name.includes(keyword) || code.includes(keyword) || typeName.includes(keyword);
        });
    }

    // Function to handle the ngOnDestroy
    ngOnDestroy(): void {

        this._endBarayWaitUi();
        // Emit a value through the _unsubscribeAll subject to trigger the unsubscription
        this._unsubscribeAll.next(null);
        // Complete the subject to release resources
        this._unsubscribeAll.complete();
    }
    // Function to clear the cart
    clearCartAll(): void {
        this.carts = [];
        this.totalPrice = 0;
        this.canSubmit = false;
        this._snackBarService.openSnackBar('Cancel order successfully', GlobalConstants.success);
    }
    // Function to increment the quantity of an item
    incrementQty(index: number): void {
        const item = this.carts[index];
        if (item.temp_qty < 1000) {
            item.temp_qty += 1;
            item.qty = item.temp_qty;
            this.getTotalPrice();
        }
    }

    // Function to decrement the quantity of an item
    decrementQty(index: number): void {
        const item = this.carts[index];
        if (item.temp_qty > 1) {
            item.temp_qty -= 1;
            item.qty = item.temp_qty;
            this.getTotalPrice();
        }
    }   
    // Function to add an item to the cart
    addToCart(incomingItem: MenuItem, qty = 0): void {
        const addQty = qty > 0 ? qty : 1;
        const hasModifiers = (incomingItem.modifierGroups?.length ?? 0) > 0;

        if (hasModifiers) {
            this.matDialog
                .open(ModifierPickDialogComponent, {
                    data: { ...incomingItem, _qty: addQty } as MenuItem & { _qty: number },
                    width: '100%',
                    maxWidth: '520px',
                    autoFocus: false,
                })
                .afterClosed()
                .pipe(take(1), takeUntil(this._unsubscribeAll))
                .subscribe((res: ModifierPickResult | undefined) => {
                    if (!res) {
                        return;
                    }
                    const optionIds = res.modifier_option_ids || [];
                    const lineKey = this._lineKey(incomingItem.id, optionIds, res.line_note);
                    const line: OrderCartLine = {
                        lineKey,
                        id: incomingItem.id,
                        name: incomingItem.name,
                        qty: addQty,
                        temp_qty: addQty,
                        unit_price: this._unitPriceForOptions(incomingItem, optionIds),
                        image: incomingItem.image,
                        code: incomingItem.code,
                        type: incomingItem.type,
                        modifier_option_ids: optionIds,
                        line_note: res.line_note,
                        modifierSummary: this._modifierSummary(incomingItem, optionIds),
                    };
                    this._mergeOrPushLine(line);
                    this.getTotalPrice();
                });
            return;
        }

        const lineKey = this._lineKey(incomingItem.id, [], undefined);
        const newLine: OrderCartLine = {
            lineKey,
            id: incomingItem.id,
            name: incomingItem.name,
            qty: addQty,
            temp_qty: addQty,
            unit_price: Number(incomingItem.unit_price ?? 0),
            image: incomingItem.image,
            code: incomingItem.code,
            type: incomingItem.type,
            modifier_option_ids: [],
            modifierSummary: '',
        };
        this._mergeOrPushLine(newLine);
        this.getTotalPrice();
    }


    // Function to calculate the total price of the items in the cart
    getTotalPrice(): void {

        // Calculate the total price by iterating over items in the cart and summing the product of quantity and unit price
        this.totalPrice = this.carts.reduce((total, item) => total + (item.qty * item.unit_price), 0);
        if (this.carts.length === 0) {
            this.canSubmit = false;
        }
    }

    // Function to remove an item from the cart
    remove(value: any, index: number = -1): void {

        // If the value is 0, set canSubmit to true
        if (value === 0) {

            this.canSubmit = true;
        }

        // Remove the item from the cart at the specified index
        this.carts.splice(index, 1);

        // Calculate and update the total price of the items in the cart
        this.getTotalPrice();
    }

    // Function to handle the blur event on the quantity input field
    blur(event: any, index: number = -1): void {

        // Store the current quantity before any changes
        const tempQty = this.carts[index].qty;

        // Check if the entered value is 0, and update canSubmit accordingly
        if (event.target.value == 0) {

            this.canSubmit = false;
        } else {

            this.canSubmit = true;
        }

        // Parse the entered value as an integer (base 10)
        const enteredValue = parseInt(event.target.value, 10);

        // Ensure the entered value does not exceed 1000
        if (enteredValue > 1000) {
            event.target.value = '1000';
        }

        // Check if the entered value is falsy (e.g., an empty string)
        if (!event.target.value) {

            // Restore the quantity to its previous value if the entered value is falsy
            this.carts[index].qty = tempQty;
            this.carts[index].temp_qty = tempQty;
        } else {

            // Update the quantity with the entered value
            this.carts[index].qty = enteredValue;
            this.carts[index].temp_qty = enteredValue;
        }

        // Calculate and update the total price of the items in the cart
        this.getTotalPrice();
    }

    // Function to handle the keydown event on the quantity input field
    private matDialog = inject(MatDialog);

    private openOrderDetailDrawer(order: OrderReceiptData): void {
        const dialogConfig = new MatDialogConfig<OrderReceiptData>();
        dialogConfig.data = order;
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        this.matDialog.open(ViewDetailSaleComponent, dialogConfig);
    }

    private _clearBarayWaitSub(): void {
        this._barayWaitSub?.unsubscribe();
        this._barayWaitSub = null;
    }

    /** Stop waiting for Baray without calling the API (natural completion). */
    private _endBarayWaitUi(): void {
        this.isAwaitingBarayPayment = false;
        this._barayPendingOrderId = null;
        this._clearBarayWaitSub();
    }

    /** Cashier gives up: stop listening and cancel the order on the server. */
    cancelBarayWait(): void {
        if (this._barayPendingOrderId == null) {
            this._endBarayWaitUi();
            return;
        }
        const id = this._barayPendingOrderId;
        this._endBarayWaitUi();
        this._service.cancelOrder(id).subscribe({
            next: () => {
                this._snackBarService.openSnackBar(
                    "Receipt cancelled — customer has not paid.",
                    GlobalConstants.success,
                );
            },
            error: (err: HttpErrorResponse) => {
                this._snackBarService.openSnackBar(
                    err?.error?.message || "Unable to cancel this order.",
                    GlobalConstants.error,
                );
            },
        });
    }

    checkOut(): void {
        const cartArray = this.carts.map((line) => {
            const entry: {
                menu_id: number;
                qty: number;
                modifier_option_ids: number[];
                line_note?: string;
            } = {
                menu_id: line.id,
                qty: line.qty,
                modifier_option_ids: line.modifier_option_ids || [],
            };
            if (line.line_note?.trim()) {
                entry.line_note = line.line_note.trim().slice(0, 500);
            }
            return entry;
        });

        const body = {
            cart: JSON.stringify(cartArray),
        };

        // Set the flag to indicate that an order is being made
        this.isOrderBeingMade = true;

        // Make the API call to create an order using the order service
        this._service.create(body).subscribe({

            next: (response) => {

                this.isOrderBeingMade = false;
                this.carts = [];
                this.totalPrice = 0;
                this.canSubmit = false;
                this.isCartSidebarOpen = false;
                // Do not show “success” when the order is not paid yet — only after Baray pay link is ready.
                const order = response.data;
                if (order?.id != null) {
                    this._service.createBarayPaymentIntent(order.id).subscribe({
                        next: (baray) => {
                            const payUrl = baray.data?.url?.trim();
                            if (payUrl) {
                                // Real Baray page — do not show “paid” here; only after webhook / status change
                                this._clearBarayWaitSub();
                                this._barayPendingOrderId = order.id;
                                this.isAwaitingBarayPayment = true;
                                window.open(payUrl, "_blank", "noopener,noreferrer");
                                const cashierId = this.user?.id ?? order.cashier?.id ?? 0;
                                this._barayWaitSub = this._barayPaid
                                    .waitUntilSettled(order.id, cashierId)
                                    .pipe(take(1), takeUntil(this._unsubscribeAll))
                                    .subscribe((outcome) => {
                                        this.isAwaitingBarayPayment = false;
                                        this._barayPendingOrderId = null;
                                        this._barayWaitSub = null;
                                        if (outcome === 'paid') {
                                            this._snackBarService.openSnackBar(
                                                "Baray: Payment completed — receipt " + String(order.receipt_number ?? "") + ".",
                                                GlobalConstants.success,
                                            );
                                            this._service.getOrderViewForBaray(order.id).subscribe({
                                                next: (v) => {
                                                    const d: Record<string, unknown> = (v.data ||
                                                        {}) as Record<string, unknown>;
                                                    const details =
                                                        (d['orderDetails'] as unknown[]) ||
                                                        (d['details'] as unknown[]) ||
                                                        [];
                                                    this.openOrderDetailDrawer({
                                                        ...order,
                                                        ...d,
                                                        details,
                                                        orderDetails: details,
                                                    } as OrderReceiptData);
                                                },
                                                error: () =>
                                                    this.openOrderDetailDrawer({
                                                        ...order,
                                                        status: 'pending',
                                                    } as OrderReceiptData),
                                            });
                                        } else if (outcome === 'cancelled') {
                                            this._snackBarService.openSnackBar(
                                                "Receipt " + String(order.receipt_number ?? "") + " — changed/cancelled",
                                                GlobalConstants.error,
                                            );
                                        } else {
                                            this._snackBarService.openSnackBar(
                                                "Baray: Waiting timeout (5 minutes) — please verify payment manually.",
                                                GlobalConstants.error,
                                            );
                                        }
                                    });
                            } else {
                                this._snackBarService.openSnackBar(
                                    "Baray: Payment link not available.",
                                    GlobalConstants.error,
                                );
                            }
                        },
                        error: (err: HttpErrorResponse) => {
                            this._snackBarService.openSnackBar(
                                err?.error?.message || "Unable to start Baray payment.",
                                GlobalConstants.error,
                            );
                        },
                    });
                } else {
                    this._snackBarService.openSnackBar(response.message, GlobalConstants.success);
                    this.openOrderDetailDrawer(order);
                }
            },

            error: (err: HttpErrorResponse) => {

                this.isOrderBeingMade = false;
                this._snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            }
        });
    }

}
