var express = require("express");
var userHelper = require("../helper/userHelper");
var adminHelper = require("../helper/adminHelper");

var router = express.Router();
var db = require("../config/connection");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;

const verifySignedIn = (req, res, next) => {
  if (req.session.signedIn) {
    next();
  } else {
    res.redirect("/signin");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let categories = await adminHelper.getAllCategories();
  adminHelper.getAllrooms().then((rooms) => {
    res.render("users/home", { admin: false, rooms, categories, user });
  });
});


router.get("/all-rooms", async function (req, res, next) {
  let user = req.session.user;
  let categories = await adminHelper.getAllCategories();
  adminHelper.getAllrooms().then((rooms) => {
    res.render("users/all-rooms", { admin: false, categories, rooms, user });
  });
});


router.get("/offers", async function (req, res, next) {
  let user = req.session.user;
  let offers = await adminHelper.getAllDiscounts();
  adminHelper.getAllrooms().then((rooms) => {
    res.render("users/offers", { admin: false, offers, rooms, user });
  });
});



// // Render Update Order Page
// router.get("/update-order", (req, res) => {
//   res.render("users/updateorder");
// });

// // Update Order API
// router.put("/update-order/:userId", async (req, res) => {
//   const { userId } = req.params;
//   const updatedData = req.body;

//   try {
//     const result = await orderHelper.updateOrder(userId, updatedData);
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// });

// router.get("/rooms/:id", async function (req, res, next) {
//   let user = req.session.user;
//   let categories = await adminHelper.getAllCategories();
//   adminHelper.getAllrooms().then((rooms) => {
//     res.render("users/rooms", { admin: false, categories, rooms, user });
//   });
// });

router.get("/rooms/:id", async (req, res) => {
  let user = req.session.user;
  try {
    let categoryId = req.params.id; // Get category ID from URL
    let rooms = await adminHelper.getRoomsByCategory(categoryId); // Fetch rooms

    res.render("users/rooms", { admin: false, rooms, user }); // Render the rooms page
  } catch (error) {
    console.error("Error fetching rooms by category:", error);
    res.status(500).send("Internal Server Error");
  }
});


// router.get("/rooms/:categoryId", async (req, res) => {
//   try {
//     let categoryId = req.params.categoryId; // Get category ID from URL
//     let rooms = await roomHelpers.getRoomsByCategory(categoryId); // Fetch rooms

//     res.render("rooms", { rooms }); // Render rooms page with filtered rooms
//   } catch (error) {
//     console.error("Error fetching rooms by category:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });



router.get("/notifications", verifySignedIn, function (req, res) {
  let user = req.session.user;  // Get logged-in user from session

  // Use the user._id to fetch notifications for the logged-in user
  userHelper.getnotificationById(user._id).then((notifications) => {
    res.render("users/notifications", { admin: false, notifications, user });
  }).catch((err) => {
    console.error("Error fetching notifications:", err);
    res.status(500).send("Error fetching notifications");
  });
});

router.get("/about", async function (req, res) {
  res.render("users/about", { admin: false, });
})


router.get("/contact", async function (req, res) {
  res.render("users/contact", { admin: false, });
})

router.get("/service", async function (req, res) {
  res.render("users/service", { admin: false, });
})


router.post("/add-feedback", async function (req, res) {
  let user = req.session.user; // Ensure the user is logged in and the session is set
  let feedbackText = req.body.text; // Get feedback text from form input
  let username = req.body.username; // Get username from form input
  let roomId = req.body.roomId; // Get room ID from form input
  let staffId = req.body.staffId; // Get staff ID from form input

  if (!user) {
    return res.status(403).send("User not logged in");
  }

  try {
    const feedback = {
      userId: ObjectId(user._id), // Convert user ID to ObjectId
      roomId: ObjectId(roomId), // Convert room ID to ObjectId
      staffId: ObjectId(staffId), // Convert staff ID to ObjectId
      text: feedbackText,
      username: username,
      createdAt: new Date() // Store the timestamp
    };

    await userHelper.addFeedback(feedback);
    res.redirect("/single-room/" + roomId); // Redirect back to the room page
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).send("Server Error");
  }
});



router.get("/single-room/:id", async function (req, res) {
  let user = req.session.user;
  const roomId = req.params.id;

  try {
    const room = await userHelper.getRoomById(roomId);

    if (!room) {
      return res.status(404).send("Room not found");
    }
    const feedbacks = await userHelper.getFeedbackByRoomId(roomId); // Fetch feedbacks for the specific room

    res.render("users/single-room", {
      admin: false,
      user,
      room,
      feedbacks
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).send("Server Error");
  }
});




////////////////////PROFILE////////////////////////////////////
router.get("/profile", async function (req, res, next) {
  let user = req.session.user;
  res.render("users/profile", { admin: false, user });
});

////////////////////USER TYPE////////////////////////////////////
router.get("/usertype", async function (req, res, next) {
  res.render("users/usertype", { admin: false, layout: 'empty' });
});





router.get("/signup", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    res.render("users/signup", { admin: false, layout: 'empty' });
  }
});

