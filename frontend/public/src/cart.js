$(document).ready(function () {
  function loadCart() {
    $.ajax({
      type: "GET",
      url: "/api/v1/cart/view",
      success: function (items) {
        renderCart(items || []);
      },
      error: function (err) {
        console.log(err);
        alert("Failed to load cart.");
      },
    });
  }

  function getItemName(item) {
    return item.name || item.itemName || item.menuItemName || "Item";
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
      const cartId = item.id || item.cartId;
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
        if (quantity <= 1) return;
        updateQuantity(cartId, quantity - 1);
      });

      $plus.click(function () {
        updateQuantity(cartId, quantity + 1);
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
        alert("Failed to update quantity.");
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
        alert("Failed to remove item from cart.");
      },
    });
  }

  $("#place-order").click(function () {
    const pickupTime = $("#pickupTime").val();
    if (!pickupTime) {
      alert("Please select a scheduled pickup time before placing your order.");
      return;
    }

    $.ajax({
      type: "POST",
      url: "/api/v1/order/new",
      data: { pickupTime: pickupTime },
      success: function () {
        alert("Order placed successfully!");
        window.location.href = "/myOrders";
      },
      error: function (err) {
        console.log(err);
        alert("Failed to place order.");
      },
    });
  });

  // initial load
  loadCart();
});




