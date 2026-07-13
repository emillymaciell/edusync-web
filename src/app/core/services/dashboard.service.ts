import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { DashboardMetrics, AdminDashboardMetrics } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${API_BASE_URL}/api/dashboard/metrics`);
  }

  getAdminMetrics(): Observable<AdminDashboardMetrics> {
    return this.http.get<AdminDashboardMetrics>(`${API_BASE_URL}/api/admin/metrics`);
  }
}