router.post("/signup", async function (req, res) {
  const { Fname, Email, Phone, Address, Pincode, District, Password } = req.body;
  let errors = {};

  // Check if email already exists
  const existingEmail = await db.get()
    .collection(collections.USERS_COLLECTION)
    .findOne({ Email });

  if (existingEmail) {
    errors.email = "This email is already registered.";
  }

  // Validate phone number length and uniqueness

  if (!Phone) {
    errors.phone = "Please enter your phone number.";
  } else if (!/^\d{10}$/.test(Phone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
  } else {
    const existingPhone = await db.get()
      .collection(collections.USERS_COLLECTION)
      .findOne({ Phone });

    if (existingPhone) {
      errors.phone = "This phone number is already registered.";
    }
  }
  // Validate Pincode
  if (!Pincode) {
    errors.pincode = "Please enter your pincode.";
  } else if (!/^\d{6}$/.test(Pincode)) {
    errors.pincode = "Pincode must be exactly 6 digits.";
  }

  if (!Fname) errors.fname = "Please enter your first name.";
  if (!Email) errors.email = "Please enter your email.";
  if (!Address) errors.address = "Please enter your address.";
  if (!District) errors.district = "Please enter your city.";

  // Password validation
  if (!Password) {
    errors.password = "Please enter a password.";
  } else {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    if (!strongPasswordRegex.test(Password)) {
      errors.password = "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.render("users/signup", {
      admin: false,
      layout: 'empty',
      errors,
      Fname,
      Email,
      Phone,
      Address,
      Pincode,
      District,
      Password
    });
  }

  // Proceed with signup
  userHelper.doSignup(req.body).then((response) => {
    req.session.signedIn = true;
    req.session.user = response;
    res.redirect("/");
  }).catch((err) => {
    console.error("Signup error:", err);
    res.status(500).send("An error occurred during signup.");
  });
});


router.get("/signin", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    res.render("users/signin", {
      admin: false,
      layout: 'empty',
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});


router.post("/signin", function (req, res) {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    req.session.signInErr = "Please fill in all fields.";
    return res.render("users/signin", {
      admin: false,
      layout: 'empty',
      signInErr: req.session.signInErr,
      email: Email,
      password: Password,
    });
  }

  userHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedIn = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      // If the user is disabled, display the message
      req.session.signInErr = response.msg || "Invalid Email/Password";
      res.render("users/signin", {
        admin: false,
        layout: 'empty',
        signInErr: req.session.signInErr,
        email: Email
      });
    }
  });
});




router.get("/signout", function (req, res) {
  req.session.signedIn = false;
  req.session.user = null;
  res.redirect("/");
});

router.get("/edit-profile/:id", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  let userProfile = await userHelper.getUserDetails(userId);
  res.render("users/edit-profile", { admin: false, userProfile, user });
});

router.post("/edit-profile/:id", verifySignedIn, async function (req, res) {
  try {
    const { Fname, Lname, Email, Phone, Address, District, Pincode } = req.body;
    let errors = {};

    // Validate first name
    if (!Fname || Fname.trim().length === 0) {
      errors.fname = 'Please enter your first name.';
    }

    if (!District || District.trim().length === 0) {
      errors.district = 'Please enter your first name.';
    }

    // Validate last name
    if (!Lname || Lname.trim().length === 0) {
      errors.lname = 'Please enter your last name.';
    }

    // Validate email format
    if (!Email || !/^\S+@\S+\.\S+$/.test(Email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // Validate phone number
    if (!Phone) {
      errors.phone = "Please enter your phone number.";
    } else if (!/^\d{10}$/.test(Phone)) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }


    // Validate pincode
    if (!Pincode) {
      errors.pincode = "Please enter your pincode.";
    } else if (!/^\d{6}$/.test(Pincode)) {
      errors.pincode = "Pincode must be exactly 6 digits.";
    }

    if (!Fname) errors.fname = "Please enter your first name.";
    if (!Lname) errors.lname = "Please enter your last name.";
    if (!Email) errors.email = "Please enter your email.";
    if (!Address) errors.address = "Please enter your address.";
    if (!District) errors.district = "Please enter your district.";

    // Validate other fields as needed...

    // If there are validation errors, re-render the form with error messages
    if (Object.keys(errors).length > 0) {
      let userProfile = await userHelper.getUserDetails(req.params.id);
      return res.render("users/edit-profile", {
        admin: false,
        userProfile,
        user: req.session.user,
        errors,
        Fname,
        Lname,
        Email,
        Phone,
        Address,
        District,
        Pincode,
      });
    }

    // Update the user profile
    await userHelper.updateUserProfile(req.params.id, req.body);

    // Fetch the updated user profile and update the session
    let updatedUserProfile = await userHelper.getUserDetails(req.params.id);
    req.session.user = updatedUserProfile;

    // Redirect to the profile page
    res.redirect("/profile");
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).send("An error occurred while updating the profile.");
  }
});





