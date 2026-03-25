// Cart array
let cart = JSON.parse(localStorage.getItem('eazycart')) || [];

// Telegram number - UK number (without + or spaces)
const TELEGRAM_NUMBER = "447536613651";

// Custom notification function (replaces alerts)
function showCustomNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas fa-info"></i>
            </div>
            <div class="notification-message">${message}</div>
            <div class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Add to cart
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCart();
    saveCart();
    showCustomNotification('✅ Added to cart!');
}

// Order now
function orderNow(product) {
    orderViaTelegram([{ ...product, quantity: 1 }]);
}

// Update cart display
function updateCart() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartCount || !cartItems || !cartTotal) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">${item.image || '📦'}</div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <div class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash-alt"></i>
                </div>
            </div>
        `).join('');
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Update quantity
function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        updateCart();
        saveCart();
    }
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    saveCart();
    showCustomNotification('🗑️ Item removed from cart');
}

// Save cart
function saveCart() {
    localStorage.setItem('eazycart', JSON.stringify(cart));
}

// Toggle cart sidebar
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    sidebar.classList.toggle('open');
}

// Order via Telegram (updated with new message format)
function orderViaTelegram(items = cart) {
    if (items.length === 0) {
        showCustomNotification('❌ Your cart is empty!');
        return;
    }
    
    let message = "🛍️ *NEW ORDER - Lunex*\n\n";
    message += "*Items:*\n";
    
    items.forEach(item => {
        message += `• ${item.name}\n`;
        message += `  Qty: ${item.quantity} x $${item.price.toFixed(2)}\n`;
    });
    
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 35 ? 0 : 4.99;
    const total = subtotal + shipping;
    
    message += `\n*Subtotal: $${subtotal.toFixed(2)}*`;
    message += `\n*Shipping: $${shipping.toFixed(2)}*`;
    message += `\n*Total: $${total.toFixed(2)}*`;
    message += `\n\n*Name:*`;
    message += `\n*Delivery Address:*`;
    message += `\n*Preferred Payment:* (Gift Card / Crypto)`;
    message += `\n\nI agree to 30% payment before shipping.`;
    message += `\n\nReady to proceed with this order.`;
    
    // Open Telegram with the UK number
    window.open(`https://t.me/+${TELEGRAM_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    
    if (items === cart) {
        cart = [];
        updateCart();
        saveCart();
    }
    toggleCart();
    
    showCustomNotification('📱 Telegram opened! Complete your order there.');
}

// ========== SEARCH FUNCTIONALITY ==========
function setupSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    
    if (!searchInput || !searchButton) return;
    
    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm === '') {
            // If search is empty, show all products
            document.querySelectorAll('.product-card').forEach(card => {
                card.style.display = 'flex';
            });
            showCustomNotification('🔍 Showing all products');
            return;
        }
        
        // Search through all product cards on the current page
        const productCards = document.querySelectorAll('.product-card');
        let foundCount = 0;
        
        productCards.forEach(card => {
            const productName = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
            
            if (productName.includes(searchTerm)) {
                card.style.display = 'flex'; // Show
                card.style.animation = 'none';
                card.offsetHeight; // Trigger reflow
                card.style.animation = 'highlight 1s ease';
                foundCount++;
                
                // Remove highlight animation after it completes
                setTimeout(() => {
                    card.style.animation = '';
                }, 1000);
            } else {
                card.style.display = 'none'; // Hide
            }
        });
        
        if (foundCount === 0) {
            showCustomNotification(`❌ No products found matching "${searchTerm}"`);
        } else {
            showCustomNotification(`✅ Found ${foundCount} product${foundCount > 1 ? 's' : ''} matching "${searchTerm}"`);
        }
    }
    
    // Search on button click
    searchButton.addEventListener('click', performSearch);
    
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Clear search when input is cleared
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === '') {
            document.querySelectorAll('.product-card').forEach(card => {
                card.style.display = 'flex';
            });
        }
    });
}

