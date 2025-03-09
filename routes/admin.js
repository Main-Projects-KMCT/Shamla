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
router.post("/add-staff", async function (req, res) {
  const { staffname, email, phone, username, password, address } = req.body;
  let errors = {};


  // Check if username already exists
  const existingUsername = await db.get()
    .collection(collections.STAFF_COLLECTION)
    .findOne({ username });

  if (existingUsername) {
    errors.username = "This username is already registered.";
  }

  // Check if username already exists
  const existingEmail = await db.get()
    .collection(collections.STAFF_COLLECTION)
    .findOne({ email });

  if (existingEmail) {
    errors.email = "This email is already registered.";
  }


  // Check if username already exists
  if (!phone) {
    errors.phone = "Please enter your phone number.";
  } else if (!/^\d{10}$/.test(phone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
  } else {
    const existingPhone = await db.get()
      .collection(collections.STAFF_COLLECTION)
      .findOne({ phone });

    if (existingPhone) {
      errors.phone = "This phone number is already registered.";
    }
  }

  if (!password) {
    errors.password = "Please enter a password.";
  } else {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      errors.password = "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.";
    }
  }


  if (Object.keys(errors).length > 0) {
    return res.render("admin/staffs/add-staff", {
      admin: true,
      layout: 'admin-layout',
      errors,
      staffname,
      username,
      email,
      phone,
      password,
      address
    });
  }
  adminHelper.addstaff(req.body, (id) => {
    res.redirect("/admin/staffs/all-staffs");
  });
});

// Check if email exists
router.post("/check-email", async (req, res) => {
  const { email } = req.body;
  const existingEmail = await db.get()
    .collection(collections.STAFF_COLLECTION)
    .findOne({ email });

  res.json({ exists: !!existingEmail }); // Returns true if exists, otherwise false
});

// Check if phone number exists
router.post("/check-phone", async (req, res) => {
  const { phone } = req.body;
  const existingPhone = await db.get()
    .collection(collections.STAFF_COLLECTION)
    .findOne({ phone });

  res.json({ exists: !!existingPhone }); // Returns true if exists, otherwise false
});

// Check if username exists
router.post("/check-username", async (req, res) => {
  const { username } = req.body;
  const existingUsername = await db.get()
    .collection(collections.STAFF_COLLECTION)
    .findOne({ username });

  res.json({ exists: !!existingUsername }); // Returns true if exists, otherwise false
});


///////EDIT staff/////////////////////                                         
router.get("/edit-staff/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let staffId = req.params.id;
  let staff = await adminHelper.getstaffDetails(staffId);
  console.log(staff);
  res.render("admin/staffs/edit-staff", { admin: true, layout: "admin-layout", staff, administator });
});

