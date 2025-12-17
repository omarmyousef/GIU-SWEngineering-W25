$(document).ready(function () {
  function loadOrders() {
    $.ajax({
      type: "GET",
      url: "/api/v1/order/truckOrders",
      success: function (orders) {
        renderOrders(orders || []);
      },
      error: function (err) {
        console.log(err);
        if (typeof showNotification === "function") {
          showNotification("Failed to load vendor orders.", "danger");
        } else {
          alert("Failed to load vendor orders.");
        }
      },
    });
  }

  function renderOrders(orders) {
    var $tbody = $("#vendor-orders-body");
    var $noOrders = $("#no-orders-vendor");
    $tbody.empty();

    if (!orders.length) {
      $noOrders.show();
      $("#vendor-orders-table").hide();
      return;
    }

    $noOrders.hide();
    $("#vendor-orders-table").show();

    orders.forEach(function (order) {
      var orderId = order.orderId;
      var status = order.orderStatus || "pending";
      var customerName = order.customerName || "Customer";
      var total = parseFloat(order.totalPrice || 0) || 0;
      var pickup = order.scheduledPickupTime
        ? new Date(order.scheduledPickupTime).toLocaleString()
        : "-";

      var $row = $("<tr></tr>");
      $row.append($("<td></td>").text(orderId));
      $row.append($("<td></td>").text(customerName));
      $row.append($("<td></td>").text(status));
      $row.append($("<td></td>").text(pickup));
      $row.append($("<td></td>").text(total.toFixed(2) + " EGP"));

      var $actions = $("<td></td>");

      // status dropdown
      var $select = $("<select class='form-control input-sm' style='display:inline-block; width:auto;'></select>");
      ["pending", "preparing", "ready", "completed", "cancelled"].forEach(function (s) {
        var $opt = $("<option></option>").val(s).text(s);
        if (s === status) $opt.attr("selected", "selected");
        $select.append($opt);
      });

      var $updateBtn = $("<button class='btn btn-xs btn-primary' style='margin-left:5px;'>Update</button>");
      $updateBtn.click(function () {
        var newStatus = $select.val();
        updateOrderStatus(orderId, newStatus);
      });

      var $detailsBtn = $("<button class='btn btn-xs btn-default' style='margin-left:5px;'>Details</button>");
      $detailsBtn.click(function () {
        loadOrderDetails(orderId);
      });

      $actions.append($select).append($updateBtn).append($detailsBtn);
      $row.append($actions);

      $tbody.append($row);
    });
  }

  function updateOrderStatus(orderId, newStatus) {
    $.ajax({
      type: "PUT",
      url: "/api/v1/order/updateStatus/" + encodeURIComponent(orderId),
      data: { orderStatus: newStatus },
      success: function () {
        if (typeof showNotification === "function") {
          showNotification("Order " + orderId + " updated to " + newStatus + ".", "success");
        } else {
          alert("Order updated.");
        }
        loadOrders();
      },
      error: function (err) {
        console.log(err);
        var message = "Failed to update order.";
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
  }

  function loadOrderDetails(orderId) {
    $.ajax({
      type: "GET",
      url: "/api/v1/order/truckOwner/" + encodeURIComponent(orderId),
      success: function (details) {
        renderOrderDetails(details);
      },
      error: function (err) {
        console.log(err);
        if (typeof showNotification === "function") {
          showNotification("Failed to load order details.", "danger");
        } else {
          alert("Failed to load order details.");
        }
      },
    });
  }

  function renderOrderDetails(order) {
    if (!order) return;

    $("#vendor-modal-order-id").text(order.orderId || "");
    var pickup = order.scheduledPickupTime
      ? new Date(order.scheduledPickupTime).toLocaleString()
      : "-";
    $("#vendor-modal-pickup-time").text(pickup);

    var $tbody = $("#vendor-order-items-body");
    $tbody.empty();

    (order.items || []).forEach(function (item) {
      var price = parseFloat(item.price || 0) || 0;
      var qty = parseInt(item.quantity || 1, 10) || 1;
      var subtotal = price * qty;

      var $row = $("<tr></tr>");
      $row.append($("<td></td>").text(item.itemName || "Item"));
      $row.append($("<td></td>").text(qty));
      $row.append($("<td></td>").text(price.toFixed(2) + " EGP"));
      $row.append($("<td></td>").text(subtotal.toFixed(2) + " EGP"));
      $tbody.append($row);
    });

    $("#vendorOrderDetailsModal").modal("show");
  }

  loadOrders();
});