// Function to replace all WhatsApp references with Telegram
function replaceWhatsAppWithTelegram() {
    // Replace text content everywhere
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
        // Check and replace text nodes
        if (element.childNodes) {
            element.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent) {
                    let newText = node.textContent;
                    let changed = false;
                    
                    // Replace WhatsApp with Telegram (case insensitive)
                    if (newText.includes('WhatsApp') || newText.includes('whatsapp')) {
                        newText = newText.replace(/WhatsApp/gi, 'Telegram');
                        changed = true;
                    }
                    
                    // Update if changed
                    if (changed) {
                        node.textContent = newText;
                    }
                }
            });
        }
        
        // Replace class names
        if (element.className && typeof element.className === 'string') {
            if (element.className.includes('whatsapp')) {
                element.className = element.className.replace(/whatsapp/gi, 'telegram');
            }
        }
        
        // Replace onclick attributes
        if (element.hasAttribute && element.hasAttribute('onclick')) {
            let onclick = element.getAttribute('onclick');
            if (onclick && onclick.includes('orderViaWhatsApp')) {
                element.setAttribute('onclick', onclick.replace(/orderViaWhatsApp/gi, 'orderViaTelegram'));
            }
        }
        
        // Replace href attributes
        if (element.hasAttribute && element.hasAttribute('href')) {
            let href = element.getAttribute('href');
            if (href && (href.includes('wa.me') || href.includes('whatsapp'))) {
                element.setAttribute('href', `https://t.me/+${TELEGRAM_NUMBER}`);
            }
        }
    });
    
    // Replace icon classes specifically
    const whatsappIcons = document.querySelectorAll('.fab.fa-whatsapp');
    whatsappIcons.forEach(icon => {
        icon.classList.remove('fa-whatsapp');
        icon.classList.add('fa-telegram');
    });
    
    // Replace button text and classes
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.innerHTML.includes('WhatsApp')) {
            button.innerHTML = button.innerHTML.replace(/WhatsApp/gi, 'Telegram');
        }
        if (button.className.includes('whatsapp')) {
            button.className = button.className.replace(/whatsapp/gi, 'telegram');
        }
    });
    
    console.log('✅ Replaced all WhatsApp references with Telegram');
}

// Function to remove Toys from navigation
function removeToysFromNav() {
    // Remove from categories strip
    const categoriesStrip = document.querySelector('.categories-strip .container');
    if (categoriesStrip) {
        const toysLink = Array.from(categoriesStrip.querySelectorAll('a')).find(link => 
            link.textContent.trim().toLowerCase() === 'toys'
        );
        if (toysLink) {
            toysLink.remove();
            console.log('✅ Removed Toys from categories strip');
        }
    }
    
    // Remove from featured categories grid
    const categoryGrid = document.querySelector('.category-grid');
    if (categoryGrid) {
        const toysItem = Array.from(categoryGrid.querySelectorAll('.cat-item')).find(item => {
            const span = item.querySelector('span');
            return span && span.textContent.trim().toLowerCase() === 'toys';
        });
        if (toysItem) {
            toysItem.remove();
            console.log('✅ Removed Toys from featured categories');
        }
    }
    
    // Remove any other Toys links in the page
    const allLinks = document.querySelectorAll('a');
    allLinks.forEach(link => {
        if (link.textContent.trim().toLowerCase() === 'toys' && link.getAttribute('href') === 'toys.html') {
            link.remove();
        }
    });
}

// Function to rebrand all EazyExchange text to Lunex
function rebrandToLunex() {
    // Update logo specifically
    const logo = document.querySelector('.logo h1');
    if (logo) {
        logo.innerHTML = 'Lunex';
    }
    
    // Update all text elements
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, div, li, .footer-section p, .footer-bottom p');
    
    textElements.forEach(element => {
        if (element.innerHTML && element.innerHTML.includes('EazyExchange')) {
            element.innerHTML = element.innerHTML.replace(/EazyExchange/g, 'Lunex');
        }
        if (element.textContent && element.textContent.includes('EazyExchange')) {
            element.textContent = element.textContent.replace(/EazyExchange/g, 'Lunex');
        }
    });
    
    // Specifically update footer texts
    const footerTexts = document.querySelectorAll('.footer-section p, .footer-bottom p');
    footerTexts.forEach(el => {
        if (el.textContent.includes('EazyExchange')) {
            el.textContent = el.textContent.replace(/EazyExchange/g, 'Lunex');
        }
    });
    
    console.log('✅ Rebranded to Lunex');
}

