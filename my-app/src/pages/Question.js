import React, { useEffect, useState } from "react";
import "./Question.css";
import axios from "axios";

function Question() {
  const [data, setData] = useState([]);
  const [complexity, setComplexity] = useState(""); //set complexity filter
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    complexity: "",
    description: "",
  });

  const [selectedQuestionId, setSelectedQuestionId] = useState(null); // For tracking the question to edit

  // Fetch user data from API when the component mounts
  useEffect(() => {
    fetch("http://localhost:5000/questions/get")
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Handle filtering from dropdown event for complexity
  const handleChange = (event) => {
    setComplexity(event.target.value);
  };

  const filteredData = data.filter((item) => {
    if (complexity) {
      return (
        item.complexity &&
        item.complexity.toLowerCase() === complexity.toLowerCase()
      );
    }
    return true;
  });

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    console.log(name);
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Input text before sending:", formData);
    try {
      if (selectedQuestionId) {
        const response = await axios.put(
          `http://localhost:5000/questions/update/${selectedQuestionId}`,
          formData
        );
        console.log("Form updated successfully:", response.data);
      } else {
        const response = await axios.post(
          "http://localhost:5000/questions/add",
          formData
        );
        console.log("Form submitted successfully:", response.data);
      }
      window.location.reload();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleEdit = (item) => {
    setSelectedQuestionId(item.id);
    setFormData({
      title: item.title,
      category: item.category,
      complexity: item.complexity,
      description: item.description,
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/questions/delete/${id}`);
      console.log("Question deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const handleReturnToAdd = () => {
    setSelectedQuestionId(null);
    setFormData({
      title: "",
      category: "",
      complexity: "",
      description: "",
    });
  };

  return (
    <div id="question">
      {/* <h1>Make Questions</h1> */}
      <h1>{selectedQuestionId ? "Edit Question" : "Make Questions"}</h1>
      <form id="questionForm" onSubmit={handleSubmit}>
        <div>
          <input
            type="Title"
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleFormChange}
            autoComplete="off"
            required
          />
          <input
            type="Category"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleFormChange}
            required
          />
          <select name="complexity" value={formData.complexity} onChange={handleFormChange} required>
            <option value="">Select Complexity</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <textarea
            id="description"
            name="description"
            placeholder="Enter your description here..."
            value={formData.description}
            onChange={handleFormChange}
          ></textarea>
          {/* <button type="submit">Add</button> */}
          <button type="submit">{selectedQuestionId ? "Update" : "Add"}</button>
          {selectedQuestionId && (
            <button type="button" onClick={handleReturnToAdd}>
              Return to Add Question
            </button>
          )}
        </div>
      </form>
      <div>
        <h1>Questions List</h1>
        {/* dropdown list to filter questions by complexity */}
        <select value={complexity} onChange={handleChange}>
          <option value="">Select a complexity</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <table id="questionList">
          {/* Display the data in table format */}
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Complexity</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.title}</td>
                <td>{item.category}</td>
                <td>{item.complexity}</td>
                <td>{item.description}</td>
                <td>
                  <div className="action-button-container">
                    <button className="edit-question" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="delete-question" onClick={() => handleDelete(item.id)}>Delete</button> 
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Question;
