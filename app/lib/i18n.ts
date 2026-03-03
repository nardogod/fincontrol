export type LanguageCode = "pt" | "en" | "sv";

type TranslationDict = Record<LanguageCode, string>;

export const tLandingTitleMain: TranslationDict = {
  pt: "Controle suas finanças",
  en: "Control your finances",
  sv: "Kontrollera din ekonomi",
};

export const tLandingTitleHighlight: TranslationDict = {
  pt: "de forma simples",
  en: "in a simple way",
  sv: "på ett enkelt sätt",
};

export const tLandingSubtitle: TranslationDict = {
  pt: "Sistema completo de controle financeiro pessoal e familiar com entrada automática via Telegram e dashboards em tempo real.",
  en: "A complete personal and family finance system with automatic Telegram input and real-time dashboards.",
  sv: "Ett komplett system för privat och familjeekonomi med automatisk Telegram‑registrering och dashboards i realtid.",
};

export const tLandingCtaSignup: TranslationDict = {
  pt: "Começar Grátis",
  en: "Get Started Free",
  sv: "Börja gratis",
};

export const tLandingCtaLogin: TranslationDict = {
  pt: "Fazer Login",
  en: "Log In",
  sv: "Logga in",
};

export const tLandingFeatures = {
  mobileFirst: {
    title: {
      pt: "Mobile First",
      en: "Mobile First",
      sv: "Mobil först",
    },
    desc: {
      pt: "Interface otimizada para celular. Controle suas finanças de qualquer lugar, a qualquer momento.",
      en: "Mobile-optimized interface. Control your finances from anywhere, anytime.",
      sv: "Mobiloptimerat gränssnitt. Kontrollera din ekonomi var som helst, när som helst.",
    },
  },
  autoInput: {
    title: {
      pt: "Entrada Automática",
      en: "Automatic Input",
      sv: "Automatisk registrering",
    },
    desc: {
      pt: "Registre gastos enviando mensagens no Telegram. AI inteligente categoriza automaticamente.",
      en: "Record expenses by sending messages on Telegram. Smart AI categorizes automatically.",
      sv: "Registrera utgifter genom att skicka meddelanden på Telegram. Smart AI kategoriserar automatiskt.",
    },
  },
  dashboards: {
    title: {
      pt: "Dashboards em Tempo Real",
      en: "Real-Time Dashboards",
      sv: "Dashboards i realtid",
    },
    desc: {
      pt: "Visualize seus gastos com gráficos interativos. Acompanhe metas e previsões mensais.",
      en: "Visualize your expenses with interactive charts. Track goals and monthly forecasts.",
      sv: "Visualisera dina utgifter med interaktiva diagram. Följ mål och månadsprognoser.",
    },
  },
};

export const tLandingStats = {
  accountTypes: {
    pt: "Tipos de Contas",
    en: "Account Types",
    sv: "Kontotyper",
  },
  transactions: {
    pt: "Transações",
    en: "Transactions",
    sv: "Transaktioner",
  },
  secure: {
    pt: "Seguro",
    en: "Secure",
    sv: "Säkert",
  },
};

export const tLandingFooter: TranslationDict = {
  pt: "© 2024 FinControl. Feito com ❤️ para ajudar você a controlar suas finanças.",
  en: "© 2024 FinControl. Made with ❤️ to help you control your finances.",
  sv: "© 2024 FinControl. Gjord med ❤️ för att hjälpa dig kontrollera din ekonomi.",
};

export const tLogin = {
  welcome: {
    pt: "Bem-vindo de volta",
    en: "Welcome back",
    sv: "Välkommen tillbaka",
  },
  subtitle: {
    pt: "Entre com sua conta para continuar",
    en: "Sign in to your account to continue",
    sv: "Logga in på ditt konto för att fortsätta",
  },
  email: { pt: "Email", en: "Email", sv: "E-post" },
  password: { pt: "Senha", en: "Password", sv: "Lösenord" },
  placeholderEmail: {
    pt: "seu@email.com",
    en: "you@email.com",
    sv: "din@epost.se",
  },
  enter: { pt: "Entrar", en: "Sign in", sv: "Logga in" },
  entering: { pt: "Entrando...", en: "Signing in...", sv: "Loggar in..." },
  noAccount: {
    pt: "Não tem uma conta?",
    en: "Don't have an account?",
    sv: "Har du inget konto?",
  },
  createAccount: {
    pt: "Criar conta",
    en: "Create account",
    sv: "Skapa konto",
  },
  loading: { pt: "Carregando...", en: "Loading...", sv: "Laddar..." },
};

export const tSignup = {
  title: {
    pt: "Criar conta",
    en: "Create account",
    sv: "Skapa konto",
  },
  subtitle: {
    pt: "Comece a controlar suas finanças hoje",
    en: "Start managing your finances today",
    sv: "Börja hantera din ekonomi idag",
  },
  fullName: {
    pt: "Nome completo",
    en: "Full name",
    sv: "Fullständigt namn",
  },
  placeholderName: {
    pt: "Seu nome",
    en: "Your name",
    sv: "Ditt namn",
  },
  email: { pt: "Email", en: "Email", sv: "E-post" },
  password: { pt: "Senha", en: "Password", sv: "Lösenord" },
  confirmPassword: {
    pt: "Confirmar senha",
    en: "Confirm password",
    sv: "Bekräfta lösenord",
  },
  create: { pt: "Criar conta", en: "Create account", sv: "Skapa konto" },
  creating: {
    pt: "Criando conta...",
    en: "Creating account...",
    sv: "Skapar konto...",
  },
  hasAccount: {
    pt: "Já tem uma conta?",
    en: "Already have an account?",
    sv: "Har du redan ett konto?",
  },
  doLogin: {
    pt: "Fazer login",
    en: "Log in",
    sv: "Logga in",
  },
};

