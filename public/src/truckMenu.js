$(document).ready(function () {
  var truckId = window.TRUCK_ID;
  var lastLoadedCategory = "";

  if (!truckId) {
    if (typeof showNotification === "function") {
      showNotification("Missing truck information. Please go back and select a truck again.", "danger");
    } else {
      alert("Missing truck information. Please go back and select a truck again.");
    }
    return;
  }

  function loadTruckInfoAndMenu(category) {
    // Load all trucks to find basic info for header (name/description if present)
    $.ajax({
      type: "GET",
      url: "/api/v1/trucks/view",
      success: function (trucks) {
        var list = trucks || [];
        var truck = list.find(function (t) {
          return String(t.truckId || t.id) === String(truckId);
        });

        if (truck) {
          $("#truck-name-heading").text(truck.truckName || truck.name || "Truck Menu");
          if (truck.description) {
            $("#truck-description").text(truck.description).show();
          } else {
            $("#truck-description").hide();
          }
        }
      },
      error: function (err) {
        console.log("Failed to load truck info", err);
      },
      complete: function () {
        loadMenu(category);
      },
    });
  }

  function loadMenu(category) {
    var url;
    if (category) {
      url =
        "/api/v1/menuItem/truck/" +
        encodeURIComponent(truckId) +
        "/category/" +
        encodeURIComponent(category);
    } else {
      url = "/api/v1/menuItem/truck/" + encodeURIComponent(truckId);
    }

    $.ajax({
      type: "GET",
      url: url,
      success: function (items) {
        renderMenu(items || []);
      },
      error: function (err) {
        console.log(err);
        if (typeof showNotification === "function") {
          showNotification("Failed to load menu items.", "danger");
        } else {
          alert("Failed to load menu items.");
        }
      },
    });
  }

  function renderMenu(items) {
    var $noItems = $("#no-items");
    var $table = $("#menu-table");
    var $tbody = $("#menu-body");
    $tbody.empty();

    if (!items.length) {
      $noItems.show();
      $table.hide();
      return;
    }

    $noItems.hide();
    $table.show();

    items.forEach(function (item) {
      var itemId = item.itemId || item.id;
      var name = item.name || item.itemName || "Item";
      var description = item.description || "";
      var category = item.category || "-";
      var price = parseFloat(item.price || item.unitPrice || 0) || 0;

      var $row = $("<tr></tr>");
      $row.append($("<td></td>").text(name));
      $row.append($("<td></td>").text(description));
      $row.append($("<td></td>").text(category));
      $row.append($("<td></td>").text(price.toFixed(2)));

      var $qtyCell = $("<td></td>");
      var $qtyInput = $("<input type='number' min='1' value='1' class='form-control' style='width:80px; display:inline-block;' />");
      $qtyCell.append($qtyInput);
      $row.append($qtyCell);

      var $actions = $("<td></td>");
      var $addBtn = $("<button class='btn btn-success btn-sm'>Add to Cart</button>");
      $addBtn.click(function () {
        var qtyVal = parseInt($qtyInput.val(), 10);
        if (!qtyVal || qtyVal < 1) {
          if (typeof showNotification === "function") {
            showNotification("Please enter a valid quantity.", "warning");
          } else {
            alert("Please enter a valid quantity.");
          }
          return;
        }
        addToCart(itemId, qtyVal, price);
      });
      $actions.append($addBtn);
      $row.append($actions);

      $tbody.append($row);
    });
  }

  function addToCart(itemId, quantity, price) {
    $.ajax({
      type: "POST",
      url: "/api/v1/cart/new",
      data: {
        itemId: itemId,
        quantity: quantity,
        price: price,
      },
      success: function (res) {
        if (typeof showNotification === "function") {
          showNotification("Item added to cart successfully.", "success");
        } else {
          alert("Item added to cart successfully.");
        }
      },
      error: function (err) {
        console.log(err);
        var message = "Failed to add item to cart.";
        if (err && err.responseJSON && err.responseJSON.error) {
          message = err.responseJSON.error;
        } else if (err && err.responseJSON && err.responseJSON.message) {
          message = err.responseJSON.message;
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

  $("#categoryFilter").change(function () {
    var category = $(this).val() || "";
    lastLoadedCategory = category;
    loadMenu(category);
  });

  // initial load
  loadTruckInfoAndMenu(lastLoadedCategory);
});


