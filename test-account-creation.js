// Test script to verify account creation
// Run this in browser console on the accounts/new page

async function testAccountCreation() {
  const supabase = createClient();

  try {
    // Test 1: Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("User:", user);
    if (authError) throw authError;

    // Test 2: Try to create a test account
    const testAccount = {
      name: "Test Account",
      type: "personal",
      color: "#3B82F6",
      description: "Test description",
    };

    console.log("Creating test account:", testAccount);

    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .insert(testAccount)
      .select()
      .single();

    if (accountError) {
      console.error("Account creation error:", accountError);
      return;
    }

    console.log("Account created successfully:", account);

    // Test 3: Add user as member
    const { error: memberError } = await supabase
      .from("account_members")
      .insert({
        account_id: account.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      console.error("Member creation error:", memberError);
      return;
    }

    console.log("Member added successfully");

    // Clean up: Delete test account
    await supabase.from("accounts").delete().eq("id", account.id);
    console.log("Test account deleted");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testAccountCreation();