export const tSidebarNav = {
  dashboard: {
    pt: "Dashboard",
    en: "Dashboard",
    sv: "Översikt",
  },
  accounts: {
    pt: "Contas",
    en: "Accounts",
    sv: "Konton",
  },
  transactions: {
    pt: "Transações",
    en: "Transactions",
    sv: "Transaktioner",
  },
  newTransaction: {
    pt: "Nova Transação",
    en: "New Transaction",
    sv: "Ny transaktion",
  },
  recurringBills: {
    pt: "Mensalidades",
    en: "Recurring bills",
    sv: "Återkommande kostnader",
  },
  telegram: {
    pt: "Telegram",
    en: "Telegram",
    sv: "Telegram",
  },
  export: {
    pt: "Exportar",
    en: "Export",
    sv: "Exportera",
  },
};

export const tSidebar = {
  logout: { pt: "Sair", en: "Log out", sv: "Logga ut" },
  user: { pt: "Usuário", en: "User", sv: "Användare" },
  language: { pt: "Idioma", en: "Language", sv: "Språk" },
  tagline: {
    pt: "Controle Financeiro",
    en: "Finance Control",
    sv: "Ekonomikontroll",
  },
};

// Dashboard Filters
export const tDashboardFilters = {
  title: { pt: "Filtros do Dashboard", en: "Dashboard Filters", sv: "Dashboardfilter" },
  clear: { pt: "Limpar", en: "Clear", sv: "Rensa" },
  collapse: { pt: "Recolher", en: "Collapse", sv: "Fäll ihop" },
  expand: { pt: "Expandir", en: "Expand", sv: "Expandera" },
  account: { pt: "Conta", en: "Account", sv: "Konto" },
  selectAccount: { pt: "Selecionar conta", en: "Select account", sv: "Välj konto" },
  allAccounts: { pt: "Todas as contas", en: "All accounts", sv: "Alla konton" },
  category: { pt: "Categoria", en: "Category", sv: "Kategori" },
  selectCategory: { pt: "Selecionar categoria", en: "Select category", sv: "Välj kategori" },
  allCategories: { pt: "Todas as categorias", en: "All categories", sv: "Alla kategorier" },
  period: { pt: "Período", en: "Period", sv: "Period" },
  selectPeriod: { pt: "Selecionar período", en: "Select period", sv: "Välj period" },
  type: { pt: "Tipo", en: "Type", sv: "Typ" },
  selectType: { pt: "Selecionar tipo", en: "Select type", sv: "Välj typ" },
  activeFilters: { pt: "Filtros Ativos:", en: "Active Filters:", sv: "Aktiva filter:" },
  accountLabel: { pt: "Conta:", en: "Account:", sv: "Konto:" },
  categoryLabel: { pt: "Categoria:", en: "Category:", sv: "Kategori:" },
  periodLabel: { pt: "Período:", en: "Period:", sv: "Period:" },
  typeLabel: { pt: "Tipo:", en: "Type:", sv: "Typ:" },
  periods: {
    currentMonth: { pt: "Este mês", en: "This month", sv: "Denna månad" },
    lastMonth: { pt: "Mês passado", en: "Last month", sv: "Förra månaden" },
    last3Months: { pt: "Últimos 3 meses", en: "Last 3 months", sv: "Senaste 3 månaderna" },
    last6Months: { pt: "Últimos 6 meses", en: "Last 6 months", sv: "Senaste 6 månaderna" },
    currentYear: { pt: "Este ano", en: "This year", sv: "Detta år" },
    customMonth: { pt: "Mês específico", en: "Specific month", sv: "Specifik månad" },
    all: { pt: "Todos os períodos", en: "All periods", sv: "Alla perioder" },
  },
  types: {
    all: { pt: "Todas", en: "All", sv: "Alla" },
    income: { pt: "Receitas", en: "Income", sv: "Inkomster" },
    expense: { pt: "Despesas", en: "Expenses", sv: "Utgifter" },
  },
  income: { pt: "Receita", en: "Income", sv: "Inkomst" },
  expense: { pt: "Despesa", en: "Expense", sv: "Utgift" },
};

