var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;
const { ObjectId } = require("mongodb");

module.exports = {


  ///////ADD notification/////////////////////                                         
  addnotification: (notification, callback) => {
    // Convert staffId and userId to ObjectId if they are provided in the notification
    if (notification.staffId) {
      notification.staffId = objectId(notification.staffId); // Convert staffId to objectId
    }

    if (notification.userId) {
      notification.userId = objectId(notification.userId); // Convert userId to ObjectId
    }

    notification.createdAt = new Date(); // Set createdAt as the current date and time

    console.log(notification);  // Log notification to check the changes

    db.get()
      .collection(collections.NOTIFICATIONS_COLLECTION)
      .insertOne(notification)
      .then((data) => {
        console.log(data);  // Log the inserted data for debugging
        callback(data.ops[0]._id);  // Return the _id of the inserted notification
      })
      .catch((err) => {
        console.error("Error inserting notification:", err);
        callback(null, err);  // Pass error back to callback
      });
  },

  ///////GET ALL notification/////////////////////   

  getAllnotifications: (staffId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch notifications by staffId and populate user details
        let notifications = await db
          .get()
          .collection(collections.NOTIFICATIONS_COLLECTION)
          .aggregate([
            // Match notifications by staffId
            {
              $match: { "staffId": objectId(staffId) }
            },
            // Lookup user details based on userId
            {
              $lookup: {
                from: collections.USERS_COLLECTION, // Assuming your users collection is named 'USERS_COLLECTION'
                localField: "userId", // Field in notifications collection
                foreignField: "_id", // Field in users collection
                as: "userDetails" // Name of the array where the user details will be stored
              }
            },
            // Unwind the userDetails array to get a single document (since $lookup returns an array)
            {
              $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true }
            }
          ])
          .toArray();

        resolve(notifications);
      } catch (error) {
        reject(error);
      }
    });
  },


  ///////ADD notification DETAILS/////////////////////                                            
  getnotificationDetails: (notificationId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .findOne({
          _id: objectId(notificationId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////DELETE notification/////////////////////                                            
  deletenotification: (notificationId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .removeOne({
          _id: objectId(notificationId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  ///////UPDATE notification/////////////////////                                            
  updatenotification: (notificationId, notificationDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .updateOne(
          {
            _id: objectId(notificationId)
          },
          {
            $set: {
              Name: notificationDetails.Name,
              Category: notificationDetails.Category,
              Price: notificationDetails.Price,
              Description: notificationDetails.Description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },


  ///////DELETE ALL notification/////////////////////                                            
  deleteAllnotifications: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },



  getFeedbackByStaffId: (staffId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const feedbacks = await db.get()
          .collection(collections.FEEDBACK_COLLECTION)
          .find({ staffId: objectId(staffId) }) // Convert staffId to ObjectId
          .toArray();
        resolve(feedbacks);
      } catch (error) {
        reject(error);
      }
    });
  },

  ///////ADD workspace/////////////////////                                         
  addworkspace: (workspace, staffId, callback) => {
    if (!staffId || !objectId.isValid(staffId)) {
      return callback(null, new Error("Invalid or missing staffId"));
    }

    workspace.Price = parseInt(workspace.Price);
    workspace.staffId = objectId(staffId); // Associate workspace with the staff

    db.get()
      .collection(collections.WORKSPACE_COLLECTION)
      .insertOne(workspace)
      .then((data) => {
        callback(data.ops[0]._id); // Return the inserted workspace ID
      })
      .catch((error) => {
        callback(null, error);
      });
  },


  ///////GET ALL workspace/////////////////////                                            
  getAllworkspaces: (staffId) => {
    return new Promise(async (resolve, reject) => {
      let workspaces = await db
        .get()
        .collection(collections.WORKSPACE_COLLECTION)
        .find({ staffId: objectId(staffId) }) // Filter by staffId
        .toArray();
      resolve(workspaces);
    });
  },

  ///////ADD workspace DETAILS/////////////////////                                            
  getworkspaceDetails: (workspaceId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.WORKSPACE_COLLECTION)
        .findOne({
          _id: objectId(workspaceId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////DELETE workspace/////////////////////                                            
  deleteworkspace: (workspaceId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.WORKSPACE_COLLECTION)
        .removeOne({
          _id: objectId(workspaceId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  ///////UPDATE workspace/////////////////////                                            
  updateworkspace: (workspaceId, workspaceDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.WORKSPACE_COLLECTION)
        .updateOne(
          {
            _id: objectId(workspaceId)
          },
          {
            $set: {
              wname: workspaceDetails.wname,
              seat: workspaceDetails.seat,
              Price: workspaceDetails.Price,
              format: workspaceDetails.format,
              desc: workspaceDetails.desc,
              baddress: workspaceDetails.baddress,

            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },


  ///////DELETE ALL workspace/////////////////////                                            
  deleteAllworkspaces: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.WORKSPACE_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },


  assignRoomToUser: (room, callback) => {
    console.log(room);

    // Convert roomId and assignTo to ObjectId
    const roomId = ObjectId(room.roomId);
    const assignTo = ObjectId(room.assignTo);
    const assignDate = room.assignDate; // Ensure assignDate is included

    db.get()
      .collection(collections.ASSIGNED_ROOMS)
      .insertOne({ roomId, assignTo, assignDate }) // Store assignDate in DB
      .then((data) => {
        console.log("Room assigned:", data.insertedId);

        // Fetch the current seat value and ensure it's a number
        return db.get()
          .collection(collections.ROOM_COLLECTION)
          .findOne({ _id: roomId });
      })
      .then((roomData) => {
        if (!roomData || isNaN(roomData.seat)) {
          throw new Error("Invalid seat value in database");
        }

        // Convert seat to a number and decrement it
        return db.get()
          .collection(collections.ROOM_COLLECTION)
          .updateOne(
            { _id: roomId },
            { $set: { seat: Number(roomData.seat) - 1 } } // Convert & update
          );
      })
      .then(() => {
        console.log("Seat count updated successfully.");
        callback(true);
      })
      .catch((err) => {
        console.error("Error assigning room:", err);
        callback(false);
      });
  },

  addProduct: (product, callback) => {
    console.log(product);
    product.Price = parseInt(product.Price);
    db.get()
      .collection(collections.PRODUCTS_COLLECTION)
      .insertOne(product)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collections.PRODUCTS_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },

  dosignup: (staffData) => {
    return new Promise(async (resolve, reject) => {
      try {
        staffData.Password = await bcrypt.hash(staffData.Password, 10);
        staffData.approved = false; // Set approved to false initially
        const data = await db.get().collection(collections.STAFF_COLLECTION).insertOne(staffData);
        resolve(data.ops[0]);
      } catch (error) {
        reject(error);
      }
    });
  },


  doSignin: (staffData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};

      // Find staff by email
      let staff = await db
        .get()
        .collection(collections.STAFF_COLLECTION)
        .findOne({ username: staffData.username });

      // If staff exists, check if the account is disabled
      if (staff) {
        if (staff.isDisable) {
          // If the account is disabled, return the msg from the staff collection
          response.status = false;
          response.msg = staff.msg || "Your account has been disabled.";
          return resolve(response);
        }

        // Compare passwords
        // Plain text comparison
        if (staffData.password === staff.password) {
          console.log("Login Success");
          response.staff = staff;
          response.status = true;
          resolve(response); // Successful login
        } else {
          console.log("Login Failed - Invalid Password");
          resolve({ status: false }); // Invalid password
        }
      } else {
        console.log("Login Failed");
        resolve({ status: false });  // Staff not found
      }
    });
  },


  getProductDetails: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .findOne({ _id: objectId(productId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .removeOne({ _id: objectId(productId) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  updateProduct: (productId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .updateOne(
          { _id: objectId(productId) },
          {
            $set: {
              Name: productDetails.Name,
              Category: productDetails.Category,
              Price: productDetails.Price,
              Description: productDetails.Description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  deleteAllProducts: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collections.USERS_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  removeUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .removeOne({ _id: objectId(userId) })
        .then(() => {
          resolve();
        });
    });
  },

  removeAllUsers: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  getAllOrders: (staffId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db
          .get()
          .collection(collections.ORDER_COLLECTION)
          .find({ "staffId": objectId(staffId) }) // Filter by staff ID
          .sort({ createdAt: -1 })  // Sort by createdAt in descending order
          .toArray();
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },



  changeStatus: (status, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              "status": status,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  cancelOrder: async (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch the order to get the associated workspace ID
        const order = await db.get()
          .collection(collections.ORDER_COLLECTION)
          .findOne({ _id: objectId(orderId) });

        if (!order) {
          return reject(new Error("Order not found."));
        }

        const workspaceId = order.workspace._id; // Get the workspace ID from the order

        // Remove the order from the database
        await db.get()
          .collection(collections.ORDER_COLLECTION)
          .deleteOne({ _id: objectId(orderId) });

        // Get the current seat count from the workspace
        const workspaceDoc = await db.get()
          .collection(collections.WORKSPACE_COLLECTION)
          .findOne({ _id: objectId(workspaceId) });

        // Check if the seat field exists and is a string
        if (workspaceDoc && workspaceDoc.seat) {
          let seatCount = Number(workspaceDoc.seat); // Convert seat count from string to number

          // Check if the seatCount is a valid number
          if (!isNaN(seatCount)) {
            seatCount += 1; // Increment the seat count

            // Convert back to string and update the workspace seat count
            await db.get()
              .collection(collections.WORKSPACE_COLLECTION)
              .updateOne(
                { _id: objectId(workspaceId) },
                { $set: { seat: seatCount.toString() } } // Convert number back to string
              );

            resolve(); // Successfully updated the seat count
          } else {
            return reject(new Error("Seat count is not a valid number."));
          }
        } else {
          return reject(new Error("Workspace not found or seat field is missing."));
        }
      } catch (error) {
        console.error("Error canceling order:", error);
        reject(error);
      }
    });
  },


  cancelAllOrders: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  searchProduct: (details) => {
    console.log(details);
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .createIndex({ Name: "text" }).then(async () => {
          let result = await db
            .get()
            .collection(collections.PRODUCTS_COLLECTION)
            .find({
              $text: {
                $search: details.search,
              },
            })
            .toArray();
          resolve(result);
        })

    });
  },


  cancelAssign: (assignId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const dbInstance = db.get();

        // 1️⃣ Find the assigned room to get roomId
        const assignedRoom = await dbInstance
          .collection(collections.ASSIGNED_ROOMS)
          .findOne({ _id: ObjectId(assignId) });

        if (!assignedRoom) {
          return reject("Assigned room not found");
        }

        const roomId = assignedRoom.roomId; // Extract roomId

        // 2️⃣ Remove the assigned room entry
        const deleteResponse = await dbInstance
          .collection(collections.ASSIGNED_ROOMS)
          .deleteOne({ _id: ObjectId(assignId) });

        if (deleteResponse.deletedCount === 0) {
          return reject("Failed to cancel room assignment");
        }

        // 3️⃣ Increment the seat count in ROOM_COLLECTION
        await dbInstance.collection(collections.ROOM_COLLECTION).updateOne(
          { _id: roomId },
          { $inc: { seat: 1 } } // Add +1 to seat count
        );

        console.log("Assignment canceled and seat count updated.");
        resolve(true);
      } catch (error) {
        console.error("Error canceling assignment:", error);
        reject(error);
      }
    });
  },



  getAllassignsById: (staffId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let assignstaffs = await db
          .get()
          .collection(collections.ASSIGN_STAFF)
          .aggregate([
            {
              $match: { staff: new ObjectId(staffId) } // Filter by staffId
            },
            {
              $lookup: {
                from: collections.ORDER_COLLECTION,
                localField: 'order',
                foreignField: '_id',
                as: 'orderDetails',
              },
            },
            { $unwind: { path: '$orderDetails', preserveNullAndEmptyArrays: true } },

            {
              $lookup: {
                from: collections.ROOM_COLLECTION,
                localField: 'room',
                foreignField: '_id',
                as: 'roomDetails',
              },
            },
            { $unwind: { path: '$roomDetails', preserveNullAndEmptyArrays: true } },

            {
              $lookup: {
                from: collections.STAFF_COLLECTION,
                localField: 'staff',
                foreignField: '_id',
                as: 'staffDetails',
              },
            },
            { $unwind: { path: '$staffDetails', preserveNullAndEmptyArrays: true } },

            {
              $project: {
                _id: 1,
                order: 1,
                staff: 1,
                "orderDetails._id": 1,
                "orderDetails.paymentMethod": 1,
                "orderDetails.totalAmount": 1,
                "orderDetails.fullAmount": 1,
                "orderDetails.status": 1,
                "orderDetails.deliveryDetails.Fname": 1,
                "orderDetails.deliveryDetails.Email": 1,
                "orderDetails.deliveryDetails.Phone": 1,
                "orderDetails.deliveryDetails.selecteddate": 1,
                "orderDetails.room.selecteddate": 1,
                "orderDetails.room.roomnumber": 1,
                "orderDetails.room.Price": 1,
                "orderDetails.room.AdvPrice": 1,
                "orderDetails.room.desc": 1,
                "staffDetails._id": 1,
                "staffDetails.staffname": 1,
                "staffDetails.role": 1,
                "roomDetails.roomnumber": 1,
                createdAt: {
                  $dateToString: {
                    format: "%Y-%m-%d %H:%M:%S",
                    date: "$createdAt",
                    timezone: "Asia/Kolkata",
                  },
                },
              },
            },
          ])
          .toArray();

        resolve(assignstaffs);
      } catch (error) {
        console.error("Error fetching assigned staff by ID:", error);
        reject(error);
      }
    });
  },


};


