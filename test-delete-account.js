// Test script to verify account deletion
// Run this in browser console on the account settings page

async function testDeleteAccount() {
  const supabase = createClient();

  try {
    // Check user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("User:", user);
    if (userError) throw userError;

    // Get current account ID from URL
    const accountId = window.location.pathname.split("/")[3];
    console.log("Account ID:", accountId);

    // Check if user owns this account
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    console.log("Account:", account);
    if (accountError) throw accountError;

    // Check if user is owner
    const isOwner = account.user_id === user.id;
    console.log("Is owner:", isOwner);

    if (!isOwner) {
      console.error("User is not the owner of this account");
      return;
    }

    // Check account members
    const { data: members, error: membersError } = await supabase
      .from("account_members")
      .select("*")
      .eq("account_id", accountId);

    console.log("Account members:", members);
    if (membersError) console.error("Members error:", membersError);

    // Test delete account members first
    console.log("Testing delete account members...");
    const { error: deleteMembersError } = await supabase
      .from("account_members")
      .delete()
      .eq("account_id", accountId);

    if (deleteMembersError) {
      console.error("Delete members error:", deleteMembersError);
    } else {
      console.log("Account members deleted successfully");
    }

    // Test delete account
    console.log("Testing delete account...");
    const { error: deleteAccountError } = await supabase
      .from("accounts")
      .delete()
      .eq("id", accountId);

    if (deleteAccountError) {
      console.error("Delete account error:", deleteAccountError);
    } else {
      console.log("Account deleted successfully");
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testDeleteAccount();