// Financial Summary
export const tFinancialSummary = {
  title: { pt: "Resumo Financeiro", en: "Financial Summary", sv: "Ekonomisk översikt" },
  showValues: { pt: "Mostrar Valores", en: "Show Values", sv: "Visa värden" },
  hideValues: { pt: "Ocultar Valores", en: "Hide Values", sv: "Dölj värden" },
  income: { pt: "Receitas", en: "Income", sv: "Inkomster" },
  expenses: { pt: "Despesas", en: "Expenses", sv: "Utgifter" },
  balance: { pt: "Balanço", en: "Balance", sv: "Saldo" },
  totalAvailable: { pt: "Total disponível na conta", en: "Total available in account", sv: "Totalt tillgängligt på kontot" },
  positive: { pt: "Positivo", en: "Positive", sv: "Positivt" },
  negative: { pt: "Negativo", en: "Negative", sv: "Negativt" },
  periodSelected: { pt: "Período selecionado", en: "Selected period", sv: "Vald period" },
  periodThisMonth: { pt: "Este mês", en: "This month", sv: "Denna månad" },
  periodLastMonth: { pt: "Mês passado", en: "Last month", sv: "Förra månaden" },
  periodLast3Months: { pt: "Últimos 3 meses", en: "Last 3 months", sv: "Senaste 3 månaderna" },
  periodLast6Months: { pt: "Últimos 6 meses", en: "Last 6 months", sv: "Senaste 6 månaderna" },
  periodThisYear: { pt: "Este ano", en: "This year", sv: "Detta år" },
  periodAll: { pt: "Todos os períodos", en: "All periods", sv: "Alla perioder" },
  categories: { pt: "Categorias", en: "Categories", sv: "Kategorier" },
  transaction: { pt: "transação", en: "transaction", sv: "transaktion" },
  transactions: { pt: "transações", en: "transactions", sv: "transaktioner" },
  incomeType: { pt: "Receita", en: "Income", sv: "Inkomst" },
  expenseType: { pt: "Despesa", en: "Expense", sv: "Utgift" },
  stats: { pt: "Estatísticas", en: "Statistics", sv: "Statistik" },
  transactionsCount: { pt: "Transações", en: "Transactions", sv: "Transaktioner" },
  accountsCount: { pt: "Contas", en: "Accounts", sv: "Konton" },
  categoriesCount: { pt: "Categorias", en: "Categories", sv: "Kategorier" },
  status: { pt: "Status", en: "Status", sv: "Status" },
  transactionsFor: { pt: "Transações - ", en: "Transactions - ", sv: "Transaktioner - " },
  noCategory: { pt: "Sem categoria", en: "No category", sv: "Ingen kategori" },
  noDescription: { pt: "Sem descrição", en: "No description", sv: "Ingen beskrivning" },
  noAccount: { pt: "Sem conta", en: "No account", sv: "Inget konto" },
};

// Accounts page
export const tAccounts = {
  title: { pt: "Minhas Contas", en: "My Accounts", sv: "Mina konton" },
  recover: { pt: "Recuperar", en: "Recover", sv: "Återställ" },
  transfer: { pt: "Transferir", en: "Transfer", sv: "Överför" },
  newAccount: { pt: "Nova Conta", en: "New Account", sv: "Nytt konto" },
  consolidatedBalance: { pt: "Saldo Total Consolidado", en: "Consolidated Total Balance", sv: "Konsoliderat totalt saldo" },
  filters: { pt: "Filtros", en: "Filters", sv: "Filter" },
  show: { pt: "Mostrar", en: "Show", sv: "Visa" },
  totalBalance: { pt: "Saldo Total", en: "Total Balance", sv: "Totalt saldo" },
  totalIncome: { pt: "Total Receitas", en: "Total Income", sv: "Totala inkomster" },
  totalExpenses: { pt: "Total Despesas", en: "Total Expenses", sv: "Totala utgifter" },
  allAccounts: { pt: "Todas as contas", en: "All accounts", sv: "Alla konton" },
  accountCount: { pt: "conta(s)", en: "account(s)", sv: "konto(n)" },
  transferBetween: { pt: "Transferência entre Contas", en: "Transfer between Accounts", sv: "Överföring mellan konton" },
  originAccount: { pt: "Conta de Origem", en: "Origin Account", sv: "Ursprungskonto" },
  destinationAccount: { pt: "Conta de Destino", en: "Destination Account", sv: "Målkonto" },
  selectOrigin: { pt: "Selecione a conta de origem", en: "Select origin account", sv: "Välj ursprungskonto" },
  selectDestination: { pt: "Selecione a conta de destino", en: "Select destination account", sv: "Välj målkonto" },
  transferValue: { pt: "Valor da Transferência", en: "Transfer Value", sv: "Överföringsbelopp" },
  descriptionOptional: { pt: "Descrição (Opcional)", en: "Description (Optional)", sv: "Beskrivning (valfritt)" },
  selectedAccounts: { pt: "Contas selecionadas", en: "Selected accounts", sv: "Valda konton" },
  filterBy: { pt: "Filtrar por Contas:", en: "Filter by Accounts:", sv: "Filtrera på konton:" },
  clearFilters: { pt: "Limpar Filtros", en: "Clear Filters", sv: "Rensa filter" },
  showingBalance: { pt: "Mostrando saldo de", en: "Showing balance of", sv: "Visar saldo för" },
  noAccountsFound: { pt: "Nenhuma conta encontrada", en: "No accounts found", sv: "Inga konton hittades" },
  createFirst: { pt: "Crie sua primeira conta para começar a controlar suas finanças", en: "Create your first account to start managing your finances", sv: "Skapa ditt första konto för att börja hantera din ekonomi" },
  createFirstAccount: { pt: "Criar Primeira Conta", en: "Create First Account", sv: "Skapa första konto" },
  editMonthlyGoal: { pt: "Editar Meta Mensal", en: "Edit Monthly Goal", sv: "Redigera månadsmål" },
  noAccountFound: { pt: "Nenhuma conta encontrada", en: "No account found", sv: "Inget konto hittades" },
  transferring: { pt: "Transferindo...", en: "Transferring...", sv: "Överför..." },
  doTransfer: { pt: "Realizar Transferência", en: "Make Transfer", sv: "Utför överföring" },
  transferSummary: { pt: "Resumo da Transferência", en: "Transfer Summary", sv: "Överföringssammanfattning" },
  from: { pt: "de", en: "from", sv: "från" },
  to: { pt: "para", en: "to", sv: "till" },
  accountBalances: { pt: "Saldos das Contas", en: "Account Balances", sv: "Kontosaldon" },
  loadingTransfers: { pt: "Carregando transferências...", en: "Loading transfers...", sv: "Laddar överföringar..." },
  transactionsCount: { pt: "transações", en: "transactions", sv: "transaktioner" },
  loadingAccounts: { pt: "Carregando contas...", en: "Loading accounts...", sv: "Laddar konton..." },
  showLabel: { pt: "Mostrar", en: "Show", sv: "Visa" },
  hideLabel: { pt: "Ocultar", en: "Hide", sv: "Dölj" },
  selectedCount: { pt: "selecionada(s)", en: "selected", sv: "valda" },
};

