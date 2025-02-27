var express = require("express");
var adminHelper = require("../helper/adminHelper");
var fs = require("fs");
const userHelper = require("../helper/userHelper");
var router = express.Router();
var db = require("../config/connection");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;
const path = require('path');


const verifySignedIn = (req, res, next) => {
  if (req.session.signedInAdmin) {
    next();
  } else {
    res.redirect("/admin/signin");
  }
};

/* GET admins listing. */
router.get("/", verifySignedIn, function (req, res, next) {
  let administator = req.session.admin;
  adminHelper.getAllProducts().then((products) => {
    res.render("admin/home", { admin: true, products, layout: "admin-layout", administator });
  });
});



router.get("/all-notifications", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let notifications = await adminHelper.getAllnotifications();
  res.render("admin/all-notifications", { admin: true, layout: "admin-layout", administator, notifications });
});

///////ADD reply/////////////////////                                         
router.get("/add-notification", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let users = await adminHelper.getAllUsers();
  res.render("admin/add-notification", { admin: true, layout: "admin-layout", administator, users });
});

///////ADD notification/////////////////////                                         
router.post("/add-notification", function (req, res) {
  adminHelper.addnotification(req.body, (id) => {
    res.redirect("/admin/all-notifications");
  });
});

router.get("/delete-notification/:id", verifySignedIn, function (req, res) {
  let notificationId = req.params.id;
  adminHelper.deletenotification(notificationId).then((response) => {
    res.redirect("/admin/all-notifications");
  });
});

///////ALL staff/////////////////////                                         
router.get("/all-staffs", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllstaffs().then((staffs) => {
    res.render("admin/staffs/all-staffs", { admin: true, layout: "admin-layout", staffs, administator });
  });
});


router.post("/delete-staff/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.STAFF_COLLECTION).deleteOne({ _id: ObjectId(req.params.id) });
  res.redirect("/admin/staffs/all-staffs");
});

///////ADD staff/////////////////////                                         
router.get("/add-staff", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  res.render("admin/staffs/add-staff", { admin: true, layout: "admin-layout", administator });
});

///////ADD staff/////////////////////                                         
router.post("/add-staff", function (req, res) {
  adminHelper.addstaff(req.body, (id) => {
    res.redirect("/admin/staffs/all-staffs");
  });
});

///////EDIT staff/////////////////////                                         
router.get("/edit-staff/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let staffId = req.params.id;
  let staff = await adminHelper.getstaffDetails(staffId);
  console.log(staff);
  res.render("admin/staff/edit-staff", { admin: true, layout: "admin-layout", staff, administator });
});

///////EDIT staff/////////////////////                                         
router.post("/edit-staff/:id", verifySignedIn, function (req, res) {
  let staffId = req.params.id;
  adminHelper.updatestaff(staffId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/staff-images/" + staffId + ".png");
      }
    }
    res.redirect("/admin/staff/all-staffs");
  });
});

///////DELETE staff/////////////////////                                         
// router.get("/delete-staff/:id", verifySignedIn, function (req, res) {
//   let staffId = req.params.id;
//   adminHelper.deletestaff(staffId).then((response) => {
//     res.redirect("/admin/all-staffs");
//   });
// });

///////DELETE ALL staff/////////////////////                                         
router.get("/delete-all-staffs", verifySignedIn, function (req, res) {
  adminHelper.deleteAllstaffs().then(() => {
    res.redirect("/admin/staff/all-staffs");
  });
});



router.get("/signup", function (req, res) {
  if (req.session.signedInAdmin) {
    res.redirect("/admin");
  } else {
    res.render("admin/signup", {
      admin: true, layout: "admin-empty",
      signUpErr: req.session.signUpErr,
    });
  }
});

router.post("/signup", function (req, res) {
  adminHelper.doSignup(req.body).then((response) => {
    console.log(response);
    if (response.status == false) {
      req.session.signUpErr = "Invalid Admin Code";
      res.redirect("/admin/signup");
    } else {
      req.session.signedInAdmin = true;
      req.session.admin = response;
      res.redirect("/admin");
    }
  });
});

router.get("/signin", function (req, res) {
  if (req.session.signedInAdmin) {
    res.redirect("/admin");
  } else {
    res.render("admin/signin", {
      admin: true, layout: "admin-empty",
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});

router.post("/signin", function (req, res) {
  adminHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedInAdmin = true;
      req.session.admin = response.admin;
      res.redirect("/admin");
    } else {
      req.session.signInErr = "Invalid Email/Password";
      res.redirect("/admin/signin");
    }
  });
});

router.get("/signout", function (req, res) {
  req.session.signedInAdmin = false;
  req.session.admin = null;
  res.redirect("/admin");
});

router.get("/all-rooms", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllrooms().then((rooms) => {
    res.render("admin/rooms/all-rooms", { admin: true, layout: "admin-layout", rooms, administator });
  });
});

router.get("/add-room", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let categories = await adminHelper.getAllCategories();
  res.render("admin/rooms/add-room", { admin: true, layout: "admin-layout", categories, administator });
});

