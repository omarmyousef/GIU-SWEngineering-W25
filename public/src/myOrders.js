$(document).ready(function () {
  function loadOrders() {
    $.ajax({
      type: "GET",
      url: "/api/v1/order/myOrders",
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

  function getStatusLabelClass(status) {
    if (!status) return "label-default";
    const s = status.toLowerCase();
    if (s === "pending") return "label-warning";
    if (s === "preparing") return "label-info";
    if (s === "ready") return "label-success";
    return "label-default";
  }

  function renderOrders(orders) {
    const $noOrders = $("#no-orders");
    const $table = $("#orders-table");
    const $tbody = $("#orders-body");
    $tbody.empty();

    if (!orders.length) {
      $noOrders.show();
      $table.hide();
      return;
    }

    // sort by most recent (assuming createdAt / orderDate / date field)
    orders.sort(function (a, b) {
      const dateA = new Date(a.createdAt || a.orderDate || a.date || 0);
      const dateB = new Date(b.createdAt || b.orderDate || b.date || 0);
      return dateB - dateA;
    });

    $noOrders.hide();
    $table.show();

    orders.forEach(function (order) {
      const orderId = order.id || order.orderId;
      const truckName = order.truckName || order.truck || "Truck";
      const status = order.orderStatus || order.status || "pending";
      const total = order.totalPrice || order.total || 0;
      const dateVal = order.createdAt || order.orderDate || order.date;
      const dateStr = dateVal ? new Date(dateVal).toLocaleString() : "-";

      const $row = $("<tr></tr>");
      $row.append($("<td></td>").text(orderId));
      $row.append($("<td></td>").text(truckName));

      const $status = $("<span></span>")
        .addClass("label " + getStatusLabelClass(status))
        .text(status);
      $row.append($("<td></td>").append($status));

      $row.append($("<td></td>").text(parseFloat(total).toFixed(2) + " EGP"));
      $row.append($("<td></td>").text(dateStr));

      const $actions = $("<td></td>");
      const $view = $("<button class='btn btn-xs btn-primary'>View Details</button>");
      $view.click(function () {
        loadOrderDetails(orderId, truckName);
      });
      $actions.append($view);
      $row.append($actions);

      $tbody.append($row);
    });
  }

  function loadOrderDetails(orderId, truckName) {
    $.ajax({
      type: "GET",
      url: "/api/v1/order/details/" + encodeURIComponent(orderId),
      success: function (details) {
        const items = (details && details.items) ? details.items : (details || []);
        const resolvedTruckName = (details && details.truckName) ? details.truckName : truckName;
        renderOrderDetails(orderId, resolvedTruckName, items);
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

  function getItemName(item) {
    return item.name || item.itemName || item.menuItemName || "Item";
  }

  function renderOrderDetails(orderId, truckName, items) {
    $("#modal-order-id").text(orderId);
    $("#modal-truck-name").text(truckName);

    const $tbody = $("#order-items-body");
    $tbody.empty();

    if (!items || !items.length) {
      const $row = $("<tr></tr>");
      $row.append($("<td colspan='4' class='text-center text-muted'></td>").text("No items found for this order."));
      $tbody.append($row);
      $("#orderDetailsModal").modal("show");
      return;
    }

    items.forEach(function (item) {
      const price = parseFloat(item.price || item.unitPrice || 0) || 0;
      const qty = parseInt(item.quantity || item.qty || item.count || 1, 10) || 1;
      const subtotal = price * qty;

      const $row = $("<tr></tr>");
      $row.append($("<td></td>").text(getItemName(item)));
      $row.append($("<td></td>").text(qty));
      $row.append($("<td></td>").text(price.toFixed(2) + " EGP"));
      $row.append($("<td></td>").text(subtotal.toFixed(2) + " EGP"));
      $tbody.append($row);
    });

    $("#orderDetailsModal").modal("show");
  }

  // initial load
  loadOrders();
});