// Dashboard
export const tDashboard = {
  hello: { pt: "Olá", en: "Hello", sv: "Hej" },
  refresh: { pt: "Atualizar", en: "Refresh", sv: "Uppdatera" },
  monthlySpending: { pt: "Gastos Mensais", en: "Monthly Spending", sv: "Månadsutgifter" },
  spendingByCategory: { pt: "Gastos por Categoria", en: "Spending by Category", sv: "Utgifter per kategori" },
  incomeByCategory: { pt: "Ganhos por Categoria", en: "Income by Category", sv: "Inkomster per kategori" },
  avgMonthlySpending: { pt: "Gasto médio mensal", en: "Average monthly spending", sv: "Genomsnittliga månadsutgifter" },
};

// Account Quick Stats (account card summary)
export const tAccountQuickStats = {
  income: { pt: "Receitas", en: "Income", sv: "Inkomster" },
  expenses: { pt: "Despesas", en: "Expenses", sv: "Utgifter" },
  currentBalance: { pt: "Saldo Atual", en: "Current Balance", sv: "Aktuellt saldo" },
  monthlyGoal: { pt: "Meta Mensal", en: "Monthly Goal", sv: "Månadsmål" },
  progress: { pt: "Progresso", en: "Progress", sv: "Framsteg" },
  remaining: { pt: "Restante", en: "Remaining", sv: "Återstår" },
  alertAt: { pt: "Alerta em", en: "Alert at", sv: "Varning vid" },
  onTrack: { pt: "No prazo", en: "On track", sv: "I rätt tid" },
  alert: { pt: "Atenção", en: "Attention", sv: "Uppmärksamhet" },
  overBudget: { pt: "Acima do orçamento", en: "Over budget", sv: "Över budget" },
  youSpent: { pt: "Você gastou", en: "You spent", sv: "Du spenderade" },
  overTheGoal: { pt: "acima da meta", en: "over the goal", sv: "över målet" },
  closeToLimit: { pt: "Você está próximo do limite. Restam", en: "You're close to the limit. Remaining", sv: "Du är nära gränsen. Återstår" },
  onTrackRemaining: { pt: "Você está no prazo. Restam", en: "You're on track. Remaining", sv: "Du är i rätt tid. Återstår" },
  toSpend: { pt: "para gastar", en: "to spend", sv: "att spendera" },
  noGoalDefined: { pt: "Sem meta definida", en: "No goal defined", sv: "Inget mål definierat" },
  unavailable: { pt: "Indisponível", en: "Unavailable", sv: "Ej tillgänglig" },
  configureGoalMessage: { pt: "Configure uma meta mensal nas configurações da conta", en: "Set a monthly goal in account settings", sv: "Ställ in ett månadsmål i kontoinställningarna" },
  transactionsCount: { pt: "transações", en: "transactions", sv: "transaktioner" },
  thisMonth: { pt: "Este mês", en: "This month", sv: "Denna månad" },
  access: { pt: "Acessar", en: "Access", sv: "Öppna" },
  configure: { pt: "Configurar", en: "Configure", sv: "Konfigurera" },
};

// Account card (accounts page)
export const tAccountCard = {
  balance: { pt: "Saldo:", en: "Balance:", sv: "Saldo:" },
  income: { pt: "Receitas:", en: "Income:", sv: "Inkomster:" },
  expenses: { pt: "Despesas:", en: "Expenses:", sv: "Utgifter:" },
  currency: { pt: "Moeda:", en: "Currency:", sv: "Valuta:" },
  transactions: { pt: "Transações:", en: "Transactions:", sv: "Transaktioner:" },
  transfer: { pt: "Transferir", en: "Transfer", sv: "Överför" },
  pixTed: { pt: "PIX/TED", en: "PIX/TED", sv: "PIX/TED" },
  editMonthlyGoal: { pt: "Editar Meta Mensal", en: "Edit Monthly Goal", sv: "Redigera månadsmål" },
  viewGoalsHistory: { pt: "Ver metas (histórico)", en: "View goals (history)", sv: "Visa mål (historik)" },
  shared: { pt: "(Compartilhada)", en: "(Shared)", sv: "(Delad)" },
  goalSettings: { pt: "Configurações de Meta - ", en: "Goal Settings - ", sv: "Målinställningar - " },
};

