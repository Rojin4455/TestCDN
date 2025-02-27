(function() {
    console.log("Script initialized");
    
    async function checkUnreadMessages() {
      console.log("checkUnreadMessages called....");
      try {
        const locationId = "drnx22opCVrfXVtsBs0Y";
        
        const response = await fetch(`https://ghltech.com/accounts/unread-messages/${locationId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        console.log("success response: ", data);
        
        if (data.unreadCount > 0) {
          addNotificationDot(data.unreadCount);
        } else {
          removeNotificationDot();
        }
      } catch (error) {
        console.error('Error checking unread messages:', error);
      }
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
    
    // Setup MutationObserver to detect when sidebar elements are added to DOM
    function setupObserver() {
      console.log("Setting up observer");
      const observer = new MutationObserver(function(mutations) {
        const conversationsItem = document.getElementById('sb_conversations');
        if (conversationsItem) {
          console.log("Found sb_conversations, running checkUnreadMessages");
          checkUnreadMessages();
          observer.disconnect();
          
          setInterval(checkUnreadMessages, 60000);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
    }
    
    console.log("outside log");
    
    if (document.readyState === "complete" || document.readyState === "interactive") {
      const conversationsItem = document.getElementById('sb_conversations');
      if (conversationsItem) {
        console.log("Document ready and found sb_conversations, running checkUnreadMessages");
        checkUnreadMessages();
        setInterval(checkUnreadMessages, 60000);
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
          setInterval(checkUnreadMessages, 60000);
        } else {
          console.log("sb_conversations not found, setting up observer");
          setupObserver();
        }
      });
    }
  })();
    