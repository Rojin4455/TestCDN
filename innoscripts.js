(function() {
    console.log("Script initialized");
    
    let lastUnreadCount = 0;
    let pollingInterval = 60000; // 1 minute
    let activeInterval = null;
    
    async function checkUnreadMessages() {
      console.log("Checking unread messages...");
      try {
        const url = window.location.href;
        const locationId = url.match(/\/location\/([^\/]+)/)?.[1] || null;
        
        if (!locationId) {
          console.error("No location ID found in URL");
          return;
        }
        
        const response = await fetch(`http://localhost:8000/accounts/unread-messages/${locationId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'  // Prevent browser caching
          }
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        console.log("Unread messages response:", data);
        
        // Update UI based on unread count
        if (data.unreadCount > 0) {
          addNotificationDot(data.unreadCount);
        } else {
          removeNotificationDot();
        }
        
        // Update last known count
        lastUnreadCount = data.unreadCount;
        
      } catch (error) {
        console.error('Error checking unread messages:', error);
      }
    }
    
    function startPolling() {
      // Clear any existing interval
      if (activeInterval) {
        clearInterval(activeInterval);
      }
      
      // Start new polling interval
      activeInterval = setInterval(checkUnreadMessages, pollingInterval);
      
      // Run immediately on start
      checkUnreadMessages();
    }
    
    function addNotificationDot(count) {
      const conversationsItem = document.getElementById('sb_conversations');
      
      if (conversationsItem) {
        removeNotificationDot();
        
        const dot = document.createElement('span');
        dot.id = 'conversation_notification_dot';
        dot.style.position = 'absolute';
        dot.style.top = '10px';
        dot.style.right = '10px';
        dot.style.width = count > 1 ? '16px' : '8px';
        dot.style.height = count > 1 ? '16px' : '8px';
        dot.style.backgroundColor = '#ff3b30';
        dot.style.borderRadius = '50%';
        dot.style.display = 'block';
        
        if (count > 1) {
          dot.textContent = count > 99 ? '99+' : count;
          dot.style.textAlign = 'center';
          dot.style.fontSize = '10px';
          dot.style.color = 'white';
          dot.style.lineHeight = '16px';
        }
        
        conversationsItem.style.position = 'relative';
        conversationsItem.appendChild(dot);
      }
    }
    
    function removeNotificationDot() {
      const existingDot = document.getElementById('conversation_notification_dot');
      if (existingDot) {
        existingDot.remove();
      }
    }
    
    // Setup initial polling
    function initialize() {
      const conversationsItem = document.getElementById('sb_conversations');
      if (conversationsItem) {
        console.log("Initializing unread messages polling");
        startPolling();
      } else {
        // If conversations item not found, set up an observer
        const observer = new MutationObserver(function(mutations) {
          const item = document.getElementById('sb_conversations');
          if (item) {
            console.log("Conversations item found, starting polling");
            startPolling();
            observer.disconnect();
          }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
    
    // Handle document ready states
    if (document.readyState === "complete" || document.readyState === "interactive") {
      initialize();
    } else {
      document.addEventListener('DOMContentLoaded', initialize);
    }
    
    // Optional: Restart polling when page becomes visible
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        console.log("Page visible, restarting polling");
        startPolling();
      }
    });
  })();