// Spending Forecast
export const tSpendingForecast = {
  title: { pt: "Previsão de Gastos - ", en: "Spending Forecast - ", sv: "Utgiftsprognos - " },
  updateForecast: { pt: "Atualizar Previsão", en: "Update Forecast", sv: "Uppdatera prognos" },
  updating: { pt: "Atualizando...", en: "Updating...", sv: "Uppdaterar..." },
  updatedAt: { pt: "Atualizado em:", en: "Updated at:", sv: "Uppdaterad:" },
  budgetStatus: { pt: "Status do Orçamento", en: "Budget Status", sv: "Budgetstatus" },
  onTrack: { pt: "No prazo", en: "On track", sv: "I rätt tid" },
  overBudget: { pt: "Acima do orçamento", en: "Over budget", sv: "Över budget" },
  underBudget: { pt: "Abaixo do orçamento", en: "Under budget", sv: "Under budget" },
  noBudget: { pt: "Orçamento não definido", en: "Budget not defined", sv: "Budget inte definierad" },
  attentionPercent: { pt: "Atenção:", en: "Attention:", sv: "Uppmärksamhet:" },
  confidence: { pt: "Confiança", en: "Confidence", sv: "Tillförlitlighet" },
  highConfidence: { pt: "Alta confiança", en: "High confidence", sv: "Hög tillförlitlighet" },
  mediumConfidence: { pt: "Média confiança", en: "Medium confidence", sv: "Medel tillförlitlighet" },
  lowConfidence: { pt: "Baixa confiança", en: "Low confidence", sv: "Låg tillförlitlighet" },
  unavailable: { pt: "Indisponível", en: "Unavailable", sv: "Ej tillgänglig" },
  monthlyBudget: { pt: "Orçamento Mensal", en: "Monthly Budget", sv: "Månadsbudget" },
  estimatedSpending: { pt: "Gasto Estimado/Mês", en: "Estimated Spending/Month", sv: "Uppskattade utgifter/månad" },
  definedByYou: { pt: "Valor definido por você", en: "Value defined by you", sv: "Värde definierat av dig" },
  basedOn6Months: { pt: "Baseado nos últimos 6 meses", en: "Based on last 6 months", sv: "Baserat på senaste 6 månaderna" },
  spendingThisWeek: { pt: "Gasto Esta Semana", en: "Spending This Week", sv: "Utgifter denna vecka" },
  estimate: { pt: "Estimativa:", en: "Estimate:", sv: "Uppskattning:" },
  remainingThisMonth: { pt: "Restante Este Mês", en: "Remaining This Month", sv: "Återstår denna månad" },
  daysRemaining: { pt: "dias restantes", en: "days remaining", sv: "dagar kvar" },
  reservedForBills: { pt: "reservado para contas fixas", en: "reserved for fixed bills", sv: "reserverat för fasta räkningar" },
  monthlyProjection: { pt: "Projeção Mensal", en: "Monthly Projection", sv: "Månadsprognos" },
  basedOnCurrentPace: { pt: "Baseado no ritmo atual", en: "Based on current pace", sv: "Baserat på nuvarande takt" },
  monthlyProgress: { pt: "Progresso do Mês", en: "Monthly Progress", sv: "Månadsframsteg" },
  currentSpending: { pt: "Gasto atual:", en: "Current spending:", sv: "Nuvarande utgifter:" },
  monthlyGoal: { pt: "Meta mensal:", en: "Monthly goal:", sv: "Månadsmål:" },
  defineBudgetMessage: { pt: "Defina um orçamento mensal nas configurações para ver o progresso.", en: "Define a monthly budget in settings to see progress.", sv: "Definiera en månadsbudget i inställningarna för att se framsteg." },
  attention: { pt: "Atenção", en: "Attention", sv: "Uppmärksamhet" },
  overBudgetMessage: { pt: "Você ultrapassou o orçamento mensal em", en: "You exceeded the monthly budget by", sv: "Du överskred månadsbudgeten med" },
  considerReviewing: { pt: "Considere revisar seus gastos.", en: "Consider reviewing your spending.", sv: "Överväg att granska dina utgifter." },
  budgetAlert: { pt: "Alerta de Orçamento", en: "Budget Alert", sv: "Budgetvarning" },
  reachedPercent: { pt: "Você atingiu", en: "You reached", sv: "Du nådde" },
  ofBudget: { pt: "do seu orçamento. Ainda restam", en: "of your budget. Still remaining", sv: "av din budget. Återstår fortfarande" },
  forThisMonth: { pt: "para este mês.", en: "for this month.", sv: "för denna månad." },
  goodWork: { pt: "Bom trabalho!", en: "Good job!", sv: "Bra jobbat!" },
  underBudgetMessage: { pt: "Você está gastando abaixo de 70% do seu orçamento. Continue assim!", en: "You're spending below 70% of your budget. Keep it up!", sv: "Du spenderar under 70% av din budget. Fortsätt så!" },
};

