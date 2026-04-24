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

import { Subject, takeUntil }           from 'rxjs';

// ================================================================>> Custom Library
import { UserService }      from 'app/core/user/service';
import { User }             from 'app/core/user/interface';
import { env }              from 'envs/env';
import { SnackbarService }  from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants      from 'helper/shared/constants';
import { ProductType }      from '../c2-sale/interface';
import { ItemComponent }    from './item/component';
import { OrderService }     from './service';
import { Data, Product }    from './interface';
import { ViewDetailSaleComponent } from 'app/shared/view/component';
import {
    AddOptionsDialogComponent,
    AddOptionsDialogResult,
} from './add-options-dialog/component';

interface CartItem {

    lineId: string;
    id: number;
    name: string;
    qty: number;
    temp_qty: number;
    unit_price: number;
    stock: number;
    image: string,
    code: string,
    type: ProductType,
    /** 0–100, amount of sugar vs full recipe */
    sugar_pct: number;
    /** 1 = single shot, 2 = double (scales coffee beans line) */
    shots: number;
}

interface IngredientStockRow {
    id: number;
    name: string;
    unit: string;
    stock: number;
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
        ItemComponent,
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
    allProducts: Product[] = [];
    isLoading: boolean = false;
    carts: CartItem[] = [];
    user: User;
    isOrderBeingMade: boolean = false;
    canSubmit: boolean = false;
    totalPrice: number = 0;
    selectedTab: any;
    searchKey: string = '';
    filteredProducts: Product[] = [];
    ingredientStocks: IngredientStockRow[] = [];
    private matDialog = inject(MatDialog);

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _userService: UserService,
        private _service: OrderService,
        private _snackBarService: SnackbarService,
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
        this.loadMenuData();
    }

    loadMenuData(): void {
        this.isLoading = true;
        this._service.getData().subscribe({
            next: (response) => {
                this.data = response.data;

                // Create the "ALL" category
                this.allProducts = this.data.reduce((all, item) => {
                    return all.concat(item.products);
                }, []);
                this.ingredientStocks = this.buildIngredientStocks(this.allProducts);

                // Add the "ALL" category to the data array
                this.data.unshift({
                    id: 0, // Use a unique id for the "ALL" category
                    name: 'All Categories',
                    products: this.allProducts
                });
                if (this.data && this.data.length > 0) {
                    this.selectedTab = this.data[0];
                    this.applySearch();
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

    // Function to handle tab selection
    selectTab(item: any): void {
        this.selectedTab = item;
        this.applySearch();
        this._changeDetectorRef.detectChanges(); // Trigger change detection manually
    }

    onSearchInput(): void {
        this.applySearch();
    }

    private applySearch(): void {
        const items = (this.selectedTab?.products || []) as Product[];
        const q = this.searchKey.trim().toLowerCase();

        if (!q) {
            this.filteredProducts = [...items];
            return;
        }

        this.filteredProducts = items.filter((p) => {
            const name = (p?.name || '').toLowerCase();
            const code = (p?.code || '').toLowerCase();
            const type = (p?.type?.name || '').toLowerCase();
            return name.includes(q) || code.includes(q) || type.includes(q);
        });
    }

    // Function to handle the ngOnDestroy
    ngOnDestroy(): void {

        // Emit a value through the _unsubscribeAll subject to trigger the unsubscription
        this._unsubscribeAll.next(null);
        // Complete the subject to release resources
        this._unsubscribeAll.complete();
    }

    trackById(_: number, item: { id: number }): number {
        return item?.id;
    }

    trackByProductId(_: number, p: { id: number }): number {
        return p?.id;
    }

    trackByLineId(_: number, row: CartItem): string {
        return row?.lineId;
    }

    trackByIngredientId(_: number, row: IngredientStockRow): number {
        return row?.id;
    }

    private buildIngredientStocks(products: Product[]): IngredientStockRow[] {
        const map = new Map<number, IngredientStockRow>();
        for (const p of products || []) {
            for (const ri of p.recipe_items || []) {
                const ing = ri.ingredient;
                if (!ing?.id) {
                    continue;
                }
                const existing = map.get(ing.id);
                if (!existing) {
                    map.set(ing.id, {
                        id: ing.id,
                        name: ing.name,
                        unit: ing.unit,
                        stock: Number(ing.stock || 0),
                    });
                } else {
                    existing.stock = Number(ing.stock || 0);
                }
            }
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }

    /** Drinks with sugar/shot-scaled recipe lines get the options dialog. */
    hasOrderOptions(p: Product): boolean {
        return (p.recipe_items || []).some(
            (r) => r.scale_key === 'sugar' || r.scale_key === 'shot',
        );
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
        if (item.temp_qty >= item.stock) {
            this._snackBarService.openSnackBar(`Only ${item.stock} available for ${item.name}`, GlobalConstants.error);
            return;
        }
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
    addToCart(incomingItem: Product, qty = 0): void {
        if ((incomingItem.stock || 0) <= 0) {
            this._snackBarService.openSnackBar(`${incomingItem.name} is out of stock`, GlobalConstants.error);
            return;
        }

        if (this.hasOrderOptions(incomingItem)) {
            const cfg = new MatDialogConfig();
            cfg.data = { product: incomingItem };
            cfg.width = 'min(100vw - 32px, 400px)';
            cfg.autoFocus = false;
            const ref = this.matDialog.open(AddOptionsDialogComponent, cfg);
            ref.afterClosed().subscribe((opts: AddOptionsDialogResult | undefined) => {
                if (!opts) {
                    return;
                }
                this.addLineToCart(incomingItem, qty, opts.sugar_pct, opts.shots);
            });
            return;
        }

        this.addLineToCart(incomingItem, qty, 100, 1);
    }

    private addLineToCart(
        incomingItem: Product,
        qty: number,
        sugar_pct: number,
        shots: number,
    ): void {
        if ((incomingItem.stock || 0) <= 0) {
            this._snackBarService.openSnackBar(`${incomingItem.name} is out of stock`, GlobalConstants.error);
            return;
        }

        const existingItem = this.carts.find(
            (item) =>
                item.id === incomingItem.id
                && item.sugar_pct === sugar_pct
                && item.shots === shots,
        );

        if (existingItem) {
            if (existingItem.qty + qty > incomingItem.stock) {
                this._snackBarService.openSnackBar(
                    `Only ${incomingItem.stock} available for ${incomingItem.name}`,
                    GlobalConstants.error,
                );
                return;
            }
            existingItem.qty += qty;
            existingItem.temp_qty = existingItem.qty;
        } else {
            const newItem: CartItem = {
                lineId: typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${incomingItem.id}-${sugar_pct}-${shots}-${Date.now()}`,
                id: incomingItem.id,
                name: incomingItem.name,
                qty: qty,
                temp_qty: qty,
                unit_price: incomingItem.unit_price,
                stock: incomingItem.stock,
                image: incomingItem.image,
                code: incomingItem.code,
                type: incomingItem.type,
                sugar_pct,
                shots,
            };
            this.carts.push(newItem);
            this.canSubmit = true;
        }
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

        if (enteredValue > this.carts[index].stock) {
            event.target.value = String(this.carts[index].stock);
            this._snackBarService.openSnackBar(
                `Only ${this.carts[index].stock} available for ${this.carts[index].name}`,
                GlobalConstants.error,
            );
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
    checkOut(): void {

        const cartPayload = {
            lines: this.carts.map((item) => ({
                product_id: item.id,
                qty: item.qty,
                sugar_pct: item.sugar_pct,
                shots: item.shots,
            })),
        };

        const body = {
            cart: JSON.stringify(cartPayload),
        };

        // Set the flag to indicate that an order is being made
        this.isOrderBeingMade = true;

        // Make the API call to create an order using the order service
        this._service.create(body).subscribe({

            next: response => {

                // Reset the order in progress flag
                this.isOrderBeingMade = false;

                // Clear the cart after a successful order
                this.carts = [];

                // Display a success message
                this._snackBarService.openSnackBar(response.message, GlobalConstants.success);
                this.loadMenuData();

                // Open a dialog to display order details
                const dialogConfig = new MatDialogConfig();
                dialogConfig.data = response.data;
                dialogConfig.autoFocus = false;
                dialogConfig.position = { right: '0px' };
                dialogConfig.height = '100dvh';
                dialogConfig.width = '100dvw';
                dialogConfig.maxWidth = '550px';
                dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
                dialogConfig.enterAnimationDuration = '0s';
                this.matDialog.open(ViewDetailSaleComponent, dialogConfig);
            },

            error: (err: HttpErrorResponse) => {

                // Reset the order in progress flag on error
                this.isOrderBeingMade = false;

                // Display an error message
                this._snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            }
        });
    }

}
