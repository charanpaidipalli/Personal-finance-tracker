import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
export interface Income { _id?: string; source: string; amount: number; date: string; description?: string; }
export interface Expense { _id?: string; category: string; amount: number; date: string; description?: string; }
export interface Budget { _id?: string; category: string; limit: number; month: string; }
export interface Goal { _id?: string; name: string; targetAmount: number; currentAmount: number; deadline?: string; }
@Injectable({providedIn:'root'})
export class FinanceService {
 private http=inject(HttpClient); private base=API_BASE_URL;
 getIncome():Observable<Income[]>{return this.http.get<Income[]>(`${this.base}/income`)}
 addIncome(x:Income){return this.http.post<Income>(`${this.base}/income`,x)} deleteIncome(id:string){return this.http.delete(`${this.base}/income/${id}`)}
 getExpenses():Observable<Expense[]>{return this.http.get<Expense[]>(`${this.base}/expenses`)} addExpense(x:Expense){return this.http.post<Expense>(`${this.base}/expenses`,x)} deleteExpense(id:string){return this.http.delete(`${this.base}/expenses/${id}`)}
 getBudgets():Observable<Budget[]>{return this.http.get<Budget[]>(`${this.base}/budgets`)} addBudget(x:Budget){return this.http.post<Budget>(`${this.base}/budgets`,x)} deleteBudget(id:string){return this.http.delete(`${this.base}/budgets/${id}`)}
 getGoals():Observable<Goal[]>{return this.http.get<Goal[]>(`${this.base}/goals`)} addGoal(x:Goal){return this.http.post<Goal>(`${this.base}/goals`,x)} updateGoal(id:string,x:Partial<Goal>){return this.http.patch<Goal>(`${this.base}/goals/${id}`,x)} deleteGoal(id:string){return this.http.delete(`${this.base}/goals/${id}`)}
 summary(){return this.http.get<any>(`${this.base}/analytics/summary`)} monthly(){return this.http.get<any[]>(`${this.base}/analytics/monthly`)} category(){return this.http.get<any[]>(`${this.base}/analytics/category`)} report(){return this.http.get<any>(`${this.base}/reports`)}
}