// Transactions page
export const tTransactions = {
  title: { pt: "Transações", en: "Transactions", sv: "Transaktioner" },
  newTransaction: { pt: "Nova Transação", en: "New Transaction", sv: "Ny transaktion" },
  multipleTransactions: { pt: "Múltiplas Transações", en: "Multiple Transactions", sv: "Flera transaktioner" },
  importCSV: { pt: "Importar CSV", en: "Import CSV", sv: "Importera CSV" },
  history: { pt: "Histórico de Transações", en: "Transaction History", sv: "Transaktionshistorik" },
  allAccounts: { pt: "Todas as contas", en: "All accounts", sv: "Alla konton" },
  allCategories: { pt: "Todas as categorias", en: "All categories", sv: "Alla kategorier" },
  allPeriods: { pt: "Todos os períodos", en: "All periods", sv: "Alla perioder" },
  allTypes: { pt: "Todos os tipos", en: "All types", sv: "Alla typer" },
  searchPlaceholder: { pt: "Buscar por descrição, categoria, conta ou valor...", en: "Search by description, category, account or amount...", sv: "Sök efter beskrivning, kategori, konto eller belopp..." },
  applyFilters: { pt: "Aplicar Filtros", en: "Apply Filters", sv: "Tillämpa filter" },
  clear: { pt: "Limpar", en: "Clear", sv: "Rensa" },
  found: { pt: "transações encontradas", en: "transactions found", sv: "transaktioner hittades" },
  foundOne: { pt: "transação encontrada", en: "transaction found", sv: "transaktion hittades" },
  noCategory: { pt: "Sem categoria", en: "No category", sv: "Ingen kategori" },
  allUsers: { pt: "Todos os usuários", en: "All users", sv: "Alla användare" },
  clearSearch: { pt: "Limpar busca", en: "Clear search", sv: "Rensa sökning" },
  incomeType: { pt: "Entradas", en: "Income", sv: "Inkomster" },
  expenseType: { pt: "Saídas", en: "Expenses", sv: "Utgifter" },
  noTransactionsFound: { pt: "Nenhuma transação encontrada", en: "No transactions found", sv: "Inga transaktioner hittades" },
  selectMonth: { pt: "Selecione o mês", en: "Select month", sv: "Välj månad" },
};

// Account Forecast Settings (modal)
export const tAccountForecastSettings = {
  title: { pt: "Configurações de Previsão - ", en: "Forecast Settings - ", sv: "Prognosinställningar - " },
  monthlyBudget: { pt: "Orçamento Mensal", en: "Monthly Budget", sv: "Månadsbudget" },
  notDefined: { pt: "Não definido", en: "Not defined", sv: "Inte definierad" },
  fixedBudget: { pt: "Orçamento fixo", en: "Fixed budget", sv: "Fast budget" },
  flexibleBudget: { pt: "Orçamento flexível", en: "Flexible budget", sv: "Flexibelt budget" },
  alertAt: { pt: "Alerta em", en: "Alert at", sv: "Varning vid" },
  notificationsActive: { pt: "Notificações ativas", en: "Active notifications", sv: "Aktiva notifieringar" },
  notificationsDisabled: { pt: "Notificações desativadas", en: "Notifications disabled", sv: "Notifieringar inaktiverade" },
  autoAdjust: { pt: "Ajuste Automático", en: "Automatic Adjustment", sv: "Automatisk justering" },
  enabled: { pt: "Ativado", en: "Enabled", sv: "Aktiverad" },
  disabled: { pt: "Desativado", en: "Disabled", sv: "Inaktiverad" },
  editSettings: { pt: "Editar Configurações", en: "Edit Settings", sv: "Redigera inställningar" },
  howItWorks: { pt: "Como Funciona", en: "How it Works", sv: "Så fungerar det" },
  fixedBudgetDesc: { pt: "Usa o valor definido como meta mensal", en: "Uses the defined value as monthly goal", sv: "Använder det definierade värdet som månadsmål" },
  flexibleBudgetDesc: { pt: "Calcula automaticamente baseado no histórico", en: "Calculates automatically based on history", sv: "Beräknas automatiskt baserat på historik" },
  autoAdjustDesc: { pt: "Atualiza estimativas conforme novos dados", en: "Updates estimates according to new data", sv: "Uppdaterar uppskattningar enligt nya data" },
  alerts: { pt: "Alertas", en: "Alerts", sv: "Varningar" },
  alertsDesc: { pt: "Notifica quando atingir o percentual definido", en: "Notifies when reaching the defined percentage", sv: "Meddelar när den definierade procenten nås" },
  monthlyBudgetKr: { pt: "Orçamento Mensal (kr)", en: "Monthly Budget (kr)", sv: "Månadsbudget (kr)" },
  leaveEmpty: { pt: "Deixe vazio para usar estimativa automática", en: "Leave empty to use automatic estimate", sv: "Lämna tomt för automatisk uppskattning" },
  alertAtPercent: { pt: "Alerta em (%)", en: "Alert at (%)", sv: "Varning vid (%)" },
  whenToAlert: { pt: "Quando receber alerta de gastos", en: "When to receive spending alert", sv: "När du ska få utgiftsvarning" },
  budgetType: { pt: "Tipo de Orçamento", en: "Budget Type", sv: "Budgettyp" },
  fixedBudgetOption: { pt: "Fixo - Valor definido", en: "Fixed - Defined Value", sv: "Fast - Definierat värde" },
  flexibleBudgetOption: { pt: "Flexível - Baseado em histórico", en: "Flexible - Based on history", sv: "Flexibel - Baserat på historik" },
  adjustEstimates: { pt: "Ajustar estimativas baseado no histórico", en: "Adjust estimates based on history", sv: "Justera uppskattningar baserat på historik" },
  receiveAlerts: { pt: "Receber alertas de gastos", en: "Receive spending alerts", sv: "Ta emot utgiftsvarningar" },
  save: { pt: "Salvar", en: "Save", sv: "Spara" },
  saving: { pt: "Salvando...", en: "Saving...", sv: "Sparar..." },
  cancel: { pt: "Cancelar", en: "Cancel", sv: "Avbryt" },
  notifications: { pt: "Notificações", en: "Notifications", sv: "Notifieringar" },
};

