// Author(s): Andrew, Xinyi
const db = require("../db/firebase");
const userCollection = db.collection("users");
const historyIndividualCollection = db.collection("historyIndividual");
const userReviewCollection = db.collection("userReviews");
const transporter = require("../config/nodemailer");

// jsonwebtoken to generate session token for persistent login
const jwt = require('jsonwebtoken');
// bcrypt for hashing password in database
const bcrypt = require('bcryptjs');
// import the token secret key used to generate token from .env
const JWT_SECRET = process.env.JWT_SECRET;

// Hash password function
async function hashPass(password) {
  return await bcrypt.hash(password, 10);
}

// sign up API
const signup = async (req, res) => {
  try {
    const usersRef = userCollection.doc(req.body.email);
    const getUser = await usersRef.get();

    if (getUser.exists) {
      return res.status(400).send({ message: "Email already exists. Please use another email." });
    }

    const username = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const encryptedPassword = await hashPass(password);

    const userJson = {
      username: username,
      email: email,
      password: encryptedPassword,
      image: null
    };

    const response = await userCollection.doc(email).set(userJson);
    res.status(200).send({ message: "User created successfully", response });
    console.log({ message: "User created successfully", response });

  } catch (error) {
    res.status(500).send({ error: error.message });
    console.log({ error: error.message });
  }
};

// login API
const login = async (req, res) => {
  const usersRef = userCollection.doc(req.body.email);
  const getUser = await usersRef.get();
  if (getUser.exists) {
    // get the hashed password in database to compare
    const userPassword = getUser.get("password");

    // check if password entered is same as password in database
    bcrypt.compare(req.body.password, userPassword, (error, compareResult) => {
      // if some error occurs
      if (error) {
        console.log(error);
      }
      // if passwords do not match
      if (!compareResult) {
        console.log("Password is incorrect.");
        return res.status(500).send({ message: "Password is incorrect." });
      }

      // passwords match, successful login
      // generate a token for the login session,
      // return the token, email and username of logged-in user
      const payload = { email: req.body.email };
      jwt.sign(payload, JWT_SECRET, { algorithm: "HS256" }, (error, token) => {
        if (error) {
          console.log(error);
          return res.status(401).send();
        }
        res.status(200).send({
          token: token,
          email: req.body.email,
          username: getUser.get("username")
        });
      })
    })
  } else {
    return res.status(404).send({ message: "No user associated with this email. Please sign up for an account." });
  }
};

// logout API
const logout = async (req, res) => {
  console.log("User is logging out.");
  res.clearCookie('session-id');
  return res.status(200).send({ message: "Logout successful." });
};

const getUser = async (req, res) => {
  const userEmail = req.params.email;
  console.log("Feteching user profile based on the email: ", userEmail)
  try {
    const usersRef = userCollection.doc(userEmail);
    const getUser = await usersRef.get();

    if (!getUser.exists) {
      console.log("User not found");
      return res.status(404).send({ error: "User not found." });
    }

    const userData = getUser.data();
    console.log("Fetched user data: ", userData);
    return res.status(200).send(userData)

  } catch (error) {
    console.error("Error fetching user data: ", error);
    return res.status(500).send({ error: error.message });
  }
}


const updateAvatar = async (req, res) => {
  try {
    const { email, image } = req.body;
    const usersRef = userCollection.doc(email);

    usersRef.update({
      image: image
    });

    return res.status(200).send({ message: "Avatar updated successfully" });

  } catch (error) {
    console.error("Error updating avatar: ", error);
    return res.status(500).send({ error: error.message });
  }

}

