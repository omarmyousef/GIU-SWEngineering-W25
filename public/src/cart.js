$(document).ready(function () {
  function initDateTimePicker() {
    var now = new Date();
    // Round to next 15 minutes and add extra 15 minutes
    var ms = 1000 * 60 * 15;
    var rounded = new Date(Math.ceil(now.getTime() / ms) * ms);
    rounded = new Date(rounded.getTime() + 15 * 60 * 1000);

    var yyyy = rounded.getFullYear();
    var mm = ("0" + (rounded.getMonth() + 1)).slice(-2);
    var dd = ("0" + rounded.getDate()).slice(-2);
    var hh = ("0" + rounded.getHours()).slice(-2);
    var min = ("0" + rounded.getMinutes()).slice(-2);

    $("#pickupDate").val(yyyy + "-" + mm + "-" + dd);

    var $timeSelect = $("#pickupTimeSelect");
    $timeSelect.empty();

    // Generate 2.5 hours of slots from rounded time in 15-min increments
    for (var i = 0; i < 10; i++) {
      var slot = new Date(rounded.getTime() + i * 15 * 60 * 1000);
      var sh = ("0" + slot.getHours()).slice(-2);
      var sm = ("0" + slot.getMinutes()).slice(-2);
      var label = sh + ":" + sm;
      var value = label;
      var $opt = $("<option></option>").val(value).text(label);
      if (i === 0) {
        $opt.attr("selected", "selected");
      }
      $timeSelect.append($opt);
    }
  }

  function loadCart() {
    $.ajax({
      type: "GET",
      url: "/api/v1/cart/view",
      success: function (items) {
        renderCart(items || []);
      },
      error: function (err) {
        console.log(err);
        if (typeof showNotification === "function") {
          showNotification("Failed to load cart.", "danger");
        } else {
          alert("Failed to load cart.");
        }
      },
    });
  }

  function getItemName(item) {
    return item.itemName || item.name || item.menuItemName || "Item";
  }

  function getItemPrice(item) {
    return item.price || item.unitPrice || 0;
  }

  function getItemQuantity(item) {
    return item.quantity || item.qty || item.count || 1;
  }

  function renderCart(items) {
    const $empty = $("#empty-cart");
    const $content = $("#cart-content");
    const $tbody = $("#cart-items-body");
    $tbody.empty();

    if (!items.length) {
      $empty.show();
      $content.hide();
      $("#cart-total").text("0.00");
      return;
    }

    $empty.hide();
    $content.show();

    let total = 0;

    items.forEach(function (item) {
      const cartId = item.cartId || item.id;
      const price = parseFloat(getItemPrice(item)) || 0;
      const quantity = parseInt(getItemQuantity(item), 10) || 1;
      const subtotal = price * quantity;
      total += subtotal;

      const $row = $("<tr></tr>");
      $row.append($("<td></td>").text(getItemName(item)));
      $row.append($("<td></td>").text(price.toFixed(2) + " EGP"));

      const $qtyCell = $("<td class='text-center'></td>");
      const $minus = $("<button class='btn btn-xs btn-default'>-</button>");
      const $plus = $("<button class='btn btn-xs btn-default'>+</button>");
      const $qtySpan = $("<span style='margin:0 10px;'></span>").text(quantity);

      $minus.click(function () {
        let currentQty = parseInt($qtySpan.text(), 10) || 1;
        if (currentQty <= 1) {
          return;
        }
        const newQty = currentQty - 1;
        updateQuantity(cartId, newQty);
      });

      $plus.click(function () {
        let currentQty = parseInt($qtySpan.text(), 10) || 1;
        const newQty = currentQty + 1;
        updateQuantity(cartId, newQty);
      });

      $qtyCell.append($minus, $qtySpan, $plus);
      $row.append($qtyCell);

      $row.append($("<td></td>").text(subtotal.toFixed(2) + " EGP"));

      const $actions = $("<td></td>");
      const $remove = $("<button class='btn btn-xs btn-danger'>Remove</button>");
      $remove.click(function () {
        removeItem(cartId);
      });
      $actions.append($remove);
      $row.append($actions);

      $tbody.append($row);
    });

    $("#cart-total").text(total.toFixed(2));
  }

  function updateQuantity(cartId, newQuantity) {
    $.ajax({
      type: "PUT",
      url: "/api/v1/cart/edit/" + encodeURIComponent(cartId),
      data: { quantity: newQuantity },
      success: function () {
        loadCart();
      },
      error: function (err) {
        console.log(err);
        if (typeof showNotification === "function") {
          showNotification("Failed to update quantity.", "danger");
        } else {
          alert("Failed to update quantity.");
        }
      },
    });
  }

  function removeItem(cartId) {
    $.ajax({
      type: "DELETE",
      url: "/api/v1/cart/delete/" + encodeURIComponent(cartId),
      success: function () {
        loadCart();
      },
      error: function (err) {
        console.log(err);
        if (typeof showNotification === "function") {
          showNotification("Failed to remove item from cart.", "danger");
        } else {
          alert("Failed to remove item from cart.");
        }
      },
    });
  }

  $("#place-order").click(function () {
    const dateVal = $("#pickupDate").val();
    const timeVal = $("#pickupTimeSelect").val();
    if (!dateVal || !timeVal) {
      if (typeof showNotification === "function") {
        showNotification("Please select a scheduled pickup date and time before placing your order.", "warning");
      } else {
        alert("Please select a scheduled pickup date and time before placing your order.");
      }
      return;
    }

    const pickupTime = dateVal + "T" + timeVal;

    // Backend expects "scheduledPickupTime"
    $.ajax({
      type: "POST",
      url: "/api/v1/order/new",
      data: { scheduledPickupTime: pickupTime },
      success: function () {
        if (typeof showNotification === "function") {
          showNotification("Order placed successfully!", "success");
        } else {
          alert("Order placed successfully!");
        }
        setTimeout(function () {
          window.location.href = "/myOrders";
        }, 800);
      },
      error: function (err) {
        console.log(err);
        let message = "Failed to place order.";
        if (err && err.responseJSON && err.responseJSON.error) {
          message = err.responseJSON.error;
        } else if (err && err.responseText) {
          message = err.responseText;
        }
        if (typeof showNotification === "function") {
          showNotification(message, "danger");
        } else {
          alert(message);
        }
      },
    });
  });

  // initial load
  initDateTimePicker();
  loadCart();
});