// New Transaction page
export const tNewTransaction = {
  title: { pt: "Nova Transação", en: "New Transaction", sv: "Ny transaktion" },
  subtitle: { pt: "Adicione uma entrada ou saída", en: "Add an income or expense", sv: "Lägg till en inkomst eller utgift" },
  details: { pt: "Detalhes da Transação", en: "Transaction Details", sv: "Transaktionsdetaljer" },
  type: { pt: "Tipo de Transação", en: "Transaction Type", sv: "Transaktionstyp" },
  income: { pt: "Entrada", en: "Income", sv: "Inkomst" },
  expense: { pt: "Saída", en: "Expense", sv: "Utgift" },
  value: { pt: "Valor (SEK)", en: "Value (SEK)", sv: "Belopp (SEK)" },
  category: { pt: "Categoria", en: "Category", sv: "Kategori" },
  account: { pt: "Conta", en: "Account", sv: "Konto" },
  mainAccount: { pt: "Conta Principal", en: "Main Account", sv: "Huvudkonto" },
  date: { pt: "Data", en: "Date", sv: "Datum" },
  description: { pt: "Descrição (opcional)", en: "Description (optional)", sv: "Beskrivning (valfritt)" },
  descriptionPlaceholder: { pt: "Ex: Compras do supermercado", en: "Ex: Supermarket purchases", sv: "T.ex. Livsmedelsinköp" },
  create: { pt: "Criar Transação", en: "Create Transaction", sv: "Skapa transaktion" },
  saving: { pt: "Salvando...", en: "Saving...", sv: "Sparar..." },
  selectAccount: { pt: "Selecione uma conta", en: "Select an account", sv: "Välj ett konto" },
};

// Category names (DB stores Portuguese; we translate for display)
const normalizeForKey = (s: string) =>
  s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");

export const tCategoryNames: Record<string, TranslationDict> = {
  [normalizeForKey("Alimentação")]: { pt: "Alimentação", en: "Food", sv: "Mat" },
  [normalizeForKey("Transporte")]: { pt: "Transporte", en: "Transport", sv: "Transport" },
  [normalizeForKey("Moradia")]: { pt: "Moradia", en: "Housing", sv: "Bostad" },
  [normalizeForKey("Saúde")]: { pt: "Saúde", en: "Health", sv: "Hälsa" },
  [normalizeForKey("Educação")]: { pt: "Educação", en: "Education", sv: "Utbildning" },
  [normalizeForKey("Lazer")]: { pt: "Lazer", en: "Leisure", sv: "Fritid" },
  [normalizeForKey("Roupas")]: { pt: "Roupas", en: "Clothes", sv: "Kläder" },
  [normalizeForKey("Outros")]: { pt: "Outros", en: "Others", sv: "Övrigt" },
  [normalizeForKey("Balanço")]: { pt: "Balanço", en: "Balance", sv: "Saldo" },
  [normalizeForKey("Dívidas")]: { pt: "Dívidas", en: "Debts", sv: "Skulder" },
  [normalizeForKey("Mensalidades")]: { pt: "Mensalidades", en: "Monthly fees", sv: "Månadsavgifter" },
  [normalizeForKey("Salário")]: { pt: "Salário", en: "Salary", sv: "Lön" },
  [normalizeForKey("Freelance")]: { pt: "Freelance", en: "Freelance", sv: "Frilans" },
  [normalizeForKey("Investimentos")]: { pt: "Investimentos", en: "Investments", sv: "Investeringar" },
};

export function getCategoryDisplayName(name: string | null | undefined, language: LanguageCode): string {
  if (!name) return "";
  const key = normalizeForKey(name);
  const trans = tCategoryNames[key];
  return trans ? trans[language] : name;
}

// Account Goals History Dialog
export const tAccountGoalsHistory = {
  title: { pt: "Histórico de metas - ", en: "Goal history - ", sv: "Målhistorik - " },
  description: {
    pt: "Relação entre o gasto mensal da conta e a meta que estava definida naquele mês (quando houver registro na tabela de metas mensais).",
    en: "Relation between the account's monthly spending and the goal defined for that month (when recorded in the monthly goals table).",
    sv: "Relation mellan kontots månadsutgifter och målet som var definierat den månaden (när det finns i tabellen för månadsmål).",
  },
  month: { pt: "Mês", en: "Month", sv: "Månad" },
  spendingInMonth: { pt: "Gasto no mês", en: "Spending in month", sv: "Utgifter i månaden" },
  monthlyGoalOfMonth: { pt: "Meta mensal do mês", en: "Monthly goal for month", sv: "Månadsmål för månaden" },
  percentOfGoal: { pt: "% da meta", en: "% of goal", sv: "% av mål" },
  noGoal: { pt: "Sem meta", en: "No goal", sv: "Inget mål" },
  loading: { pt: "Carregando histórico...", en: "Loading history...", sv: "Laddar historik..." },
  noDataYet: {
    pt: "Ainda não há dados suficientes para montar o histórico desta conta.",
    en: "Not enough data yet to build this account's history.",
    sv: "Inte tillräckligt med data ännu för att bygga denna kontos historik.",
  },
};

