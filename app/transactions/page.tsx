import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/app/lib/supabase/server";
import TransactionsCard from "@/app/components/TransactionsCard";
import SidebarWrapper from "@/app/components/SidebarWrapper";
import TransactionsPageHeader from "@/app/components/TransactionsPageHeader";

interface TransactionsPageProps {
  searchParams: {
    page?: string;
    account?: string;
    category?: string;
    type?: string;
  };
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const page = parseInt(searchParams.page || "1");
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  // Buscar contas do usuário (próprias)
  const { data: userAccounts, error: userAccountsError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Type assertion para contas do usuário
  const typedUserAccounts = (userAccounts as any[]) || [];

  // Buscar contas compartilhadas (onde o usuário é membro)
  const { data: sharedAccounts, error: sharedAccountsError } = await supabase
    .from("account_members")
    .select(
      `
      *,
      account:accounts(
        id,
        name,
        description,
        icon,
        type,
        color,
        is_active,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Combinar contas próprias e compartilhadas, evitando duplicatas
  const userAccountIds = new Set(typedUserAccounts.map((acc) => acc.id));
  const sharedAccountData =
    (sharedAccounts as any[])?.map((member) => ({
      ...member.account,
      is_shared: true,
      member_role: member.role,
    })) || [];

  // Filtrar contas compartilhadas que não são próprias
  const uniqueSharedAccounts = sharedAccountData.filter(
    (acc) => !userAccountIds.has(acc.id)
  );

  const accounts = [...typedUserAccounts, ...uniqueSharedAccounts];

  console.log("🔍 Debug detalhado das contas (página transactions):");
  console.log("- Contas próprias:", userAccounts?.length || 0);
  console.log(
    "- Contas compartilhadas encontradas:",
    sharedAccounts?.length || 0
  );
  console.log("- Contas compartilhadas únicas:", uniqueSharedAccounts.length);
  console.log("- Total de contas:", accounts.length);
  console.log(
    "- IDs das contas:",
    accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      is_shared: acc.is_shared,
    }))
  );

  console.log("Transactions page - Accounts query result:", {
    userAccounts,
    sharedAccounts,
    accounts,
    userAccountsError,
    sharedAccountsError,
  });
  console.log(
    "Transactions page - Number of accounts found:",
    accounts?.length || 0
  );

  // Build query
  const accountIds = accounts?.map((a) => a.id) || [];
  console.log("🔍 Account IDs para filtrar:", accountIds);

  let query = supabase.from("transactions").select(
    `
      *, 
      category:categories(*), 
      account:accounts(*)
    `,
    {
      count: "exact",
    }
  );

  // Aplicar filtro por contas do usuário
  if (accountIds.length > 0) {
    query = query.in("account_id", accountIds);
    console.log("✅ Aplicando filtro por contas:", accountIds);
  } else {
    console.log("⚠️ Nenhuma conta encontrada, buscando todas as transações");
  }

  // Apply filters
  if (searchParams.account) {
    query = query.eq("account_id", searchParams.account);
  }
  if (searchParams.category) {
    query = query.eq("category_id", searchParams.category);
  }
  if (searchParams.type) {
    query = query.eq("type", searchParams.type);
  }
  if ((searchParams as any).user) {
    query = query.eq("user_id", (searchParams as any).user);
  }

  // Pagination and ordering
  const {
    data: transactions,
    count,
    error: transactionsError,
  } = await query
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  console.log("Transactions page - Transactions query result:", {
    transactions,
    count,
    transactionsError,
  });
  console.log(
    "Transactions page - Number of transactions found:",
    transactions?.length || 0
  );

  // Debug adicional para entender o problema
  console.log("🔍 Debug detalhado:");
  console.log("- Account IDs:", accountIds);
  console.log("- Search params:", searchParams);
  console.log("- Query filters applied:", {
    account: searchParams.account,
    category: searchParams.category,
    type: searchParams.type,
  });

  // Debug adicional
  if (transactionsError) {
    console.error("❌ Erro na query de transações:", transactionsError);
  }

  // Buscar dados dos usuários separadamente
  const userIds = [
    ...new Set(transactions?.map((t) => t.user_id).filter(Boolean) || []),
  ];
  let usersData: Record<string, any> = {};

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    usersData =
      users?.reduce((acc: Record<string, any>, user) => {
        acc[user.id] = user;
        return acc;
      }, {}) || {};
  }

  // Adicionar dados do usuário às transações
  const transactionsWithUsers =
    transactions?.map((transaction) => ({
      ...transaction,
      user: usersData[transaction.user_id] || null,
    })) || [];

  if (transactionsWithUsers && transactionsWithUsers.length > 0) {
    console.log(
      "✅ Transações encontradas:",
      transactionsWithUsers.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        account: t.account?.name,
        category: t.category?.name,
        user: t.user?.full_name || t.user?.email,
        date: t.transaction_date,
      }))
    );
  } else {
    console.log("⚠️ Nenhuma transação retornada pela query");
  }

  // Fetch categories for filters
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(
      `is_default.eq.true,account_id.in.(${
        accounts?.map((a) => a.id).join(",") || "null"
      })`
    )
    .order("name");

  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  return (
    <SidebarWrapper user={user}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="border-b bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 lg:px-6">
            <TransactionsPageHeader
              count={count}
              accounts={accounts || []}
              categories={categories || []}
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 lg:px-6">
          <TransactionsCard
            transactions={transactionsWithUsers || []}
            accounts={accounts || []}
            categories={categories || []}
            currentPage={page}
            totalPages={totalPages}
          />
        </div>
      </div>
    </SidebarWrapper>
  );
}
