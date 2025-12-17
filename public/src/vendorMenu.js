$(document).ready(function () {
  var allItems = [];

  function normalize(str) {
    return String(str || "").toLowerCase().trim();
  }

  function loadMenu() {
    $.ajax({
      type: "GET",
      url: "/api/v1/menuItem/view",
      success: function (items) {
        allItems = items || [];
        renderMenu(allItems);
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
    var $tbody = $("#vendor-menu-body");
    var $noItems = $("#no-items-vendor");
    $tbody.empty();

    if (!items.length) {
      $noItems.show();
      $("#vendor-menu-table").hide();
      return;
    }

    $noItems.hide();
    $("#vendor-menu-table").show();

    items.forEach(function (item) {
      var itemId = item.itemId || item.id;
      var name = item.name || "Item";
      var description = item.description || "";
      var category = item.category || "-";
      var price = parseFloat(item.price || 0) || 0;
      var status = item.status || "available";

      var $row = $("<tr></tr>");
      $row.append($("<td></td>").text(itemId));
      $row.append($("<td></td>").text(name));
      $row.append($("<td></td>").text(description));
      $row.append($("<td></td>").text(category));
      $row.append($("<td></td>").text(price.toFixed(2)));
      $row.append($("<td></td>").text(status === "available" ? "Available" : "Unavailable"));

      var $actions = $("<td></td>");
      var $editBtn = $("<button class='btn btn-xs btn-default'>Edit</button>");
      $editBtn.click(function () {
        openEditModal(item);
      });

      var $deleteBtn = $("<button class='btn btn-xs btn-danger' style='margin-left:5px;'>Delete</button>");
      $deleteBtn.click(function () {
        if (confirm("Mark this item as unavailable?")) {
          deleteItem(itemId);
        }
      });

      $actions.append($editBtn).append($deleteBtn);
      $row.append($actions);

      $tbody.append($row);
    });
  }

  function openAddModal() {
    $("#vendor-menu-modal-title").text("Add Menu Item");
    $("#vendor-menu-item-id").val("");
    $("#vendor-menu-name").val("");
    $("#vendor-menu-description").val("");
    $("#vendor-menu-category").val("");
    $("#vendor-menu-price").val("");
    $("#vendor-menu-available").prop("checked", true);
    $("#vendorMenuItemModal").modal("show");
  }

  function openEditModal(item) {
    $("#vendor-menu-modal-title").text("Edit Menu Item");
    $("#vendor-menu-item-id").val(item.itemId || item.id);
    $("#vendor-menu-name").val(item.name || "");
    $("#vendor-menu-description").val(item.description || "");
    $("#vendor-menu-category").val(item.category || "");
    $("#vendor-menu-price").val(item.price || "");
    $("#vendor-menu-available").prop("checked", (item.status || "available") === "available");
    $("#vendorMenuItemModal").modal("show");
  }

  function saveItem() {
    var id = $("#vendor-menu-item-id").val();
    var name = $("#vendor-menu-name").val().trim();
    var description = $("#vendor-menu-description").val().trim();
    var category = $("#vendor-menu-category").val().trim();
    var price = $("#vendor-menu-price").val();
    var available = $("#vendor-menu-available").is(":checked");

    if (!name || !price || !category) {
      if (typeof showNotification === "function") {
        showNotification("Name, price, and category are required.", "warning");
      } else {
        alert("Name, price, and category are required.");
      }
      return;
    }

    var data = {
      name: name,
      price: price,
      category: category,
      description: description,
    };

    if (!id) {
      // create new item
      $.ajax({
        type: "POST",
        url: "/api/v1/menuItem/new",
        data: data,
        success: function () {
          if (typeof showNotification === "function") {
            showNotification("Menu item created successfully.", "success");
          } else {
            alert("Menu item created successfully.");
          }
          $("#vendorMenuItemModal").modal("hide");
          loadMenu();
        },
        error: function (err) {
          console.log(err);
          var message = "Failed to create menu item.";
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
    } else {
      // update existing item
      $.ajax({
        type: "PUT",
        url: "/api/v1/menuItem/edit/" + encodeURIComponent(id),
        data: data,
        success: function () {
          if (typeof showNotification === "function") {
            showNotification("Menu item updated successfully.", "success");
          } else {
            alert("Menu item updated successfully.");
          }
          $("#vendorMenuItemModal").modal("hide");
          loadMenu();
        },
        error: function (err) {
          console.log(err);
          var message = "Failed to update menu item.";
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
  }

  function deleteItem(id) {
    $.ajax({
      type: "DELETE",
      url: "/api/v1/menuItem/delete/" + encodeURIComponent(id),
      success: function () {
        if (typeof showNotification === "function") {
          showNotification("Menu item marked as unavailable.", "success");
        } else {
          alert("Menu item marked as unavailable.");
        }
        loadMenu();
      },
      error: function (err) {
        console.log(err);
        var message = "Failed to delete menu item.";
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

  $("#add-item-btn").click(function () {
    openAddModal();
  });

  $("#vendor-menu-save-btn").click(function () {
    saveItem();
  });

  $("#vendorMenuSearch").on("input", function () {
    var q = normalize($(this).val());
    if (!q) {
      renderMenu(allItems);
      return;
    }
    var filtered = allItems.filter(function (it) {
      return (
        normalize(it.name).includes(q) ||
        normalize(it.description).includes(q) ||
        normalize(it.category).includes(q)
      );
    });
    renderMenu(filtered);
  });

  loadMenu();
});