// Account Interdependency
export const tAccountInterdependency = {
  title: { pt: "Interdependência de Contas", en: "Account Interdependency", sv: "Kontointerdependens" },
  accountSummary: { pt: "Resumo da Conta", en: "Account Summary", sv: "Kontosammanfattning" },
  mainAccountNotFound: {
    pt: "Conta principal não encontrada. Crie uma conta do tipo \"personal\" com \"principal\" no nome para ativar a interdependência.",
    en: "Main account not found. Create a \"personal\" account with \"principal\" in the name to enable interdependency.",
    sv: "Huvudkonto hittades inte. Skapa ett \"personal\"-konto med \"principal\" i namnet för att aktivera interdependens.",
  },
  totalValue: { pt: "Valor Total", en: "Total Value", sv: "Totalt värde" },
  totalAllocated: { pt: "Total Alocado", en: "Total Allocated", sv: "Totalt allokerat" },
  remaining: { pt: "Restante", en: "Remaining", sv: "Återstående" },
};

// Telegram Settings page
export const tTelegram = {
  title: { pt: "Configurações do Telegram", en: "Telegram Settings", sv: "Telegram-inställningar" },
  subtitle: { pt: "Gerencie sua conexão com o bot do Telegram", en: "Manage your connection with the Telegram bot", sv: "Hantera din anslutning med Telegram-botten" },
  connectionStatus: { pt: "Status da Conexão", en: "Connection Status", sv: "Anslutningsstatus" },
  connectDescription: { pt: "Conecte sua conta do Telegram para registrar transações rapidamente", en: "Connect your Telegram account to register transactions quickly", sv: "Anslut ditt Telegram-konto för att registrera transaktioner snabbt" },
  accountConnected: { pt: "Conta conectada", en: "Account connected", sv: "Konto anslutet" },
  telegramLinked: { pt: "Seu Telegram está vinculado ao FinControl", en: "Your Telegram is linked to FinControl", sv: "Ditt Telegram är kopplat till FinControl" },
  howToUse: { pt: "Como usar:", en: "How to use:", sv: "Så använder du:" },
  openTelegram: { pt: "Abra o Telegram e procure pelo bot do FinControl", en: "Open Telegram and search for the FinControl bot", sv: "Öppna Telegram och sök efter FinControl-botten" },
  useStart: { pt: "Use /start para iniciar", en: "Use /start to start", sv: "Använd /start för att starta" },
  useGasto: { pt: "Use /gasto [valor] para registrar despesas", en: "Use /gasto [value] to register expenses", sv: "Använd /gasto [belopp] för att registrera utgifter" },
  useReceita: { pt: "Use /receita [valor] para registrar receitas", en: "Use /receita [value] to register income", sv: "Använd /receita [belopp] för att registrera inkomster" },
  useHelp: { pt: "Use /help para ver todos os comandos", en: "Use /help to see all commands", sv: "Använd /help för att se alla kommandon" },
  disconnect: { pt: "Desconectar Telegram", en: "Disconnect Telegram", sv: "Koppla från Telegram" },
  disconnecting: { pt: "Desconectando...", en: "Disconnecting...", sv: "Kopplar från..." },
  loading: { pt: "Carregando configurações", en: "Loading settings", sv: "Laddar inställningar" },
};

// Export page
export const tExport = {
  title: { pt: "Exportar Dados", en: "Export Data", sv: "Exportera data" },
  subtitle: { pt: "Baixe suas transações em diferentes formatos", en: "Download your transactions in different formats", sv: "Ladda ner dina transaktioner i olika format" },
  exportCsv: { pt: "Exportar como CSV", en: "Export as CSV", sv: "Exportera som CSV" },
  exportCsvDesc: { pt: "Baixe suas transações em formato CSV para usar em planilhas", en: "Download your transactions in CSV format for spreadsheets", sv: "Ladda ner dina transaktioner i CSV-format för kalkylblad" },
  exportCsvBtn: { pt: "Exportar CSV", en: "Export CSV", sv: "Exportera CSV" },
  exportExcel: { pt: "Exportar como Excel", en: "Export as Excel", sv: "Exportera som Excel" },
  exportExcelDesc: { pt: "Planilha por mês com totais para análise", en: "Monthly spreadsheet with totals for analysis", sv: "Månadsvis kalkylblad med summor för analys" },
  exportExcelBtn: { pt: "Exportar Excel", en: "Export Excel", sv: "Exportera Excel" },
  exportHistory: { pt: "Histórico de Exportações", en: "Export History", sv: "Exporthistorik" },
  recentExports: { pt: "Suas últimas exportações", en: "Your recent exports", sv: "Dina senaste exportfiler" },
};
