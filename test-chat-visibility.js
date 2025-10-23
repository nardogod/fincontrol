// Test script to check if FloatingChat is visible
// Run this in browser console on the dashboard page

function testChatVisibility() {
  console.log("Testing FloatingChat visibility...");

  // Check if FloatingChat button exists
  const chatButton = document.querySelector(
    '[class*="fixed bottom-6 right-6"]'
  );
  console.log("Chat button found:", chatButton);

  if (chatButton) {
    console.log("Chat button classes:", chatButton.className);
    console.log("Chat button visible:", chatButton.offsetParent !== null);
    console.log("Chat button position:", {
      top: chatButton.offsetTop,
      left: chatButton.offsetLeft,
      right: window.innerWidth - chatButton.offsetLeft - chatButton.offsetWidth,
      bottom:
        window.innerHeight - chatButton.offsetTop - chatButton.offsetHeight,
    });
  } else {
    console.log("Chat button not found!");

    // Check if FloatingChat component is in DOM
    const floatingChat = document.querySelector('[class*="MessageCircle"]');
    console.log("FloatingChat component found:", floatingChat);

    // Check all fixed positioned elements
    const fixedElements = document.querySelectorAll('[class*="fixed"]');
    console.log("All fixed elements:", fixedElements);

    // Check for any green buttons
    const greenButtons = document.querySelectorAll('[class*="bg-green-500"]');
    console.log("Green buttons found:", greenButtons);
  }

  // Check if there are any console errors
  console.log("Check the console for any React errors above this message");
}

// Run the test
testChatVisibility();
