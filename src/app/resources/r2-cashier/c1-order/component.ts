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
import { Data as OrderReceiptData, ProductType } from '../c2-sale/interface';
import { MenuItemComponent }    from './item/component';
import { BarayPaidWatcherService } from './baray-paid-watcher.service';
import { OrderService }     from './service';
import { Data, MenuItem }    from './interface';
import { ViewDetailSaleComponent } from 'app/shared/view/component';
interface CartItem {

    id: number;
    name: string;
    qty: number;
    temp_qty: number;
    unit_price: number;
    image: string,
    code: string,
    type: ProductType,
}


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
    carts: CartItem[] = [];
    user: User;
    isOrderBeingMade: boolean = false;
    /** Full-screen wait after Baray pay link opens until paid, timeout, or cashier cancels. */
    isAwaitingBarayPayment: boolean = false;
    private _barayPendingOrderId: number | null = null;
    private _barayWaitSub: Subscription | null = null;
    canSubmit: boolean = false;
    totalPrice: number = 0;
    selectedTab: any;

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
                this.data = (response.data || []).map((cat: Data) => ({
                    ...cat,
                    products: (cat as Data & { menus?: MenuItem[] }).menus || cat.products || [],
                }));

                this.allMenuItems = this.data.reduce((all: MenuItem[], item: Data) => {
                    return all.concat((item as Data & { menus?: MenuItem[] }).menus || item.products || []);
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

    trackByMenuItemId(_index: number, row: { id: number }): number {
        return row?.id;
    }

    // Function to handle tab selection
    selectTab(item: any): void {
        this.selectedTab = item;
        this._changeDetectorRef.detectChanges(); // Trigger change detection manually
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

        // Find an existing item in the cart with the same id as the incoming item
        const existingItem = this.carts.find(item => item.id === incomingItem.id);

        if (existingItem) {

            // If the item already exists, update its quantity and temp_qty
            existingItem.qty += qty;
            existingItem.temp_qty = existingItem.qty;

        } else {

            // If the item doesn't exist, create a new CartItem and add it to the cart
            const newItem: CartItem = {

                id: incomingItem.id,
                name: incomingItem.name,
                qty: qty,
                temp_qty: qty,
                unit_price: incomingItem.unit_price,
                image: incomingItem.image,
                code: incomingItem.code,
                type: incomingItem.type,
            };
            this.carts.push(newItem);
            // Set canSubmit to true, indicating that there is at least one item in the cart
            this.canSubmit = true;
        }

        // Calculate and update the total price of the items in the cart
        this.getTotalPrice();
    }


    // Function to calculate the total price of the items in the cart
    getTotalPrice(): void {

        // Calculate the total price by iterating over items in the cart and summing the product of quantity and unit price
        this.totalPrice = this.carts.reduce((total, item) => total + (item.qty * item.unit_price), 0);
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
                    "បានបោះបង់វិក័យ — អតិថិជនមិនទាន់ទូទាត់។",
                    GlobalConstants.success,
                );
            },
            error: (err: HttpErrorResponse) => {
                this._snackBarService.openSnackBar(
                    err?.error?.message || "មិនអាចបោះបង់បញ្ជាទិញបានទេ",
                    GlobalConstants.error,
                );
            },
        });
    }

    checkOut(): void {

        // Create a dictionary to represent the cart with item IDs and quantities
        const carts: { [itemId: number]: number } = {};

        this.carts.forEach((item: CartItem) => {

            carts[item.id] = item.qty;
        });

        // Prepare the request body with the serialized cart data
        const body = {

            cart: JSON.stringify(carts)
        };

        // Set the flag to indicate that an order is being made
        this.isOrderBeingMade = true;

        // Make the API call to create an order using the order service
        this._service.create(body).subscribe({

            next: (response) => {

                this.isOrderBeingMade = false;
                this.carts = [];
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
                                                "Baray: ទូទាត់រួច — វិក័យ " + String(order.receipt_number ?? "") + "។",
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
                                                "វិក័យ " + String(order.receipt_number ?? "") + " — បានផ្លាស់ / បោះបង់",
                                                GlobalConstants.error,
                                            );
                                        } else {
                                            this._snackBarService.openSnackBar(
                                                "Baray: អស់ពេលរង (5 នាទី) — ពិនិត្យទូទាត់ដៃ។",
                                                GlobalConstants.error,
                                            );
                                        }
                                    });
                            } else {
                                this._snackBarService.openSnackBar(
                                    "Baray: គ្មានតំណទូទាត់",
                                    GlobalConstants.error,
                                );
                            }
                        },
                        error: (err: HttpErrorResponse) => {
                            this._snackBarService.openSnackBar(
                                err?.error?.message || "មិនអាចបើកទូទាត់ Baray បានទេ",
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