// ========== APPLY ALL REQUESTED UI CHANGES ==========
function applyUIChanges() {
    // Helper function to find elements by text content
    function findElementByText(selector, text) {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).find(el => el.textContent.includes(text));
    }

    // Helper function to find parent section by heading text
    function findSectionByHeading(headingText) {
        const headings = document.querySelectorAll('.footer-section h4');
        for (let heading of headings) {
            if (heading.textContent.includes(headingText)) {
                return heading.closest('.footer-section');
            }
        }
        return null;
    }

    // 1. Remove 'shipping info' and 'track order' from Help & Support
    const helpSection = findSectionByHeading('Help & Support');
    if (helpSection) {
        const links = helpSection.querySelectorAll('li a');
        links.forEach(link => {
            if (link.textContent.includes('Shipping Info') || link.textContent.includes('Track Order')) {
                link.closest('li').remove();
            }
        });
    }

    // 2. Replace Telegram number with icon in Contact & Payment
    const contactSection = findSectionByHeading('Contact & Payment');
    if (contactSection) {
        const telegramLink = contactSection.querySelector('.telegram-contact');
        if (telegramLink) {
            telegramLink.innerHTML = '<i class="fab fa-telegram" style="font-size: 24px;"></i>';
            telegramLink.style.fontSize = '0';
            telegramLink.style.padding = '12px';
            telegramLink.style.display = 'inline-flex';
            telegramLink.style.alignItems = 'center';
            telegramLink.style.justifyContent = 'center';
            telegramLink.style.width = '48px';
            telegramLink.style.height = '48px';
            telegramLink.style.borderRadius = '50%';
        }
    }

    // 3. Replace Contact alert with Telegram link in Company section
    const companySection = findSectionByHeading('Company');
    if (companySection) {
        const contactLink = findElementByText('li a', 'Contact');
        if (contactLink) {
            contactLink.textContent = 'Contact us';
            contactLink.removeAttribute('onclick');
            contactLink.href = `https://t.me/+${TELEGRAM_NUMBER}`;
            contactLink.target = '_blank';
        }
    }

    // 4. Remove Cash App Cashtag from payment methods
    const paymentParagraphs = document.querySelectorAll('.payment-methods p');
    paymentParagraphs.forEach(p => {
        if (p.textContent.includes('Cash App') && p.textContent.includes('$Cashtag:')) {
            p.innerHTML = p.innerHTML.replace(/\s*\(\$Cashtag: @Lunex\)/, '');
        }
    });

    // 5. Remove Clearance and Pets from navigation (Toys is handled separately)
    const categoriesStrip = document.querySelector('.categories-strip .container');
    if (categoriesStrip) {
        const links = categoriesStrip.querySelectorAll('a');
        links.forEach(link => {
            if (link.textContent.includes('Clearance') || link.textContent.includes('Pets')) {
                link.remove();
            }
        });
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    updateCart();
    setupSearch(); // Initialize search
    rebrandToLunex(); // Rebrand to Lunex
    replaceWhatsAppWithTelegram(); // Replace all WhatsApp references with Telegram
    removeToysFromNav(); // Remove Toys from navigation
    applyUIChanges(); // Apply all UI changes
    
    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        const cart = document.getElementById('cartSidebar');
        const icon = document.querySelector('.cart-icon');
        if (cart && icon && !cart.contains(e.target) && !icon.contains(e.target) && cart.classList.contains('open')) {
            cart.classList.remove('open');
        }
    });
});

// Timer countdown for flash sale
let timer = setInterval(() => {
    const timerEl = document.querySelector('.timer');
    if (timerEl) {
        const spans = timerEl.querySelectorAll('span');
        if (spans.length === 3) {
            let h = parseInt(spans[0].textContent);
            let m = parseInt(spans[1].textContent);
            let s = parseInt(spans[2].textContent);
            
            s--;
            if (s < 0) { s = 59; m--; }
            if (m < 0) { m = 59; h--; }
            if (h < 0) { h = 23; }
            
            spans[0].textContent = h.toString().padStart(2, '0');
            spans[1].textContent = m.toString().padStart(2, '0');
            spans[2].textContent = s.toString().padStart(2, '0');
        }
    }
}, 1000);