router.get('/place-order/:id', verifySignedIn, async (req, res) => {
  const roomId = req.params.id;

  // Validate the room ID
  if (!ObjectId.isValid(roomId)) {
    return res.status(400).send('Invalid room ID format');
  }

  let user = req.session.user;

  // Fetch the product details by ID
  let room = await userHelper.getRoomDetails(roomId);

  // If no room is found, handle the error
  if (!room) {
    return res.status(404).send('Room not found');
  }

  // Render the place-order page with room details
  res.render('users/place-order', { user, room });
});

router.post('/place-order', async (req, res) => {
  let user = req.session.user;
  let roomId = req.body.roomId;

  // Fetch room details
  let room = await userHelper.getRoomDetails(roomId);
  if (!room) {
    return res.status(404).send("Room not found");
  }

  let totalPrice = room.Price; // Default: Full price
  let advanceAmount = room.AdvPrice; // Advance payment amount
  let selectedPaymentMethod = req.body["payment-method"];

  // Determine the amount to charge based on the payment method
  let paymentAmount = selectedPaymentMethod === "ADVANCE" ? advanceAmount : totalPrice;

  // Call placeOrder function
  userHelper.placeOrder(req.body, room, paymentAmount, user)
    .then((orderId) => {
      if (selectedPaymentMethod === "COD") {
        res.json({ codSuccess: true });
      } else {
        // Pass the correct amount to Razorpay (Advance or Full)
        userHelper.generateRazorpay(orderId, paymentAmount).then((response) => {
          res.json(response);
        });
      }
    })
    .catch((err) => {
      console.error("Error placing order:", err);
      res.status(500).send("Internal Server Error");
    });
});




router.post("/verify-payment", async (req, res) => {
  console.log(req.body);

  userHelper
    .verifyPayment(req.body)
    .then(() => {
      // Ensure the correct order ID is updated
      userHelper.changePaymentStatus(req.body["order[receipt]"], req.body.amountPaid).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false, errMsg: "Payment Failed" });
    });
});


router.get("/order-placed", verifySignedIn, async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  // le = await userHelper.g(userId);
  res.render("users/order-placed", { admin: false, user });
});

router.get("/orders", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  // Fetch user orders
  let orders = await userHelper.getUserOrder(userId);
  res.render("users/orders", { admin: false, user, orders });
});

router.get("/view-ordered-rooms/:id", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let orderId = req.params.id;

  // Log the orderId to see if it's correctly retrieved
  console.log("Retrieved Order ID:", orderId);

  // Check if orderId is valid
  if (!ObjectId.isValid(orderId)) {
    console.error('Invalid Order ID format:', orderId);  // Log the invalid ID
    return res.status(400).send('Invalid Order ID');
  }

  try {
    let rooms = await userHelper.getOrderRooms(orderId);
    res.render("users/order-rooms", {
      admin: false,
      user,
      rooms,
    });
  } catch (err) {
    console.error('Error fetching ordered rooms:', err);
    res.status(500).send('Internal Server Error');
  }
});



router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  userHelper.cancelOrder(orderId).then(() => {
    res.redirect("/orders");
  });
});

router.post("/search", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  // le = await userHelper.g(userId);
  userHelper.searchProduct(req.body).then((response) => {
    res.render("users/search-result", { admin: false, user, response });
  });
});





router.get("/updateorder/:id", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let orderId = req.params.id;
  let order = await userHelper.getorderDetails(orderId);
  res.render("users/updateorder", { admin: false, order, user });
});

router.post("/updateorder/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;

  // Update order details
  userHelper.updateorder(orderId, req.body).then(() => {
    res.redirect("/orders");
  }).catch((err) => {
    console.error("Error updating order:", err);
    res.status(500).send("Failed to update order.");
  });
});



router.get("/filter-rooms", async (req, res) => {
  try {
    let { priceRange, category, roomname } = req.query;
    let filters = {};

    // ✅ Handle price range filter (convert Price to number)
    if (priceRange) {
      let [minPrice, maxPrice] = priceRange.split("-").map(Number);
      filters.Price = { $gte: minPrice, $lte: maxPrice };
    }

    // ✅ Handle category filter
    if (category) filters.category = new ObjectId(category);

    // ✅ Handle room name search
    if (roomname) filters.roomname = { $regex: new RegExp(roomname, "i") };

    console.log("Filters applied:", filters); // Debugging

    // Fetch rooms and categories
    let categories = await adminHelper.getAllCategories();
    let rooms = await adminHelper.getFilteredRooms(filters);

    res.render("users/filter-rooms", {
      admin: false,
      layout: "layout",
      rooms,
      categories,
    });
  } catch (error) {
    console.error("Error filtering rooms:", error);
    res.status(500).send("Internal Server Error");
  }
});


module.exports = router;
