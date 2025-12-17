$(document).ready(function () {
  function loadTruckInfo() {
    $.ajax({
      type: "GET",
      url: "/api/v1/trucks/myTruck",
      success: function (truck) {
        if (!truck) return;
        $("#truck-name").text(truck.truckName || "My Truck");
        $("#truck-status").text(truck.truckStatus || "unknown");
        $("#truck-order-status").text(
          truck.orderStatus === "available" ? "Accepting orders" : "Not accepting orders"
        );
        $("#toggle-orders").data("current-status", truck.orderStatus || "unavailable");
      },
      error: function (err) {
        console.log(err);
        if (typeof showNotification === "function") {
          showNotification("Failed to load truck info.", "danger");
        } else {
          alert("Failed to load truck info.");
        }
      },
    });
  }

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
          showNotification("Failed to load orders.", "danger");
        } else {
          alert("Failed to load orders.");
        }
      },
    });
  }

  function renderOrders(orders) {
    var $tbody = $("#orders-body");
    var $noOrders = $("#no-orders-vendor");
    $tbody.empty();

    if (!orders.length) {
      $noOrders.show();
      return;
    }

    $noOrders.hide();

    // simple stats for today
    var stats = { pending: 0, preparing: 0, ready: 0 };

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
      var $select = $("<select class='form-control input-sm'></select>");
      ["pending", "preparing", "ready", "completed", "cancelled"].forEach(function (s) {
        var $opt = $("<option></option>").val(s).text(s);
        if (s === status) $opt.attr("selected", "selected");
        $select.append($opt);
      });
      var $btn = $("<button class='btn btn-xs btn-primary' style='margin-top:5px;'>Update</button>");
      $btn.click(function () {
        var newStatus = $select.val();
        updateOrderStatus(orderId, newStatus);
      });
      $actions.append($select).append($btn);
      $row.append($actions);

      $tbody.append($row);

      if (status === "pending") stats.pending += 1;
      if (status === "preparing") stats.preparing += 1;
      if (status === "ready") stats.ready += 1;
    });

    $("#stat-pending").text(stats.pending);
    $("#stat-preparing").text(stats.preparing);
    $("#stat-ready").text(stats.ready);
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

  $("#toggle-orders").click(function () {
    var current = $(this).data("current-status") || "unavailable";
    var next = current === "available" ? "unavailable" : "available";

    $.ajax({
      type: "PUT",
      url: "/api/v1/trucks/updateOrderStatus",
      data: { orderStatus: next },
      success: function () {
        if (typeof showNotification === "function") {
          showNotification("Truck order status updated to " + next + ".", "success");
        } else {
          alert("Truck order status updated.");
        }
        loadTruckInfo();
      },
      error: function (err) {
        console.log(err);
        var message = "Failed to update truck order status.";
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
  loadTruckInfo();
  loadOrders();
});


