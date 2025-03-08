var express = require("express");
var staffHelper = require("../helper/staffHelper");
var fs = require("fs");
const userHelper = require("../helper/userHelper");
const adminHelper = require("../helper/adminHelper");

var router = express.Router();
var db = require("../config/connection");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;


const verifySignedIn = (req, res, next) => {
  if (req.session.signedInStaff) {
    next();
  } else {
    res.redirect("/staff/signin");
  }
};

/* GET admins listing. */
router.get("/", verifySignedIn, function (req, res, next) {
  let staff = req.session.staff;
  res.render("staff/home", { staff: true, layout: "admin-layout", staff });
});


///////ALL notification/////////////////////                                         
router.get("/all-notifications", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;

  // Ensure you have the staff's ID available
  let staffId = staff._id; // Adjust based on how staff ID is stored in session

  // Pass staffId to getAllOrders
  let orders = await staffHelper.getAllOrders(staffId);
  let notifications = await staffHelper.getAllnotifications(staffId)
  res.render("staff/all-notifications", { staff: true, layout: "layout", notifications, staff, orders });
});

///////ADD notification/////////////////////                                         
router.get("/add-notification", verifySignedIn, function (req, res) {
  let staff = req.session.staff;
  res.render("staff/all-notifications", { staff: true, layout: "layout", staff });
});

///////ADD notification/////////////////////                                         
router.post("/add-notification", function (req, res) {
  staffHelper.addnotification(req.body, (id) => {
    res.redirect("/staff/all-notifications");
  });
});

router.get("/delete-notification/:id", verifySignedIn, function (req, res) {
  let notificationId = req.params.id;
  adminHelper.deletenotification(notificationId).then((response) => {
    res.redirect("/staff/all-notifications");
  });
});

///////EDIT notification/////////////////////                                         
router.get("/edit-notification/:id", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;
  let notificationId = req.params.id;
  let notification = await staffHelper.getnotificationDetails(notificationId);
  console.log(notification);
  res.render("staff/edit-notification", { staff: true, layout: "layout", notification, staff });
});

///////EDIT notification/////////////////////                                         
router.post("/edit-notification/:id", verifySignedIn, function (req, res) {
  let notificationId = req.params.id;
  staffHelper.updatenotification(notificationId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/notification-images/" + notificationId + ".png");
      }
    }
    res.redirect("/staff/all-notifications");
  });
});

///////DELETE notification/////////////////////                                         
router.get("/delete-notification/:id", verifySignedIn, function (req, res) {
  let notificationId = req.params.id;
  staffHelper.deletenotification(notificationId).then((response) => {
    res.redirect("/staff/all-notifications");
  });
});

///////DELETE ALL notification/////////////////////                                         
router.get("/delete-all-notifications", verifySignedIn, function (req, res) {
  staffHelper.deleteAllnotifications().then(() => {
    res.redirect("/staff/all-notifications");
  });
});


////////////////////PROFILE////////////////////////////////////
router.get("/profile", async function (req, res, next) {
  let staff = req.session.staff;
  res.render("staff/profile", { staff: true, layout: "layout", staff });
});


///////ALL workspace/////////////////////                                         
// router.get("/all-feedbacks", verifySignedIn, async function (req, res) {
//   let staff = req.session.staff;

//   const workspaceId = req.params.id;

//   console.log('workspace')

//   try {
//     const workspace = await userHelper.getWorkspaceById(workspaceId);
//     const feedbacks = await userHelper.getFeedbackByWorkspaceId(workspaceId); // Fetch feedbacks for the specific workspace
//     console.log('feedbacks', feedbacks)
//     res.render("staff/all-feedbacks", { staff: true, layout: "layout", workspace, feedbacks, staff });
//   } catch (error) {
//     console.error("Error fetching workspace:", error);
//     res.status(500).send("Server Error");
//   }

// });


router.get("/staff-feedback", async function (req, res) {
  let staff = req.session.staff; // Get the staff from session

  if (!staff) {
    return res.status(403).send("Staff not logged in");
  }

  try {
    // Fetch feedback for this staff
    const feedbacks = await staffHelper.getFeedbackByStaffId(staff._id);

    // Fetch workspace details for each feedback
    const feedbacksWithWorkspaces = await Promise.all(feedbacks.map(async feedback => {
      const workspace = await userHelper.getWorkspaceById(ObjectId(feedback.workspaceId)); // Convert workspaceId to ObjectId
      if (workspace) {
        feedback.workspaceName = workspace.name; // Attach workspace name to feedback
      }
      return feedback;
    }));

    // Render the feedback page with staff, feedbacks, and workspace data
    res.render("staff/all-feedbacks", {
      staff,  // Staff details
      feedbacks: feedbacksWithWorkspaces // Feedback with workspace details
    });
  } catch (error) {
    console.error("Error fetching feedback and workspaces:", error);
    res.status(500).send("Server Error");
  }
});



