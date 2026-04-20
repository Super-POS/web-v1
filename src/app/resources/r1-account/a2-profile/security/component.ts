// ================================================================================>> Core Library
import { Component, OnInit } from '@angular/core';

// ================================================================================>> Third Party Library
// Material
import { MatIconModule } from '@angular/material/icon';


@Component({
    selector    : 'profile-security',
    standalone  : true,
    templateUrl : './template.html',
    styleUrl    : './style.scss',
    imports     : [
        MatIconModule
    ]
})

export class ProfileSecurityComponent implements OnInit {

    constructor( ) { }

    ngOnInit(): void {}
}