const changePassword = async (req, res) => {
  try {
    const usersRef = userCollection.doc(req.body.email);
    const getUser = await usersRef.get();

    // Check if the user exists
    if (!getUser.exists) {
      return res.status(404).send({ error: "No user associated with this email. Please sign up for an account." });
    }

    const userPassword = getUser.get("password");

    // Check if the old password matches the one in the database
    const match = await bcrypt.compare(req.body.oldPassword, userPassword);
    if (!match) {
      return res.status(400).send({ error: "Old password is incorrect." });
    }

    // Hash the new password
    const newPassword = req.body.password;
    const encryptedPassword = await hashPass(newPassword);

    // Update the password in Firebase
    await usersRef.update({ password: encryptedPassword });
    console.log("Password updated successfully.");
    return res.status(200).send({ message: "Password updated successfully." });

  } catch (error) {
    console.error("Error changing password: ", error);
    return res.status(500).send({ error: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const usersRef = historyIndividualCollection.doc(req.body.email);
    const getUser = await usersRef.get();

    if (!getUser.exists) {
      console.log("No matching history made. Creating an empty document.");
      await usersRef.set({});
      return res.status(204).send({ message: "No matching history made." });
    }

    const historyData = getUser.data();

    const filteredHistoryData = Object.keys(historyData).reduce((acc, key) => {
      const entry = historyData[key];
      const otherUserEmail = entry.collaborators.user1.email === req.body.email
        ? entry.collaborators.user2.email
        : entry.collaborators.user1.email;

      acc[key] = {
        timestamp: entry.timestamp,
        otherUserEmail: otherUserEmail,
        category: entry.questionData.category[0],
        complexity: entry.questionData.complexity,
        description: entry.questionData.description,
        title: entry.questionData.title,
        contextCode: entry.contextCode,
        contextText: entry.contextText,
        roomId: entry.roomId,
        reviewGiven: entry.reviewGiven

      };
      return acc;
    }, {});

    console.log("Fetched matching history data: ", filteredHistoryData);
    return res.status(200).send(filteredHistoryData);

  } catch (error) {
    console.error("Error fetching matching history data: ", error);
    return res.status(500).send({ error: error.message });
  }
};


// For user feedback
const addReview = async (req, res) => {
  try {
    const { otherUserEmail, newReview } = req.body;

    const now = new Date();
    now.setHours(now.getHours() + 8); // Adjust to UTC+8

    const reviewWithTimestamp = {
      ...newReview,
      timestamp: now.toISOString(),
    };

    const userRef = userReviewCollection.doc(otherUserEmail);

    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({ 1: reviewWithTimestamp });
    } else {
      const reviews = doc.data();
      const reviewKeys = Object.keys(reviews).map(Number);
      let maxKey = Math.max(...reviewKeys);
      if (maxKey === -Infinity) {
        maxKey = 0;
      }
      await userRef.update({ [maxKey + 1]: reviewWithTimestamp });
    }

    const historyRef = db.collection("historyIndividual").doc(newReview.by);
    const historyDoc = await historyRef.get();

    roomId = newReview.roomId;

    if (historyDoc.exists && historyDoc.data()[roomId]) {
      await historyRef.update({
        [`${roomId}.reviewGiven`]: true,
      });
      console.log(`reviewGiven updated to true for email: ${newReview.email}, roomId: ${roomId}`);
    } else {
      console.log(`No history entry found for roomId ${roomId}`);
    }

    console.log(`Review added to ${otherUserEmail} successfully`);
    res.status(200).send({ message: `Review added to ${otherUserEmail} successfully` });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).send({ error: error.message });
  }
}


const getReview = async (req, res) => {
  const userEmail = req.params.email;
  console.log("Feteching user review based on the email: ", userEmail)
  try {

    const reviewCollection = db.collection("userReviews");
    const usersRef = reviewCollection.doc(userEmail);
    const getReviews = await usersRef.get();

    if (!getReviews.exists) {
      console.log("User review not found. Creating an empty document.");
      await usersRef.set({});
      return res.status(204).send({ message: "User review not found. Created a placeholder document with no data." });
    }

    const userData = getReviews.data();
    console.log("Fetched user review data: ", userData);
    return res.status(200).send(userData)

  } catch (error) {
    console.error("Error fetching user data: ", error);
    return res.status(500).send({ error: error.message });
  }
}


// For website feedback
const addWebsiteFeedback = async (req, res) => {
  let feedbackContent = req.body.feedbackContent.comment;
  console.log("Fetching website feedback: ", req.body.feedbackContent);

  const sender = req.body.feedbackContent.email;
  feedbackContent += `\nFrom: ${sender}`;

  const mailOptions = {
    from: {
      name: `"CS3219 PeerPrep Program`,
      address: req.body.feedbackContent.email,
    },
    to: [process.env.EMAIL_USER],
    subject: "Website Feedback",
    text: feedbackContent || "No feedback provided",
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Feedback email has been sent");
    res.status(200).send({ message: "Feedback sent successfully" });
  } catch (error) {
    console.error("Failed to send feedback:", error);
    res.status(500).send({ error: "Failed to send feedback" });
  }
};




// Export user functions
module.exports = {
  signup,
  login,
  logout,
  getUser,
  updateAvatar,
  changePassword,
  getHistory,
  addReview,
  getReview,
  addWebsiteFeedback
};