///////ALL workspace/////////////////////                                         
router.get("/all-workspaces", verifySignedIn, function (req, res) {
  let staff = req.session.staff;
  staffHelper.getAllworkspaces(req.session.staff._id).then((workspaces) => {
    res.render("staff/all-workspaces", { staff: true, layout: "layout", workspaces, staff });
  });
});

///////ADD workspace/////////////////////                                         
router.get("/add-workspace", verifySignedIn, function (req, res) {
  let staff = req.session.staff;
  res.render("staff/add-workspace", { staff: true, layout: "layout", staff });
});

///////ADD workspace/////////////////////                                         
router.post("/add-workspace", function (req, res) {
  // Ensure the staff is signed in and their ID is available
  if (req.session.signedInStaff && req.session.staff && req.session.staff._id) {
    const staffId = req.session.staff._id; // Get the staff's ID from the session

    // Pass the staffId to the addworkspace function
    staffHelper.addworkspace(req.body, staffId, (workspaceId, error) => {
      if (error) {
        console.log("Error adding workspace:", error);
        res.status(500).send("Failed to add workspace");
      } else {
        let image = req.files.Image;
        image.mv("./public/images/workspace-images/" + workspaceId + ".png", (err) => {
          if (!err) {
            res.redirect("/staff/all-workspaces");
          } else {
            console.log("Error saving workspace image:", err);
            res.status(500).send("Failed to save workspace image");
          }
        });
      }
    });
  } else {
    // If the staff is not signed in, redirect to the sign-in page
    res.redirect("/staff/signin");
  }
});


///////EDIT workspace/////////////////////                                         
router.get("/edit-workspace/:id", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;
  let workspaceId = req.params.id;
  let workspace = await staffHelper.getworkspaceDetails(workspaceId);
  console.log(workspace);
  res.render("staff/edit-workspace", { staff: true, layout: "layout", workspace, staff });
});

///////EDIT workspace/////////////////////                                         
router.post("/edit-workspace/:id", verifySignedIn, function (req, res) {
  let workspaceId = req.params.id;
  staffHelper.updateworkspace(workspaceId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/workspace-images/" + workspaceId + ".png");
      }
    }
    res.redirect("/staff/all-workspaces");
  });
});

///////DELETE workspace/////////////////////                                         
router.get("/delete-workspace/:id", verifySignedIn, function (req, res) {
  let workspaceId = req.params.id;
  staffHelper.deleteworkspace(workspaceId).then((response) => {
    fs.unlinkSync("./public/images/workspace-images/" + workspaceId + ".png");
    res.redirect("/staff/all-workspaces");
  });
});

///////DELETE ALL workspace/////////////////////                                         
router.get("/delete-all-workspaces", verifySignedIn, function (req, res) {
  staffHelper.deleteAllworkspaces().then(() => {
    res.redirect("/staff/all-workspaces");
  });
});


router.get("/all-users", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;

  // Ensure you have the staff's ID available
  let staffId = staff._id; // Adjust based on how staff ID is stored in session

  // Pass staffId to getAllOrders
  let orders = await staffHelper.getAllOrders(staffId);

  res.render("staff/all-users", {
    staff: true,
    layout: "layout",
    orders,
    staff
  });
});

router.get("/all-transactions", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;

  // Ensure you have the staff's ID available
  let staffId = staff._id; // Adjust based on how staff ID is stored in session

  // Pass staffId to getAllOrders
  let orders = await staffHelper.getAllOrders(staffId);

  res.render("staff/all-transactions", {
    staff: true,
    layout: "layout",
    orders,
    staff
  });
});

router.get("/pending-approval", function (req, res) {
  if (!req.session.signedInStaff || req.session.staff.approved) {
    res.redirect("/staff");
  } else {
    res.render("staff/pending-approval", {
      staff: true, layout: "empty",
    });
  }
});


router.get("/signup", function (req, res) {
  if (req.session.signedInStaff) {
    res.redirect("/staff");
  } else {
    res.render("staff/signup", {
      staff: true, layout: "empty",
      signUpErr: req.session.signUpErr,
    });
  }
});

