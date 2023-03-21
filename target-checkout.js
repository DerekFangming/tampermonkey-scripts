// ==UserScript==
// @name         Target.com Checkout Bot
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       You
// @match        https://www.target.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

/*
  ** IMPORTANT ** How to TEST the bot:
  1. Go to target.com and make sure to login to your account. Make sure you have a default address and payment method set in your account.
  2. Make sure the PLACE_ORDER is set to false. We want to test the checkout flow. When it's set to false, bot will not place an order. Click (Ctrl + S) to save this script if you make changes.
  3. Open a new tab and navigate to an item that is in stock. The bot should add MAX_QUANTITY_SELECTION items to the shopping cart and attempt to checkout(Will stop before placing order).
  4. If you see a popup window, the bot is working correctly. If you see red error message on the status panel, let me know.
  5. Go to shopping cart and make sure to remove everything, especially the items we just tested here. After that you can start using it by following the steps below.

  How to use the bot:
  1. Set REFRESH_SECONDS and MAX_QUANTITY_SELECTION accordingly. Make sure PLACE_ORDER is set to true. Click (Ctrl + S) to save this script if you make changes.
  2. Open a new tab and navigate to the item. If the item is available, the bot will place an order immediately. If the item is not available, the bot will automatically refresh the page until it's available.

*/

// If the item is out of stop, bot will automatically refresh the page after below seconds and check again. To avoid being banned by target, please keep it above 60 seconds.
const REFRESH_SECONDS = 5;

// Control how many items to add to cart if available.
const MAX_QUANTITY_SELECTION = 10;

// When set to true, bot will checkout shopping cart. When set to false, bot will test checkout process and tell you if everything works or not.
const PLACE_ORDER = false;

(async function() {
    'use strict'

    var nextRefresh = null

    const statusBar = document.createElement('div')
    statusBar.style.cssText = 'position:fixed;left:0;bottom:0;width:850px;height:75px;background:#5c5a5a80;color:white;padding-left:15px;z-index:10000;'
    document.body.appendChild(statusBar)

    const status = document.createElement('p')
    status.innerHTML = 'Initializing ...'
    statusBar.appendChild(status)

    const footer = document.createElement('p')
    footer.innerHTML = '<small>If this tool is stuck, refresh the page manually to reload it</small>'
    footer.style.cssText = 'position:fixed;left:15px;bottom:0;'
    statusBar.appendChild(footer)

    var itemPageInterval = setInterval(function() {
        if (nextRefresh != null) {
            if (nextRefresh < new Date()) {
                location.reload()
            }
            return
        }

        if (/StyledFulfillmentOptions/g.test(document.body.innerHTML)) {
            addItemsToCart()
            return
        }

        if (window.location.href == 'https://www.target.com/cart') {
            checkoutCart()
            return
        }

        if (window.location.href == 'https://www.target.com/checkout') {
            placeOrder()
            return
        }

        status.innerHTML = 'Please nevigate to item page. Bot will automatically attempt to checkout after that.'
    }, 5000)

    async function addItemsToCart() {
        status.innerHTML = 'Item detected. Checking for avilability.'

        let checkoutOpts = document.querySelector('button[aria-label^="shipping"]')
        if (checkoutOpts == null) {
            clearInterval(itemPageInterval)
            return showError(`Error: Found ${checkoutOpts.length} checkout buttons. Bot has stoppped.`)
        }

        checkoutOpts.click()
        await sleep(50)

        let quantitiesDropdownDiv = document.querySelector('div[class^="styles__StyledInlineQuantityPicker"]')
        if (quantitiesDropdownDiv == null) {
            status.innerHTML = `Item currently out of stock. Refreshing in ${REFRESH_SECONDS} seconds to check again. - (${new Date().toLocaleString()})`
            nextRefresh = new Date(new Date().getTime() + REFRESH_SECONDS * 1000)
            return
        }

        status.innerHTML = 'Currently in stock!'
        let quantitiesValue = document.querySelector('div[class^="styles__StyledQuantityValue"]')
        if (quantitiesValue == null) {
            return showError('Error: Cannot find quantity value option. Bot has stoppped.')
        }


        let quantitiesDropdown = document.querySelector('button[id^="select"]')
        if (quantitiesDropdown == null) {
            return showError('Error: Cannot find quantity selection dropdown list. Bot has stoppped.')
        }

        // Use this to force dropdown to show up
        quantitiesValue.innerHTML = 2
        quantitiesDropdown.click()
        await sleep(500)

        let quantitiesDropdownOptions = document.querySelector('ul[class^="Optionsstyles__StyledSelectCustomOptions"]')
        if (quantitiesDropdownOptions == null) {
            return showError('Error: Quantity selection dropdown list options not showing up. Bot has stoppped.')
        }

        let quantity = Math.min(MAX_QUANTITY_SELECTION, quantitiesDropdownOptions.childNodes.length - 1) // There's always a hidden option for the list
        console.log(quantitiesDropdownOptions.childNodes[quantity - 1])
        quantitiesDropdownOptions.childNodes[quantity - 1].click()

        let theOption = quantitiesDropdownOptions.childNodes[quantity - 1].querySelector('a')
        theOption.click()
        await sleep(500)

        let addToCardBtn = document.querySelector('button[id^="addToCartButtonOr"]')
        if (addToCardBtn == null) {
            return showError('Error: Cannot find add to cart button. Bot has stoppped.')
        }

        addToCardBtn.click()
        await sleep(100)
        window.location.href = 'https://www.target.com/cart'

    }

    async function checkoutCart() {
        clearInterval(itemPageInterval)
        status.innerHTML = 'Attempting to checkout'
        let buttons = [...document.querySelectorAll('button')]
        let checkoutBtn = buttons.find(b => b.textContent.includes('Check out'))
        if (checkoutBtn == null) {
            return showError('Error: Cannot find "Check out" button. Bot has stoppped.')
        }

        checkoutBtn.click()
    }

    async function placeOrder() {
        clearInterval(itemPageInterval)
        status.innerHTML = 'Attempting to place order'
        let buttons = [...document.querySelectorAll('button')]
        let placeOrderBtn = buttons.find(b => b.textContent.includes('Place your order'))
        if (placeOrderBtn == null) {
            return showError('Error: Cannot find "Place your order" button. Bot has stoppped.')
        }

        if (PLACE_ORDER) {
            status.innerHTML = 'Placing order'
            placeOrderBtn.click()
        } else {
            status.innerHTML = 'Test run complete. When PLACE_ORDER is set to true, the bot will place the order instead of showing this popup.'
            alert('Test run complete. When PLACE_ORDER is set to true, the bot will place the order instead of showing this popup.')
        }
    }

    function showError(message) {
        status.style.cssText = 'color:red;'
        status.innerHTML = `${message} - (${new Date().toLocaleString()})`
    }

    function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time))
    }

})()


