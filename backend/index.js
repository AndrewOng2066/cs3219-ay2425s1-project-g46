const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
const admin = require("firebase-admin");
const firebaseConfig = require("./firebaseConfig.js");
const credentials = JSON.parse(JSON.stringify(firebaseConfig));

app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = admin.firestore();

const createText = async (inputText) => {
  const id = inputText;
  await db.collection("texts").add({ text: inputText });
};

app.post("/create", async (req, res) => {
  try {
    console.log(req.body);
    const id = req.body.email;
    const userJson = {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName, // Fixed typo
    };
    const response = db.collection("users").doc(id).set(userJson); // Added 'await'
    res.send({ message: "User created successfully", response });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * post /submit
 *
 * Submits text to firebase under texts collection.
 *
 * Responses:
 * - 200: Returns success message
 */
app.post("/submit/text", (req, res) => {
  const { inputText } = req.body;
  console.log("Received input:", inputText);
  res
    .status(200)
    .json({ message: `Form data received successfully: ${inputText}` });
  createText(inputText);
});

/**
 * GET /api/data/questions
 *
 * Retrieves data from firebase from questions collection.
 *
 * Responses:
 * - 200: Returns an array of data matching the query parameters.
 * - 500: Server error if something goes wrong while fetching data.
 */
app.get("/questions/get", async (req, res) => {
  try {
    const snapshot = await db.collection("questions").get();
    const data = [];

    if (snapshot.empty) {
      console.log("No matching documents.");
      return;
    }

    snapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data());
      data.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching data from Firebase:", error);
    res.status(500).json({ message: "Error fetching data from Firebase" });
  }
});

/**
 * POST /createQ
 *
 * Creates questions from form data and store in firebase
 *
 * Responses:
 * - 500: Server error if something goes wrong while fetching data.
 */
app.post("/questions/add", async (req, res) => {
  try {
    console.log(req.body);
    const questionJson = {
      title: req.body.title,
      category: req.body.category,
      complexity: req.body.complexity,
      description: req.body.description,
    };
    const response = db.collection("questions").doc().set(questionJson); // Added 'await'
    res.send({ message: "Question created successfully", response });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.put("/questions/update/:id", async (req, res) => {
  try {
    const questionId = req.params.id; 
    console.log("Updating question ID:", questionId);
    
    const updatedQuestion = {
      title: req.body.title,
      category: req.body.category,
      complexity: req.body.complexity,
      description: req.body.description,
    };

    const response = await db.collection("questions").doc(questionId).set(updatedQuestion, { merge: true });

    res.send({ message: "Question updated successfully", response });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.delete("/questions/delete/:id", async (req, res) => {
  try {
    const questionId = req.params.id; 
    console.log("Deleting question ID:", questionId);
    
    await db.collection("questions").doc(questionId).delete();

    res.send({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