router.post("/signup", async function (req, res) {
  const { Companyname, Email, Phone, Address, City, Pincode, Password } = req.body;
  let errors = {};

  // Field validations
  if (!Companyname) errors.Companyname = "Please enter your company name.";
  if (!Email) errors.email = "Please enter your email.";
  if (!Phone) errors.phone = "Please enter your phone number.";
  if (!Address) errors.address = "Please enter your address.";
  if (!City) errors.city = "Please enter your city.";
  if (!Pincode) errors.pincode = "Please enter your pincode.";
  if (!Password) errors.password = "Please enter a password.";

  // Check if email or company name already exists
  const existingEmail = await db.get()
    .collection(collections.STAFF_COLLECTION)
    .findOne({ Email });
  if (existingEmail) errors.email = "This email is already registered.";

  const existingCompanyname = await db.get()
    .collection(collections.STAFF_COLLECTION)
    .findOne({ Companyname });
  if (existingCompanyname) errors.Companyname = "This company name is already registered.";

  // Validate Pincode and Phone
  if (!/^\d{6}$/.test(Pincode)) errors.pincode = "Pincode must be exactly 6 digits.";
  if (!/^\d{10}$/.test(Phone)) errors.phone = "Phone number must be exactly 10 digits.";
  const existingPhone = await db.get()
    .collection(collections.STAFF_COLLECTION)
    .findOne({ Phone });
  if (existingPhone) errors.phone = "This phone number is already registered.";

  // If there are validation errors, re-render the form
  if (Object.keys(errors).length > 0) {
    return res.render("staff/signup", {
      staff: true,
      layout: 'empty',
      errors,
      Companyname,
      Email,
      Phone,
      Address,
      City,
      Pincode,
      Password
    });
  }

  staffHelper.dosignup(req.body).then((response) => {
    if (!response) {
      req.session.signUpErr = "Invalid Admin Code";
      return res.redirect("/staff/signup");
    }

    // Extract the id properly, assuming it's part of an object (like MongoDB ObjectId)
    const id = response._id ? response._id.toString() : response.toString();

    // Ensure the images directory exists
    const imageDir = "./public/images/staff-images/";
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    // Handle image upload
    if (req.files && req.files.Image) {
      let image = req.files.Image;
      let imagePath = imageDir + id + ".png";  // Use the extracted id here

      console.log("Saving image to:", imagePath);  // Log the correct image path

      image.mv(imagePath, (err) => {
        if (!err) {
          // On successful image upload, redirect to pending approval
          req.session.signedInStaff = true;
          req.session.staff = response;
          res.redirect("/staff/pending-approval");
        } else {
          console.log("Error saving image:", err);  // Log any errors
          res.status(500).send("Error uploading image");
        }
      });
    } else {
      // No image uploaded, proceed without it
      req.session.signedInStaff = true;
      req.session.staff = response;
      res.redirect("/staff/pending-approval");
    }
  }).catch((err) => {
    console.log("Error during signup:", err);
    res.status(500).send("Error during signup");
  });
}),


  router.get("/signin", function (req, res) {
    if (req.session.signedInStaff) {
      res.redirect("/staff");
    } else {
      res.render("staff/signin", {
        staff: true, layout: "empty",
        signInErr: req.session.signInErr,
      });
      req.session.signInErr = null;
    }
  });

router.post("/signin", function (req, res) {
  const { username, password } = req.body;

  // Validate Email and password
  if (!username || !password) {
    req.session.signInErr = "Please fill all fields.";
    return res.redirect("/staff/signin");
  }

  staffHelper.doSignin(req.body)
    .then((response) => {
      if (response.status === true) {
        req.session.signedInStaff = true;
        req.session.staff = response.staff;
        res.redirect("/staff");
      } else {
        req.session.signInErr = "Invalid Username/Password";
        res.redirect("/staff/signin");
      }
    })
    .catch((error) => {
      console.error(error);
      req.session.signInErr = "An error occurred. Please try again.";
      res.redirect("/staff/signin");
    });
});




router.get("/signout", function (req, res) {
  req.session.signedInStaff = false;
  req.session.staff = null;
  res.redirect("/staff");
});

router.get("/add-product", verifySignedIn, function (req, res) {
  let staff = req.session.staff;
  res.render("staff/add-product", { staff: true, layout: "layout", workspace });
});

