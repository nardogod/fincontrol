// Debug script for transactions visibility
// Run this in browser console on the transactions page

async function debugTransactions() {
  const supabase = createClient();

  try {
    // Check current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("Current user:", user);
    if (userError) throw userError;

    // Check user accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    console.log("User accounts:", accounts);
    if (accountsError) console.error("Accounts error:", accountsError);

    if (!accounts || accounts.length === 0) {
      console.log("❌ No accounts found for user");
      return;
    }

    // Check transactions for each account
    for (const account of accounts) {
      console.log(
        `\n--- Checking account: ${account.name} (${account.id}) ---`
      );

      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select(
          `
          id, type, amount, description, transaction_date, created_via,
          category:categories(name, icon),
          account:accounts(name, icon),
          user:users(full_name)
        `
        )
        .eq("account_id", account.id)
        .order("transaction_date", { ascending: false });

      console.log(`Transactions for ${account.name}:`, transactions);
      if (transactionsError)
        console.error("Transactions error:", transactionsError);
    }

    // Check all transactions (without account filter)
    console.log("\n--- All transactions (no filter) ---");
    const { data: allTransactions, error: allError } = await supabase
      .from("transactions")
      .select(
        `
        id, type, amount, description, transaction_date, created_via,
        category:categories(name, icon),
        account:accounts(name, icon),
        user:users(full_name)
      `
      )
      .order("transaction_date", { ascending: false });

    console.log("All transactions:", allTransactions);
    if (allError) console.error("All transactions error:", allError);
  } catch (error) {
    console.error("Debug failed:", error);
  }
}

// Run the debug
debugTransactions();
