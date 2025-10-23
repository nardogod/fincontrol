// Debug script for chat transactions visibility
// Run this in browser console on the dashboard page

async function debugChatTransactions() {
  const supabase = createClient();

  try {
    console.log("🔍 INICIANDO DEBUG DE TRANSAÇÕES NO CHAT");
    console.log("=".repeat(50));

    // 1. Check current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("1. Current user:", user);
    if (userError) {
      console.error("❌ User error:", userError);
      return;
    }

    // 2. Check all accounts (no filters)
    console.log("\n2. Checking ALL accounts...");
    const { data: allAccounts, error: allAccountsError } = await supabase
      .from("accounts")
      .select("*");

    console.log("All accounts in database:", allAccounts);
    if (allAccountsError)
      console.error("All accounts error:", allAccountsError);

    // 3. Check user's accounts
    console.log("\n3. Checking user's accounts...");
    const { data: userAccounts, error: userAccountsError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id);

    console.log("User's accounts:", userAccounts);
    if (userAccountsError)
      console.error("User accounts error:", userAccountsError);

    // 4. Check all transactions (no filters)
    console.log("\n4. Checking ALL transactions...");
    const { data: allTransactions, error: allTransactionsError } =
      await supabase
        .from("transactions")
        .select(
          `
        id, type, amount, description, transaction_date, created_via,
        category:categories(name, icon),
        account:accounts(name, icon),
        user:users(full_name)
      `
        )
        .order("transaction_date", { ascending: false })
        .limit(20);

    console.log("All transactions in database:", allTransactions);
    if (allTransactionsError)
      console.error("All transactions error:", allTransactionsError);

    // 5. Check transactions with account filter
    if (userAccounts && userAccounts.length > 0) {
      console.log("\n5. Checking transactions with account filter...");
      const accountIds = userAccounts.map((acc) => acc.id);
      console.log("Account IDs to filter:", accountIds);

      const { data: filteredTransactions, error: filteredError } =
        await supabase
          .from("transactions")
          .select(
            `
          id, type, amount, description, transaction_date, created_via,
          category:categories(name, icon),
          account:accounts(name, icon),
          user:users(full_name)
        `
          )
          .in("account_id", accountIds)
          .order("transaction_date", { ascending: false })
          .limit(10);

      console.log("Filtered transactions:", filteredTransactions);
      if (filteredError)
        console.error("Filtered transactions error:", filteredError);
    }

    // 6. Check RLS policies
    console.log("\n6. Testing RLS access...");
    const { data: rlsTest, error: rlsError } = await supabase
      .from("transactions")
      .select("count")
      .limit(1);

    console.log("RLS test result:", rlsTest);
    if (rlsError) console.error("RLS error:", rlsError);

    // 7. Check if transactions exist in specific accounts
    if (allAccounts && allAccounts.length > 0) {
      console.log("\n7. Checking transactions per account...");
      for (const account of allAccounts.slice(0, 3)) {
        // Check first 3 accounts
        const { data: accountTransactions, error: accountError } =
          await supabase
            .from("transactions")
            .select(
              `
            id, type, amount, description, transaction_date,
            category:categories(name, icon),
            account:accounts(name, icon)
          `
            )
            .eq("account_id", account.id)
            .order("transaction_date", { ascending: false })
            .limit(5);

        console.log(
          `Transactions for account "${account.name}" (${account.id}):`,
          accountTransactions
        );
        if (accountError)
          console.error(`Error for account ${account.name}:`, accountError);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("🔍 DEBUG COMPLETO!");
  } catch (error) {
    console.error("❌ Debug failed:", error);
  }
}

// Run the debug
debugChatTransactions();
