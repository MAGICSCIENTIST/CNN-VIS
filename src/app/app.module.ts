import { NodeTitlePipe } from './utils/pipes/node-title.pipe';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzListModule } from 'ng-zorro-antd/list';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IconsProviderModule } from './icons-provider.module';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { zh_CN } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import { OverviewComponent } from './pages/overview/overview.component';
import { ColorPanelComponent } from './utils/color-panel/color-panel.component';
import { LinePanelComponent } from './utils/line-panel/line-panel.component';
import { DetailPanelComponent } from './utils/detail-panel/detail-panel.component';
import { LinkTitlePipe } from './utils/pipes/link-title.pipe';

registerLocaleData(zh);

@NgModule({
  declarations: [
    AppComponent,
    OverviewComponent,
    ColorPanelComponent,
    NodeTitlePipe,
    LinePanelComponent,
    DetailPanelComponent,
    LinkTitlePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    IconsProviderModule,
    NzLayoutModule,
    NzMenuModule,
    FormsModule,
    NzCardModule,
    NzGridModule,
    NzModalModule,
    NzListModule,
    NzDividerModule,
    NzTypographyModule,
    NzNotificationModule,
    NzToolTipModule,
    HttpClientModule,
    BrowserAnimationsModule
  ],
  providers: [{ provide: NZ_I18N, useValue: zh_CN }],
  bootstrap: [AppComponent]
})
export class AppModule { }
