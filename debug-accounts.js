// Debug script to check accounts
// Run this in browser console on the accounts page

async function debugAccounts() {
  const supabase = createClient();

  try {
    // Check user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("User:", user);
    if (userError) throw userError;

    // Check all accounts (simple query)
    const { data: allAccounts, error: allError } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("All accounts:", allAccounts);
    if (allError) console.error("All accounts error:", allError);

    // Check user's accounts
    const { data: userAccounts, error: userError2 } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    console.log("User accounts:", userAccounts);
    if (userError2) console.error("User accounts error:", userError2);

    // Check account members
    const { data: members, error: membersError } = await supabase
      .from("account_members")
      .select("*")
      .eq("user_id", user.id);

    console.log("Account members:", members);
    if (membersError) console.error("Members error:", membersError);

    // Check complex query
    const { data: complexAccounts, error: complexError } = await supabase
      .from("accounts")
      .select(
        `
        *,
        account_members(
          user_id,
          role,
          user:users(full_name, email)
        )
      `
      )
      .or(`user_id.eq.${user.id},account_members.user_id.eq.${user.id}`)
      .order("name");

    console.log("Complex accounts:", complexAccounts);
    if (complexError) console.error("Complex accounts error:", complexError);
  } catch (error) {
    console.error("Debug failed:", error);
  }
}

// Run the debug
debugAccounts();
