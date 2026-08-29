import { Injectable, inject } from '@angular/core';
import { DashboardService } from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService extends DashboardService {
  // Alias to DashboardService
}