///////EDIT staff/////////////////////                                         
router.post("/edit-staff/:id", verifySignedIn, async function (req, res) {
  // const { staffname, email, phone, username } = req.body;
  // let errors = {};


  // // Check if username already exists
  // const existingUsername = await db.get()
  //   .collection(collections.STAFF_COLLECTION)
  //   .findOne({ username });

  // if (existingUsername) {
  //   errors.username = "This username is already registered.";
  // }

  // // Check if username already exists
  // const existingEmail = await db.get()
  //   .collection(collections.STAFF_COLLECTION)
  //   .findOne({ email });

  // if (existingEmail) {
  //   errors.email = "This email is already registered.";
  // }


  // // Check if username already exists
  // if (!phone) {
  //   errors.phone = "Please enter your phone number.";
  // } else if (!/^\d{10}$/.test(phone)) {
  //   errors.phone = "Phone number must be exactly 10 digits.";
  // } else {
  //   const existingPhone = await db.get()
  //     .collection(collections.STAFF_COLLECTION)
  //     .findOne({ phone });

  //   if (existingPhone) {
  //     errors.phone = "This phone number is already registered.";
  //   }
  // }


  // if (Object.keys(errors).length > 0) {
  //   return res.render("admin/edit-staff/:id", {
  //     admin: true,
  //     layout: 'admin-layout',
  //     errors,
  //     username,
  //     email,
  //     phone,
  //   });
  // }



  let staffId = req.params.id;
  adminHelper.updatestaff(staffId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/staff-images/" + staffId + ".png");
      }
    }
    res.redirect("/admin/staffs/all-staffs");
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
  let categories = await adminHelper.getAllCategories();

  console.log(room);
  res.render("admin/rooms/edit-room", { admin: true, layout: "admin-layout", room, administator, categories });
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

  // Extract filters from query params
  let { fromDate, toDate, selecteddate, totalAmount, userId, roomNumber } = req.query;

  let filters = { fromDate, toDate, selecteddate, totalAmount, userId, roomNumber };

  try {
    let orders = await adminHelper.getAllOrders(filters);

    res.render("admin/all-orders", {
      admin: true,
      layout: "admin-layout",
      administator,
      orders,
      filters  // Send filters to retain values in the form
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

router.get("/change-status/", verifySignedIn, async function (req, res) {

  try {

    const { status, orderId, phone } = req.query;

    // Update order status in the database
    await db.get().collection(collections.ORDER_COLLECTION).updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status } }
    );

    // If the status is "Confirmed", redirect to WhatsApp
    if (status === "Confirmed" && phone) {
      const message = encodeURIComponent(
        `✅ Your booking has been CONFIRMED!\n\nThank you for choosing us! 🏨`
      );
      return res.redirect(`https://wa.me/${phone}?text=${message}`);
    }

    if (status === "Declined" && phone) {
      const message = encodeURIComponent(
        `❌ Your booking has been Declined!\n\nSorry for your inconvenience`
      );
      return res.redirect(`https://wa.me/${phone}?text=${message}`);
    }

    res.redirect("/admin/all-orders");
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).send("Internal Server Error");
  }
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


router.get("/all-payments", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let { fromDate, toDate } = req.query;
  let orders = await adminHelper.getAllOrders(fromDate, toDate);
  res.render("admin/payment/all-payments", { admin: true, orders, layout: "admin-layout", administator });
});







router.get("/all-discounts", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllDiscounts().then((discounts) => {
    res.render("admin/discount/all-discounts", { admin: true, discounts, layout: "admin-layout", administator });
  });
});


router.get("/add-discount", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let rooms = await adminHelper.getAllrooms()
  res.render("admin/discount/add-discount", { admin: true, layout: "admin-layout", administator, rooms });
});

router.post("/add-discount", function (req, res) {
  adminHelper.addDiscount(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/images/discounts-images/" + id + ".png", (err, done) => {
      if (!err) {
        res.redirect("/admin/discount/all-discounts");
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/edit-discounts/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let discountsId = req.params.id;
  let discounts = await adminHelper.getDiscountDetails(discountsId);
  console.log(discounts);
  res.render("admin/discount/edit-discount", { admin: true, discounts, layout: "admin-layout", administator });
});

router.post("/edit-discount/:id", verifySignedIn, function (req, res) {
  let discountsId = req.params.id;
  adminHelper.updateDiscounts(discountsId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/discounts-images/" + discountsId + ".png");
      }
    }
    res.redirect("/admin/discount/all-discounts");
  });
});

router.post("/delete-discount/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.DISCOUNTS_COLLECTION).deleteOne({ _id: ObjectId(req.params.id) });
  res.redirect("/admin/discount/all-discounts");
});




//////ALL staff/////////////////////                                         
router.get("/assigned-staffs", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let users = await adminHelper.getAllUsers()
  let orders = await adminHelper.getAllOrders()
  let assignstaffs = await adminHelper.getAllassigns()
  console.log("-------", assignstaffs);

  res.render("admin/staffs/assigned-staffs", { admin: true, layout: "admin-layout", assignstaffs, users, orders, administator });
});


router.post("/delete-assign/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.ASSIGN_STAFF).deleteOne({ _id: ObjectId(req.params.id) });
  res.redirect("/admin/staffs/assigned-staffs");
});

///////ADD staff/////////////////////                                         
router.get("/assign-staff", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let staffs = await adminHelper.getAllstaffs()
  let orders = await adminHelper.getAllOrders()
  res.render("admin/staffs/assign-staff", { admin: true, staffs, orders, layout: "admin-layout", administator });
});

///////ADD staff/////////////////////                                         
router.post("/assign-staff", async function (req, res) {
  adminHelper.assignstaff(req.body, (id) => {
    res.redirect("/admin/staffs/assigned-staffs");
  });
});


module.exports = router;
