(function() {
    console.log("Script initialized");
    
    // Keep track of the last count we saw
    let lastUnreadCount = 0;
    let lastTimestamp = 0;
    let backoffInterval = 60000; // Start with 1 minute
    let maxBackoffInterval = 5 * 60000; // Max 5 minutes
    let activeInterval = null;
    
    async function checkUnreadMessages() {
      console.log("checkUnreadMessages called....");
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
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        console.log("Response from server:", data);
        
        // Update UI based on unread count
        if (data.unreadCount > 0) {
          addNotificationDot(data.unreadCount);
        } else {
          removeNotificationDot();
        }
        
        // Adaptive polling logic
        if (data.unreadCount !== lastUnreadCount) {
          // Count changed - reset to frequent polling
          backoffInterval = 60000;
          scheduleNextCheck();
        } else {
          // Count stayed the same - back off gradually
          backoffInterval = Math.min(backoffInterval * 1.5, maxBackoffInterval);
          scheduleNextCheck();
        }
        
        // Update our tracking variables
        lastUnreadCount = data.unreadCount;
        lastTimestamp = data.timestamp || Date.now();
        
      } catch (error) {
        console.error('Error checking unread messages:', error);
        // On error, still schedule next check but don't change the interval
        scheduleNextCheck();
      }
    }
    
    function scheduleNextCheck() {
      if (activeInterval) {
        clearTimeout(activeInterval);
      }
      
      console.log(`Scheduling next check in ${backoffInterval/1000} seconds`);
      activeInterval = setTimeout(checkUnreadMessages, backoffInterval);
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
    
    // Reset polling interval when user interacts with the page
    function handleUserActivity() {
      backoffInterval = 60000; // Reset to 1 minute
      checkUnreadMessages(); // Check immediately
    }
    
    // Listen for user activity
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    
    // Setup MutationObserver to detect when sidebar elements are added to DOM
    function setupObserver() {
      console.log("Setting up observer");
      const observer = new MutationObserver(function(mutations) {
        const conversationsItem = document.getElementById('sb_conversations');
        if (conversationsItem) {
          console.log("Found sb_conversations, running checkUnreadMessages");
          checkUnreadMessages();
          observer.disconnect();
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // Initialize based on document state
    if (document.readyState === "complete" || document.readyState === "interactive") {
      const conversationsItem = document.getElementById('sb_conversations');
      if (conversationsItem) {
        console.log("Document ready and found sb_conversations, running checkUnreadMessages");
        checkUnreadMessages();
      } else {
        console.log("Document ready but sb_conversations not found, setting up observer");
        setupObserver();
      }
    } else {
      // Document not yet loaded, wait for DOMContentLoaded
      document.addEventListener('DOMContentLoaded', function() {
        console.log("DOMContentLoaded event fired");
        const conversationsItem = document.getElementById('sb_conversations');
        if (conversationsItem) {
          console.log("Found sb_conversations, running checkUnreadMessages");
          checkUnreadMessages();
        } else {
          console.log("sb_conversations not found, setting up observer");
          setupObserver();
        }
      });
    }
    
    // Handle visibility changes (tab focus/unfocus)
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        // Page is now visible - check immediately
        handleUserActivity();
      }
    });
  })();