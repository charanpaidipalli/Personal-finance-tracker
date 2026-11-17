import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { AuthService, AuthUser } from './services/auth.service';
import { API_BASE_URL } from './services/api.config';
import { FinanceService, Income, Expense, Budget, Goal } from './services/finance.service';

Chart.register(...registerables);

type AuthMode = 'login' | 'register';
type SaveKind = 'income' | 'expense' | 'budget' | 'goal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {
  private api = inject(FinanceService);
  private auth = inject(AuthService);

  @ViewChild('monthlyChart') monthlyChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChart!: ElementRef<HTMLCanvasElement>;

  private monthlyChartInstance?: Chart;
  private categoryChartInstance?: Chart;

  title = 'Pocketwise';
  today = new Date();
  tab = 'dashboard';
  authReady = false;
  currentUser: AuthUser | null = null;
  authMode: AuthMode = 'login';
  authBusy = false;
  authError = '';
  authForm = { name: '', email: '', password: '' };
  dataError = '';
  saveError = '';
  saveSuccess = '';
  saving: SaveKind | null = null;
  income: Income[] = [];
  expenses: Expense[] = [];
  budgets: Budget[] = [];
  goals: Goal[] = [];
  summary = { totalIncome: 0, totalExpense: 0, balance: 0 };
  monthly: Array<{ month: string; income: number; expense: number }> = [];
  category: Array<{ _id: string; total: number }> = [];
  chartsReady = false;

  incomeForm: Income = { source: '', amount: 0, date: new Date().toISOString().slice(0, 10), description: '' };
  expenseForm: Expense = { category: '', amount: 0, date: new Date().toISOString().slice(0, 10), description: '' };
  budgetForm: Budget = { category: '', limit: 0, month: new Date().toISOString().slice(0, 7) };
  goalForm: Goal = { name: '', targetAmount: 0, currentAmount: 0, deadline: '' };

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: ({ user }) => {
        this.currentUser = user;
        this.authReady = true;
        if (user) this.loadAll();
      },
      error: (error: HttpErrorResponse) => {
        this.authReady = true;
        if (error.status !== 401) {
          this.authError = this.requestError(error, 'Could not check your sign-in status.');
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    setTimeout(() => this.drawCharts(), 300);
  }

  setAuthMode(mode: AuthMode): void {
    this.authMode = mode;
    this.authError = '';
  }

  submitAuth(): void {
    this.authBusy = true;
    this.authError = '';
    const request = this.authMode === 'register'
      ? this.auth.register(this.authForm)
      : this.auth.login({ email: this.authForm.email, password: this.authForm.password });

    request.subscribe({
      next: ({ user }) => {
        this.currentUser = user;
        this.authReady = true;
        this.authBusy = false;
        this.authError = '';
        this.authForm = { name: '', email: '', password: '' };
        this.loadAll();
      },
      error: (error: HttpErrorResponse) => {
        this.authBusy = false;
        this.authError = this.requestError(error, 'Could not sign in. Please try again.');
      }
    });
  }

  logout(): void {
    this.dataError = '';
    this.auth.logout().subscribe({
      next: () => {
        this.currentUser = null;
        this.clearFinanceData();
        this.authForm = { name: '', email: '', password: '' };
        this.authMode = 'login';
      },
      error: (error: HttpErrorResponse) => {
        this.dataError = this.requestError(error, 'Could not sign out. Please try again.');
      }
    });
  }

  loadAll(): void {
    this.dataError = '';
    forkJoin({
      income: this.api.getIncome(),
      expenses: this.api.getExpenses(),
      budgets: this.api.getBudgets(),
      goals: this.api.getGoals(),
      summary: this.api.summary(),
      monthly: this.api.monthly(),
      category: this.api.category()
    }).subscribe({
      next: data => {
        this.income = data.income;
        this.expenses = data.expenses;
        this.budgets = data.budgets;
        this.goals = data.goals;
        this.summary = data.summary;
        this.monthly = data.monthly;
        this.category = data.category;
        this.drawCharts();
      },
      error: (error: HttpErrorResponse) => {
        this.dataError = this.requestError(error, 'Could not load your finance data.');
      }
    });
  }

  money(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  addIncome(): void {
    const entry = { ...this.incomeForm, amount: Number(this.incomeForm.amount) };
    this.saveRequest(this.api.addIncome(entry), 'income', 'Income saved.', () => {
      this.incomeForm = { source: '', amount: 0, date: new Date().toISOString().slice(0, 10), description: '' };
    });
  }

  addExpense(): void {
    const entry = { ...this.expenseForm, amount: Number(this.expenseForm.amount) };
    this.saveRequest(this.api.addExpense(entry), 'expense', 'Expense saved.', () => {
      this.expenseForm = { category: '', amount: 0, date: new Date().toISOString().slice(0, 10), description: '' };
    });
  }

  addBudget(): void {
    const budget = { ...this.budgetForm, limit: Number(this.budgetForm.limit) };
    this.saveRequest(this.api.addBudget(budget), 'budget', 'Budget saved.', () => {
      this.budgetForm = { category: '', limit: 0, month: new Date().toISOString().slice(0, 7) };
    });
  }

  addGoal(): void {
    const goal = {
      ...this.goalForm,
      targetAmount: Number(this.goalForm.targetAmount),
      currentAmount: Number(this.goalForm.currentAmount)
    };
    this.saveRequest(this.api.addGoal(goal), 'goal', 'Savings goal added.', () => {
      this.goalForm = { name: '', targetAmount: 0, currentAmount: 0, deadline: '' };
    });
  }

  removeIncome(id: string): void {
    this.deleteRequest(this.api.deleteIncome(id));
  }

  removeExpense(id: string): void {
    this.deleteRequest(this.api.deleteExpense(id));
  }

  removeBudget(id: string): void {
    this.deleteRequest(this.api.deleteBudget(id));
  }

  removeGoal(id: string): void {
    this.deleteRequest(this.api.deleteGoal(id));
  }

  goalPercent(goal: Goal): number {
    return Math.min(100, Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100));
  }

  drawCharts(): void {
    if (!this.chartsReady) return;

    if (this.monthlyChart?.nativeElement) {
      this.monthlyChartInstance?.destroy();
      this.monthlyChartInstance = new Chart(this.monthlyChart.nativeElement, {
        type: 'bar',
        data: {
          labels: this.monthly.map(item => item.month),
          datasets: [
            { label: 'Income', data: this.monthly.map(item => item.income), backgroundColor: '#9bd8aa', borderRadius: 5, maxBarThickness: 24 },
            { label: 'Expense', data: this.monthly.map(item => item.expense), backgroundColor: '#f0a18a', borderRadius: 5, maxBarThickness: 24 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 7, boxHeight: 7, padding: 18, color: '#7c8797', font: { size: 10 } } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#98a29b', font: { size: 9 } } },
            y: { beginAtZero: true, grid: { color: '#eff2ef' }, ticks: { color: '#98a29b', font: { size: 9 } } }
          }
        }
      });
    }

    if (this.categoryChart?.nativeElement) {
      this.categoryChartInstance?.destroy();
      this.categoryChartInstance = new Chart(this.categoryChart.nativeElement, {
        type: 'doughnut',
        data: {
          labels: this.category.map(item => item._id),
          datasets: [{
            data: this.category.map(item => item.total),
            backgroundColor: ['#90c99e', '#eaa18b', '#b0a7d8', '#e5c779', '#80bac0', '#d494b2', '#9caf78'],
            borderWidth: 3,
            borderColor: '#fff',
            hoverOffset: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 7, boxHeight: 7, padding: 13, color: '#7c8797', font: { size: 9 } } }
          }
        }
      });
    }
  }

  setTab(tab: string): void {
    this.tab = tab;
    this.saveError = '';
    this.saveSuccess = '';
    setTimeout(() => this.drawCharts(), 100);
  }

  private saveRequest<T>(request: Observable<T>, kind: SaveKind, successMessage: string, reset: () => void): void {
    this.saving = kind;
    this.saveError = '';
    this.saveSuccess = '';
    request.subscribe({
      next: () => {
        this.saving = null;
        reset();
        this.saveSuccess = successMessage;
        this.loadAll();
      },
      error: (error: HttpErrorResponse) => {
        this.saving = null;
        this.saveError = this.requestError(error, 'Could not save this entry.');
      }
    });
  }

  private deleteRequest(request: Observable<unknown>): void {
    this.dataError = '';
    request.subscribe({
      next: () => this.loadAll(),
      error: (error: HttpErrorResponse) => {
        this.dataError = this.requestError(error, 'Could not delete this entry.');
      }
    });
  }

  private requestError(error: HttpErrorResponse, fallback: string): string {
    if (error.status === 401 && this.currentUser) {
      this.currentUser = null;
      this.clearFinanceData();
      this.authError = 'Your session has expired. Please sign in again.';
      return this.authError;
    }
    if (error.status === 0) {
      return `Can't reach the finance API at ${API_BASE_URL}. Start MongoDB and the backend, then retry.`;
    }
    const message = error.error?.message;
    return typeof message === 'string' ? message : fallback;
  }

  private clearFinanceData(): void {
    this.income = [];
    this.expenses = [];
    this.budgets = [];
    this.goals = [];
    this.summary = { totalIncome: 0, totalExpense: 0, balance: 0 };
    this.monthly = [];
    this.category = [];
    this.monthlyChartInstance?.destroy();
    this.categoryChartInstance?.destroy();
    this.monthlyChartInstance = undefined;
    this.categoryChartInstance = undefined;
  }
}