router.post("/add-room", async (req, res) => {
  const { roomnumber } = req.body;
  let errors = {};

  // Check if files are uploaded
  if (!req.files) {
    return res.status(400).send("No files were uploaded.");
  }

  const existingNum = await db.get()
    .collection(collections.ROOM_COLLECTION)
    .findOne({ roomnumber });

  if (existingNum) {
    errors.roomnumber = "This room is already exist.";
  }

  if (Object.keys(errors).length > 0) {
    return res.render("admin/rooms/add-room", {
      admin: true,
      layout: "admin-layout",
      errors,
      roomnumber
    });
  }

  // Generate a unique ID for the room
  adminHelper.addroom(req.body, (id) => {
    const files = req.files; // Access all uploaded files
    const fileKeys = Object.keys(files); // Get keys like 'Image1', 'Image2', etc.

    // Loop through the files and save each one
    let savePromises = fileKeys.map((key, index) => {
      const image = files[key]; // Access the file
      const uploadPath = path.join(
        __dirname,
        "../public/images/room-images/",
        `${id}-${index + 1}.png` // Save as <id>-1.png, <id>-2.png, etc.
      );

      // Move the file to the destination folder
      return new Promise((resolve, reject) => {
        image.mv(uploadPath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });

    // Wait for all files to be saved
    Promise.all(savePromises)
      .then(() => {
        res.redirect("/admin/rooms/all-rooms");
      })
      .catch((err) => {
        console.error("Error saving images:", err);
        res.status(500).send("Failed to upload images.");
      });
  });
});

router.get("/edit-room/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let roomId = req.params.id;
  let room = await adminHelper.getroomDetails(roomId);
  console.log(room);
  res.render("admin/rooms/edit-room", { admin: true, layout: "admin-layout", room, administator });
});

router.post("/edit-room/:id", verifySignedIn, function (req, res) {
  let roomId = req.params.id;

  // Update room details first
  adminHelper.updateroom(roomId, req.body).then(() => {
    if (req.files) {
      const files = req.files; // Access all uploaded files
      const fileKeys = Object.keys(files); // Get keys like 'Image1', 'Image2', etc.

      // Loop through the files and save each one
      let savePromises = fileKeys.map((key, index) => {
        const image = files[key]; // Access the file
        const uploadPath = path.join(
          __dirname,
          "../public/images/room-images/",
          `${roomId}-${index + 1}.png` // Save as <roomId>-1.png, <roomId>-2.png, etc.
        );

        // Move the file to the destination folder
        return new Promise((resolve, reject) => {
          image.mv(uploadPath, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });

      // Wait for all images to be saved before redirecting
      Promise.all(savePromises)
        .then(() => {
          res.redirect("/admin/rooms/all-rooms");
        })
        .catch((err) => {
          console.error("Error saving images:", err);
          res.status(500).send("Failed to upload images.");
        });
    } else {
      // If no new images were uploaded, just redirect
      res.redirect("/admin/rooms/all-rooms");
    }
  });
});


router.post("/delete-room/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.ROOM_COLLECTION).deleteOne({ _id: ObjectId(req.params.id) });
  res.redirect("/admin/rooms/all-rooms");
});




router.get("/all-users", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllUsers().then((users) => {
    res.render("admin/users/all-users", { admin: true, layout: "admin-layout", administator, users });
  });
});

router.post("/block-user/:id", (req, res) => {
  const userId = req.params.id;
  const { reason } = req.body;

  // Update the user in the database to set isDisable to true and add the reason
  db.get()
    .collection(collections.USERS_COLLECTION)
    .updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isDisable: true, blockReason: reason } }
    )
    .then(() => res.json({ success: true }))
    .catch(err => {
      console.error('Error blocking user:', err);
      res.json({ success: false });
    });
});



router.get("/remove-all-users", verifySignedIn, function (req, res) {
  adminHelper.removeAllUsers().then(() => {
    res.redirect("/admin/all-users");
  });
});

router.get("/all-orders", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let { fromDate, toDate } = req.query; // Get fromDate and toDate from the query parameters

  try {
    let orders = await adminHelper.getAllOrders(fromDate, toDate); // Pass the date range to the function

    res.render("admin/finance", {
      admin: true,
      layout: "admin-layout",
      administator,
      orders,     // Render the filtered orders
      fromDate,   // Pass back toDate and fromDate to display on the form
      toDate
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Server Error");
  }
});


router.get(
  "/view-ordered-products/:id",
  verifySignedIn,
  async function (req, res) {
    let administator = req.session.admin;
    let orderId = req.params.id;
    let products = await userHelper.getOrderProducts(orderId);
    res.render("admin/order-products", {
      admin: true, layout: "admin-layout",
      administator,
      products,
    });
  }
);

router.get("/change-status/", verifySignedIn, function (req, res) {
  let status = req.query.status;
  let orderId = req.query.orderId;
  adminHelper.changeStatus(status, orderId).then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  adminHelper.cancelOrder(orderId).then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.get("/cancel-all-orders", verifySignedIn, function (req, res) {
  adminHelper.cancelAllOrders().then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.post("/search", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.searchProduct(req.body).then((response) => {
    res.render("admin/search-result", { admin: true, layout: "admin-layout", administator, response });
  });
});



router.get("/all-categories", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllCategories().then((categories) => {
    res.render("admin/category/all-categories", { admin: true, categories, layout: "admin-layout", administator });
  });
});


router.get("/add-category", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  res.render("admin/category/add-category", { admin: true, layout: "admin-layout", administator });
});

router.post("/add-category", function (req, res) {
  adminHelper.addCategory(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/images/category-images/" + id + ".png", (err, done) => {
      if (!err) {
        res.redirect("/admin/category/all-categories");
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/edit-category/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let categoryId = req.params.id;
  let category = await adminHelper.getCategoryDetails(categoryId);
  console.log(category);
  res.render("admin/category/edit-category", { admin: true, category, layout: "admin-layout", administator });
});

router.post("/edit-category/:id", verifySignedIn, function (req, res) {
  let categoryId = req.params.id;
  adminHelper.updateCategory(categoryId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/category-images/" + categoryId + ".png");
      }
    }
    res.redirect("/admin/category/all-categories");
  });
});

router.post("/delete-category/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.CATEGORY_COLLECTION).deleteOne({ _id: ObjectId(req.params.id) });
  res.redirect("/admin/category/all-categories");
});


module.exports = router;