router.post("/add-product", function (req, res) {
  staffHelper.addProduct(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/images/product-images/" + id + ".png", (err, done) => {
      if (!err) {
        res.redirect("/staff/add-product");
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/edit-product/:id", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;
  let productId = req.params.id;
  let product = await staffHelper.getProductDetails(productId);
  console.log(product);
  res.render("staff/edit-product", { staff: true, layout: "layout", product, workspace });
});

router.post("/edit-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  staffHelper.updateProduct(productId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/product-images/" + productId + ".png");
      }
    }
    res.redirect("/staff/all-products");
  });
});

router.get("/delete-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  staffHelper.deleteProduct(productId).then((response) => {
    fs.unlinkSync("./public/images/product-images/" + productId + ".png");
    res.redirect("/staff/all-products");
  });
});

router.get("/delete-all-products", verifySignedIn, function (req, res) {
  staffHelper.deleteAllProducts().then(() => {
    res.redirect("/staff/all-products");
  });
});

router.get("/all-users", verifySignedIn, function (req, res) {
  let staff = req.session.staff;
  staffHelper.getAllUsers().then((users) => {
    res.render("staff/users/all-users", { staff: true, layout: "layout", workspace, users });
  });
});

router.get("/remove-user/:id", verifySignedIn, function (req, res) {
  let userId = req.params.id;
  staffHelper.removeUser(userId).then(() => {
    res.redirect("/staff/all-users");
  });
});

router.get("/remove-all-users", verifySignedIn, function (req, res) {
  staffHelper.removeAllUsers().then(() => {
    res.redirect("/staff/all-users");
  });
});

router.get("/all-orders", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;

  // Ensure you have the staff's ID available
  let staffId = staff._id; // Adjust based on how staff ID is stored in session

  // Pass staffId to getAllOrders
  let orders = await staffHelper.getAllOrders(staffId);

  res.render("staff/all-orders", {
    staff: true,
    layout: "layout",
    orders,
    staff
  });
});

router.get(
  "/view-ordered-products/:id",
  verifySignedIn,
  async function (req, res) {
    let staff = req.session.staff;
    let orderId = req.params.id;
    let products = await userHelper.getOrderProducts(orderId);
    res.render("staff/order-products", {
      staff: true, layout: "layout",
      workspace,
      products,
    });
  }
);

router.get("/change-status/", verifySignedIn, function (req, res) {
  let status = req.query.status;
  let orderId = req.query.orderId;
  staffHelper.changeStatus(status, orderId).then(() => {
    res.redirect("/staff/all-orders");
  });
});

router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  staffHelper.cancelOrder(orderId).then(() => {
    res.redirect("/staff/all-orders");
  });
});

router.get("/cancel-all-orders", verifySignedIn, function (req, res) {
  staffHelper.cancelAllOrders().then(() => {
    res.redirect("/staff/all-orders");
  });
});

router.post("/search", verifySignedIn, function (req, res) {
  let staff = req.session.staff;
  staffHelper.searchProduct(req.body).then((response) => {
    res.render("staff/search-result", { staff: true, layout: "layout", workspace, response });
  });
});


router.get("/bookings", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;
  let { fromDate, toDate } = req.query;
  let users = await adminHelper.getAllUsers();
  let orders = await adminHelper.getAllOrders(fromDate, toDate);
  res.render("staff/rooms/bookings", { admin: false, layout: "admin-layout", orders, users, staff });
});


router.get("/assigned/:staffId", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;
  let users = await adminHelper.getAllUsers();
  const staffId = req.params.staffId;
  let assignedrooms = await staffHelper.getAllassignsById(staffId);
  res.render("staff/rooms/assigned", { admin: false, layout: "admin-layout", assignedrooms, users, staff });
});

router.post("/delete-assign/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.ASSIGN_STAFF).deleteOne({ _id: ObjectId(req.params.id) });
  res.redirect("/staff");
});

router.get("/cancel-room/:id", verifySignedIn, function (req, res) {
  let assignId = req.params.id;
  staffHelper.cancelAssign(assignId).then(() => {
    res.redirect("/staff/assigned");
  });
});

router.get("/cancel-booking/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  adminHelper.cancelOrder(orderId).then(() => {
    res.redirect("/staff/bookings");
  });
});




router.get("/all-rooms", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;
  let users = await adminHelper.getAllUsers();
  let rooms = await adminHelper.getAllrooms();
  res.render("staff/rooms/all-rooms", { admin: false, layout: "admin-layout", rooms, users, staff });
});


///////ADD notification/////////////////////                                         
router.post("/assign-room", function (req, res) {
  staffHelper.assignRoomToUser(req.body, (id) => {
    res.redirect("/staff/rooms/all-rooms");
  });
});


module.exports = router;
