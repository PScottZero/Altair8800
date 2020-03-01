import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AltairComponent } from './altair/altair.component';
import { SysInfoComponent } from './sys-info/sys-info.component';

@NgModule({
  declarations: [
    AppComponent,
    AltairComponent,
    SysInfoComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
