// Simple delete test
// Run this in browser console

async function simpleDeleteTest() {
  const supabase = createClient();

  try {
    // Get account ID from URL
    const accountId = window.location.pathname.split("/")[3];
    console.log("Testing delete for account:", accountId);

    // Try to delete account directly
    const { data, error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", accountId)
      .select();

    console.log("Delete result:", { data, error });

    if (error) {
      console.error("Delete failed:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
    } else {
      console.log("Delete successful:", data);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
simpleDeleteTest();
